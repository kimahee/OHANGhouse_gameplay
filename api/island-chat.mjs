import {createHash} from 'node:crypto';
import {rpc,unavailable} from '../server/supabase.mjs';
const reply=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'no-store'}});
export default {async fetch(request) {
  if(request.method!=='POST')return reply({},405);
  const origin=request.headers.get('origin');
  if(origin && origin!==new URL(request.url).origin)return reply({},403);
  if(!request.headers.get('content-type')?.startsWith('application/json'))return reply({},415);
  const raw=await request.text();
  if(raw.length>4096)return reply({},413);
  let b;try{b=JSON.parse(raw);}catch{return reply({},400);}
  if(!b || !['wood','fire','earth','metal','water'].includes(b.island) || !/^[a-f0-9]{48}$/.test(b.secret) ||
     !Number.isSafeInteger(b.seq) || b.seq<1 || ![b.x,b.y,b.yaw].every(Number.isFinite))return reply({},400);
  const id=createHash('sha256').update(b.secret).digest('hex').slice(0,32);
  const coord=n=>Math.round(Math.max(0,Math.min(10000,n)));
  const state={name:String(b.name||'산책자').slice(0,16),speech:String(b.speech||'').slice(0,70),
    typing:b.typing===true,x:coord(b.x),y:coord(b.y),yaw:b.yaw};
  try{return reply(await rpc('ohaeng_presence',{p_id:id,p_island:b.island,p_seq:b.seq,p_state:state,p_leave:b.leave===true}));}
  catch{return unavailable();}
}};
