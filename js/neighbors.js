(() => {
  const V=window.Village;
  function identity(){
    const key='ohaeng-owner-token-v1';
    let token=localStorage.getItem(key);
    if(!token){token=Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');localStorage.setItem(key,token);}
    return token;
  }
  V.touchOnExit=()=>{
    const token=localStorage.getItem('ohaeng-owner-token-v1');
    if(token)navigator.sendBeacon('./api/village',new Blob([JSON.stringify({action:'touch',game:window.VillageHome.slot,token})],{type:'application/json'}));
  };
  let identityPromise;
  V.village=async(action,params={})=>{
    identityPromise??=navigator.locks?navigator.locks.request('ohaeng-owner',identity):Promise.resolve(identity());
    const response=await fetch('./api/village',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...params,game:window.VillageHome.slot,token:await identityPromise}),signal:AbortSignal.timeout(7000)});
    if(!response.ok)throw Error('연결을 확인하고 다시 시도해 주세요.');
    return response.json();
  };
  V.openBook=(id,isOwner)=>{
    const dialog=document.createElement('dialog'),title=document.createElement('h2'),list=document.createElement('div'),status=document.createElement('p');
    dialog.className='village-book';title.textContent='방명록';status.setAttribute('role','status');
    const button=(text,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=fn;return b;};
    let cursor;const more=button('더 보기',()=>load(true));
    async function load(append){try{const page=await V.village('book',{id,cursor:append?cursor:null});if(!append)list.replaceChildren();
      for(const entry of page.entries){const p=document.createElement('p'),n=document.createElement('strong');n.textContent=entry.name;p.append(n,document.createElement('br'),entry.message);list.append(p);}
      cursor=page.cursor;more.hidden=!cursor;status.textContent=list.children.length?'':'아직 발자국이 없어요.';}catch{status.textContent='방명록을 불러올 수 없어요.';}}
    dialog.append(title,list,more,status);
    if(!isOwner){const form=document.createElement('form'),input=document.createElement('input'),submit=document.createElement('button');input.required=true;input.maxLength=180;input.placeholder='집주인에게 한마디';input.setAttribute('aria-label','방명록 내용');submit.textContent='남기기';form.append(input,submit);
      form.onsubmit=async e=>{e.preventDefault();if(!input.value.trim())return;submit.disabled=true;try{await V.village('sign',{id,message:input.value});input.value='';await load(false);}catch{status.textContent='등록하지 못했어요. 다시 시도해 주세요.';}finally{submit.disabled=false;}};dialog.append(form);}
    dialog.append(button('닫기',()=>dialog.close()));document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();load(false);
  };
})();
