(async () => {
  'use strict';
  const home=window.VillageHome;
  if(!home.playing)return;
  const V=window.Village, $=id=>document.getElementById(id);
  const cv=$('view'),panel=$('panel'),body=$('panel-body');
  const menu=$('menu-dialog'),boot=$('boot-text');
  boot.textContent='마을을 여는 중…';
  const watchdog=setTimeout(()=>{boot.textContent='로딩이 지연되고 있어요. Safari에서 게임 주소를 다시 열어 주세요.';$('boot-link').hidden=false;},12000);
  $('boot-link').hidden=true;
  const C=window.VillageCoast, islandName=C.name;
  const key=home.storageKey('ohaeng-village-'+C.id+'-v1'),keys=new Set(),media=matchMedia('(prefers-reduced-motion: reduce)');
  const el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt)n.textContent=txt;return n;};
  const btn=(text,cls,fn)=>{const b=el('button',cls,text);b.type='button';b.onclick=fn;return b;};
  const ico=name=>{const n=el('i');n.dataset.icon=name;V.icon(n,name);return n;};
  document.querySelectorAll('[data-icon]').forEach(n=>V.icon(n,n.dataset.icon));
  let saved={};try{saved=JSON.parse(localStorage.getItem(key))||{};}catch{}
  function readHarvestCount(record){
    return Number.isSafeInteger(record?.harvestCount)&&record.harvestCount>0?record.harvestCount:0;
  }
  const state={harvestCount:readHarvestCount(saved),leafCount:Number.isSafeInteger(saved.leafCount)&&saved.leafCount>=0?saved.leafCount:0,found:new Set(V.keepsakes.filter(k=>Array.isArray(saved.found)&&saved.found.includes(k.id)).map(k=>k.id))};
  const houseKey='ohaeng-owner-house-v1', framesKey='ohaeng-owner-frames-v1';
  function migrateHouse(){
    if(home.read(houseKey))return;
    const legacy='ohaeng-village-house-v1';
    let last;try{last=JSON.parse(home.read('ohaeng-last-game-v1'));}catch{}
    const keys=[home.storageKey(legacy),...(last?.id?['ohaeng-save:'+last.id+':'+legacy]:[]),legacy,...Object.keys(localStorage).filter(k=>k.endsWith(':'+legacy))];
    for(const k of keys){const value=home.read(k);if(value){home.write(houseKey,value);const frames=home.read(k.replace(legacy,'ohaeng-village-frames-v1'));if(frames)home.write(framesKey,frames);break;}}
  }
  migrateHouse();
  let ownerId='',online=false;
  state.neighbors=[];
  async function refreshHomes(){
    try{const data=await V.village('list',{island:C.id});ownerId=data.me;state.neighbors=data.homes.filter(h=>h.id!==ownerId);}catch{}
  }
  let savedHouse;
  try{savedHouse=JSON.parse(home.read(houseKey));}catch{}
  const hasHouse=()=>savedHouse&&Object.hasOwn(C.atlas,savedHouse.island)&&Object.hasOwn(V.houseStyles,savedHouse.color)
    &&typeof savedHouse.name==='string'&&savedHouse.name.trim().length>0&&savedHouse.name.length<=16
    &&Number.isFinite(savedHouse.x)&&Number.isFinite(savedHouse.y);
  if(location.protocol.startsWith('http')){
    try {const mine=await V.village('mine');ownerId=mine.me;online=true;
      if(mine.house)savedHouse=mine.house;
      else if(hasHouse()){savedHouse=await V.village('create',{house:savedHouse});
        const legacy=home.read(framesKey);if(legacy){try{await V.village('decorate',{id:ownerId,rooms:JSON.parse(legacy)});}catch{}}}
      if(savedHouse)home.write(houseKey,JSON.stringify(savedHouse));
      refreshHomes();setInterval(()=>{if(!document.hidden)refreshHomes();},10000);
    }catch{}
  }
  if(hasHouse()&&savedHouse.island===C.id)state.house=savedHouse;
  const terrain=new V.Terrain(),player={x:C.cx,y:C.cy,dir:'down',moving:false,running:false,sitting:false,phase:0};
  await Promise.all([V.loadIslandArt(),V.furnitureReady]);
  const scene=new V.Scene(cv,terrain);
  const doorstep=house=>({x:house.x,y:house.y+36});
  function startAtHouse(house){
    const point=doorstep(house);
    if(terrain.allows(point.x,point.y))Object.assign(player,point);
    scene.center(player);
  }
  function installHouse(house){
    terrain.setHouse(house);
    const clear=o=>o.id||o.k==='ore'||o.k==='mesa'||Math.abs(o.x-house.x)>108||Math.abs(o.y-house.y)>104;
    scene.objects=scene.objects.filter(clear);
    scene.leafTrees=scene.leafTrees.filter(clear);
  }
  if(state.house){
    installHouse(state.house);
    startAtHouse(state.house);
  }else scene.center(player);
  const harvestGame=V.harvest[C.id];
  function findHarvestSite(){
    const candidates=V.harvestCandidates(C,scene).filter(p=>
      terrain.allows(p.x,p.y+9)&&(!state.house||V.distance(p,state.house)>145));
    candidates.sort((a,b)=>V.distance(a,{x:C.cx,y:C.cy})-V.distance(b,{x:C.cx,y:C.cy}));
    const spot=candidates.find(p=>terrain.route(player,V.approach(p)));
    return spot?{...spot,id:'island-harvest',name:harvestGame.site,action:harvestGame.title}:null;
  }
  let harvestSite=findHarvestSite();
  scene.harvestSite=harvestSite;
  const localPlaces=()=>harvestSite?[harvestSite,...V.getPlaces(state)]:V.getPlaces(state);

  let route=[],onArrival=null,near=null,last=0,lastHud=0,lastSave=0,dirty=false,speed=0,headingX=0,headingY=1,foot=0;
  let stickX=0,stickY=0,stickId=null,running=false,noticeTimer,ctx=null,soundOn=false,large=null;
  const particles=[];
  const destinations=C.neighbors.filter(island=>island.destination);
  if(C.id!=='fire'){
    document.title=islandName+' 산책 · 오행의 집';
    cv.setAttribute('aria-label',islandName+' 산책. 방향키 또는 WASD로 걷고 E로 가까운 사물을 살펴봅니다.');
  }
  let travelling=false;
  const confirmation=$('travel-confirm');
  let pendingDestination;
  function confirmTravel(island){
    if(!island||travelling||confirmation.open)return;
    pendingDestination=island;
    stop();keys.clear();resetStick();
    confirmation.returnValue='';
    $('travel-question').textContent=island.name+'으로 이동하시겠습니까?';
    confirmation.showModal();
  }
  confirmation.addEventListener('close',()=>{
    const destination=pendingDestination;
    pendingDestination=null;
    if(confirmation.returnValue==='yes'&&destination)travel(destination);
  });
  function travel(island){
    if(travelling)return;
    travelling=true;stop();keys.clear();resetStick();close();if(menu.open)menu.close();save();
    $('travel-message').textContent=island.name[0]+' 섬으로 이동 중';
    $('travel-overlay').dataset.island=C.id;
    $('travel-overlay').hidden=false;
    const next=home.url(island.destination);
    setTimeout(()=>window.location.assign(next),media.matches?500:780);
  }
  function travelButton(button,island){
    const label=island.name+(island.destination==='fire'?' 돌아가기':' 건너가기');
    button.setAttribute('aria-label',label);
    const drawing=el('canvas');drawing.setAttribute('aria-hidden','true');
    V.islandIcon(drawing,island);button.append(drawing);
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
      confirmTravel(island);
    });
    return button;
  }
  const shoreButtons=destinations.map(island=>{
    const button=travelButton(btn('','shore-travel',null),island);
    button.classList.add('world-island');
    button.hidden=true;
    $('stage').append(button);
    return {island,button};
  });
  function updateTravel(){
    for(const {island,button} of shoreButtons){
      const view=scene.travelView(island);
      button.hidden=!view;
      if(view){
        button.style.left=view.x+'px';
        button.style.top=view.y+'px';
        if(view.width)button.style.width=view.width+'px';
      }else button.classList.remove('enlarged');
    }
  }
  const place=id=>localPlaces().find(p=>p.id===id)||scene.groundLeaves.find(leaf=>leaf.id===id);
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
  let splashNoise;
  function stepNoise(leaf=false){
    if(!soundOn||!ctx||ctx.state!=='running')return;
    if(!splashNoise){
      splashNoise=ctx.createBuffer(1,Math.round(ctx.sampleRate*.15),ctx.sampleRate);
      const samples=splashNoise.getChannelData(0);
      for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
    }
    const wave=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain(),t=ctx.currentTime;
    wave.buffer=splashNoise;wave.playbackRate.value=.88+Math.random()*.25;
    filter.type='bandpass';filter.Q.value=.8;
    filter.frequency.setValueAtTime(leaf?3900:1850,t);
    filter.frequency.exponentialRampToValueAtTime(leaf?1750:480,t+.13);
    gain.gain.setValueAtTime(.001,t);
    gain.gain.linearRampToValueAtTime(leaf?.14:.24,t+.009);
    gain.gain.exponentialRampToValueAtTime(.001,t+.15);
    wave.connect(filter);filter.connect(gain);gain.connect(ctx.destination);
    wave.start(t);wave.stop(t+.15);
  }
  soundOn=home.read(home.soundKey)==='on';
  function paintSound(){
    $('sound').setAttribute('aria-pressed',soundOn);
    $('sound').setAttribute('aria-label',soundOn?'소리 끄기':'소리 켜기');
    $('sound').title=$('sound').getAttribute('aria-label');
    $('sound').querySelector('span').textContent=soundOn?'소리 켬':'소리 끔';
    V.icon($('sound').querySelector('i'),soundOn?'sound':'mute');
  }
  async function unlockSound(){
    ctx ||= new (window.AudioContext||window.webkitAudioContext)();
    await ctx.resume();
  }
  function startSound(){
    if(soundOn&&ctx?.state!=='running')unlockSound().catch(()=>{});
  }
  addEventListener('pointerdown',startSound,{passive:true});
  addEventListener('keydown',startSound);
  $('sound').onclick=async()=>{
    if(!soundOn){
      try{await unlockSound();}
      catch{notice('이 브라우저에서는 소리를 재생할 수 없어요.');return;}
    }
    soundOn=!soundOn;home.write(home.soundKey,soundOn?'on':'off');paintSound();tone(523);
  };
  paintSound();
  $('game-home').onclick=()=>{save();window.location.assign(home.url());};
  function stop(){route=[];onArrival=null;speed=0;player.moving=false;}
  const toolsToggle=$('notebook-tools-toggle'),toolsPanel=$('notebook-tools');
  function showNotebookTools(visible){
    toolsPanel.hidden=!visible;
    toolsToggle.setAttribute('aria-expanded',String(visible));
  }
  toolsToggle.onclick=()=>showNotebookTools(toolsPanel.hidden);
  menu.addEventListener('cancel',event=>{
    if(toolsPanel.hidden)return;
    event.preventDefault();
    showNotebookTools(false);
    toolsToggle.focus();
  });
  $('menu-open').onclick=()=>{showNotebookTools(false);stop();keys.clear();resetStick();notebookIsland=C.id;notebook();menu.showModal();};
  $('menu-close').onclick=()=>menu.close();
  function close(){if(panel.open)panel.close();}
  function modal(title,sub,wide=false){
    if(menu.open)menu.close();
    panel.classList.remove('house-heading');
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
  const notebookOrder=['wood','fire','earth','metal','water'];
  let notebookIsland=C.id;
  function collection(id){
    if(id===C.id)return state;
    let record;
    try{record=JSON.parse(home.read(home.storageKey('ohaeng-village-'+id+'-v1')));}catch{}
    return {harvestCount:readHarvestCount(record),found:new Set(Array.isArray(record?.found)?record.found:[]),
      leafCount:Number.isSafeInteger(record?.leafCount)&&record.leafCount>=0?record.leafCount:0};
  }
  function notebook(){
    const tabs=$('notebook-islands'),items=$('souvenirs');
    const selected=collection(notebookIsland);
    tabs.replaceChildren();items.replaceChildren();
    for(const id of notebookOrder){
      const record=collection(id),name=C.atlas[id].name;
      const total=V.islandKeepsakes(id).filter(k=>record.found.has(k.id)).length;
      const tab=btn('','notebook-tab',()=>{
        notebookIsland=id;notebook();tabs.querySelector('[aria-pressed="true"]').focus();
      });
      tab.setAttribute('aria-pressed',String(id===notebookIsland));
      tab.append(el('span','',name),el('small','',total+' / 3'));tabs.append(tab);
    }
    $('notebook-island').textContent=C.atlas[notebookIsland].name+' 기념물';
    $('leaf-total').hidden=notebookIsland!=='fire'&&!selected.harvestCount;
    const gathered=selected.harvestCount?V.harvest[notebookIsland].item+' ×'+selected.harvestCount:'';
    $('leaf-total').textContent=[notebookIsland==='fire'?'가을 낙엽 ×'+selected.leafCount:'',gathered].filter(Boolean).join(' · ');
    const catalog=V.islandKeepsakes(notebookIsland);
    $('count').textContent=catalog.filter(k=>selected.found.has(k.id)).length+' / 3';
    for(const k of catalog){
      const found=selected.found.has(k.id);
      const card=btn('','notebook-item'+(found?' found':''),()=>notebookDetail(k,found));
      const art=el('canvas');art.setAttribute('aria-hidden','true');V.specimen(art,k.id);
      card.append(art,el('strong','',k.name),el('small','',found?'수집 완료':'미수집'));items.append(card);
    }
  }
  function notebookDetail(k,found){
    modal(k.name,C.atlas[notebookIsland].name+' 산책 수첩');
    const art=el('canvas'),wrap=el('div','spec-large');wrap.append(art);V.specimen(art,k.id);
    body.append(wrap,el('p','dialog-text','발견 장소 · '+k.place));
    if(found)body.append(el('p','dialog-text',k.note));
    if(!found&&notebookIsland===C.id)body.append(btn('찾으러 가기','primary',()=>toPlace(k.id)));
    body.append(btn('수첩으로 돌아가기','secondary',()=>{close();notebook();menu.showModal();}));
  }
  function itemPage(k){
    modal(k.name,'FIELD NOTES');const big=el('div','spec-large'),art=el('canvas');big.append(art);V.specimen(art,k.id);
    body.append(big,el('p','dialog-text',k.note),btn('산책 계속하기','primary',close));
  }
  function interact(id){
    if(id==='house-entry'){confirmHouseEntry();return;}
    const p=place(id);if(!p||V.distance(player,V.approach(p))>50)return;
    stop();
    if(id==='island-harvest'){
      modal(harvestGame.title,harvestGame.site);
      V.startHarvest(C.id,{el,btn,body,award:()=>{
        const first=!state.harvestCount;
        state.harvestCount=Math.min(Number.MAX_SAFE_INTEGER,state.harvestCount+1);
        save();tone(659);
        if(first)notice(harvestGame.reward+' 해금');
      }});
      return;
    }
    const leafIndex=scene.groundLeaves.indexOf(p);
    if(leafIndex>=0){
      scene.groundLeaves.splice(leafIndex,1);state.leafCount=Math.min(Number.MAX_SAFE_INTEGER,state.leafCount+1);
      save();notebook();tone(659);notice('가을 낙엽을 주웠어요');hud();return;
    }
    const k=V.keepsakes.find(s=>s.id===id);
    if(k){
      if(!state.found.has(id)){state.found.add(id);save();notebook();tone(659);notice(k.name+' 수집 완료');}
      itemPage(k);
    }else if(id==='bench'){player.sitting=!player.sitting;player.dir='down';notice(player.sitting?'벤치에서 쉬는 중이에요. 이동하면 일어나요.':'다시 산책할까요?');}
    else{
      V.openMailbox({modal,body,el,btn});
    }
  }
  function mapPoint(canvas,event){
    const box=canvas.getBoundingClientRect(),m=V.mapTransform(canvas.clientWidth,canvas.clientHeight);
    const x=event.clientX-box.left-canvas.clientLeft,y=event.clientY-box.top-canvas.clientTop;
    return {x:(x-m.ox)/m.s,y:(y-m.oy)/m.s,scale:m.s};
  }
  function atFrontDoor(){
    return [state.house,...state.neighbors].filter(Boolean).filter(h=>V.distance(player,doorstep(h))<=34).sort((a,b)=>V.distance(player,doorstep(a))-V.distance(player,doorstep(b)))[0];
  }
  function confirmHouseEntry(){
    const h=atFrontDoor();if(!h)return;
    modal('집에 들어가시겠습니까?','');
    panel.classList.add('house-heading');
    const actions=el('div','house-entry-actions');
    const no=btn('아니오','secondary',close);
    actions.append(no,btn('예','primary',()=>visitHouse(h)));
    body.append(actions);no.focus();
  }
  let interior=null;
  async function visitHouse(h){
    const own=h===state.house;
    if(own&&!online){enterHouse(h,true);return;}
    try{const data=await V.village('visit',{id:h.id});enterHouse(data.house,own,data.rooms);}
    catch{if(own)enterHouse(h,true);else notice('이웃집을 불러오지 못했어요.');}
  }
  function enterHouse(house,own,sharedRooms){
    modal(house.name+'의 집','',true);
    panel.classList.add('interior-view','house-heading');
    startAtHouse(house);player.sitting=false;player.dir='down';save();
    const canvas=el('canvas','house-interior');
    canvas.width=800;canvas.height=560;
    const ctx=canvas.getContext('2d');ctx.scale(2,2);
    const guest={x:102,y:328,yaw:Math.PI,phase:0,moving:false};
    let path=[],bedroom=false;
    const exit=btn('집 밖으로','primary',close);
    const describe=()=>{
      const height=bedroom?280:384;
      const wide=matchMedia('(min-aspect-ratio: 6/5)').matches;
      canvas.roomWidthFactor=wide?1.68:1;
      canvas.width=Math.round(800*canvas.roomWidthFactor);canvas.height=height*2;
      canvas.style.setProperty('--room-ratio',canvas.width/canvas.height);
      ctx.setTransform(canvas.width/400,0,0,2,0,0);
      canvas.setAttribute('aria-label',bedroom?'방과 어두운 복도':'거실과 어두운 복도');
      exit.hidden=bedroom;
    };
    const inHall=y=>bedroom?y>234:y<92;
    const walkHall=()=>{
      const end={x:200,y:bedroom?269:45,hall:true};
      path=inHall(guest.y)?[end]:[{x:200,y:bedroom?220:110},end];
    };
    canvas.onclick=event=>{
      const box=canvas.getBoundingClientRect();
      const x=(event.clientX-box.left)*400/box.width,y=(event.clientY-box.top)*(canvas.height/2)/box.height;
      if(!editor.hidden){placeScreen(x,y);return;};
      if(x>=172&&x<=228&&inHall(y)&&(bedroom||y>=4)){walkHall();return;}
      const margin=bedroom?70:38;
      if(x>=margin&&x<=400-margin&&y>=115&&y<=(bedroom?232:336)){
        path=inHall(guest.y)?[{x:200,y:bedroom?230:100},{x,y}]:[{x,y}];
      }
    };
    const joystick=el('div','interior-stick stick'),knob=el('span','stick-knob');
    joystick.setAttribute('role','group');
    joystick.setAttribute('aria-label','실내 이동 조이스틱');
    joystick.append(el('span','stick-dots'),knob);
    let pointer=null,axisX=0,axisY=0;
    function steer(event){
      if(event.pointerId!==pointer)return;
      const box=joystick.getBoundingClientRect();
      const dx=(event.clientX-box.left-box.width/2)/(box.width*.32);
      const dy=(event.clientY-box.top-box.height/2)/(box.height*.32);
      const length=Math.max(1,Math.hypot(dx,dy));
      axisX=dx/length;axisY=dy/length;
      knob.style.transform='translate(calc(-50% + '+axisX*box.width*.28+'px),calc(-50% + '+axisY*box.height*.28+'px))';
    }
    joystick.onpointerdown=event=>{
      if(pointer!==null||event.button!==0)return;
      pointer=event.pointerId;path=[];
      joystick.setPointerCapture(pointer);steer(event);
    };
    joystick.onpointermove=steer;
    joystick.onpointerup=joystick.onpointercancel=joystick.onlostpointercapture=event=>{
      if(event.pointerId!==pointer)return;
      pointer=null;axisX=axisY=0;knob.style.transform='';
    };
    function switchRoom(){
      bedroom=!bedroom;guest.x=200;guest.y=bedroom?220:110;
      guest.yaw=bedroom?Math.PI:0;guest.moving=false;
      axisX=axisY=0;knob.style.transform='';describe();editor.hidden=true;decorate?.setAttribute('aria-expanded','false');
    }
    let view=0;
    let storedFrames;
    try{storedFrames=sharedRooms||(own?JSON.parse(home.read(framesKey)):null);}catch{}
    function cellsFor(small){
      const cells=[];
      const columns=small?[94,147,200,253,306]:[64,109,154,200,246,291,336];
      const rows=small?4:7;
      for(let row=0;row<rows;row++)for(const [col,x] of columns.entries()){
        const hallEntrance=x===200&&row===(small?rows-1:0);
        const frontEntrance=!small&&x===109&&row===rows-1;
        if(hallEntrance||frontEntrance)continue;
        cells.push({key:row+'-'+col,x,y:109+row*35});
      }
      return cells;
    }
    const grids={living:cellsFor(false),bedroom:cellsFor(true)};
    const rooms={};
    for(const key of Object.keys(grids)){
      const old=storedFrames?.[key],grid=grids[key];
      if(Array.isArray(old)){
        const floor={};
        const back=grid.filter(cell=>cell.y===109);
        if(old[3])floor[back[0].key]=old[3];
        if(old[4])floor[back[back.length-1].key]=old[4];
        rooms[key]={wall:old.slice(0,3),floor};
      }else rooms[key]={wall:Array.isArray(old?.wall)?old.wall.slice(0,3):[],floor:{...old?.floor}};
    }
    // Keep original one-cell benches compact if a wider bench would displace another saved piece.
    for(const [key,layout] of Object.entries(rooms)){
      const old=storedFrames?.[key];
      layout.compact={...old?.compact};
      if(old?.layoutVersion!==2){
        const allowed=new Set(grids[key].map(c=>c.key));
        for(const [anchor,id] of Object.entries(layout.floor)){
          if(V.footprint(anchor,id).some(k=>!allowed.has(k)||(k!==anchor&&layout.floor[k])))layout.compact[anchor]=true;
        }
      }
      layout.layoutVersion=2;
    }
    const frames=[],available=new Map();
    function registerFrame(id,island,name,art,unlocked){
      const item={id,island,name,art,unlocked};
      frames.push(item);if(unlocked||!own)available.set(id,item);
    }
    for(const id of notebookOrder){
      const record=collection(id);
      for(const item of V.islandKeepsakes(id)){
        const art=el('canvas');V.specimen(art,id!=='fire'&&item.id==='shell'?'stone':item.id);
        registerFrame(id+':'+item.id,id,item.name,art,record.found.has(item.id));
      }
      const art=el('canvas');V.harvestArt(art,id);
      registerFrame('harvest:'+id,id,V.harvest[id].reward,art,!!record.harvestCount);
      if(id==='fire'){
        const leaf=el('canvas');leaf.width=leaf.height=64;
        const brush=leaf.getContext('2d');brush.fillStyle='#bc623d';brush.fill(new Path2D('M10 49Q7 15 54 11Q53 45 10 49Z'));
        registerFrame('autumn-leaf',id,'가을 낙엽',leaf,record.leafCount>0);
      }
    }
    const roomKey=()=>bedroom?'bedroom':'living';
    const editor=el('section','frame-editor');editor.id='interior-editor';editor.hidden=true;
    const shelf=el('div','decor-shelf'),toolbar=el('div','decor-toolbar');
    shelf.tabIndex=0;
    shelf.setAttribute('role','region');
    shelf.setAttribute('aria-label','가구 세로 목록');
    const frameShelf=el('div','reward-shelf');
    frameShelf.setAttribute('aria-label','수집 액자');
    const status=el('p','frame-status');status.setAttribute('role','status');
    let draft=null,selection=null,picked=null,mode='floor',history=[];
    const actions=el('div','house-interior-actions');
    actions.append(btn('복도 지나기','secondary hall-action',walkHall),exit);
    const decorate=$('interior-tools');
    decorate.hidden=!own;
    if(house.id)actions.prepend(btn('방명록','secondary',()=>V.openBook(house.id,own)));
    const floorTab=btn('가구','secondary',()=>{setMode('floor');shelf.scrollIntoView({block:'nearest'});shelf.focus({preventScroll:true});});
    const wallTab=btn('액자','secondary',()=>{setMode('wall');frameShelf.firstElementChild?.focus();});
    const remove=btn('보관','secondary',()=>{
      if(!selection)return;
      remember();delete draft[mode][selection.key];if(mode==='floor')delete draft.compact[selection.key];selection=null;picked=null;update();
    });
    const undo=btn('되돌리기','secondary',()=>{
      if(history.length)draft=history.pop();selection=null;picked=null;update();
    });
    const finish=btn('완료','primary',async()=>{
      if(!own||!draft||finish.disabled)return;
      const snapshot=structuredClone({...rooms,[roomKey()]:draft});finish.disabled=true;
      try{if(online)await V.village('decorate',{id:ownerId,rooms:snapshot});}
      catch{status.textContent='배치를 저장하지 못했어요. 다시 시도해 주세요.';finish.disabled=false;return;}
      finish.disabled=false;
      try{localStorage.setItem(framesKey,JSON.stringify({...rooms,[roomKey()]:draft}));}
      catch{status.textContent='저장 공간을 확인한 뒤 다시 시도해 주세요.';return;}
      rooms[roomKey()]=draft;toggle(false);showReport();
    });
    function showReport(){
      const report=el('dialog','decor-report'),data=V.decorScores(rooms);
      const heading=house.name+'의 집 오행 분석';
      report.setAttribute('aria-label',heading);
      const title=el('h2','',heading);
      const max=Math.max(...data.map(d=>d.score)),leaders=data.filter(d=>d.score===max);
      const summary=!max?'아직 비어 있는 집이에요. 마음에 드는 가구로 첫 분위기를 정해 보세요.':
        leaders.length===5?'다섯 오행이 같은 점수로 어우러진 집이에요.':
        leaders.map(d=>d.label).join('·')+'의 분위기가 가장 잘 드러나는 집이에요.';
      const graph=el('canvas');graph.width=520;graph.height=400;
      graph.setAttribute('role','img');graph.setAttribute('aria-label',data.map(d=>d.label+' '+d.score+'점').join(', '));
      const c=graph.getContext('2d');c.scale(2,2);
      const point=(i,r)=>[130+Math.sin(i*Math.PI*2/5)*r,100-Math.cos(i*Math.PI*2/5)*r];
      function polygon(points,fill,stroke){
        c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();
        if(fill){c.fillStyle=fill;c.fill();}c.strokeStyle=stroke;c.stroke();
      }
      for(let level=2;level<=10;level+=2)polygon(data.map((_,i)=>point(i,level*7)),null,'#c8bdad');
      polygon(data.map((d,i)=>point(i,d.score*7)),'#72927c66','#446b54');
      c.font='bold 12px system-ui';c.textAlign='center';c.textBaseline='middle';
      data.forEach((d,i)=>{
        const [x,y]=point(i,88),[px,py]=point(i,d.score*7);
        c.fillStyle='#38392e';c.fillText(d.label+' '+d.score,x,y);
        c.beginPath();c.arc(px,py,3,0,Math.PI*2);c.fillStyle=d.color;c.fill();
      });
      report.append(title,graph,el('p','decor-verdict',summary));
      const link=el('a','analysis-link','내 사주에 어울리는 인테리어 찾아보기');
      link.href='https://ohaeng-uijip.vercel.app/';link.target='_blank';link.rel='noopener noreferrer';
      report.append(link,btn('집으로 돌아가기','secondary',()=>report.close()));title.tabIndex=-1;
      body.append(report);report.onclose=event=>{event.stopPropagation();report.remove();decorate.focus();};report.showModal();title.focus({preventScroll:true});report.scrollTop=0;
    }
    const cancel=btn('집으로 돌아가기','secondary decor-return',()=>toggle(false));
    cancel.hidden=true;decorate.before(cancel);panel.addEventListener('close',()=>cancel.remove(),{once:true});
    function remember(){history.push(structuredClone(draft));if(history.length>40)history.shift();}
    function update(){
      remove.disabled=!selection;undo.disabled=!history.length;
      for(const button of [...shelf.children,...frameShelf.children])button.setAttribute('aria-pressed',String(button.dataset.id===picked));
      status.textContent=picked?(mode==='wall'?'걸고 싶은 벽 자리를 눌러 주세요.':'놓고 싶은 바닥 칸을 눌러 주세요.'):
        mode==='wall'&&!available.size?'섬에서 수집하면 기념 액자가 열려요.':'아래에서 고르거나 놓인 아이템을 눌러 옮기세요.';
    }
    const filter=el('div','decor-tabs');
    filter.setAttribute('role','group');filter.setAttribute('aria-label','가구 오행');
    let elementFilter='all';
    function setMode(next){
      mode=next;selection=null;picked=null;shelf.hidden=next==='wall';
      floorTab.setAttribute('aria-pressed',String(mode==='floor'));wallTab.setAttribute('aria-pressed',String(mode==='wall'));update();
    }
    for(const item of frames){
      const island=C.atlas[item.island].name;
      const button=btn('',item.unlocked?'reward-slot':'reward-slot missing',()=>{
        setMode('wall');
        if(!item.unlocked){status.textContent=island+'을 천천히 둘러보세요. 이 액자의 주인공이 기다리고 있을지도 몰라요.';return;}
        picked=item.id;update();
      });
      button.dataset.id=item.id;button.setAttribute('aria-label',item.unlocked?item.name+' 액자':island+' 미수집 액자');
      button.title=button.getAttribute('aria-label');button.append(item.art);frameShelf.append(button);
    }
    function showFurniture(){
      shelf.replaceChildren();shelf.scrollTop=0;
      for(const button of filter.children)button.setAttribute('aria-pressed',String(button.dataset.id===elementFilter));
      for(const item of V.catalog.values()){
        if(!item.listed||(elementFilter!=='all'&&item.element!==elementFilter))continue;
        const art=el('canvas');art.width=168;art.height=144;
        const brush=art.getContext('2d');brush.scale(3,3);V.drawFurniture(brush,28,item.id,42);
        const button=btn(item.name+' · '+item.w+'×'+item.h,'decor-item',()=>{
          setMode('floor');picked=item.id;update();
        });
        let hold,held=false,start;
        button.addEventListener('touchstart',e=>{const q=e.touches[0];start={x:q.clientX,y:q.clientY};held=false;hold=setTimeout(()=>{held=true;setMode('floor');picked=item.id;update();},300);},{passive:true});
        button.addEventListener('touchmove',e=>{const q=e.touches[0];if(held)e.preventDefault();else if(Math.hypot(q.clientX-start.x,q.clientY-start.y)>8)clearTimeout(hold);},{passive:false});
        button.addEventListener('touchend',e=>{clearTimeout(hold);if(!held)return;e.preventDefault();held=false;const r=canvas.getBoundingClientRect(),q=e.changedTouches[0];
          if(q.clientX>=r.left&&q.clientX<=r.right&&q.clientY>=r.top&&q.clientY<=r.bottom)placeScreen((q.clientX-r.left)*400/r.width,(q.clientY-r.top)*(canvas.height/2)/r.height);},{passive:false});
        button.addEventListener('touchcancel',()=>{clearTimeout(hold);held=false;});
        button.draggable=true;button.ondragstart=e=>e.dataTransfer.setData('text/plain',item.id);button.dataset.id=item.id;button.prepend(art);shelf.append(button);
      }
      setMode('floor');
    }
    for(const id of ['all','fire','wood','earth','metal','water']){
      const button=btn(id==='all'?'전체':V.furniture[id].label,'secondary',()=>{elementFilter=id;showFurniture();});
      button.dataset.id=id;filter.append(button);
    }
    function placeScreen(x,y){
      if(view){const p=V.editorCamera(view,bedroom).inverse().transformPoint({x,y});placeAt(p.x,p.y);}else placeAt(x,y);
    }
    canvas.ondragover=e=>{if(own&&draft)e.preventDefault();};
    canvas.ondrop=e=>{if(!own||!draft)return;e.preventDefault();const id=e.dataTransfer.getData('text/plain');if(!V.catalog.has(id))return;
      setMode('floor');picked=id;const r=canvas.getBoundingClientRect();placeScreen((e.clientX-r.left)*400/r.width,(e.clientY-r.top)*(canvas.height/2)/r.height);};
    function placeAt(x,y){
      const cell=mode==='floor'?grids[roomKey()].find(c=>Math.abs(x-c.x)<=22&&y>=c.y-28&&y<=c.y+6):
        (bedroom?[116,196,246]:[148,256,324]).map((x,key)=>({x,key})).find(c=>Math.abs(x-c.x)<=20&&y>=32&&y<=79);
      if(!cell){status.textContent=mode==='floor'?'통로를 피해 표시된 바닥 칸을 골라 주세요.':'벽에 표시된 자리를 골라 주세요.';return;}
      const occupied=mode==='floor'?V.occupancy(draft):null;
      const anchor=occupied?.get(cell.key)??cell.key;
      const existing=draft[mode][anchor];
      if(!picked||selection?.key===anchor&&existing){
        selection=existing?{key:anchor}:null;picked=existing||null;update();return;
      }
      if(mode==='floor'){
        const valid=new Set(grids[roomKey()].map(c=>c.key));
        if(V.footprint(cell.key,picked).some(k=>!valid.has(k)||(occupied.has(k)&&occupied.get(k)!==selection?.key))){
          status.textContent='가구 크기만큼 빈 칸이 필요해요. 오른쪽과 아래쪽 여유를 확인해 주세요.';return;
        }
      }else if(existing){status.textContent='이미 사용 중인 자리예요. 빈 자리를 골라 주세요.';return;}
      remember();if(selection){delete draft[mode][selection.key];if(mode==='floor')delete draft.compact[selection.key];}
      draft[mode][cell.key]=picked;selection=null;picked=null;update();
    }
    function toggle(open){
      if(!own)return;view=0;updateView();
      editor.hidden=!open;cameraBar.hidden=!open;cancel.hidden=!open;actions.hidden=open;joystick.hidden=open;
      decorate.setAttribute('aria-expanded',String(open));path=[];axisX=axisY=0;
      if(open){draft=structuredClone(rooms[roomKey()]);history=[];showFurniture();}
      else draft=null;
    }
    const views=['정면','위에서 보기'];
    const viewLabel=el('span'),cameraBar=el('div','camera-bar');
    function updateView(){viewLabel.textContent=views[view];}
    for(const step of [-1,1]){
      const b=btn(step<0?'←':'→','secondary',()=>{view=(view+step+views.length)%views.length;updateView();});
      b.setAttribute('aria-label',step<0?'이전 시점':'다음 시점');if(step>0)cameraBar.append(viewLabel);cameraBar.append(b);
    }
    updateView();
    toolbar.append(floorTab,wallTab,remove,undo,finish);
    const inventory=el('div','decor-inventory');inventory.append(frameShelf,shelf);
    editor.append(filter,inventory,status,toolbar);decorate.onclick=()=>toggle(editor.hidden);
    const controls=el('div','interior-controls');
    controls.append(editor,actions);
    const viewport=el('div','room-viewport');viewport.append(canvas,cameraBar);cameraBar.hidden=true;body.append(viewport,controls,joystick);describe();
    interior=dt=>{
      const target=path[0];guest.moving=!!target;
      if(Math.hypot(axisX,axisY)>.12){
        const nextX=guest.x+axisX*dt*112,nextY=guest.y+axisY*dt*112;
        const allowed=(x,y)=>{
          const margin=inHall(y)?183:bedroom?70:38;
          const minY=bedroom||Math.abs(x-200)>24?115:45;
          return x>=margin&&x<=400-margin&&y>=minY&&y<=(bedroom?269:336);
        };
        if(allowed(nextX,guest.y))guest.x=nextX;
        if(allowed(guest.x,nextY))guest.y=nextY;
        guest.moving=true;guest.yaw=Math.atan2(axisX,axisY);guest.phase+=dt*14;
        if(bedroom?guest.y>=265:guest.y<=49)switchRoom();
      }else if(target){
        const dx=target.x-guest.x,dy=target.y-guest.y,d=Math.hypot(dx,dy),step=dt*120;
        if(d<=step){
          guest.x=target.x;guest.y=target.y;path.shift();
          if(target.hall)switchRoom();
        }else{guest.x+=dx/d*step;guest.y+=dy/d*step;guest.yaw=Math.atan2(dx,dy);guest.phase+=dt*14;}
      }
      const key=roomKey(),layout=draft||rooms[key];
      const pieces=grids[key].filter(c=>V.catalog.has(layout.floor[c.key])).map(c=>{
        const item=V.catalog.get(layout.floor[c.key]),compact=layout.compact[c.key];
        const w=compact?1:item.w,h=compact?1:item.h;
        return {id:item.id,w,h,x:c.x+(w-1)*(bedroom?53:45)/2,y:c.y+(h-1)*35};
      }).sort((a,b)=>a.y-b.y);
      if(draft&&view){V.drawPlan(ctx,view,house.color,bedroom,layout.wall.map(id=>available.get(id)),pieces,mode==='floor'?grids[key]:[],selection?.key);return;}
      V.drawHouseInterior(ctx,house.color,guest,bedroom,layout.wall.map(id=>available.get(id)),!!draft,pieces,
        draft&&mode==='floor'?grids[key]:[],selection?.key);
    };
    const aspect=matchMedia("(min-aspect-ratio: 6/5)");aspect.addEventListener("change",describe);panel.addEventListener("close",()=>aspect.removeEventListener("change",describe),{once:true});
    interior(0);
  }
  panel.addEventListener('close',()=>{interior=null;panel.classList.remove('interior-view');$('interior-tools').hidden=true;});
  function houseSetup(){
    modal('집터 고르기',islandName,true);
    const plots=Array.from({length:8},(_,index)=>{
      const angle=-Math.PI/2+index*Math.PI/4;
      return {x:Math.round(C.cx+Math.cos(angle)*820),y:Math.round(C.cy+Math.sin(angle)*760)};
    }).filter(p=>C.boundary(p.x,p.y)>230&&V.getPlaces().every(place=>V.distance(p,place)>170)
      &&V.rockFormations.every(rock=>V.distance(p,rock)>rock.size*85+90)
      &&(!C.water||[-120,0,120].every(dy=>Math.abs(p.x-C.riverX(p.y+dy))>C.riverWidth(p.y+dy)+125))
      &&terrain.route(player,doorstep(p)));
    if(!plots.length){body.append(el('p','dialog-text','지금 선택할 수 있는 집터가 없어요.'));return;}
    const form=el('form','house-setup');
    const nameLabel=el('label','','이름'),name=el('input');
    name.type='text';name.required=true;name.maxLength=16;name.placeholder='표지판에 쓸 이름';nameLabel.append(name);
    const colorLabel=el('label','','오행 색상'),color=el('select');
    for(const [id,style] of Object.entries(V.houseStyles)){
      const option=el('option','',style.name);option.value=id;color.append(option);
    }
    color.value=C.id;colorLabel.append(color);
    const preview=el('canvas','house-preview');
    preview.width=155;preview.height=110;
    preview.setAttribute('aria-label','집 디자인 미리보기');
    const fields=el('div','house-fields');fields.append(nameLabel,colorLabel,preview);
    const canvas=el('canvas','large-map');
    canvas.setAttribute('aria-label',islandName+' 집터 지도');
    const choices=el('div','house-plots');choices.setAttribute('role','group');choices.setAttribute('aria-label','집터 번호');
    const status=el('p','dialog-text');status.setAttribute('role','status');
    const submit=el('button','primary','이곳에 집 짓기');submit.disabled=true;
    let selectedPlot=-1;
    function drawPreview(){
      const ctx=preview.getContext('2d');ctx.clearRect(0,0,155,110);
      V.drawHouse(ctx,{x:54,name:name.value.trim()||'나',color:color.value},99);
    }
    const drawPlots=()=>scene.drawMap(canvas,{plots,selectedPlot},null,true);
    const selectPlot=index=>{
      selectedPlot=index;submit.disabled=false;status.textContent=(index+1)+'번 집터를 골랐어요.';
      for(const [i,button] of [...choices.children].entries())button.setAttribute('aria-pressed',String(i===index));
      drawPlots();
    };
    for(const [i] of plots.entries()){
      const choice=btn((i+1)+'번','secondary',()=>selectPlot(i));
      choice.setAttribute('aria-pressed','false');choices.append(choice);
    }
    canvas.onclick=event=>{
      const point=mapPoint(canvas,event);
      const index=plots.findIndex(plot=>V.distance(plot,point)*point.scale<17);
      if(index>=0)selectPlot(index);
    };
    form.onsubmit=async event=>{
      event.preventDefault();
      if(selectedPlot<0||hasHouse())return;
      const owner=name.value.trim();
      if(!owner){status.textContent='표지판에 쓸 이름을 입력해 주세요.';name.focus();return;}
      let house={...plots[selectedPlot],island:C.id,name:owner,color:color.value};
      if(online){submit.disabled=true;try{house=await V.village('create',{house});}catch{status.textContent='집을 등록하지 못했어요. 다시 시도해 주세요.';submit.disabled=false;return;}}
      try{localStorage.setItem(houseKey,JSON.stringify(house));}
      catch{status.textContent='브라우저 저장 공간을 사용할 수 없어요.';return;}
      savedHouse=state.house=house;
      installHouse(house);startAtHouse(house);harvestSite=scene.harvestSite=findHarvestSite();save();close();notice(owner+'의 집을 지었어요.');
    };
    name.oninput=color.onchange=drawPreview;
    form.append(fields,el('p','dialog-text','지도나 번호 버튼에서 집터를 골라 주세요.'),canvas,choices,status,submit);
    body.append(form);drawPreview();drawPlots();
    const observer=new ResizeObserver(drawPlots);
    observer.observe(canvas);
    panel.addEventListener('close',()=>observer.disconnect(),{once:true});
  }
  function map(){
    modal(islandName+' 지도','ISLAND MAP',true);
    const mapView=el('div','harvest-map-view');
    large=el('canvas','large-map');
    mapView.append(large);
    if(harvestSite){
      const star=el('span','harvest-map-star','✦');
      star.setAttribute('role','img');star.setAttribute('aria-label',harvestSite.name);
      mapView.append(star);
    }
    body.append(mapView);
    const legend=el('div','map-legend');legend.innerHTML='<span><canvas width="20" height="20" aria-hidden="true"></canvas>내 위치</span><span><b class="landmark"></b>마을 장소</span>';
    V.mapFace(legend.querySelector('canvas').getContext('2d'),10,10,8);
    const mapHint=el('span');mapHint.setAttribute('role','status');legend.append(mapHint);body.append(legend);
    const places=el('div','places');
    if(state.house){const b=btn(state.house.name+'의 집','',()=>go(doorstep(state.house)));b.append(ico('arrow'));places.append(b);}
    for(const h of state.neighbors){places.append(btn(h.name+'의 집 방문','secondary',()=>visitHouse(h)));}
    if(!hasHouse())places.append(btn('집터 고르기','',houseSetup));
    for(const p of V.getPlaces(state)){const b=btn(p.name,'',()=>toPlace(p.id));b.append(ico('arrow'));places.append(b);}
    for(const island of destinations)places.append(travelButton(btn('','travel-card',null),island));
    body.append(btn('오행 전체 지도','secondary',atlasMap),places);scene.drawMap(large,state,player,true);
    large.onclick=e=>{
      const b=large.getBoundingClientRect();
      const x=e.clientX-b.left-large.clientLeft,y=e.clientY-b.top-large.clientTop;
      const m=V.mapTransform(large.clientWidth,large.clientHeight);
      const to={x:(x-m.ox)/m.s,y:(y-m.oy)/m.s};
      if(!terrain.allows(to.x,to.y)){
        const marker=m.markers.find(({left,top,width,height})=>
          x>=left&&x<=left+width&&y>=top&&y<=top+height);
        if(marker){confirmTravel(marker.island);return;}
      }
      const other=state.neighbors.find(h=>V.distance(h,to)<12/m.s);if(other){visitHouse(other);return;}
      if(state.house&&V.distance(state.house,to)<12/m.s){go(doorstep(state.house));return;}
      if(harvestSite&&V.distance(harvestSite,to)<12/m.s)return;
      const p=V.getPlaces(state).find(p=>V.distance(p,to)<10/m.s);
      if(p)toPlace(p.id);else if(!terrain.allows(to.x,to.y)){mapHint.textContent=islandName+' 안에서 걸어갈 곳을 골라 주세요.';}else go(to);
    };
  }
  function atlasMap(){
    modal('오행 전체 지도','ISLAND MAP',true);
    const atlas=el('div','island-atlas');
    const illustration=el('img');illustration.src=window.VillageIslandArt.atlas;
    illustration.alt='위쪽 금섬, 왼쪽 화섬, 가운데 토섬, 아래쪽 목섬, 오른쪽 수섬';
    atlas.append(illustration);
    for(const [id,item] of Object.entries(C.atlas)){
      const destination=destinations.find(island=>island.destination===id);
      const marker=btn(id===C.id?item.name+' · 내 위치':item.name,'atlas-marker',()=>confirmTravel(destination));
      marker.style.left=item.x+'%';marker.style.top=item.y+'%';
      marker.disabled=!destination;
      if(id===C.id)marker.setAttribute('aria-current','location');
      atlas.append(marker);
    }
    body.append(atlas,btn('현재 섬 지도','secondary',map));
  }
  $('map-top').onclick=map;
  $('help').onclick=()=>{
    modal('산책 조작법','FIELD GUIDE');const dl=el('dl','help-list');
    for(const [a,b] of [['걷기','방향키·WASD 또는 오른쪽 조이스틱을 사용하세요. 땅을 누르면 길을 찾아갑니다.'],['달리기','PC는 Shift를 누른 채 이동하세요. 휴대폰은 달리기 버튼을 켜세요.'],['살펴보기','우체통, 벤치, 기념물 가까이에서 E나 화면의 행동 버튼을 누르세요.'],['지도','M 또는 지도 버튼을 눌러 장소를 골라 보세요.'],['섬 이동','해안에서 이웃 섬을 길게 누르면 확대돼요. 이동하려면 섬을 짧게 누른 뒤 예를 선택하세요. 지도에서도 이동할 수 있어요.'],['저장','이 브라우저에 위치와 모은 기념물이 저장됩니다.']]){
      const row=el('div');row.append(el('dt','',a),el('dd','',b));dl.append(row);
    }body.append(dl);
  };
  $('act').onclick=()=>{if(near)interact(near.id);};
  const arrows={KeyW:[0,-1],ArrowUp:[0,-1],KeyS:[0,1],ArrowDown:[0,1],KeyA:[-1,0],ArrowLeft:[-1,0],KeyD:[1,0],ArrowRight:[1,0]};
  addEventListener('keydown',e=>{
    if(travelling||confirmation.open||panel.open||menu.open||e.ctrlKey||e.metaKey||e.altKey||e.target.closest('input,select,textarea'))return;
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
    const id=scene.hitTest(x,y);const neighbor=state.neighbors.find(h=>h.id===id);if(neighbor){go(doorstep(neighbor),()=>visitHouse(neighbor));return;}if(id&&id===state.house?.id){go(doorstep(state.house));return;}if(id){toPlace(id,true);return;}
    const point=scene.point(x,y);if(point)go(point);
  });
  const stick=$('stick');
  function resetStick(){stickId=null;stickX=stickY=0;$('stick-knob').style.transform='translate(-50%,-50%)';}
  function steer(e){
    if(e.pointerId!==stickId)return;
    const b=stick.getBoundingClientRect(),range=b.width*.34;
    const x=(e.clientX-b.left-b.width/2)/range,y=(e.clientY-b.top-b.height/2)/range;
    const l=Math.max(1,Math.hypot(x,y));stickX=x/l;stickY=y/l;
    if(Math.hypot(stickX,stickY)<.15)stickX=stickY=0;
    $('stick-knob').style.transform='translate(calc(-50% + '+stickX*b.width*.27+'px),calc(-50% + '+stickY*b.width*.27+'px))';
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
    const depth=C.wadeDepth(player.x,player.y);
    const desired=(player.running?140:84)*(target?1:Math.min(1,len))*(1-depth*.38);
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
      if(foot>=22){
        foot=0;
        if(C.wadeDepth(player.x,player.y)>.06){
          if(!media.matches)particles.push({x:player.x,y:player.y,life:.46,max:.46});
          stepNoise();
        }else if(C.id==='fire'&&C.boundary(player.x,player.y)>45)stepNoise(true);
        else tone(player.running?118:89,.012,.048);
      }
    }
    if(target&&len<=travel+.02){
      route.shift();if(!route.length){const id=onArrival;onArrival=null;speed=0;if(typeof id==="function")id();else if(id)interact(id);}
    }
  }
  function hud(){
    const all=localPlaces(),sorted=all.map(p=>[p,V.distance(player,V.approach(p))]).sort((a,b)=>a[1]-b[1]);
    const leaf=scene.groundLeaves.find(p=>V.distance(player,p)<=30);
    const entrance=atFrontDoor()?{id:'house-entry',action:'집에 들어가기'}:null;
    near=entrance||leaf||sorted.find(([p,d])=>d<=43&&(!state.found.has(p.id)))?.[0]||null;
    $('act').hidden=!near;if(near)$('act-text').textContent=player.sitting&&near.id==='bench'?'일어나기':near.action;
    $('location').textContent=sorted[0][1]<98?sorted[0][0].name:C.boundary(player.x,player.y)<85?(C.water?'청록빛 물가':C.wood?'풀빛 물가':C.earth?'볕드는 물가':C.metal?'은빛 물가':'노을 물가'):(C.water?'물길 들판':C.wood?'너른 연둣빛 들판':C.earth?'너른 황토 들판':C.metal?'은빛 바위 들판':'홍초 들판');
    
  }
  function frame(t){
    const dt=Math.min(.055,last?(t-last)/1000:0);last=t;
    if(!document.hidden){
      if(!travelling&&!confirmation.open&&!panel.open&&!menu.open){update(dt);scene.updateLeaves(dt);scene.follow(player,dt,media.matches);}
      for(let i=particles.length-1;i>=0;i--){particles[i].life-=dt;if(particles[i].life<=0)particles.splice(i,1);}
      if(panel.open&&interior)interior(dt);
      if(!menu.open&&!panel.open){scene.drawScene(state,player,route,particles,t,media.matches);updateTravel();}
      if(t-lastHud>160){hud();lastHud=t;}
      if(dirty&&t-lastSave>1200){save();lastSave=t;}
    }
    requestAnimationFrame(frame);
  }
  new ResizeObserver(()=>{scene.measure();hud();if(large)scene.drawMap(large,state,player,true);}).observe($('stage'));
  scene.chat=V.startChat(C.id,player,()=>savedHouse?.name);
  scene.measure();notebook();hud();save();home.markIsland(C.id);scene.drawScene(state,player,route,particles,performance.now(),media.matches);updateTravel();clearTimeout(watchdog);$('loading').hidden=true;if(!hasHouse()&&home.choosingHome)houseSetup();requestAnimationFrame(frame);
})().catch(()=>{document.getElementById('loading').hidden=false;document.getElementById('boot-text').textContent='게임을 시작하지 못했어요. Safari에서 게임 주소를 열어 주세요.';document.getElementById('boot-link').hidden=false;});
