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
  const designNames={
    wood:'대숲 평상|버들짜임 서랍장|넝쿨 화분|대나무 등받이의자|버들 스툴|대숲 소파|대숲 코너소파|대마디 원탁|숲지기 작업대|가지 책장|대살 옷장|새순 침대|넝쿨 천개침대|잎새 장스탠드|대살 초롱|버들 원형 자리|풀잎 길쌈 러너|숲그늘 병풍|대나무 울타리|정원 수반|덩굴 화병|숲길 전신거울|잎새 삼면경',
    fire:'불꽃 벤치|구리 장식 서랍장|노을 화분|홍염 의자|불씨 스툴|홍단 소파|홍단 코너소파|화로 원탁|구리 작업대|등불 책장|홍련 옷장|노을 침대|홍단 천개침대|불꽃 장스탠드|호박빛 초롱|불꽃 원형러그|노을빛 러너|홍련 병풍|불꽃 난간|동빛 수반|불씨 화병|구리 전신거울|홍염 삼면경',
    earth:'흙담 벤치|흙벽감 수납장|옹기 화분|사암 의자|찰흙 스툴|황토 소파|흙담 코너소파|사암 원탁|도공 작업대|흙벽감 책장|황토 아치장|볏짚 침대|모래빛 천개침대|토기 장스탠드|점토 등롱|볏짚 원형자리|보릿빛 러너|흙빛 병풍|낮은 돌담|토기 수반|옹기 화병|사암 전신거울|흙빛 삼면경',
    metal:'은관 벤치|리벳 서랍장|주석 화분|강관 의자|은빛 스툴|백철 소파|백철 코너소파|원반 탁자|세공 작업대|강철 책장|은판 옷장|은관 침대|백은 천개침대|은반 장스탠드|금속 초롱|은사 원형러그|은사 러너|은빛 병풍|강관 난간|주석 수반|은빛 화병|은테 전신거울|은테 삼면경',
    water:'잔물결 벤치|남빛 물결장|청유 화분|물결 의자|물방울 스툴|쪽빛 소파|쪽빛 코너소파|호수 유리탁자|남빛 작업대|여울 책장|파도 옷장|물비늘 침대|쪽빛 천개침대|물방울 장스탠드|청유 초롱|물무늬 원형러그|여울 러너|파도 병풍|물결 난간|청유 수반|물방울 화병|여울 전신거울|파도 삼면경'
  };
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
  for(const element of Object.keys(designNames)){
    const names=designNames[element].split('|');
    [...catalog.values()].filter(item=>item.element===element&&item.listed).forEach((item,i)=>{item.name=names[i];});
  }
  const collections={
    wood:'목공 작업대|덩굴 진열장|나무 스툴|긴 나무 벤치|참나무 의자|이끼빛 소파|숲지기 침대|정원 협탁|꽃병 원탁|화분 선반|참나무 찬장|나뭇결 서랍장|한지 장스탠드|손잡이 등불|풀빛 러그|대나무 병풍|나무 전신거울|여닫이 궤짝|주방 도구걸이|장작 선반',
    fire:'찻집 작업대|찻잎 보관장|호박빛 탁상등|무쇠 차 화로|적갈색 소파|찻집 의자|홍차 스툴|긴 찻집 벤치|노을 데이베드|촛불 협탁|꽃잎 찻상|찻잎 서랍장|찻잔 선반|찻집 찬장|꽃무늬 병풍|노을 장스탠드|구리 전신거울|벽돌빛 러그|차 도구 궤짝|다기 진열대',
    earth:'도예 작업대|도공 물레|흙빛 좌식 소파|옹기 선반|낮은 작업 벤치|도공 의자|도예 스툴|모래빛 소파|보릿빛 침대|도자기 협탁|토기 원탁|흙빛 진열장|도구 보관장|황토 서랍장|종이 장스탠드|도기 등롱|볏짚 자리|천 병풍|토색 전신거울|흙그릇 건조대',
    metal:'대장간 작업대|공구 선반|철제 옷장|부품 서랍장|대장간 소파|철제 침대|철제 협탁|주철 원탁|쇠다리 벤치|철제 의자|공방 스툴|관절 장스탠드|철제 랜턴|철망 바구니|공방 병풍|철테 전신거울|철제 궤짝|공구 카트|앞치마 걸이|회색 러그',
    water:'개울 세면대|수건 선반|유리병 수경 정원|빨래 작업대|푸른 천 벤치|물빛 의자|세탁실 스툴|물빛 원탁|쪽빛 소파|물빛 침대|세탁실 협탁|푸른 서랍장|빨래 선반|푸른 찬장|천갓 장스탠드|유리 랜턴|물결 러그|천 병풍|은빛 전신거울|수건 바구니장'
  };
  const footprints={
    wood:'21 21 11 21 11 21 22 11 21 21 21 21 11 11 22 31 11 21 21 21',
    fire:'21 21 11 11 21 11 11 21 22 11 21 21 21 21 31 11 11 22 21 21',
    earth:'21 11 21 21 21 11 11 21 22 11 21 21 21 21 11 11 22 31 11 21',
    metal:'21 21 21 21 21 22 11 21 21 11 11 11 11 11 31 11 21 11 21 22',
    water:'21 21 11 21 21 11 11 21 21 22 11 21 21 21 11 11 22 31 11 11'
  };
  for(const item of catalog.values())item.listed=false;
  for(const [element,names] of Object.entries(collections)){
    const sizes=footprints[element].split(' ');
    names.split('|').forEach((name,tile)=>{
      const id=element+':'+(53+tile),[w,h]=sizes[tile].split('').map(Number);
      catalog.set(id,{id,element,name,w,h,tile,type:'collection',listed:true});
    });
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
