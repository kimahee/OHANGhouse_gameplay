/* Letters are separate records so two open tabs can both leave a letter. */
window.Village.openMailbox = function ({modal, body, el, btn}) {
  const metal=window.VillageCoast.metal;
  const {earth,id}=window.VillageCoast;
  const prefix = 'ohaeng-'+id+'-letter:';
  const papers = [
    ['ember', '노을 우표'], ['sea', '물결무늬'], ['clover', '풀꽃 압화'],
    ['star', '별밤 점묘'], ['grid', '살구 모눈']
  ];
  const welcome = earth?{paper:'grid',sender:'토섬 우편소',message:'토섬에 오신 걸 환영해요. 너른 황토 들판을 지나 볕마루 언덕에 올라 보세요.'}:metal?{paper:'star',sender:'금섬 우편소',message:'금섬에 오신 걸 환영해요. 세 봉우리와 바위 단상 사이를 산책해 보세요.'}:{paper:'ember', sender:'노을마을 우편소', message:'새 이웃에게.\n\n바닷물이 빠진 모래밭에는 노을 조개가 남고, 서쪽 들판에는 작은 꽃이 피어요. 산책 수첩에 오늘 찾은 기념물을 기록해 보세요.'};
  function sheet(letter) {
    const page = el('article','mail-sheet');
    page.dataset.paper = letter.paper;
    page.append(el('p','mail-message',letter.message), el('p','mail-sign',letter.sender+' 드림'));
    return page;
  }
  function inbox() {
    modal('우체통에 담긴 편지','VILLAGE POST');
    body.append(btn('편지 쓰기','primary',compose));
    const letters = [];
    try {
      for (const key of Object.keys(localStorage)) {
        if (!key.startsWith(prefix)) continue;
        let letter;
        try { letter = JSON.parse(localStorage.getItem(key)); } catch { continue; }
        if (letter && typeof letter.message === 'string' && papers.some(([id])=>id===letter.paper)) letters.push(letter);
      }
    } catch { body.append(el('p','mail-note','이 브라우저에서 저장된 편지를 읽을 수 없어요.')); }
    letters.sort((a,b)=>b.created-a.created);
    for (const letter of [...letters,welcome]) body.append(sheet(letter));
  }
  function compose() {
    modal('편지 쓰기','VILLAGE POST');
    const form = el('form','mail-form'), choices = el('fieldset','mail-choices');
    choices.append(el('legend','','편지지 고르기'));
    const page = el('div','mail-sheet');
    page.dataset.paper = papers[0][0];
    for (const [id,name] of papers) {
      const label = el('label','mail-choice'), radio = el('input'), sample = el('span','mail-sample');
      radio.type='radio'; radio.name='paper'; radio.value=id; radio.checked=id===page.dataset.paper;
      radio.onchange=()=>{page.dataset.paper=id;};
      sample.dataset.paper=id; label.append(radio,sample,document.createTextNode(name)); choices.append(label);
    }
    const message = el('textarea'), sender = el('input'), messageLabel = el('label','','편지 내용'), senderLabel = el('label','','보내는 이');
    message.rows=5; message.maxLength=600; message.required=true; message.placeholder='오늘 마을에서 남기고 싶은 이야기는요?';
    sender.maxLength=20; sender.placeholder='마을 산책자'; messageLabel.append(message); senderLabel.append(sender); page.append(messageLabel,senderLabel);
    const status=el('p','mail-note','편지는 이 브라우저의 우체통에 보관돼요.'); status.setAttribute('role','status');
    const send=el('button','primary','우체통에 넣기'); send.type='submit';
    form.onsubmit=event=>{
      event.preventDefault();
      if (!message.value.trim()) {status.textContent='편지 내용을 입력해 주세요.'; message.focus(); return;}
      const created=Date.now(), letter={created,paper:page.dataset.paper,message:message.value.trim(),sender:sender.value.trim()||'마을 산책자'};
      try { localStorage.setItem(prefix+created+'-'+Math.random().toString(36).slice(2),JSON.stringify(letter)); }
      catch { status.textContent='편지를 저장하지 못했어요. 내용을 복사해 두거나 다시 시도해 주세요.';return; }
      inbox();
      const confirmation=el('p','mail-note','우체통에 편지를 넣었어요.'); confirmation.setAttribute('role','status');body.prepend(confirmation);
    };
    form.append(choices,page,status,send,btn('목록으로','secondary',inbox));body.append(form);
  }
  inbox();
};
