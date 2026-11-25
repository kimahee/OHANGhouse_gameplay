begin;
create schema if not exists ohaeng_private;
revoke all on schema ohaeng_private from public, anon, authenticated;
create table if not exists ohaeng_private.presence (
  id text primary key, island text not null, sequence bigint not null,
  state jsonb not null, seen_at timestamptz not null, departed boolean not null
);
create index if not exists presence_island_seen on ohaeng_private.presence(island,seen_at desc);
create index if not exists presence_expiry on ohaeng_private.presence(seen_at);
create table if not exists ohaeng_private.objects (
  path text collate "C" primary key, body text not null, meta jsonb not null
);
alter table ohaeng_private.presence enable row level security;
alter table ohaeng_private.objects enable row level security;

create or replace function public.ohaeng_presence(p_id text, p_island text, p_seq bigint, p_state jsonb, p_leave boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare moment timestamptz := clock_timestamp(); peers jsonb;
begin
  if p_island not in ('wood','fire','earth','metal','water') or p_seq < 1 then raise exception 'invalid presence'; end if;
  insert into ohaeng_private.presence as previous values(p_id,p_island,p_seq,p_state,moment,p_leave)
    on conflict(id) do update set island=excluded.island, sequence=excluded.sequence,
      state=excluded.state, seen_at=excluded.seen_at, departed=excluded.departed
    where previous.sequence < excluded.sequence;
  -- Keep a short tombstone on leave so an older in-flight update cannot bring it back.
  delete from ohaeng_private.presence where id in (select id from ohaeng_private.presence
    where seen_at < moment - interval '5 minutes' order by seen_at limit 32 for update skip locked);
  if p_leave then return '{"peers":[]}'::jsonb; end if;
  select coalesce(jsonb_agg(state || jsonb_build_object('id',id)), '[]'::jsonb) into peers
    from (select state,id from ohaeng_private.presence
      where island=p_island and id<>p_id and not departed and seen_at > moment-interval '15 seconds'
      order by seen_at desc,id limit 160) active;
  return jsonb_build_object('peers',peers);
end $$;

-- Preserve the existing house, guest book and announcement API and its ownership checks.
create or replace function public.ohaeng_objects(action text, args jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare k text := args->>'key'; result jsonb; amount int;
begin
  if action='get' then select to_jsonb(body) into result from ohaeng_private.objects where path=k;
  elsif action='put' then
    if (args->>'createOnly')::boolean then
      insert into ohaeng_private.objects values(k,args->>'body',args->'meta') on conflict do nothing;
      return to_jsonb(found);
    end if;
    insert into ohaeng_private.objects values(k,args->>'body',args->'meta')
      on conflict(path) do update set body=excluded.body, meta=excluded.meta;
    return 'true'::jsonb;
  elsif action='list' then
    amount:=least(501,greatest(1,(args->>'limit')::int));
    select coalesce(jsonb_agg(jsonb_build_object('key',path,'customMetadata',meta) order by path),'[]'::jsonb)
      into result from (select path,meta from ohaeng_private.objects where
        starts_with(path,args->>'prefix') and path > coalesce(args->>'cursor','') order by path limit amount) rows;
  elsif action='delete' then
    delete from ohaeng_private.objects where path in (select jsonb_array_elements_text(args->'keys'));
    return 'true'::jsonb;
  else raise exception 'unknown operation';
  end if;
  return result;
end $$;
revoke all on function public.ohaeng_presence(text,text,bigint,jsonb,boolean), public.ohaeng_objects(text,jsonb) from public,anon,authenticated;
grant execute on function public.ohaeng_presence(text,text,bigint,jsonb,boolean), public.ohaeng_objects(text,jsonb) to service_role;
notify pgrst,'reload schema';
commit;
