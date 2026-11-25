(() => {
  window.Village.startChat = function(island,player,owner) {
    const $=id=>document.getElementById(id), form=$('chat-form'), input=$('chat-input'), toggle=$('chat-open');
    const secret=Array.from(crypto.getRandomValues(new Uint8Array(24)),n=>n.toString(16).padStart(2,'0')).join('');
    const peers=new Map(), bubbles=new Map(), layer=$('chat-bubbles');
    let typed=0, speech='', until=0, timer, busy=false, again=false, failures=0, active=true;
    const typing=()=>!form.hidden && document.activeElement===input && Date.now()-typed<4000;
    const local=()=>({name:owner()||'산책자',typing:typing(),speech:Date.now()<until?speech:''});
    const announce=$('announce-open'),banner=$('news-banner');
    let broadcast=false,newsBusy=false,newsUntil=0;const seenNews=new Set(),queue=[];
    function open(all){broadcast=all;form.hidden=false;toggle.hidden=announce.hidden=true;
      input.placeholder=all?'모든 섬에 전할 공지':'섬에서 할 말을 입력하세요';input.maxLength=all?100:70;input.focus();}
    async function news(){
      if(document.hidden||newsBusy)return;newsBusy=true;
      try{const data=await window.Village.village('news');for(const n of data.news){if(!seenNews.has(n.id)){seenNews.add(n.id);queue.push(n);}}
        if(seenNews.size>500)for(const id of [...seenNews].slice(0,250))seenNews.delete(id);
      }catch{}finally{newsBusy=false;}
      const overlay=[...document.querySelectorAll('dialog[open]')].at(-1)||$('stage');
      if(banner.parentElement!==overlay)overlay.append(banner);
      if(Date.now()>newsUntil){const next=queue.shift();banner.hidden=!next;if(next){banner.textContent='전체 공지 · '+next.name+'　'+next.text;newsUntil=Date.now()+6500;}}
    }
    news();setInterval(news,3500);announce.onclick=()=>open(true);
    function close(){announce.hidden=false;form.hidden=true;toggle.hidden=false;typed=0;sync();}
    toggle.onclick=()=>open(false);
    $('chat-close').onclick=close;
    input.oninput=()=>{const first=!typing();typed=input.value.length?Date.now():0;if(first||!typed)sync();};
    input.onblur=()=>{typed=0;sync();};
    input.onkeydown=e=>{if(e.key==='Escape')close();if(e.isComposing&&e.key==='Enter')e.preventDefault();};
    form.onsubmit=async e=>{e.preventDefault();const value=input.value.trim();if(!value)return;
      if(broadcast){const send=form.querySelector('button');if(send.disabled)return;send.disabled=true;
        try{await window.Village.village('announce',{message:value});input.value='';close();news();}
        catch{$('chat-status').textContent='공지를 보내지 못했어요.';}finally{send.disabled=false;}return;}
      speech=value;until=Date.now()+8000;input.value='';close();};
    let sequence=0,lastSuccess=0;
    function packet(){return {seq:++sequence,island,secret,x:player.x,y:player.y,yaw:player.yaw||0,...local()};}
    async function sync(){
      clearTimeout(timer);if(!active||document.hidden)return;
      if(busy){again=true;return;} busy=true;
      try {
        const res=await fetch('./api/island-chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(packet()),signal:AbortSignal.timeout(7000)});
        if(!res.ok)throw Error();
        const data=await res.json(), seen=new Set();
        for(const next of data.peers){
          seen.add(next.id);const peer=peers.get(next.id)||{x:next.x,y:next.y,phase:0};
          Object.assign(peer,{tx:next.x,ty:next.y,name:next.name,speech:next.speech,typing:next.typing,yaw:next.yaw});
          peers.set(next.id,peer);
        }
        for(const id of peers.keys())if(!seen.has(id))peers.delete(id);
        failures=0;lastSuccess=Date.now();
      }catch {failures++;if(Date.now()-lastSuccess>=15000)peers.clear();}
      finally{busy=false;const status=$('chat-status');status.textContent=failures?'다른 플레이어와 연결 중…':'';
        const delay=again?100:failures?Math.min(12000,failures*2000)+Math.random()*400:1100+Math.random()*200;again=false;
        if(active&&!document.hidden)timer=setTimeout(sync,delay);}
    }
    function bubble(id,info,x,y){
      let element=bubbles.get(id);
      if(!info.typing&&!info.speech && id==='me')return;
      if(!element){element=document.createElement('div');element.className='island-bubble';layer.append(element);bubbles.set(id,element);}
      element.hidden=false;element.style.transform='translate('+Math.round(x)+'px,'+Math.round(y)+'px) translate(-50%,-100%)';
      const key=JSON.stringify([info.name,info.typing,info.speech]);if(element.dataset.content===key)return;
      element.dataset.content=key;element.replaceChildren();const name=document.createElement('small');name.textContent=info.name;element.append(name);
      if(info.typing){const dots=document.createElement('span');dots.className='chat-dots';dots.setAttribute('aria-label','입력 중');for(let i=0;i<3;i++)dots.append(document.createElement('i'));element.append(dots);}
      else if(info.speech){const text=document.createElement('span');text.textContent=info.speech;element.append(text);}
    }
    function paint(scene,groundY,ox,oy,z){for(const [id,node] of bubbles){if(id!=='me'&&!peers.has(id)){node.remove();bubbles.delete(id);}else node.hidden=true;}
      const place=(id,p,info)=>bubble(id,info,ox+p.x*z,oy+(groundY(p.x,p.y)-57)*z);
      place('me',player,local());for(const [id,p] of peers)place(id,p,p);
    }
    let prev=performance.now();
    function avatars(t){const dt=Math.min(.1,Math.max(0,(t-prev)/1000));prev=t;
      for(const p of peers.values()){const dx=p.tx-p.x,dy=p.ty-p.y,k=1-Math.exp(-6*dt);p.moving=Math.hypot(dx,dy)>1;p.x+=dx*k;p.y+=dy*k;p.phase+=dt*9;}return peers.values();}
    function leave(){active=false;clearTimeout(timer);if(location.protocol.startsWith('http'))navigator.sendBeacon('./api/island-chat',new Blob([JSON.stringify({...packet(),leave:true})],{type:'application/json'}));}
    addEventListener('pagehide',leave);addEventListener('pageshow',()=>{if(!active){active=true;sync();}});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync();});
    sync();return {paint,avatars};
  };
})();
