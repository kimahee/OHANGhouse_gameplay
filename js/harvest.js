(() => {
  const V=window.Village;
  const harvest={
    wood:{title:'나무 흔들기',site:'가지가 달린 나무',item:'나뭇가지',reward:'나뭇가지 벽걸이',hint:'나무를 왼쪽과 오른쪽으로 번갈아 흔들어 주세요.',color:'#71845b'},
    water:{title:'계곡 물고기 채집',site:'물고기 여울',item:'계곡 물고기',reward:'물고기 도감 액자',hint:'물고기 그림자가 뜰채 구간에 들어오면 건져요.',color:'#4f8791'},
    metal:{title:'은빛 광산',site:'산 아래 은빛 광산',item:'은빛 원석',reward:'은빛 원석 액자',hint:'반짝이는 광맥을 찾아 세 번 캐 보세요.',color:'#8e8b9d'},
    earth:{title:'갯벌 진흙 채집',site:'해변 갯벌',item:'진흙',reward:'황토 옹기 액자',hint:'파도가 물러나 젖은 진흙이 드러날 때 퍼 올려요.',color:'#a66f46'},
    fire:{title:'노을빛 불씨 모으기',site:'노을 등불터',item:'노을빛 불씨',reward:'노을 등불 액자',hint:'작은 빛이 등불 구간에 닿을 때 받아요. 세 점을 모아 보세요.',color:'#bc5f45'}
  };
  function harvestCandidates(C,scene){
    if(C.wood)return scene.objects.filter(o=>o.k==='pine').map(o=>({x:o.x,y:o.y+22}));
    if(C.metal)return V.rockFormations.flatMap(o=>[45,80,110].map(d=>({x:o.x,y:o.y+d})));
    if(C.water)return [1670,1840,1980,2500,2710].flatMap(y=>[-1,1].map(side=>({x:C.riverX(y)+side*(C.riverWidth(y)+20),y})));
    if(C.earth)return C.shore.filter((_,i)=>C.beachAt(i)>.8).map(p=>C.insetPoint(p,50));
    return [{x:2750,y:2450},{x:2850,y:2390},{x:2450,y:2440},{x:2250,y:2200},{x:2970,y:2200},{x:2600,y:1880}];
  }
  function startHarvest(id,{el,btn,body,award}){
    const game=harvest[id],status=el('p','harvest-status');
    status.setAttribute('role','status');
    const board=el('div','harvest-board');
    let cancel=()=>{};
    function finish(){
      cancel();board.replaceChildren();award();
      status.textContent=game.item+'을(를) 모았어요.';
      board.append(btn('다시 채집하기','secondary',()=>startHarvest(id,{el,btn,body,award})));
      board.firstElementChild.focus();
    }
    function controls(){
      if(id==='wood'){
        let last='',shakes=0;
        const tree=el('div','harvest-tree','♠');tree.setAttribute('aria-hidden','true');board.append(tree);
        const shake=side=>{
          if(last===side){status.textContent='반대 방향으로 흔들어 보세요.';return;}
          last=side;shakes++;tree.dataset.side=side;
          status.textContent='나무 흔들기 '+shakes+' / 4';
          if(shakes===4){
            board.replaceChildren(btn('떨어진 나뭇가지 줍기','primary',finish));board.firstElementChild.focus();
          }
        };
        board.append(btn('왼쪽으로 흔들기','secondary',()=>shake('left')),btn('오른쪽으로 흔들기','secondary',()=>shake('right')));
        return;
      }
      if(id==='metal'){
        let hits=0,target=Math.floor(Math.random()*3);
        const veins=[];
        function reveal(){
          veins.forEach((button,i)=>{
            button.textContent=i===target?'✦':'◆';
            button.classList.toggle('shining',i===target);
            button.setAttribute('aria-label',(i+1)+'번 광맥'+(i===target?', 반짝임':''));
          });
        }
        for(let i=0;i<3;i++){
          const button=btn('','secondary vein',()=>{
            if(i!==target){status.textContent='반짝이는 광맥을 찾아보세요.';return;}
            if(++hits===3){finish();return;}
            target=(target+1+Math.floor(Math.random()*2))%3;reveal();
            status.textContent='광맥 캐기 '+hits+' / 3';
          });
          veins.push(button);board.append(button);
        }
        reveal();return;
      }
      const track=el('div','harvest-track '+id),zone=el('span','harvest-zone'),marker=el('span','harvest-marker',id==='water'?'◀':id==='fire'?'✦':'≈');
      track.setAttribute('aria-hidden','true');track.append(zone,marker);board.append(track);
      let position=0,hits=0,frame=0,started=null,waiting=false;
      const required=id==='fire'?3:1,cycle=id==='earth'?2300:id==='water'?1800:1500;
      const active=()=>position>=.55&&position<=.79;
      let wasActive=false;
      const animate=time=>{
        if(!track.isConnected){cancel();return;}
        started??=time;
        position=((time-started)%cycle)/cycle;
        marker.style.left=position*100+'%';
        track.classList.toggle('ready',active());
        if(active()!==wasActive){
          wasActive=active();waiting=false;
          if(id==='earth')status.textContent=wasActive?'진흙이 드러났어요.':'파도가 들어오고 있어요.';
        }
        frame=requestAnimationFrame(animate);
      };
      const action=id==='water'?'뜰채 들기':id==='earth'?'진흙 퍼 올리기':'불씨 받기';
      board.append(btn(action,'primary',()=>{
        if(!active()||waiting){status.textContent='때를 맞춰 다시 눌러 보세요.';return;}
        waiting=true;
        if(++hits===required)finish();
        else status.textContent='불씨 '+hits+' / '+required;
      }));
      cancel=()=>cancelAnimationFrame(frame);
      frame=requestAnimationFrame(animate);
    }
    body.replaceChildren(el('p','dialog-text',game.hint),board,status);
    controls();
  }
  function harvestArt(canvas,id){
    canvas.width=canvas.height=100;
    const c=canvas.getContext('2d'),color=harvest[id].color;
    c.lineCap=c.lineJoin='round';c.lineWidth=5;c.strokeStyle='#67483e';c.fillStyle=color;
    const shapes={
      wood:'M20 76L78 24M47 52L43 28M59 42L82 50',
      water:'M23 50Q48 16 72 50Q46 84 23 50L10 32V68Z',
      metal:'M18 55L37 22L68 26L83 59L63 77L31 75Z',
      earth:'M24 34Q50 24 76 34L69 69Q50 84 31 69Z',
      fire:'M32 30H68L75 73H25Z'
    };
    const shape=new Path2D(shapes[id]);
    if(id!=='wood')c.fill(shape);c.stroke(shape);
    c.fillStyle='#ffe4a4';
    if(id==='fire')c.fill(new Path2D('M50 38Q70 61 50 67Q34 61 50 38Z'));
    if(id==='water'){c.beginPath();c.arc(60,47,3,0,Math.PI*2);c.fill();}
    if(id==='metal')c.stroke(new Path2D('M37 23L45 52L82 59M45 52L31 75'));
    if(id==='earth')c.stroke(new Path2D('M24 34Q50 48 76 34'));
  }
  Object.assign(V,{harvest,harvestCandidates,startHarvest,harvestArt});
})();
