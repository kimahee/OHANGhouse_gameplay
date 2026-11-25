(() => {
  'use strict';
  const islands = [
    {id:'wood',name:'목섬',note:'겹겹이 이어지는 초록 능선을 산책해요.'},
    {id:'fire',name:'화섬',note:'붉은 들판을 걸으며 가을 낙엽을 주워요.'},
    {id:'earth',name:'토섬',note:'햇볕이 드는 황토 언덕을 둘러봐요.'},
    {id:'metal',name:'금섬',note:'은빛 바위와 광맥이 있는 들판을 걸어요.'},
    {id:'water',name:'수섬',note:'돌다리를 건너고 얕은 계곡을 걸어요.'}
  ];
  const read = key => {
    try { return localStorage.getItem(key); } catch { return null; }
  };
  const write = (key,value) => {
    try { localStorage.setItem(key,value); } catch {}
  };
  const query = new URLSearchParams(location.search);
  const validSlot=id=>typeof id==='string'&&/^[a-f0-9]{32}$/.test(id);
  const slot=query.get('save');
  const latestKey='ohaeng-last-game-v2';
  const resumeWindow=10*60*1000;
  function latestGame(){
    try{
      const record=JSON.parse(read(latestKey));
      if(validSlot(record?.id)&&islands.some(i=>i.id===record.island)
        &&Number.isFinite(record.time)&&Date.now()-record.time<resumeWindow)return record;
    }catch{}
    return null;
  }
  const current=latestGame();
  const playing=query.get('play')==='1'&&current?.id===slot;
  const storageKey=key=>'ohaeng-save:'+slot+':'+key;
  const markIsland=island=>write(latestKey,JSON.stringify({id:slot,island,time:Date.now()}));
  const url = (id,saveSlot=slot) => {
    const target = new URL(location.href);
    target.searchParams.delete('island');
    target.searchParams.delete('play');
    target.searchParams.delete('house');
    target.searchParams.delete('home');
    target.searchParams.delete('save');
    if(id){
      target.searchParams.set('play','1');
      if(saveSlot)target.searchParams.set('save',saveSlot);
      if(id!=='fire')target.searchParams.set('island',id);
    }
    return target;
  };
  const soundKey='ohaeng-village-sound';
  window.VillageHome={playing,url,soundKey,read,write,storageKey,markIsland,slot};
  const $ = id => document.getElementById(id);
  $('game').hidden=!playing;
  $('home').hidden=playing;
  if(playing){
    const island=query.get('island')||'fire';
    markIsland(island);
    function refresh(){
      if(latestGame()?.id!==slot){location.replace(url());return;}
      if(!document.hidden)markIsland(island);
    }
    setInterval(()=>{if(!document.hidden)refresh();},5000);
    document.addEventListener('visibilitychange',()=>{
      if(latestGame()?.id!==slot){location.replace(url());return;}
      markIsland(island);
    });
    addEventListener('pagehide',()=>{if(!document.hidden&&latestGame()?.id===slot)markIsland(island);});
    addEventListener('pageshow',event=>{if(event.persisted)refresh();});
    addEventListener('storage',event=>{if(event.key===latestKey&&latestGame()?.id!==slot)location.replace(url());});
    return;
  }
  if(current&&query.get('home')!=='1'){
    location.replace(url(current.island,current.id));
    return;
  }
  if(query.has('play')||query.has('save')||query.has('island'))history.replaceState(null,'',url());

  function node(tag,content,cls){
    const element=document.createElement(tag);
    if(content)element.textContent=content;
    if(cls)element.className=cls;
    return element;
  }
  function button(label,action,cls='home-dialog-button'){
    const element=node('button',label,cls);
    element.type='button';element.addEventListener('click',action);
    return element;
  }
  function enter(island){
    const id=Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');
    write(latestKey,JSON.stringify({id,island:island.id,time:Date.now()}));
    location.assign(url(island.id,id));
  }
  const dialog=$('home-dialog'),body=$('home-dialog-body');
  function open(title){
    $('home-dialog-title').textContent=title;body.replaceChildren();
    if(!dialog.open)dialog.showModal();
  }
  $('home-close').onclick=()=>dialog.close();
  function showIsland(island){
    open(island.name);
    const art=node('img',null,'home-island-preview');
    art.src=window.VillageIslandArt[island.id];art.alt='';
    body.append(art,node('p',island.note),button(island.name+'에서 산책하기',()=>enter(island)));
  }
  function chooseIsland(){
    open('섬 선택하기');
    const options=node('div',null,'home-picker');
    for(const island of islands){
      const entry=button('',()=>enter(island));
      const art=node('img');art.src=window.VillageIslandArt[island.id];art.alt='';
      entry.append(art,node('span',island.name));
      options.append(entry);
    }
    body.append(options);
  }
  $('home-play').onclick=chooseIsland;

  const codeFor=island=>'OH-'+island.id.toUpperCase();
  function codeMenu(){
    open('섬 코드');
    body.append(node('p','코드를 공유하면 같은 이름의 섬에 방문할 수 있어요. 산책 기록은 각자의 브라우저에 저장돼요.'));
    body.append(button('코드 입력',inputCode),button('섬 코드 만들기',createCode,'home-dialog-button'));
  }
  function inputCode(){
    open('섬 코드 입력');
    const form=node('form',null,'home-code-form'), label=node('label','섬 코드'), input=node('input');
    input.id='island-code';input.placeholder='OH-FIRE';input.required=true;input.maxLength=20;
    input.autocomplete='off';input.autocapitalize='characters';label.htmlFor=input.id;
    const status=node('p');status.setAttribute('role','status');
    const submit=node('button','코드 확인','home-dialog-button');
    form.append(label,input,submit,status);body.append(form);
    form.addEventListener('submit',event=>{
      event.preventDefault();
      const island=islands.find(i=>codeFor(i)===input.value.trim().toUpperCase());
      if(island)showIsland(island);else status.textContent='섬 코드를 다시 확인해 주세요.';
    });
    input.focus();
  }
  function createCode(){
    open('섬 코드 만들기');
    const label=node('label','공유할 섬'),select=node('select');select.id='code-island';label.htmlFor=select.id;
    for(const island of islands){
      const option=node('option',island.name);option.value=island.id;select.append(option);
    }
    const code=node('input');code.readOnly=true;code.setAttribute('aria-label','공유용 섬 코드');
    const status=node('p');status.setAttribute('role','status');
    const update=()=>{code.value=codeFor(islands.find(i=>i.id===select.value));status.textContent='';};
    select.onchange=update;update();
    const copy=button('코드 복사',async()=>{
      try {await navigator.clipboard.writeText(code.value);status.textContent='코드를 복사했어요.';}
      catch {code.focus();code.select();status.textContent='선택된 코드를 복사해 주세요.';}
    });
    body.append(label,select,code,copy,status);
  }
  $('home-code').onclick=codeMenu;
  $('home-help').onclick=()=>{
    open('게임 방법');
    const list=node('ul',null,'home-help-list');
    for(const line of [
      '조이스틱을 밀거나 땅을 눌러 걸어요. PC에서는 방향키도 쓸 수 있어요.',
      '오른쪽의 빠르게 걷기 버튼으로 이동 속도를 바꿔요.',
      '기념물이나 낙엽을 누르거나, 가까이에서 행동 버튼을 눌러 주워요.',
      '해안이나 지도에서 이웃 섬을 고른 뒤 예를 누르면 이동해요.'
    ])list.append(node('li',line));
    body.append(list);
  };
  let sound=read(soundKey)==='on';
  function paintSound(){
    const speaker=$('home-sound');window.Village.icon(speaker,sound?'sound':'mute');speaker.setAttribute('aria-label','게임 소리');speaker.title=sound?'소리 끄기':'소리 켜기';$('home-sound').setAttribute('aria-pressed',sound);
  }
  $('home-sound').onclick=()=>{sound=!sound;write(soundKey,sound?'on':'off');paintSound();};
  paintSound();

  const stars=$('home-clouds');
  const cloudLayer=node('div',null,'home-cloud-layer');
  cloudLayer.setAttribute('aria-hidden','true');
  stars.after(cloudLayer);
  const cloud=new Path2D('M0 36 Q20 42 35 29 Q43 2 64 16 Q79 -4 99 11 Q117 9 122 28 Q143 39 167 31 Q148 58 118 48 Q95 66 72 49 Q49 60 28 45 Q10 48 0 36Z');
  const curls=new Path2D('M38 34q10-23 24-9q10 11-4 14q-9 0-6-7 M67 39q10-32 27-20q16 12 3 24q-11 8-15-2q-2-8 7-7 M108 29q9 5 7 12 M18 42q14 1 23-5 M125 40q16 6 29 0');
  const placements=[[-.11,.14,1.08,1],[1.11,.24,1.05,-1],[-.06,.64,.80,1],
    [1.04,.77,.91,-1],[.10,.04,.39,1],[.92,.91,.66,-1]];
  placements.forEach(([x,y,scale,flip],index)=>{
    const float=node('div',null,'home-cloud-drift'),canvas=node('canvas');
    canvas.width=336;canvas.height=132;
    const c=canvas.getContext('2d');c.scale(2,2);c.fillStyle='#e6e6cdab';
    c.fill(cloud);c.strokeStyle='#367080';c.lineWidth=1.6;c.stroke(curls);
    float.style.left=(x*100)+'%';
    if(flip<0){
      float.style.left='auto';float.style.right=((1-x)*100)+'%';canvas.style.transform='scaleX(-1)';
    }
    float.style.top=(y*100)+'%';float.style.width=(168*scale)+'px';
    float.style.setProperty('--drift-x',((index%2?-1:1)*(6+index%3*2))+'px');
    float.style.setProperty('--drift-y',((index%2?1:-1)*(4+index%3))+'px');
    float.style.animationDuration=(10+index*1.7)+'s';
    float.style.animationDelay=(-index*1.9)+'s';
    float.append(canvas);cloudLayer.append(float);
  });
  function drawStars(){
    const {clientWidth:w,clientHeight:h}=stars,d=Math.min(devicePixelRatio||1,2);
    if(!w||!h)return;
    stars.width=w*d;stars.height=h*d;
    const c=stars.getContext('2d');c.scale(d,d);
    c.fillStyle='#eee5bf';
    for(const [x,y,r] of [[.23,.12,4],[.76,.09,3],[.86,.39,4],[.12,.46,3],[.16,.8,4],[.77,.89,3]]){
      c.beginPath();c.moveTo(w*x,h*y-r);c.lineTo(w*x+r,h*y);c.lineTo(w*x,h*y+r);c.lineTo(w*x-r,h*y);c.closePath();c.fill();
    }
  }
  drawStars();new ResizeObserver(drawStars).observe(stars);
})();
