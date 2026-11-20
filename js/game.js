(async () => {
  'use strict';
  const V=window.Village, $=id=>document.getElementById(id);
  const cv=$('view'),panel=$('panel'),body=$('panel-body');
  const menu=$('menu-dialog'),boot=$('boot-text');
  boot.textContent='마을을 여는 중…';
  const watchdog=setTimeout(()=>{boot.textContent='로딩이 지연되고 있어요. Safari에서 게임 주소를 다시 열어 주세요.';$('boot-link').hidden=false;},12000);
  $('boot-link').hidden=true;
  const C=window.VillageCoast, islandName=C.name;
  const key='ohaeng-village-'+C.id+'-v1',keys=new Set(),media=matchMedia('(prefers-reduced-motion: reduce)');
  const el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt)n.textContent=txt;return n;};
  const btn=(text,cls,fn)=>{const b=el('button',cls,text);b.type='button';b.onclick=fn;return b;};
  const ico=name=>{const n=el('i');n.dataset.icon=name;V.icon(n,name);return n;};
  document.querySelectorAll('[data-icon]').forEach(n=>V.icon(n,n.dataset.icon));
  let saved={};try{saved=JSON.parse(localStorage.getItem(key))||{};}catch{}
  const state={found:new Set(V.keepsakes.filter(k=>Array.isArray(saved.found)&&saved.found.includes(k.id)).map(k=>k.id))};
  const terrain=new V.Terrain(),player={...V.spawn,dir:'down',moving:false,running:false,sitting:false,phase:0};
  if(Number.isFinite(saved.x)&&Number.isFinite(saved.y)&&saved.world===3&&terrain.allows(saved.x,saved.y)){player.x=saved.x;player.y=saved.y;}
  const scene=new V.Scene(cv,terrain);scene.center(player);
  let route=[],onArrival=null,near=null,last=0,lastHud=0,lastSave=0,dirty=false,speed=0,headingX=0,headingY=1,foot=0;
  let stickX=0,stickY=0,stickId=null,running=false,noticeTimer,ctx=null,soundOn=false,large=null;
  const particles=[];
  const destinations=C.neighbors.filter(island=>island.destination);
  $('map-element').textContent=C.earth?'土 · 토의 섬':C.metal?'金 · 금의 섬':'火 · 화의 섬';
  if(C.id!=='fire'){
    document.title=islandName+' 산책 · 오행의 집';
    cv.setAttribute('aria-label',islandName+' 산책. 방향키 또는 WASD로 걷고 E로 가까운 사물을 살펴봅니다.');
  }
  let travelling=false;
  function travel(island){
    if(travelling)return;
    travelling=true;stop();keys.clear();resetStick();close();if(menu.open)menu.close();save();
    $('travel-message').textContent=island.name[0]+' 섬으로 이동 중';
    $('travel-overlay').dataset.island=C.id;
    $('travel-overlay').hidden=false;
    const next=new URL(window.location.href);
    if(island.destination==='fire')next.searchParams.delete('island');else next.searchParams.set('island',island.destination);
    setTimeout(()=>window.location.assign(next),media.matches?500:780);
  }
  function travelButton(button,island){
    const label=island.name+(island.destination==='fire'?' 돌아가기':' 건너가기');
    button.setAttribute('aria-label',label);
    const art=window.VillageIslandArt[island.destination];
    if(art&&(island.destination==='metal'||button.classList.contains('travel-card'))){
      const img=el('img');img.src=art;img.alt='';img.draggable=false;
      button.append(img);
    }else{
      const drawing=el('canvas');drawing.setAttribute('aria-hidden','true');
      V.islandIcon(drawing,island);button.append(drawing);
    }
    button.append(el('span','',label));
    let timer,pointer,pressed=false,startX,startY;
    function cancel(){clearTimeout(timer);pointer=null;pressed=false;}
    button.addEventListener('pointerdown',e=>{
      if(!e.isPrimary||e.button!==0)return;
      cancel();pointer=e.pointerId;startX=e.clientX;startY=e.clientY;
      timer=setTimeout(()=>{pressed=true;button.classList.add('enlarged');},360);
    });
    button.addEventListener('pointermove',e=>{
      if(pointer===e.pointerId&&Math.hypot(e.clientX-startX,e.clientY-startY)>14)clearTimeout(timer);
    });
    button.addEventListener('pointerup',e=>{if(pointer===e.pointerId)clearTimeout(timer);});
    button.addEventListener('pointercancel',cancel);
    button.addEventListener('pointerleave',cancel);
    button.addEventListener('contextmenu',e=>e.preventDefault());
    button.addEventListener('click',e=>{
      if(pressed&&e.detail!==0){cancel();return;}
      travel(island);
    });
    return button;
  }
  const shoreButtons=destinations.map(island=>{
    const button=travelButton(btn('','shore-travel',null),island);
    button.classList.toggle('world-island',C.id!=='fire'||island.destination!=='metal');
    button.hidden=true;
    $('stage').append(button);
    return {island,button};
  });
  function updateTravel(){
    for(const {island,button} of shoreButtons){
      const view=scene.travelView(player,island);
      button.hidden=!view;
      if(view){
        button.style.left=view.x+'px';
        button.style.top=view.y+'px';
        if(view.width)button.style.width=view.width+'px';
      }else button.classList.remove('enlarged');
    }
  }
  const place=id=>V.getPlaces(state).find(p=>p.id===id);
  function save(){
    try{localStorage.setItem(key,JSON.stringify({world:3,...state,found:[...state.found],x:player.x,y:player.y}));}
    catch{$('save-status').querySelector('span').textContent='이번 접속만 저장';}
    dirty=false;
  }
  function notice(s){
    clearTimeout(noticeTimer);$('notice').textContent=s;$('notice').hidden=false;
    noticeTimer=setTimeout(()=>{$('notice').hidden=true;},2700);
  }
  function tone(freq,vol=.035,len=.08){
    if(!soundOn||!ctx||ctx.state!=='running')return;
    const o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime;
    o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+len);
    o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+len);
  }
  $('sound').onclick=async()=>{
    try{ctx ||= new (window.AudioContext||window.webkitAudioContext)();await ctx.resume();soundOn=!soundOn;}
    catch{notice('이 브라우저에서는 소리를 재생할 수 없어요.');return;}
    $('sound').setAttribute('aria-pressed',soundOn);$('sound').setAttribute('aria-label',soundOn?'소리 끄기':'소리 켜기');
    $('sound').title=$('sound').getAttribute('aria-label');$('sound').querySelector('span').textContent=soundOn?'소리 켬':'소리 끔';
    V.icon($('sound').querySelector('i'),soundOn?'sound':'mute');tone(523);
  };
  function stop(){route=[];onArrival=null;speed=0;player.moving=false;}
  $('menu-open').onclick=()=>{stop();keys.clear();resetStick();menu.showModal();scene.drawMap($('mini'),state,player);};
  $('menu-close').onclick=()=>menu.close();
  function close(){if(panel.open)panel.close();}
  function modal(title,sub,wide=false){
    if(menu.open)menu.close();
    panel.classList.toggle('mail-panel',sub==='VILLAGE POST');
    stop();keys.clear();resetStick();large=null;body.replaceChildren();
    $('panel-title').textContent=title;$('panel-eyebrow').textContent=sub;panel.classList.toggle('wide',wide);
    if(!panel.open)panel.showModal();return body;
  }
  $('close').onclick=close;
  panel.addEventListener('close',()=>{large=null;keys.clear();cv.focus({preventScroll:true});});
  panel.onclick=e=>{if(e.target===panel){const b=panel.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)close();}};
  function go(to,action=null){
    const path=terrain.route(player,to);
    if(!path){notice('그곳은 걸어갈 수 없어요. 섬 안쪽의 땅을 골라 주세요.');return false;}
    if(menu.open)menu.close();
    close();player.sitting=false;route=path;onArrival=action;

    cv.focus({preventScroll:true});return true;
  }
  function toPlace(id,interact=false){const p=place(id);if(p)go(V.approach(p),interact?id:null);}
  function notebook(){
    $('count').textContent=state.found.size+' / 3';$('souvenirs').replaceChildren();
    $('collection-hint').textContent=state.found.size===3?'들판의 기념물을 모두 기록했어요.':'기념물을 골라 그곳까지 걸어가 보세요.';
    for(const k of V.keepsakes){
      const found=state.found.has(k.id),b=btn('','specimen'+(found?' found':''),()=>found?itemPage(k):toPlace(k.id));
      b.setAttribute('aria-label',k.name+(found?' 기록 보기':' 찾으러 가기'));
      const pic=el('span','spec-img'),drawing=el('canvas');pic.append(drawing);V.specimen(drawing,k.id);
      const txt=el('span','spec-main');txt.append(el('span','spec-name',k.name),el('span','spec-place',found?'수집 완료':k.place));
      const end=el('span','spec-go');end.append(ico(found?'check':'chevron'));b.append(pic,txt,end);$('souvenirs').append(b);
    }
  }
  function itemPage(k){
    modal(k.name,'FIELD NOTES');const big=el('div','spec-large'),art=el('canvas');big.append(art);V.specimen(art,k.id);
    body.append(big,el('p','dialog-text',k.note),btn('산책 계속하기','primary',close));
  }
  function interact(id){
    const p=place(id);if(!p||V.distance(player,V.approach(p))>50)return;
    stop();const k=V.keepsakes.find(s=>s.id===id);
    if(k){
      if(!state.found.has(id)){state.found.add(id);save();notebook();tone(659);notice(k.name+' 수집 완료');}
      itemPage(k);
    }else if(id==='bench'){player.sitting=!player.sitting;player.dir='down';notice(player.sitting?'벤치에서 쉬는 중이에요. 이동하면 일어나요.':'다시 산책할까요?');}
    else{
      V.openMailbox({modal,body,el,btn});
    }
  }
  function map(){
    modal(islandName+' 지도','ISLAND MAP',true);large=el('canvas','large-map');body.append(large);
    const legend=el('div','map-legend');legend.innerHTML='<span><canvas width="20" height="20" aria-hidden="true"></canvas>내 위치</span><span><b class="landmark"></b>마을 장소</span>';
    V.mapFace(legend.querySelector('canvas').getContext('2d'),10,10,8);
    const mapHint=el('span');mapHint.setAttribute('role','status');legend.append(mapHint);body.append(legend);
    const places=el('div','places');for(const p of V.getPlaces(state)){const b=btn(p.name,'',()=>toPlace(p.id));b.append(ico('arrow'));places.append(b);}
    for(const island of destinations)places.append(travelButton(btn('','travel-card',null),island));
    body.append(places);scene.drawMap(large,state,player,true);
    large.onclick=e=>{const b=large.getBoundingClientRect(),m=V.mapTransform(b.width,b.height);
      const to={x:(e.clientX-b.left-m.ox)/m.s,y:(e.clientY-b.top-m.oy)/m.s};
      const destination=destinations.find(i=>V.distance(i.center,to)<18/m.s);
      if(destination){travel(destination);return;}
      const p=V.getPlaces(state).find(p=>V.distance(p,to)<10/m.s);
      if(p)toPlace(p.id);else if(!terrain.allows(to.x,to.y)){mapHint.textContent=islandName+' 안에서 걸어갈 곳을 골라 주세요.';}else go(to);
    };
  }
  $('mini-map').onclick=$('map-top').onclick=map;
  $('help').onclick=()=>{
    modal('산책 조작법','FIELD GUIDE');const dl=el('dl','help-list');
    for(const [a,b] of [['걷기','방향키·WASD 또는 오른쪽 조이스틱을 사용하세요. 땅을 누르면 길을 찾아갑니다.'],['달리기','PC는 Shift를 누른 채 이동하세요. 휴대폰은 달리기 버튼을 켜세요.'],['살펴보기','우체통, 벤치, 기념물 가까이에서 E나 화면의 행동 버튼을 누르세요.'],['지도','M 또는 지도 버튼을 눌러 장소를 골라 보세요.'],['섬 이동','해안에서 이웃 섬을 길게 누르면 확대돼요. 짧게 누르면 건너갈 수 있어요. 지도에서도 이동할 수 있어요.'],['저장','이 브라우저에 위치와 모은 기념물이 저장됩니다.']]){
      const row=el('div');row.append(el('dt','',a),el('dd','',b));dl.append(row);
    }body.append(dl);
  };
  $('act').onclick=()=>{if(near)interact(near.id);};
  const arrows={KeyW:[0,-1],ArrowUp:[0,-1],KeyS:[0,1],ArrowDown:[0,1],KeyA:[-1,0],ArrowLeft:[-1,0],KeyD:[1,0],ArrowRight:[1,0]};
  addEventListener('keydown',e=>{
    if(travelling||panel.open||menu.open||e.ctrlKey||e.metaKey||e.altKey||e.target.closest('input,select,textarea'))return;
    if(arrows[e.code]){keys.add(e.code);route=[];onArrival=null;player.sitting=false;e.preventDefault();}
    if(e.key==='Shift')keys.add('Shift');
    if(!e.repeat&&e.code==='KeyM'){e.preventDefault();map();}
    if(!e.repeat&&e.code==='KeyE'&&near){e.preventDefault();interact(near.id);}
    if(e.key==='Escape')stop();
  });
  addEventListener('pageshow',event=>{if(event.persisted){travelling=false;$('travel-overlay').hidden=true;}});
  addEventListener('keyup',e=>{keys.delete(e.code);if(e.key==='Shift')keys.delete('Shift');});
  cv.addEventListener('pointerdown',e=>{
    if(e.button!==0||!e.isPrimary)return;
    cv.focus({preventScroll:true});const b=cv.getBoundingClientRect(),x=e.clientX-b.left,y=e.clientY-b.top;
    const id=scene.hitTest(x,y);if(id){toPlace(id,true);return;}
    const point=scene.point(x,y);if(point)go(point);
  });
  const stick=$('stick');
  function resetStick(){stickId=null;stickX=stickY=0;$('stick-knob').style.transform='translate(-50%,-50%)';}
  function steer(e){
    if(e.pointerId!==stickId)return;
    const b=stick.getBoundingClientRect(),x=(e.clientX-b.left-b.width/2)/25,y=(e.clientY-b.top-b.height/2)/25;
    const l=Math.max(1,Math.hypot(x,y));stickX=x/l;stickY=y/l;
    if(Math.hypot(stickX,stickY)<.15)stickX=stickY=0;
    $('stick-knob').style.transform='translate(calc(-50% + '+stickX*20+'px),calc(-50% + '+stickY*20+'px))';
  }
  stick.onpointerdown=e=>{if(stickId!==null)return;stickId=e.pointerId;stick.setPointerCapture(e.pointerId);stop();player.sitting=false;steer(e);};
  stick.onpointermove=steer;stick.onpointerup=stick.onpointercancel=stick.onlostpointercapture=e=>{if(e.pointerId===stickId)resetStick();};
  $('run').onclick=()=>{running=!running;$('run').setAttribute('aria-pressed',running);};
  function resetInput(){keys.clear();resetStick();stop();if(dirty)save();}
  addEventListener('blur',resetInput);addEventListener('pagehide',resetInput);document.addEventListener('visibilitychange',()=>{if(document.hidden)resetInput();last=0;});
  function update(dt){
    let dx=stickX,dy=stickY;
    for(const k of keys){if(arrows[k]){dx+=arrows[k][0];dy+=arrows[k][1];}}
    const target=route[0];if(target){dx=target.x-player.x;dy=target.y-player.y;}
    const len=Math.hypot(dx,dy);player.moving=false;
    if(!target&&len<.05&&speed<1){speed=0;return;}
    player.running=keys.has('Shift')||running;
    const desired=(player.running?140:84)*(target?1:Math.min(1,len));
    speed+=(desired-speed)*(-Math.expm1(-dt*(desired>speed?8:18)));
    if(len>.001){
      const turn=target?1:-Math.expm1(-18*dt);
      headingX+=(dx/len-headingX)*turn;headingY+=(dy/len-headingY)*turn;
    }
    const travel=target?Math.min(speed*dt,len):speed*dt;
    const vx=headingX*travel,vy=headingY*travel;
    const prev={x:player.x,y:player.y};
    if(terrain.segment(prev.x,prev.y,prev.x+vx,prev.y+vy)){player.x+=vx;player.y+=vy;}
    else if(!target){if(terrain.segment(prev.x,prev.y,prev.x+vx,prev.y))player.x+=vx;if(terrain.segment(player.x,prev.y,player.x,prev.y+vy))player.y+=vy;}
    else{stop();return;}
    const d=V.distance(prev,player);
    if(d>.002){const targetYaw=Math.atan2(player.x-prev.x,player.y-prev.y);const yaw=player.yaw||0;player.yaw=yaw+Math.atan2(Math.sin(targetYaw-yaw),Math.cos(targetYaw-yaw))*(-Math.expm1(-16*dt));}
    if(d>.002){
      const horizontal=player.dir==='right'||player.dir==='left';
      player.dir=Math.abs(headingX)>Math.abs(headingY)*(horizontal?.83:1.20)?(headingX>0?'right':'left'):(headingY>0?'down':'up');
      player.moving=true;player.sitting=false;player.phase=(player.phase+d/45*Math.PI*2)%(Math.PI*2);foot+=d;dirty=true;
      if(foot>=22){foot=0;if(!media.matches)particles.push({x:player.x,y:player.y,life:.7,max:.7,angle:Math.atan2(dy,dx)});tone(player.running?118:89,.012,.048);}
    }
    if(target&&len<=travel+.02){
      route.shift();if(!route.length){const id=onArrival;onArrival=null;speed=0;if(id)interact(id);}
    }
  }
  function hud(){
    const all=V.getPlaces(state),sorted=all.map(p=>[p,V.distance(player,V.approach(p))]).sort((a,b)=>a[1]-b[1]);
    near=sorted.find(([p,d])=>d<=43&&(!state.found.has(p.id)))?.[0]||null;
    $('act').hidden=!near;if(near)$('act-text').textContent=player.sitting&&near.id==='bench'?'일어나기':near.action;
    $('location').textContent=sorted[0][1]<98?sorted[0][0].name:C.boundary(player.x,player.y)<85?(C.earth?'볕드는 물가':C.metal?'은빛 물가':'노을 물가'):(C.earth?'너른 황토 들판':C.metal?'은빛 바위 들판':'홍초 들판');
    
  }
  function frame(t){
    const dt=Math.min(.055,last?(t-last)/1000:0);last=t;
    if(!document.hidden){
      if(!travelling&&!panel.open&&!menu.open){update(dt);scene.follow(player,dt,media.matches);}
      for(let i=particles.length-1;i>=0;i--){particles[i].life-=dt;if(particles[i].life<=0)particles.splice(i,1);}
      if(!menu.open&&!panel.open){scene.drawScene(state,player,route,particles,t,media.matches);updateTravel();}
      if(t-lastHud>160){hud();lastHud=t;}
      if(dirty&&t-lastSave>1200){save();lastSave=t;}
    }
    requestAnimationFrame(frame);
  }
  new ResizeObserver(()=>{scene.measure();hud();if(large)scene.drawMap(large,state,player,true);}).observe($('stage'));
  scene.measure();notebook();hud();save();scene.drawScene(state,player,route,particles,performance.now(),media.matches);updateTravel();clearTimeout(watchdog);$('loading').hidden=true;requestAnimationFrame(frame);
})().catch(()=>{document.getElementById('loading').hidden=false;document.getElementById('boot-text').textContent='게임을 시작하지 못했어요. Safari에서 게임 주소를 열어 주세요.';document.getElementById('boot-link').hidden=false;});
