export async function rpc(name, params) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing server configuration');
  const headers = {apikey:key, 'content-type':'application/json'};
  if (!key.startsWith('sb_secret_')) headers.Authorization = 'Bearer ' + key;
  const response = await fetch(new URL('/rest/v1/rpc/' + name, url), {
    method:'POST', headers, body:JSON.stringify(params), signal:AbortSignal.timeout(5500)
  });
if (!response.ok) {
  const error = await response.json().catch(() => null);
  const message = String(error?.message ?? '');

  let reason = 'unclassified';
  if (/invalid api key|invalid apikey/i.test(message)) reason = 'invalid_api_key';
  else if (/no api key|missing api key/i.test(message)) reason = 'missing_api_key';
  else if (/jwt|token/i.test(message)) reason = 'token_error';
  else if (/permission denied/i.test(message)) reason = 'permission_denied';

  const code = String(error?.code ?? '');
  console.error('Supabase RPC failed', {
    function: name,
    status: response.status,
    code: /^(PGRST\d{3}|[0-9A-Z]{5})$/.test(code) ? code : null,
    reason
  });
  throw new Error('Database temporarily unavailable');
}  return response.json();
}
const objectCall = (action,args) => rpc('ohaeng_objects',{action,args});
export const bucket = {
  async get(key) {
    const body = await objectCall('get',{key});
    return body == null ? null : {json:() => JSON.parse(body)};
  },
  put(key,body,options={}) {
    return objectCall('put',{key,body,meta:options.customMetadata||{},createOnly:options.onlyIf?.etagDoesNotMatch==='*'});
  },
  async list({prefix,cursor,limit=500}) {
    limit = Math.min(500,limit);
    const rows = await objectCall('list',{prefix,cursor,limit:limit+1});
    const objects = rows.slice(0,limit);
    return {objects,truncated:rows.length>limit,cursor:objects.at(-1)?.key};
  },
  delete(keys) { return objectCall('delete',{keys:Array.isArray(keys)?keys:[keys]}); }
};
export const unavailable = () => Response.json({error:'마을 연결을 다시 시도해 주세요.'},{status:503,headers:{'cache-control':'no-store'}});
