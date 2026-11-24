// The browser sends its secret only to this same-origin endpoint.
// Only the derived public identifier is returned to other players.
export async function islandChat(request, bucket) {
  const respond = (data, status = 200) => Response.json(data, {
    status, headers: {'Cache-Control':'no-store'}
  });
  if (request.method !== 'POST') return respond({},405);
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) return respond({},403);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return respond({},415);
  if (Number(request.headers.get('content-length')) > 4096) return respond({},413);
  let body;
  try { const raw=await request.text(); if(raw.length>4096)return respond({},413); body=JSON.parse(raw); }
  catch { return respond({},400); }
  if (!body || !['wood','fire','earth','metal','water'].includes(body.island) ||
      !/^[a-f0-9]{48}$/.test(body.secret) || ![body.x,body.y,body.yaw].every(Number.isFinite)) return respond({},400);
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(body.secret));
  const id=Array.from(new Uint8Array(hash).slice(0,16),n=>n.toString(16).padStart(2,'0')).join('');
  const prefix='walk/'+body.island+'/', key=prefix+id, now=Date.now();
  if(body.leave){await bucket.delete(key);return respond({});}
  const metadata={x:String(Math.round(Math.min(10000,Math.max(0,body.x)))),y:String(Math.round(Math.min(10000,Math.max(0,body.y)))),
    yaw:String(body.yaw),time:String(now), typing:body.typing===true?'1':'0',
    name:encodeURIComponent(String(body.name||'산책자').slice(0,16).toWellFormed()),
    speech:encodeURIComponent(String(body.speech||'').slice(0,70).toWellFormed())};
  await bucket.put(key,'',{customMetadata:metadata});
  const peers=[], expired=[];
  let cursor;
  do {
    const page=await bucket.list({prefix,cursor,limit:256,include:['customMetadata']});
    for(const item of page.objects){
      const m=item.customMetadata;
      if(!m || now-Number(m.time)>12000){if(expired.length<64)expired.push(item);continue;}
      if(item.key!==key && peers.length<160)peers.push({id:item.key.slice(prefix.length),x:+m.x,y:+m.y,yaw:+m.yaw,
        name:decodeURIComponent(m.name),speech:decodeURIComponent(m.speech),typing:m.typing==='1'});
    }
    cursor=page.truncated?page.cursor:undefined;
  }while(cursor && peers.length<160);
  // Expired connections are invisible immediately. Recheck before pruning.
  for(const item of expired){const head=await bucket.head(item.key);if(head?.etag===item.etag && +head.customMetadata.time===+item.customMetadata.time)await bucket.delete(item.key);}
  return respond({peers});
}
