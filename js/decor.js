(() => {
  const V=window.Village;
  // Each row is a furniture family. Sizes are width and depth in floor cells.
  const families=[
    ['의자 스툴 흔들의자 안락의자 등받이의자','11 11 11 11 11','seat'],
    ['소파 데이베드 긴의자 코너소파 등받이소파','21 22 21 22 21','sofa'],
    ['원형탁자 식탁 협탁 티테이블 작업대','11 22 11 21 21','table'],
    ['책장 진열장 찬장 서랍장 옷장','21 21 21 11 21','shelf'],
    ['싱글침대 더블침대 낮은침대 천개침대 손님침대','12 22 12 22 12','bed'],
    ['독서등 장스탠드 연등 초롱 탁상등','11 11 11 11 11','lamp'],
    ['원형러그 발매트 긴러그 직조카펫 사각러그','22 11 12 22 21','rug'],
    ['병풍 격자칸막이 접이식가림막 낮은울타리 장식스크린','31 21 21 21 31','screen'],
    ['꽃병 수반 장식항아리 긴목화병 분재받침','11 11 11 11 21','vase'],
    ['전신거울 화장대 탁상거울 타원거울 삼면경','11 21 11 11 21','mirror']
  ];
  const prefixes={wood:'참나무',fire:'노을빛',earth:'황토',metal:'은빛',water:'청유'};
  const featured=new Set([3,4,8,11,13,17,18,22,23,26,29,30,33,35,38,41,44,46,48,52]);
  const catalog=new Map();
  for(const [element,style] of Object.entries(V.furniture)){
    function add(name,w,h,type,variant){
      const id=element+':'+catalogIndex++;
      catalog.set(id,{id,element,name,w,h,type,variant,listed:type==='classic'||featured.has(catalogIndex-1)});
    }
    let catalogIndex=0;
    style.names.forEach((name,i)=>add(name,i===0?2:1,1,'classic',i));
    for(const [names,sizes,type] of families){
      names.split(' ').forEach((name,i)=>{
        const size=sizes.split(' ')[i];
        add(prefixes[element]+' '+name,Number(size[0]),Number(size[1]),type,i);
      });
    }
  }
  function keysFor(anchor,w,h){
    const [row,col]=anchor.split('-').map(Number),result=[];
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)result.push((row+y)+'-'+(col+x));
    return result;
  }
  function footprint(anchor,id,compact=false){
    const item=catalog.get(id);
    return item?keysFor(anchor,compact?1:item.w,compact?1:item.h):[];
  }
  function occupancy(layout){
    const occupied=new Map();
    for(const [anchor,id] of Object.entries(layout.floor)){
      for(const key of footprint(anchor,id,layout.compact?.[anchor]))occupied.set(key,anchor);
    }
    return occupied;
  }
  function scores(rooms){
    return Object.entries(V.furniture).map(([element,style])=>{
      const counts=Object.values(rooms).map(room=>Object.values(room.floor).filter(id=>catalog.get(id)?.element===element).length);
      const count=counts.reduce((a,b)=>a+b,0);
      return {element,label:style.label,count,score:Math.min(10,count*2),color:style.accent};
    });
  }
  Object.assign(V,{catalog,footprint,occupancy,decorScores:scores});
})();
