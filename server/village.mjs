// Each browser owns one anonymous identity across its game slots.
export async function village(request, bucket) {
  const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
  if(request.method!=='POST')return reply({},405);
  if(request.headers.get('Origin') && request.headers.get('Origin')!==new URL(request.url).origin)return reply({},403);
  if(!request.headers.get('content-type')?.startsWith('application/json'))return reply({},415);
  const raw=await request.text();if(raw.length>24000)return reply({},413);
  let b;try{b=JSON.parse(raw);}catch{return reply({},400);}
  if(!b || !/^[a-f0-9]{64}$/.test(b.token))return reply({},401);
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(b.token));
  const me=Array.from(new Uint8Array(bytes),n=>n.toString(16).padStart(2,'0')).join('');
  const key='homes/'+me, validId=/^[a-f0-9]{64}$/, islands=['wood','fire','earth','metal','water'];
  const get=async k=>{const obj=await bucket.get(k);return obj?obj.json():null;};
  const clean=(s,max)=>typeof s==='string'?s.trim().slice(0,max):'';
  const publicHouse=h=>({id:h.id,island:h.island,x:h.x,y:h.y,color:h.color,name:h.name});
  if(b.action==='list'){
    const homes=[];let cursor;
    do{const page=await bucket.list({prefix:'homes/',include:['customMetadata'],cursor});
      for(const o of page.objects){const h=JSON.parse(o.customMetadata.house);if(h.island===b.island)homes.push(h);}
      cursor=page.truncated?page.cursor:undefined;
    }while(cursor);return reply({me,homes});
  }
  const game=typeof b.game==='string'&&/^[a-f0-9]{32}$/.test(b.game)?b.game:null;
  if(b.action==='create'){
    const old=await get(key);if(old&&(!game||old.game===game))return reply(publicHouse(old));
    const h=b.house;if(!h||!islands.includes(h.island)||!islands.includes(h.color)||!clean(h.name,16)||![h.x,h.y].every(n=>Number.isFinite(n)&&n>=0&&n<=10000))return reply({},400);
    const house=publicHouse({...h,id:me,name:clean(h.name,16)});
    const saved=await bucket.put(key,JSON.stringify({...house,game}),{...(old?{}:{onlyIf:{etagDoesNotMatch:'*'}}),customMetadata:{house:JSON.stringify(house)}});
    return reply(saved?house:publicHouse(await get(key)));
  }
  if(b.action==='mine'){const house=await get(key);return reply({house:house&&(!game||house.game===game)?publicHouse(house):null,me});}
  if(b.action==='announce'){
    const message=clean(b.message,100);if(!message)return reply({},400);
    const name=(await get(key))?.name||'산책자', now=Date.now();
    const id=(9999999999999-now)+'-'+crypto.randomUUID();
    await bucket.put('news/'+id,'',{customMetadata:{text:encodeURIComponent(message.toWellFormed()),name:encodeURIComponent(name),time:String(now)}});
    return reply({ok:true});
  }
  if(b.action==='news'){
    const page=await bucket.list({prefix:'news/',limit:100,include:['customMetadata']});
    const news=[],old=[];
    for(const o of page.objects){const m=o.customMetadata;if(Date.now()-Number(m.time)>90000){old.push(o.key);continue;}
      news.push({id:o.key,text:decodeURIComponent(m.text),name:decodeURIComponent(m.name)});}
    if(old.length)await bucket.delete(old);return reply({news:news.reverse()});
  }
  if(!validId.test(b.id))return reply({},400);
  if(b.action==='decorate'&&b.id!==me)return reply({},403);
  const h=await get('homes/'+b.id);if(!h)return reply({},404);
  const layoutKey='layouts/'+b.id+(h.game?'/'+h.game:'');
  if(b.action==='visit')return reply({house:publicHouse(h),rooms:await get(layoutKey)});
  if(b.action==='decorate'){
    if(h.game&&h.game!==game)return reply({},409);
    const rooms=b.rooms;
    if(!rooms || !['living','bedroom'].every(k=>rooms[k]&&Array.isArray(rooms[k].wall)&&rooms[k].wall.length<=3&&rooms[k].wall.every(s=>s==null||typeof s==='string')&&rooms[k].floor&&typeof rooms[k].floor==='object'&&Object.values(rooms[k].floor).every(s=>typeof s==='string')))return reply({},400);
    await bucket.put(layoutKey,JSON.stringify(rooms));return reply({ok:true});
  }
  const prefix='visitors/'+b.id+'/';
  if(b.action==='sign'){
    if(b.id===me)return reply({},403);
    const message=clean(b.message,180);if(!message)return reply({},400);
    const entry={name:(await get(key))?.name||'산책자',message,time:Date.now()};
    await bucket.put(prefix+(9999999999999-entry.time)+'-'+crypto.randomUUID(),JSON.stringify(entry));return reply({ok:true});
  }
  if(b.action==='book'){
    const page=await bucket.list({prefix,limit:20,cursor:b.cursor||undefined});
    return reply({entries:(await Promise.all(page.objects.map(o=>get(o.key)))).filter(Boolean),cursor:page.truncated?page.cursor:null});
  }
  return reply({},400);
}
