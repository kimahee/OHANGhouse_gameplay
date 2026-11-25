// A fixed-angle illustrated world. The map and walking scene share a shoreline,
// height field and landmark positions. Stationary ground is painted once.
(() => {
  'use strict';
  const V=window.Village, C=window.VillageCoast, tilt=.72, up=Math.sqrt(1-tilt*tilt);
  const seaColor='#485a69';
  const ink='#573c40', cream='#ffe6ad', tau=Math.PI*2;
  const groundY=(x,y)=>y*tilt-C.elevation(x,y)*up;
  function surface(w,h){const cv=document.createElement('canvas');cv.width=Math.ceil(w);cv.height=Math.ceil(h);return cv;}
  function shape(c,d,fill,stroke=ink,width=1.8){
    const p=new Path2D(d);if(fill){c.fillStyle=fill;c.fill(p);}
    if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke(p);}
  }
  function oval(c,x,y,rx,ry,fill,stroke=null){
    c.beginPath();c.ellipse(x,y,rx,ry,0,0,tau);c.fillStyle=fill;c.fill();
    if(stroke){c.strokeStyle=stroke;c.lineWidth=1.7;c.stroke();}
  }
  function stamp(kind,variant=0){
    const cv=surface(176,178),c=cv.getContext('2d');c.translate(88,156);c.lineCap=c.lineJoin='round';
    const shadow=(r)=>oval(c,4,0,r,r*.20,'rgba(85,43,49,.22)');
    if(kind==='pine'){
      shadow(24);shape(c,'M-3 1L-2 -40H3L4 1Z','#9a674d');
      shape(c,'M0 -88Q-8 -74 -14 -66L-7 -67Q-13 -54 -23 -46L-12 -48Q-21 -32 -32 -24Q-17 -22 -9 -28Q-13 -20 -18 -17Q2 -15 11 -21Q18 -17 32 -22Q18 -34 13 -45L22 -43Q12 -54 7 -66L13 -64Z',variant?'#797749':'#535e4b');
      shape(c,'M-1 -74L-5 -57M-7 -46L-17 -34M5 -43L14 -32',null,'#aba174',2.5);
    }else if(kind==='tree'){
      shadow(29);shape(c,'M-4 0L-2 -61H4L4 0Z','#94664f');
      shape(c,'M-24 -32Q-44 -37 -33 -57Q-39 -76 -23 -83Q-18 -105 -1 -100Q19 -108 24 -86Q43 -81 36 -61Q46 -42 30 -34Q16 -23 0 -29Q-12 -22 -24 -32Z',variant?'#cc674d':'#dd9054');
      shape(c,'M0 -18L0 -76M0 -49L-13 -62M0 -43L14 -58M-1 -63L-8 -72',null,'#794e3c',3);
      shape(c,'M-23 -69q-4 -8 2 -12m5 -8q4 -6 8 -6',null,'#f7b777',3);
    }else if(kind==='kiosk'){
      shadow(45);
      shape(c,'M-36 -2V-58L-30 -60V-4ZM30 -2V-58L35 -59V-2Z','#b98059');
      shape(c,'M-40 -23L22 -23L40 -30L40 -7L22 0L-40 -1Z','#cd8b5c');
      shape(c,'M22 -23L40 -30V-7L22 0Z','#a26550');
      shape(c,'M-43 -26L20 -26L42 -33L-20 -33Z','#f5c482');
      shape(c,'M-42 -62Q-15 -63 -1 -100Q14 -76 40 -69L48 -63Q24 -50 -42 -55Z','#eab755');
      shape(c,'M-1 -100Q-5 -70 -19 -57L-30 -57Q-14 -71 -1 -100ZM-1 -100Q10 -70 29 -58L40 -62Q15 -75 -1 -100Z','#bd6550');
      shape(c,'M-43 -58Q-36 -47 -29 -56Q-19 -46 -11 -55Q-1 -45 8 -54Q20 -45 28 -56Q37 -48 47 -62',null,ink,2.7);
      for(let i=0;i<4;i++)oval(c,-24+i*11,-28-i%2*2,5,4,['#94464a','#efbf73','#95976c','#d37352'][i],ink);
      shape(c,'M-1 -98V-112L12 -108L0 -104',cream);
    }else if(kind==='post'){
      shadow(15);shape(c,'M-3 1V-35H4V1Z','#aa7955');
      shape(c,'M-16 -29V-51Q-14 -63 0 -61L15 -56L17 -35L3 -28Z','#a3aca0');
      shape(c,'M-15 -47Q-10 -61 -3 -54L1 -31L-15 -32Z','#cf745d');
      shape(c,'M-10 -47l7 1',null,ink,2.6);
    }else if(kind==='bench'){
      shadow(36);shape(c,'M-25 0V-23H-21V0ZM21 0V-23H25V0Z','#78664b');
      shape(c,'M-31 -30L29 -30L30 -21L-30 -21ZM-31 -17L28 -17L31 -12L-31 -12ZM-34 -11H28L36 -5L-29 -5Z','#d4a16a');
    }else if(kind==='rock'){
      shadow(17);shape(c,'M-20 -3L-16 -13L-3 -21L11 -19L22 -7L16 -1L-6 1Z','#a7968a');
      shape(c,'M-16 -12L-3 -20L10 -18L4 -13L-8 -11Z','#d8bea2',null);
    }else if(kind==='flowers'){
      for(let i=0;i<5;i++){const x=(i-2)*5,y=-8-(i*7%12);shape(c,'M'+x+' 0q2 -7 0 '+y,null,'#77684a',1.3);
        for(let j=0;j<5;j++)oval(c,x+2.2*Math.cos(j*tau/5),y+2.2*Math.sin(j*tau/5),1.9,2,variant?'#e7af61':'#ffe4a6');
        oval(c,x,y,1.4,1.4,'#a26c46');}
    }else if(kind==='ore'||kind==='mesa'){
      shadow(62);
      if(kind==='mesa'){
        shape(c,'M-69 -21L-45 -38L40 -42L71 -24L52 -6L-42 -2Z','#777781');
        shape(c,'M-69 -21L-48 -42L33 -48L71 -24L27 -16L-30 -14Z','#ccc4bd');
      }else{
        shape(c,'M-70 -4L-43 -39L-24 -47L4 -108L25 -114L47 -70L71 -7L28 2Z','#8a8991');
        shape(c,'M-59 -12L-24 -47L4 -108L25 -114L10 -66L-8 -45L-26 -15Z','#d6cfc3',null);
        shape(c,'M-28 -20L-16 -38L6 -46L25 -74L35 -79M12 -16L33 -26L47 -46',null,'#f4dfae',2.4);
      }
    }else if(kind==='mount'){
      shadow(59);shape(c,'M-72 -4Q-53 -21 -35 -50L-20 -67L-10 -59L8 -100Q13 -109 21 -98L47 -49L75 -7Q36 5 -12 -2Z','#807454');
      shape(c,'M-12 -59L8 -100Q14 -109 21 -98L35 -72L22 -78L17 -74L10 -86L4 -77L-1 -78Z','#f7dcb2');
      shape(c,'M-48 -30L-20 -67L-11 -58L-21 -60L-27 -51L-32 -52Z','#eacba4');
    }else{
      shadow(10);shape(c,'M-9 0Q-17 -7 -10 -12Q-12 -20 -5 -19Q1 -27 7 -20Q15 -20 13 -10Q20 -1 7 0Z','#959357');
    }
    return cv;
  }
  const bounds={
    left:Math.min(...C.shore.map(p=>p.x))-60,right:Math.max(...C.shore.map(p=>p.x))+60,
    top:Math.min(...C.shore.map(p=>p.y))-60,bottom:Math.max(...C.shore.map(p=>p.y))+60
  };
  function mapTransform(w,h){
    const compact=h<160;
    const iconWidth=compact?25:Math.min(42,w*.14);
    const iconHeight=iconWidth*.55,fontSize=compact?10:12;
    const boxHeight=iconHeight+fontSize+3,gap=compact?5:8,pad=compact?7:12;
    const sides={left:[],right:[],top:[],bottom:[]};
    for(const island of C.neighbors){
      const angle=Math.round(island.index/32)*Math.PI/4;
      const dx=Math.cos(angle),dy=Math.sin(angle);
      const horizontal=Math.abs(dx)>.65;
      const side=horizontal?(dx<0?'left':'right'):(dy<0?'top':'bottom');
      sides[side].push({island,position:horizontal?dy:dx});
    }
    const extra=(side,size)=>sides[side].length?size+gap:0;
    const left=pad+extra('left',iconWidth),right=w-pad-extra('right',iconWidth);
    const top=pad+extra('top',boxHeight),bottom=h-pad-extra('bottom',boxHeight);
    const s=Math.max(.001,Math.min((right-left)/(bounds.right-bounds.left),(bottom-top)/(bounds.bottom-bounds.top)));
    const ox=(left+right-(bounds.left+bounds.right)*s)/2;
    const oy=(top+bottom-(bounds.top+bounds.bottom)*s)/2;
    const land={left:ox+bounds.left*s,right:ox+bounds.right*s,top:oy+bounds.top*s,bottom:oy+bounds.bottom*s};
    const markers=[];
    for(const [side,items] of Object.entries(sides)){
      const horizontal=side==='left'||side==='right';
      const start=horizontal?land.top:land.left,end=horizontal?land.bottom:land.right;
      const size=horizontal?boxHeight:iconWidth;
      items.sort((a,b)=>a.position-b.position);
      const step=items.length>1?Math.min((end-start-size)/(items.length-1),size+gap*2):0;
      items.forEach(({island},i)=>{
        const along=(start+end)/2+(i-(items.length-1)/2)*step;
        const x=horizontal?(side==='left'?land.left-gap-iconWidth/2:land.right+gap+iconWidth/2):along;
        const y=horizontal?along:(side==='top'?land.top-gap-boxHeight/2:land.bottom+gap+boxHeight/2);
        markers.push({island,x,y,left:x-iconWidth/2,top:y-boxHeight/2,width:iconWidth,height:boxHeight});
      });
    }
    return {s,ox,oy,markers,iconHeight,fontSize};
  }
  function trace(c,fn,ring=C.shore){c.beginPath();ring.forEach((p,i)=>{const [x,y]=fn(p);if(i)c.lineTo(x,y);else c.moveTo(x,y);});c.closePath();}
  function paintField(){
    const scale=.52,cv=surface(C.width*scale,C.height*tilt*scale),c=cv.getContext('2d'),r=V.rng(6219);
    c.scale(scale,scale);
    const shorePoint=p=>[p.x,p.y*tilt];
    trace(c,shorePoint);
    c.save();c.clip();c.fillStyle=C.water?'#65968a':C.wood?'#9ea65f':C.earth?'#d6a64c':C.metal?'#a9a8ad':'#ba6059';c.fillRect(0,0,C.width,C.height*tilt);
    for(let i=0;i<650;i++){
      const x=r()*C.width,y=r()*C.height,rad=65+r()*175;
      const g=c.createRadialGradient(x,groundY(x,y),0,x,groundY(x,y),rad);
      g.addColorStop(0,C.water?(i%3?'#a2ae708a':'#367c8070'):C.wood?(i%3?'#c7cb7c94':'#667d475e'):C.earth?(i%3?'#f3cc7190':'#a6783a72'):C.metal?(i%3?'#d8d1c693':'#62697970'):(i%3?'rgba(222,128,98,.58)':'rgba(143,63,77,.52)'));g.addColorStop(1,'#00000000');
      c.fillStyle=g;c.fillRect(x-rad,groundY(x,y)-rad,rad*2,rad*2);
    }
    if(C.wood){
      shape(c,'M530 1260Q1080 690 1610 805Q2090 920 2550 970Q2040 1040 1590 940Q1100 900 530 1260Z','#56744474',null);
      shape(c,'M2010 1060Q2520 1100 3030 755Q3570 560 4590 1160Q3940 960 3510 890Q3170 903 2920 1085Q2530 1260 2010 1060Z','#69844766',null);
      shape(c,'M620 2200Q1260 1750 1840 2050Q2370 2320 3040 2020Q3530 1700 4660 1710Q3780 1860 3310 2170Q2410 2550 1690 2180Q1250 1970 620 2200Z','#667f4863',null);
    }
    if(C.earth){
      shape(c,'M700 1250Q1220 725 1650 725Q2050 710 2470 1000Q2190 939 1800 1040Q1330 1030 700 1250Z','#ac742856',null);
      shape(c,'M1190 1270Q1670 1000 2030 1045Q2540 1090 2880 935Q3320 755 3840 1090Q3410 975 2950 1170Q2380 1370 1860 1180Q1500 1110 1190 1270Z','#edbb596b',null);
      shape(c,'M2100 1540Q2530 1110 2980 1205Q3300 1250 3860 1110L4370 1430Q3820 1270 3370 1450Q2990 1570 2660 1410Z','#a67a3354',null);
    }
    c.lineCap='round';
    for(let i=0;i<42000;i++){
      const x=r()*C.width,y=r()*C.height,s=groundY(x,y),k=r();
      c.strokeStyle=C.water?(k>.5?'#93ab80':'#4f857d'):C.wood?(k>.68?'#c5c77d':k>.35?'#73804f':'#a8af65'):C.earth?(k>.68?'#e9c477':k>.35?'#b18242':'#c09956'):C.metal?(k>.68?'#c5c0b5':k>.35?'#898a91':'#aaa7a2'):(k>.68?'#da9070':k>.35?'#a55152':'#ce7666');c.lineWidth=1.5+r();
      c.beginPath();c.moveTo(x-3,s-2);c.lineTo(x-1,s);c.moveTo(x+1,s);c.lineTo(x+3,s-4);c.stroke();
    }
    c.restore();
    const project=p=>[p.x,groundY(p.x,p.y)];
    paintCoast(c,project);
    if(C.water)paintRiver(c,project,true);
    return cv;
  }
  function paintRiver(c,project,details=false){
    const samples=401,mouthStart=C.riverEnd-320,mouthEnd=C.riverEnd-65;
    // Trace past the shore so the island outline defines the mouth.
    const channelEnd=C.riverEnd+120;
    c.save();
    trace(c,project);
    c.clip();
    const projectedY=y=>project({x:C.riverX(y),y})[1];
    for(const [offset,color] of [[14,'#829877'],[7,'#9db29a'],[0,'#b4d6ba'],[-7,'#a2d3c1'],[-17,'#90c9be'],[-29,'#80beb7']]){
      const banks=[-1,1].map(side=>Array.from({length:samples},(_,i)=>{
        const y=C.riverStart+(channelEnd-C.riverStart)*i/(samples-1);
        return {x:C.riverX(y)+side*(C.riverWidth(y)+offset),y};
      }));
      trace(c,project,[...banks[0],...banks[1].reverse()]);
      const water=c.createLinearGradient(0,projectedY(mouthStart),0,projectedY(mouthEnd));
      water.addColorStop(0,color);
      water.addColorStop(.54,offset>0?'#697e75':'#659399');
      water.addColorStop(1,seaColor);
      c.fillStyle=water;c.fill();
    }
    c.restore();
    if(!details)return;
    c.save();
    c.lineCap='round';
    for(const side of [-1,1]){
      for(let i=0;i<190;i++){
        const y=C.riverStart+12+i*15+5*Math.sin(i*2.7);
        if(Math.abs(y-C.bridgeY)<85||Math.sin(i*.61+side)<-.66)continue;
        const x=C.riverX(y)+side*(C.riverWidth(y)+6+4*Math.sin(i*1.7));
        if(C.boundary(x,y)<22)continue;
        const [px,py]=project({x,y});
        const tall=i%17===0;
        c.lineWidth=tall?1.7:1.15;
        c.strokeStyle=i%2?'#576d4d':'#899b55';
        for(let j=-1;j<=1;j++){
          const h=(tall?19:5)+3*Math.sin(i+j*2)**2;
          c.beginPath();c.moveTo(px+j*2,py);
          c.quadraticCurveTo(px+j*4,py-h*.65,px+j*6,py-h);c.stroke();
        }
        if(tall)oval(c,px,py-20,2,4,'#80674d');
        if(i%13===4){
          const [rx,ry]=project({x:x-side*14,y});
          oval(c,rx,ry+2,10,4,'#d7e9d7');
          oval(c,rx,ry-1,8,5,'#7c8777');
          oval(c,rx-1,ry-3,6,3,'#b3b7a3');
        }
      }
    }
    c.restore();
  }
  const bridgeX=C.riverX(C.bridgeY),bridgeSpan=118,bridgeHalfDepth=44;
  const bridgeLift=x=>24*Math.max(0,1-((x-bridgeX)/bridgeSpan)**2);
  function bridgeDeckY(x,y){return groundY(x,y)-bridgeLift(x);}
  function drawStoneBridge(c){
    const x=bridgeX,y=C.bridgeY;
    const polygon=(points,fill,line='#596257')=>{
      c.beginPath();c.moveTo(...points[0]);for(const point of points.slice(1))c.lineTo(...point);
      c.closePath();c.fillStyle=fill;c.fill();
      if(line){c.strokeStyle=line;c.lineWidth=1.4;c.stroke();}
    };
    const deck=(dx,dy)=>[x+dx,bridgeDeckY(x+dx,y+dy)];
    const stone=['#a7ab90','#b5b8a6','#8f9886','#999f8c','#aeb39b'];
    for(let dx=-bridgeSpan;dx<bridgeSpan;dx+=16){
      const end=Math.min(bridgeSpan,dx+16);
      for(let row=0;row<4;row++){
        const dy=-bridgeHalfDepth+row*22;
        const color=stone[(row+Math.round((dx+bridgeSpan)/16)*3)%stone.length];
        polygon([deck(dx,dy),deck(end,dy),deck(end,dy+22),deck(dx,dy+22)],color);
      }
    }
    for(const side of [-1,1]){
      const dy=side*bridgeHalfDepth;
      for(let dx=-bridgeSpan;dx<bridgeSpan;dx+=12){
        const end=Math.min(bridgeSpan,dx+12);
        const a=deck(dx,dy),b=deck(end,dy);
        const footing=px=>groundY(x+px,y+dy)+8-24*Math.sqrt(Math.max(0,1-(px/63)**2));
        if(side===1)polygon([a,b,[b[0],footing(end)],[a[0],footing(dx)]],'#737c70');
        const moss=Math.round((dx+bridgeSpan)/12)%4===0;
        polygon([[a[0],a[1]-7],[b[0],b[1]-7],b,a],moss?'#879365':'#a3aa95');
      }
      for(const dx of [-110,110]){
        const [px,py]=deck(dx,dy);
        polygon([[px-7,py-17],[px+7,py-17],[px+7,py+3],[px-7,py+3]],'#818c76');
        polygon([[px-9,py-16],[px-5,py-22],[px+6,py-22],[px+9,py-16]],'#aeb49b');
      }
    }
  }
  function drawRiverFlow(c,top,bottom,time,reduced){
    const start=C.riverStart,end=C.riverEnd;
    const offset=reduced?0:(time*.041)%41;
    c.lineCap='round';
    for(let row=Math.floor((top/tilt-start)/41)-1;row<(bottom/tilt-start)/41+2;row++){
      for(let lane=0;lane<4;lane++){
        const y=start+row*41+offset+lane*9;
        const finish=y+23+lane*4;
        if(y<=start||finish>=end)continue;
        const fraction=(lane-1.5)*.43+.1*Math.sin(row*1.7+lane);
        const position=dy=>C.riverX(dy)+fraction*C.riverWidth(dy);
        const x=position(y),mid=(y+finish)/2,xMid=position(mid),xEnd=position(finish);
        if(C.boundary(x,y)<2||C.boundary(xEnd,finish)<2)continue;
        c.beginPath();c.moveTo(x,groundY(x,y));
        c.quadraticCurveTo(xMid,groundY(xMid,mid),xEnd,groundY(xEnd,finish));
        c.globalAlpha=1-V.clamp((y-(end-245))/180,0,1);
        c.strokeStyle=lane%2?'#d5f7ebaa':'#498d9d79';c.lineWidth=lane%2?1.7:2.5;c.stroke();
      }
    }
    c.globalAlpha=1;
  }
  function splash(c,x,y,progress,opacity){
    c.save();
    c.globalAlpha=opacity;
    c.strokeStyle='#e0faf4';c.lineWidth=1.2;
    c.beginPath();c.ellipse(x,y,7+progress*15,2.5+progress*6,0,0,tau);c.stroke();
    for(const sign of [-1,1])oval(c,x+sign*(6+15*progress),y-14*Math.sin(Math.PI*progress),1.6,2,'#d1f2eb');
    c.restore();
  }
  function paintCoast(c,project){
    // Adjacent contours share their edges. Painting from deep water to grass
    // gives the wet sand and shallow water a continuous transition.
    const strips=24;
    const ring=t=>C.shore.map((p,i)=>C.insetPoint(p,t*(t<0?52:34+C.beachWidth(i))));
    let outer=ring(-1);
    c.save();
    for(let j=1;j<=strips;j++){
      const t=-1+j*2/strips,inner=ring(t);
      const shoreStrength=Math.min(1,Math.max(0,1+t))**1.8;
      const dry=V.clamp(t/.24,0,1);
      for(let i=0;i<outer.length;i++){
        const next=(i+1)%outer.length;
        const beach=(C.beachAt(i)+C.beachAt(next))/2;
        const wet=shoreStrength*(.53+.29*beach)*(1-dry);
        const sand=beach*dry*(1-t)**1.2;
        const p=C.shore[i],q=C.shore[next];
        const y=(p.y+q.y)/2,x=(p.x+q.x)/2;
        const mouth=C.water&&y>C.riverEnd-230
          ? V.clamp((C.riverWidth(y)+32-Math.abs(x-C.riverX(y)))/42,0,1) : 0;
        const strength=(wet+sand)*(1-mouth);
        if(strength<.015)continue;
        const points=[outer[i],outer[next],inner[next],inner[i]].map(project);
        c.beginPath();c.moveTo(...points[0]);
        for(const point of points.slice(1))c.lineTo(...point);
        c.closePath();
        const mix=sand/strength;
        const color=[98+135*mix,137+53*mix,137-6*mix].map(Math.round);
        c.fillStyle='rgba('+color.join(',')+','+strength+')';c.fill();
        c.strokeStyle=c.fillStyle;c.lineWidth=.35;c.stroke();
      }
      outer=inner;
    }
    c.restore();
  }
  const islandImages=new Map();
  async function loadIslandArt(){
    await Promise.all(Object.entries(window.VillageIslandArt).map(async ([id,src])=>{
      const image=new Image();
      image.src=src;
      try{await image.decode();islandImages.set(id,image);}catch{/* Keep the illustrated fallback if an asset cannot load. */}
    }));
  }
  function drawIsland(c,island){
    const image=islandImages.get(island.art||island.destination);
    if(image){
      const scale=Math.min(236/image.naturalWidth,127/image.naturalHeight);
      const width=image.naturalWidth*scale,height=image.naturalHeight*scale;
      c.drawImage(image,-width/2,19-height,width,height);
      return;
    }
    oval(c,7,-1,116,23,'#aabbad');
    oval(c,7,-5,108,20,island.colors[0]);
    shape(c,island.ridge,island.colors[0],null);
    shape(c,island.detail,island.colors[2],null);
    shape(c,'M-106 -6Q-65 -27 -38 -16Q-14 -5 16 -16Q56 -30 88 -14L110 -9Q63 18 3 16Q-65 16 -106 -6Z',island.colors[1],null);
    if(island.veins)shape(c,island.veins,null,'#e1d7bf',2.4);
  }
  function mapFace(c,x,y,r){
    c.save();c.translate(x,y);c.scale(r/12,r/12);
    oval(c,0,0,12,12,'#fff1cd','#573c40');
    oval(c,0,1.5,7.5,7.8,'#965e44');
    oval(c,0,3,6.3,6,'#f4be8d');
    oval(c,-5.8,3.4,1.5,1.7,'#edb189');
    oval(c,5.8,3.4,1.5,1.7,'#edb189');
    oval(c,-2.4,2.7,.85,1.15,'#4a3634');
    oval(c,2.4,2.7,.85,1.15,'#4a3634');
    shape(c,'M-1.4 5.8q1.4 1.4 2.8 0',null,'#9d6652',.8);
    oval(c,0,-4.2,7.3,4.7,'#92a8a4');
    oval(c,.8,-1.5,7.9,1.65,'#b0c0b5');
    c.restore();
  }
  function distantIslands(c,player){
    for(const island of C.neighbors){
      if(island.destination)continue; // The interactive island is drawn by its button.
      const {x,y}=island.center;
      const opacity=C.metal?1:V.clamp((440-V.distance(player,island.shore))/210,0,1)*.76;
      if(opacity===0)continue;
      c.save();c.translate(x,y*tilt);c.globalAlpha=opacity;
      drawIsland(c,island);
      if(C.metal){
        c.font='700 13px system-ui,sans-serif';c.textAlign='center';
        c.fillStyle='#fff1cd';c.fillText(island.name,0,42);
      }
      c.restore();
    }
  }
  // Rounded solids in character-local 3D axes. Facing and walking are continuous.
  function avatar(c,p){
    const a=p.yaw||0,cos=Math.cos(a),sin=Math.sin(a),parts=[];
    function ball(x,h,z,rx,ry,rz,color){
      const xx=x*cos+z*sin,zz=z*cos-x*sin;
      parts.push({x:xx,y:zz*tilt-h*up,depth:zz*up+h*tilt,rx:Math.hypot(rx*cos,rz*sin),ry:Math.hypot(ry*up,tilt*Math.hypot(rz*cos,rx*sin)),color});
    }
    const swing=p.moving?Math.sin(p.phase):0,base=p.sitting?-3:0;
    for(const sign of [-1,1]){
      const step=swing*sign;
      ball(sign*4,11+base,step*4,3.1,7,3,'#db9c74');
      ball(sign*4,4+base+Math.max(0,step)*3,2+step*5,4.2,3.8,5.5,'#6d5449');
      ball(sign*4,16+base,0,4.2,5,4.2,'#9b6d4e');
      ball(sign*8,24+base,-step*4,3.2,6,3.2,'#edb189');
    }
    ball(0,25+base,0,8,10,6.3,'#83928a');ball(0,40+base,-2,13,13,12,'#925c45');
    ball(0,40+base,2,11.8,12.3,10.5,'#f4be8d');
    for(const sign of [-1,1]){
      ball(sign*10.4,41+base,1,3,4.2,3,'#eeb489');
      ball(sign*4.4,42+base,11.4,1.55,2.15,1.15,'#4a3634');
      ball(sign*4.45-.25,42.8+base,12.1,.48,.48,.42,'#fff3ca');
      ball(sign*7,39+base,10,2.1,.9,.6,'#df997d');
      ball(sign*9,46+base,5.7,4.1,5.4,4.5,'#935b40');
    }
    ball(0,39.7+base,12,1.25,1.1,1.3,'#e3a37a');
    ball(0,37+base,11.6,1.8,.55,.65,'#9d6652');
    ball(-4,48+base,8,6,3.2,3,'#955e40');
    ball(0,51+base,-1,14.3,8.6,13,'#92a8a4');ball(0,50+base,7.7,14.2,2.4,8,'#b0c0b5');
    ball(0,59+base,-1,2.7,1.8,2.7,'#718a89');
    oval(c,1,0,11,3,'#733e454f');
    parts.sort((l,r)=>l.depth-r.depth);
    for(const b of parts){const gradient=c.createRadialGradient(b.x-b.rx*.3,b.y-b.ry*.38,0,b.x,b.y,b.rx*1.3);
      gradient.addColorStop(0,b.color);gradient.addColorStop(.72,b.color);gradient.addColorStop(1,ink);
      oval(c,b.x,b.y,b.rx,b.ry,gradient);}
  }
  function paintLeaf(c,x,y,angle,color,size){
    c.save();c.translate(x,y);c.rotate(angle);c.scale(size,size);
    c.beginPath();c.moveTo(-7,0);c.quadraticCurveTo(-3,-6,7,-1);
    c.quadraticCurveTo(4,5,-7,0);c.fillStyle=color;c.fill();
    c.beginPath();c.moveTo(-8,1);c.lineTo(4,-1);c.strokeStyle='#79472f';c.lineWidth=.8;c.stroke();
    c.restore();
  }
  const houseStyles={
    wood:{name:'목 · 초록',roof:'#6f8455',shade:'#4f6844'},
    fire:{name:'화 · 주홍',roof:'#ca7258',shade:'#a14f42'},
    earth:{name:'토 · 황토',roof:'#cc9a48',shade:'#9e7039'},
    metal:{name:'금 · 은회색',roof:'#aaa9b1',shade:'#787c88'},
    water:{name:'수 · 청록',roof:'#56898e',shade:'#436875'}
  };
  function drawHouse(c,house,y){
    const style=houseStyles[house.color];
    c.save();c.translate(house.x,y);
    oval(c,0,-4,48,9,'#49363238');
    shape(c,'M36 -5L56 -17V-57L36 -45Z','#c8ad85');
    shape(c,'M-36 -5V-45L0 -80L36 -45V-5Z','#ead6ad');
    // The ridge and right eave share the same rearward offset.
    shape(c,'M0 -84L20 -96L62 -57L42 -45Z',style.roof);
    shape(c,'M11 -74L31 -86M22 -64L42 -76M32 -54L52 -66',null,style.shade,1.2);
    shape(c,'M-42 -45L0 -84L42 -45L39 -41L0 -77L-39 -41Z',style.shade);
    shape(c,'M42 -45L62 -57V-53L39 -41Z',style.shade);
    oval(c,0,-58,5,5,'#ffe6a7',ink);
    shape(c,'M-11 -5V-26Q-2 -40 7 -26V-5Z','#8b6149');
    shape(c,'M-29 -29h13v13h-13z M16 -29h13v13h-13z','#ffe6a7');
    shape(c,'M-22.5 -29v13M-29 -22.5h13M22.5 -29v13M16 -22.5h13',null,ink,1);
    shape(c,'M49 6v-17m42 17v-17',null,ink,2);
    c.fillStyle='#f9e7bc';c.strokeStyle=ink;c.lineWidth=1.3;
    c.beginPath();c.roundRect(42,-24,56,20,3);c.fill();c.stroke();
    c.fillStyle=ink;c.font='600 10px system-ui,sans-serif';c.textAlign='center';c.textBaseline='middle';
    c.fillText(house.name+'의 집',70,-14,49);c.restore();
  }
  const furniture = {
    wood:{label:'목',accent:'#738754',names:['참나무 벤치','덩굴 무늬 수납장','새싹 화분']},
    fire:{label:'화',accent:'#b5563e',names:['주홍 방석 벤치','테라코타 수납장','노을 다육 화분']},
    earth:{label:'토',accent:'#b28348',names:['황토색 벤치','흙빛 도자기 수납장','옹기 화분']},
    metal:{label:'금',accent:'#888e98',names:['은빛 철제 벤치','백동 손잡이 수납장','은회색 화분']},
    water:{label:'수',accent:'#4c7788',names:['물빛 방석 벤치','물결 무늬 수납장','청유 항아리 화분']}
  };
  // Draw each piece once at thumbnail resolution, then reuse it in the room.
  const furnitureSprites=new Map();
  const finishes={
    wood: {light:'#e6c693',mid:'#be915e',dark:'#805d40',trim:'#607751'},
    fire: {light:'#f4b991',mid:'#cd7858',dark:'#964b3b',trim:'#ffe0aa'},
    earth:{light:'#efd195',mid:'#bc965f',dark:'#856242',trim:'#f7e2ae'},
    metal:{light:'#e5e7e2',mid:'#a5afa9',dark:'#63706f',trim:'#c59559'},
    water:{light:'#b9d8d0',mid:'#77a9ad',dark:'#446f79',trim:'#e0eee1'}
  };
  const inlays={
    wood:'M-11 1Q-4 3 1 -2Q5 -5 11 -3M-3 0Q-8 -6 -9 -3Q-7 0 -3 0M3 -3Q6 2 9 0',
    fire:'M-11 1L-7 -2L-3 1L1 -3L5 1L9 -2',
    earth:'M-11 1H-6V-2H-2V1H2V-2H6V1H11',
    metal:'M-10 0H-4L0 -3L4 0L0 3L-4 0M4 0H10',
    water:'M-12 0Q-8 -4 -4 0T4 0T12 0M-7 3Q-4 1 -1 3T6 3'
  };
  function furnitureSprite(element,kind){
    const cv=surface(168,144),c=cv.getContext('2d'),f=finishes[element];
    c.scale(3,3);c.translate(28,42);c.lineJoin=c.lineCap='round';
    const outline='#59493f';
    const panel=(path,fill)=>shape(c,path,fill,outline,1.15);
    const line=(path,color,width=1)=>shape(c,path,null,color,width);
    const sheen=c.createLinearGradient(-14,-29,16,-2);
    sheen.addColorStop(0,f.light);sheen.addColorStop(.44,f.mid);sheen.addColorStop(1,f.dark);
    function detail(x,y,scale){
      c.save();c.translate(x,y);c.scale(scale,scale);line(inlays[element],f.trim,1.35);c.restore();
    }
    const product=V.catalog.get(element+':'+kind);
    if(product&&product.type!=='classic'){
      const v=product.variant,span=13+v%3*2;
      const arch=(x,y,w,h)=>{c.beginPath();c.roundRect(x,y,w,h,2+v%3);c.fillStyle=sheen;c.fill();c.strokeStyle=outline;c.lineWidth=1.1;c.stroke();};
      const leg=(x,y)=>line('M'+x+' '+y+'v6',f.dark,2.5);
      const top=(y)=>{panel('M-21 '+y+'l5 -5h36l-4 5z',f.light);};
      oval(c,1,0,20,3,'#503a3526');
      switch(product.type){
      case 'seat':case 'sofa':{
        const width=product.type==='sofa'?40:26;
        if(v!==1||product.type==='sofa')arch(-width/2,-28-v,width,15);
        arch(-width/2-1,-15,width+2,8);leg(3-width/2,-7);leg(width/2-3,-7);
        if(v>=2||product.type==='sofa'){arch(-width/2-2,-18,4,9);arch(width/2-2,-18,4,9);}
        if(product.type==='sofa'&&v===3){arch(2,-14,18,13);line('M-15 -13H0',f.light);}
        detail(0,-21,.78);break;
      }
      case 'table':
        leg(-14,-7);leg(14,-7);arch(-17,-15,34,9);
        if(v===0||v===3)oval(c,0,-16,21,7,f.light,outline);else top(-15);
        detail(0,-10,.66);break;
      case 'shelf':
        arch(-span,-35,span*2,33);
        for(let i=0;i<(v===4?1:3);i++){
          const y=-31+i*9;panel('M-10 '+y+'h20v7h-20z',v===0||v===1?f.dark:f.mid);
          if(v<2){for(let j=0;j<=i+1;j++)line('M'+(-8+j*4)+' '+(y+5)+'v-4',j%2?f.trim:f.light,2);}
          else oval(c,0,y+4,1.6,1,f.trim);
        }if(v===4)line('M0 -30v25',f.dark);break;
      case 'bed':
        arch(-17,-32,34,20);panel('M-16 -23h31l6 18h-42z',f.light);
        oval(c,-4,-21,9,3,'#f6e7cc');panel('M-18 -16h35l4 11h-42z',f.mid);
        if(v===3){line('M-19 -5v-32h38v32',f.dark,2);top(-33);}
        detail(0,-11,.85);leg(-17,-5);leg(17,-5);break;
      case 'lamp':
        oval(c,0,-2,10,3,f.dark,outline);line('M0 -4v-22',f.dark,2.6);
        if(v===2){line('M-5 -33Q0 -43 5 -33',f.dark,1.6);line('M0 -15v8',f.trim,2);}
        if(v===2||v===3)oval(c,0,-25,span-3,11,f.light,outline);
        else panel('M-7 -36h14l7 17h-28z',f.light);
        detail(0,-24,.65);break;
      case 'rug':
        if(v===0)oval(c,0,-9,22,10,f.mid,outline);
        else panel('M-16 -21h34l5 18h-46z',f.mid);
        for(const y of [-13,-8]){line('M-15 '+y+'h30',f.light,.9);detail(0,y,.65);}
        if(v!==0)for(let x=-18;x<=18;x+=4)line('M'+x+' -3v3',f.trim);break;
      case 'screen':
        for(let i=0;i<3;i++){const x=-20+i*13;arch(x,-32+(i%2)*3,13,29);detail(x+6,-20,.44);leg(x+2,-5);}
        if(v===3){c.clearRect(-23,-40,46,38);line('M-20 -16H20M-20 -8H20',f.dark,2.6);for(const x of [-18,-9,0,9,18])panel('M'+x+' 0v-18l2 -3 2 3v18z',f.light);}
        if(v===1||v===4)for(let y=-26;y<-8;y+=5)line('M-19 '+y+'h37',f.dark,.8);break;
      case 'vase':
        panel(v===1?'M-19 -15Q-16 0 0 -1Q16 0 19 -15Z':'M-5 -30h10q-2 8 5 14Q19 -2 5 0h-10Q-18 -4 -10 -16Q-3 -23 -5 -30Z',sheen);
        oval(c,0,v===1?-15:-30,v===1?19:5,2.4,f.dark,outline);
        detail(0,-9,.73);
        if(v===0||v===4){line('M0 -28l-6 -8m6 8 7 -10','#607453',1.5);oval(c,6,-36,5,3,'#93aa75');}break;
      case 'mirror':
        arch(-12,-8,24,6);line('M0 -5v-13',f.dark,3);
        oval(c,0,-23,span-3,14,f.dark,outline);oval(c,0,-23,span-5,12,'#bbd4d0');
        line('M-6 -22l8 -9m-4 13 7 -8','#f8f1df',1.6);
        if(v===4){for(const x of [-21,13]){arch(x,-31,8,22);c.fillStyle='#bbd4d0';c.fillRect(x+2,-28,4,15);}}break;
      }
      return cv;
    }
    oval(c,1,1,kind==='2'?13:22,3,'#503a352b');
    if(kind==='0'){
      panel('M-18 -13H-14L-15 0H-18ZM14 -13H18L18 0H15Z',f.dark);
      panel('M-19 -12V-27Q0 -32 18 -27V-12Z',sheen);
      line('M-16 -25Q0 -29 15 -25',f.light);detail(0,-21,.94);
      panel('M-22 -12L-17 -17H17L22 -12V-7H-22Z',f.mid);
      const cushion=element==='fire'||element==='water';
      panel('M-22 -12L-17 -17H17L22 -12Q1 -10 -22 -12Z',cushion?f.light:'#e6c69b');
      line('M-18 -8.5H18',f.light,.8);
      if(cushion)line('M-15 -14.6Q0 -13.5 15 -14.6',f.dark,.7);
      else line('M-15 -14H-4M0 -14H14','#97754f',.65);
      for(const x of [-16,16])oval(c,x,-9,1,1,f.trim);
    }else if(kind==='1'){
      panel('M-16 -5H-12V0H-16ZM11 -5H15V0H11Z',f.dark);
      panel('M-18 -30H14V-4H-18Z',sheen);
      panel('M14 -30L20 -34V-8L14 -4Z',f.dark);
      panel('M-20 -30L-14 -35H21L15 -30Z',f.light);
      panel('M-15 -27H11V-18H-15ZM-15 -16H11V-7H-15Z',f.mid);
      detail(-2,-23,.59);line('M-12 -14H8',f.light,.65);
      for(const y of [-19.7,-10.6]){
        oval(c,-1.7,y,2.6,1.35,outline);oval(c,-1.7,y-.55,2,1,f.trim);
      }
    }else{
      const round=element==='water'||element==='earth';
      panel(round?'M-8 -16Q-7 -13 -11 -10Q-15 -4 -7 0Q0 3 7 0Q15 -4 11 -10Q7 -14 8 -16Z':
        'M-11 -16H11L8 -2Q0 2 -8 -2Z',sheen);
      oval(c,0,-16,round?8.7:11.5,3.1,f.light,outline);
      oval(c,0,-16,round?6.8:9,1.65,'#745c48');detail(0,-7,.63);
      if(element==='fire'){
        for(const [x,y,angle] of [[-6,-22,-.85],[6,-22,.85],[-3,-26,-.42],[3,-26,.42],[0,-25,0]]){
          c.save();c.translate(x,y);c.rotate(angle);panel('M0 5Q-6 -1 0 -9Q5 -2 0 5Z','#91a47b');line('M0 -8L1 -6','#c47d64');c.restore();
        }
      }else if(element==='water'){
        line('M0 -16Q-5 -25 -9 -29M0 -16Q4 -25 8 -31M0 -16Q1 -30 -2 -35','#607a59',1.6);
        for(const [x,y] of [[-9,-30],[8,-32],[-2,-36]])oval(c,x,y,1.8,3.2,'#947c58');
      }else{
        const leaf=element==='metal'?'#91a99a':element==='wood'?'#78955b':'#899252';
        line('M0 -16Q3 -24 0 -32','#627653',1.6);
        panel('M1 -21Q-12 -21 -12 -31Q-1 -32 1 -21Z',leaf);
        panel('M1 -26Q2 -36 13 -34Q12 -26 1 -26Z',leaf);
        line('M-9 -29L-1 -23M3 -28L10 -32','#d1d7ab',.8);
        if(element==='earth')for(const x of [-5,3,9])oval(c,x,-33+Math.abs(x%3),2.1,2,'#eed39a');
      }
    }
    return cv;
  }
  const paintedKinds=[0,1,2,3,4,8,11,13,17,18,22,23,26,29,30,33,35,38,41,44,46,48,52];
  const sheets={};
  V.furnitureReady=Promise.allSettled(Object.entries(window.VillageFurnitureSheets).map(async ([element,url])=>{
    const sheet=new Image();
    sheet.src=url;
    await sheet.decode();
    sheets[element]=sheet;
  }));
  const collections={};
  for(const element of Object.keys(window.VillageFurnitureSheets)){
    const img=new Image();img.src='./assets/'+element+'-collection.webp';collections[element]=img;
  }
  V.furnitureReady=Promise.allSettled([V.furnitureReady,...Object.values(collections).map(img=>img.decode())]);
  function drawFurniture(c,x,id,y=106){
    const [element,kind]=id.split(':');
    const item=V.catalog.get(id);
    if(!item)return;
    if(item.tile!==undefined){
      const img=collections[element];
      if(img.complete&&img.naturalWidth){
        const size=img.width/4;
        c.drawImage(img,item.tile%4*size,Math.floor(item.tile/4)*size,size,size,x-24,y-45,48,48);
      }
      return;
    }
    // Older saves can contain variations retired from the shop.
    let tile=paintedKinds.indexOf(Number(kind));
    if(tile<0)tile=paintedKinds.findIndex(n=>V.catalog.get(element+':'+n)?.type===item.type);
    const sheet=sheets[element];
    if(sheet&&tile>=0){
      const cell=sheet.width/5;
      c.drawImage(sheet,tile%5*cell,Math.floor(tile/5)*cell,cell,cell,x-24,y-42,48,48);
    }else{
      if(!furnitureSprites.has(id))furnitureSprites.set(id,furnitureSprite(element,kind));
      c.drawImage(furnitureSprites.get(id),x-28,y-42,56,48);
    }
  }
  // Project the floor and its grid only. Keep each furniture illustration upright.
  function editorCamera(view,bedroom){
    const cy=bedroom?150:192;
    if(view===2)return new DOMMatrix().translate(200,cy*.83).scale(1.04,2.05).translate(-200,-58);
    return new DOMMatrix().translate(200,cy).scale(.96).translate(-200,-cy);
  }
  function drawPlan(c,view,color,bedroom,frames,pieces,cells,selected,island){
    const m=editorCamera(view,bedroom);
    c.save();c.fillStyle='#30282c';c.fillRect(0,0,400,bedroom?280:384);
    c.transform(m.a,m.b,m.c,m.d,m.e,m.f);
    drawHouseInterior(c,color,null,bedroom,frames,true,pieces,cells,selected,island);
    c.restore();
  }
  const furnitureScale=item=>{
    const kind=Number(item.id.split(':')[1]);
    if(kind>=53)return 1.08+.26*(item.w-1)+.10*(item.h-1);
    if([18,22,26,38,48,52].includes(kind))return 1.55;
    if([29,30].includes(kind))return 1.12;
    return Math.min(1.6,.78+.23*(item.w+item.h-2));
  };
  Object.assign(V,{editorCamera,drawPlan});
  const roomPlate=new Image();
  roomPlate.src='./assets/room-oak.webp';
  const sunlight={
    fire:{sky:'#eea57a',hill:'#bf7354',light:'#ffb06e',reach:89},
    water:{sky:'#bddde0',hill:'#7ca7ad',light:'#c3f1fa',reach:59},
    metal:{sky:'#dce5ee',hill:'#8e979f',light:'#f2f6ff',reach:72},
    earth:{sky:'#ecd5a3',hill:'#b09665',light:'#ffdf9c',reach:61},
    wood:{sky:'#c4d8be',hill:'#82a078',light:'#f2edbb',reach:57}
  };
  function windowLight(c,wx,theme,island){
    c.save();c.translate(wx-22,94);c.transform(1,0,wx<200?.34:-.34,1,0,0);
    c.fillStyle=theme.light;
    c.shadowColor=theme.light;c.shadowBlur=island==='earth'?9:4;
    c.globalAlpha=island==='metal'?.40:.32;
    for(const x of [0,23])for(const y of [0,theme.reach/2+2])c.fillRect(x,y,20,theme.reach/2-2);
    c.shadowBlur=0;
    if(island==='water'||island==='wood'){
      c.fillStyle=island==='wood'?'#606f41':'#f4ffff';
      c.globalAlpha=.23;
      for(let i=0;i<13;i++){
        c.beginPath();c.ellipse(4+(i*19)%35,4+(i*13)%(theme.reach-6),island==='wood'?3:6,1.5,-.3,0,tau);c.fill();
      }
    }
    c.restore();
  }
  function drawHouseInterior(c,color,p,bedroom,frames=[],editing=false,furnishings=[],cells=[],selected=null,island=C.id){
    const style=houseStyles[color];
    const depth=bedroom?0:104, bottom=242+depth;
    c.clearRect(0,0,400,280+depth);
    c.fillStyle='#30282c';c.fillRect(0,0,400,280+depth);
    const left=bedroom?58:26,right=400-left;
    const floor=c.createLinearGradient(0,84,0,bottom);
    floor.addColorStop(0,bedroom?'#aa876f':'#b59477');
    floor.addColorStop(.35,bedroom?'#dec3a1':'#e9ceaa');
    floor.addColorStop(1,bedroom?'#cead8b':'#dbc09e');
    c.fillStyle=floor;c.fillRect(left,84,right-left,158+depth);
    for(let y=98;y<bottom;y+=16){
      c.fillStyle='#fff8e438';c.fillRect(left,y+1,right-left,1);
      shape(c,'M'+left+' '+y+'H'+right,null,'#87624a50',.7);
      for(let x=left+26+(y%32===2?0:24);x<right;x+=55){
        shape(c,'M'+x+' '+y+'v-14',null,'#87624a48',.7);
        c.fillStyle='#96725228';c.fillRect(x+3,y-6,Math.min(22,right-x-3),.6);
      }
    }
    const wall=c.createLinearGradient(0,4,0,85);
    wall.addColorStop(0,'#e1ccb1');wall.addColorStop(1,'#f3e9d1');
    c.fillStyle=wall;c.fillRect(left,4,right-left,80);
    for(let x=left+10;x<right-5;x+=10){
      c.fillStyle='#ae94782b';c.fillRect(x,6,1,69);
    }
    shape(c,'M'+left+' 6H'+right,null,'#fff3d8',2);
    c.fillStyle=style.shade;c.fillRect(left,78,right-left,6);
    shape(c,'M'+left+' 77H'+right,null,'#e9ceb0',2);
    shape(c,'M'+left+' 4L'+(left-13)+' 15V'+(bottom+10)+'L'+left+' '+bottom+'Z','#b59c88');
    shape(c,'M'+right+' 4L'+(right+13)+' 15V'+(bottom+10)+'L'+right+' '+bottom+'Z','#987f71');
    const shade=c.createLinearGradient(0,84,0,109);
    shade.addColorStop(0,'#69473555');shade.addColorStop(1,'#69473500');
    c.fillStyle=shade;c.fillRect(left,84,right-left,25);
    if(roomPlate.complete&&roomPlate.naturalWidth){
      const w=roomPlate.width,h=roomPlate.height,seam=Math.round(h*.425);
      c.drawImage(roomPlate,0,0,w,seam,left,4,right-left,80);
      c.drawImage(roomPlate,0,seam,w,h-seam,left,84,right-left,bottom-84);
      c.fillStyle=shade;c.fillRect(left,84,right-left,25);
    }
    const theme=sunlight[island]||sunlight.wood;
    const wx=bedroom?296:103;
    windowLight(c,wx,theme,island);
    c.save();c.translate(wx,-20);
    shape(c,'M-23 43H23V72H-23Z','#fff1d9');
    shape(c,'M-20 46H20V69H-20Z',theme.sky,null);
    shape(c,'M-20 61Q-10 53 0 65Q10 58 20 60V69H-20Z',theme.hill,null);
    shape(c,'M0 44V71M-22 57H22',null,'#fff1d9',1.6);
    shape(c,'M-25 73H25',null,'#d6bc9b',3);
    c.restore();
    shape(c,'M'+left+' '+bottom+'H'+right,null,'#8c684d',3);
    const opening=bedroom?234:85,end=bedroom?280:4;
    const corridor=c.createLinearGradient(0,end,0,opening);
    corridor.addColorStop(0,'#30282c');corridor.addColorStop(1,'#685248');
    c.fillStyle=corridor;c.fillRect(172,Math.min(opening,end),56,Math.abs(end-opening));
    shape(c,'M172 '+opening+'V'+end+'M228 '+opening+'V'+end,null,'#a18470',3);
    if(!bedroom)shape(c,'M77 '+bottom+'H126',null,'#f1d9aa',5);
    const framePositions=bedroom?[116,196,246]:[148,256,324];
    framePositions.forEach((x,index)=>{
      const frame=frames[index];
      if(frame){
        c.fillStyle='#54372b48';c.fillRect(x-12,49,27,27);
        c.fillStyle='#896346';c.fillRect(x-13,46,26,26);
        c.fillStyle='#fbefd6';c.fillRect(x-10,49,20,20);
        if(frame.art)c.drawImage(frame.art,x-10,49,20,20);
        else paintLeaf(c,x,59,-.5,'#bc623d',.85);
      }
      if(editing){
        oval(c,x,40,6,6,'#f8ead3',ink);
        c.save();c.font='bold 8px system-ui';c.textAlign='center';c.fillStyle=ink;
        c.fillText(index+1,x,43);c.restore();
      }
    });
    if(editing){
      for(const cell of cells){
        c.fillStyle=cell.key===selected?'#f7e8aaad':'#fff3dc24';
        c.fillRect(cell.x-21,cell.y-24,42,28);
        c.strokeStyle=cell.key===selected?'#495c48':'#765f4755';
        c.strokeRect(cell.x-21,cell.y-24,42,28);
      }
    }
    const drawGuest=()=>{c.save();c.translate(p.x,p.y);c.scale(.76/(c.canvas.roomWidthFactor||1),.76);avatar(c,p);c.restore();};
    let guestDrawn=!p;
    for(const item of furnishings){
      if(!guestDrawn&&p.y<item.y){drawGuest();guestDrawn=true;}
      oval(c,item.x+1,item.y,12*item.w,2.4*item.h,'rgba(75,53,38,.13)');
      c.save();c.translate(item.x,item.y);const scale=furnitureScale(item);c.scale(scale/(c.canvas.roomWidthFactor||1),scale);drawFurniture(c,0,item.id,0);c.restore();
    }
    if(!guestDrawn)drawGuest();
  }
  const woodlandTreeScale=(kind)=>C.wood&&kind==='pine'?1.45:1;
  class Scene{
    constructor(canvas,terrain){
      this.canvas=canvas;this.terrain=terrain;this.field=paintField();this.art={};this.objects=[];
      for(const k of ['tree','pine','flowers','mount','kiosk','post','bench','rock','shrub','ore','mesa'])this.art[k]=[stamp(k,0),stamp(k,1)];
      const add=(x,y,k,size=1,variant=0,id=null)=>this.objects.push({x,y,k,size,variant,id});
      const rnd=V.rng(185),spawn=V.spawn;
      for(let i=0;i<3300;i++){
        const x=rnd()*C.width,y=rnd()*C.height;if(C.boundary(x,y)<24||V.distance({x,y},spawn)<78||V.getPlaces().some(p=>V.distance(p,{x,y})<55))continue;
        const t=rnd(),k=C.water?(t<.09?'pine':t<.27?'shrub':t<.52?'flowers':null):C.wood?(t<.16?'pine':t<.22?'rock':t<.45?'shrub':t<.78?'flowers':null):C.earth?(t<.06?'rock':t<.23?'shrub':'flowers'):C.metal?(t<.24?'rock':t<.39?'shrub':t<.55?'flowers':null):t<.10?'tree':t<.17?'pine':t<.24?'rock':t<.31?'shrub':'flowers';
        const size=(.48+rnd()*.58)*woodlandTreeScale(k);
        const byBridge=C.water&&Math.abs(x-bridgeX)<bridgeSpan+20&&Math.abs(y-C.bridgeY)<bridgeHalfDepth+20;
        if(k&&!byBridge&&!C.waterAt(x,y)&&C.boundary(x,y)>=28+C.beachWidth(C.edge(x,y)))add(x,y,k,size,i%2);
      }
      if(C.metal){
        for(const {x,y,kind,size} of V.rockFormations)add(x,y,kind,size);
      }else if(C.id==='fire')for(const [dx,dy,k,s] of [[-132,-76,'kiosk',1.15],[160,-152,'tree',1.05],[-94,73,'flowers',1.1],[95,46,'pine',.87],[63,-73,'flowers',1],[125,-260,'mount',1.9],[-10,-295,'mount',2.3],[-163,-246,'mount',1.55]])add(spawn.x+dx,spawn.y+dy,k,s);
      for(const p of V.fixedPlaces)add(p.x,p.y,p.id,1,0,p.id);
      this.objects.sort((a,b)=>a.y-b.y);
      this.notes={};for(const p of V.keepsakes){const cv=surface(100,100);V.specimen(cv,p.id);this.notes[p.id]=cv;}
      this.hit=[];this.camera={};this.zoom=1;
      this.fallingLeaves=[];this.groundLeaves=[];this.leafClock=.1;this.leafSerial=0;
      this.leafTrees=C.id==='fire'?this.objects.filter(o=>o.k==='tree'):[];
    }
    updateLeaves(dt){
      if(C.id!=='fire')return;
      for(let i=this.groundLeaves.length-1;i>=0;i--){
        this.groundLeaves[i].life-=dt;
        if(this.groundLeaves[i].life<=0)this.groundLeaves.splice(i,1);
      }
      for(let i=this.fallingLeaves.length-1;i>=0;i--){
        const drop=this.fallingLeaves[i];
        drop.age+=dt;
        if(drop.age<drop.duration)continue;
        if(drop.keep&&this.groundLeaves.length<16&&this.terrain.allows(drop.x,drop.y)&&C.boundary(drop.x,drop.y)>30){
          this.groundLeaves.push({...drop,life:100});
          this.fallingLeaves.splice(i,1);
        }else{
          drop.keep=false;
          if(drop.age>=drop.duration+drop.fade)this.fallingLeaves.splice(i,1);
        }
      }
      this.leafClock-=dt;
      if(this.leafClock>0)return;
      this.leafClock=.68+Math.random()*.66;
      if(this.fallingLeaves.length>=8)return;
      const {x:cx,y:cy}=this.camera;
      const visible=this.leafTrees.filter(tree=>{
        if(Math.abs(tree.x-cx)>this.w*.46/this.zoom)return false;
        const canopy=groundY(tree.x,tree.y)-66*tree.size-cy;
        return canopy>-this.h*.47/this.zoom&&canopy<this.h*.38/this.zoom;
      });
      if(!visible.length)return;
      const tree=visible[Math.floor(Math.random()*visible.length)],side=Math.random()<.5?-1:1;
      const startX=tree.x+side*(13+Math.random()*11)*tree.size;
      this.fallingLeaves.push({
        id:'leaf-'+this.leafSerial++,name:'가을 낙엽',action:'낙엽 줍기',
        startX,startY:groundY(tree.x,tree.y)-(60+Math.random()*19)*tree.size,
        x:startX+side*(13+Math.random()*22),y:tree.y+14+Math.random()*24,
        sway:8+Math.random()*9,side,age:0,duration:2.6+Math.random()*1.6,fade:.75+Math.random()*.65,
        keep:Math.random()<.43,color:['#ffca65','#ef922f','#e36c45'][Math.floor(Math.random()*3)]
      });
    }
    center(p){this.camera={x:p.x,y:groundY(p.x,p.y)};}
    measure(){
      const b=this.canvas.getBoundingClientRect();this.w=b.width;this.h=b.height;this.zoom=V.clamp(Math.min(b.width/340,b.height/560),.78,1.7);
      this.terrain.zoom=this.zoom;this.terrain.tilt=tilt;const d=Math.min(devicePixelRatio||1,1.5);
      this.canvas.width=Math.max(1,Math.round(b.width*d));this.canvas.height=Math.max(1,Math.round(b.height*d));this.c=this.canvas.getContext('2d');
    }
    follow(p,dt,reduced){
      const z=this.zoom,dx=p.x-this.camera.x,dy=groundY(p.x,p.y)-this.camera.y;
      const mx=this.w*(reduced?.23:.12)/z,my=this.h*(reduced?.18:.09)/z,k=-Math.expm1(-6*dt);
      this.camera.x+=k*(dx-V.clamp(dx,-mx,mx));this.camera.y+=k*(dy-V.clamp(dy,-my,my));
    }
    point(sx,sy){
      const x=this.camera.x+(sx-this.w/2)/this.zoom,py=this.camera.y+(sy-this.h*.52)/this.zoom;
      let lo=py/tilt-4,hi=(py+160)/tilt;for(let i=0;i<17;i++){let mid=(lo+hi)/2;if(groundY(x,mid)<py)lo=mid;else hi=mid;}return {x,y:(lo+hi)/2};
    }
    travelView(island){
      const z=this.zoom;
      const x=this.w/2+(island.center.x-this.camera.x)*z;
      const y=this.h*.52+(island.center.y*tilt-this.camera.y)*z;
      const scale=z*island.displayScale;
      const left=x-121*scale,top=y-104*scale,width=246*scale;
      if(left+width<=0||left>=this.w||top+132*scale+35<=0||top>=this.h)return null;
      return {x:left,y:top,width};
    }
    hitTest(x,y){return this.hit.find(b=>Math.abs(x-b.x)<b.r&&Math.abs(y-b.y)<b.r)?.id;}
    drawScene(state,p,route,particles,t,reduced){
      const c=this.c,w=this.w,h=this.h,z=this.zoom,ox=w/2-this.camera.x*z,oy=h*.52-this.camera.y*z;
      c.setTransform(this.canvas.width/w,0,0,this.canvas.height/h,0,0);
      c.fillStyle=seaColor;c.fillRect(0,0,w,h);c.save();c.translate(ox,oy);c.scale(z,z);
      const left=-ox/z,top=-oy/z;
      c.strokeStyle='#8c9692';c.lineWidth=1.3;
      c.beginPath();for(let j=Math.floor(top/26);j<(top+h/z)/26+1;j++)for(let i=Math.floor(left/65)-1;i<(left+w/z)/65+1;i++){
        const x=i*65+18*Math.sin(j*29+i),y=j*26+5*Math.cos(i*11+j)+(reduced?0:Math.sin(t*.0009+i)*1.6);c.moveTo(x,y);c.quadraticCurveTo(x+5,y+2,x+12,y);}
      c.stroke();distantIslands(c,p);c.drawImage(this.field,0,0,C.width,C.height*tilt);
      if(C.water&&left<3700&&left+w/z>2450){
        drawRiverFlow(c,top,top+h/z,t,reduced);
        if(top<C.bridgeY*tilt+90&&top+h/z>C.bridgeY*tilt-120)drawStoneBridge(c);
      }
      for(const drop of particles)splash(c,drop.x,groundY(drop.x,drop.y),1-drop.life/drop.max,drop.life/drop.max);
      if(this.harvestSite){
        const {x,y}=this.harvestSite,gy=groundY(x,y);
        oval(c,x,gy,11,5,'#e9ca82',ink);
        if(C.id==='fire'){
          c.save();c.translate(x,gy);
          shape(c,'M0 -3V-28M-9 -27H8',null,ink,2);
          shape(c,'M-12 -24H-2L-3 -13H-11Z','#f7bd60');
          oval(c,-7,-19,2,3,'#fff3b0');c.restore();
        }else oval(c,x,gy-2,4,2,'#fff1bb');
      }
      if(route.length){let target=route[route.length-1];oval(c,target.x,groundY(target.x,target.y),5,2.8,cream);}
      this.hit=[];
      for(const leaf of this.groundLeaves){
        const y=groundY(leaf.x,leaf.y);
        if(leaf.x<left-14||leaf.x>left+w/z+14||y<top-14||y>top+h/z+14)continue;
        paintLeaf(c,leaf.x,y,.4,leaf.color,1);
        this.hit.push({x:ox+leaf.x*z,y:oy+y*z,r:Math.max(13,12*z),id:leaf.id});
      }
      const homeObject=state.house?[{...state.house,k:'house'}]:[];
      const live=[...(state.neighbors||[]).map(h=>({...h,k:"house"})),...homeObject,...Array.from(this.chat?.avatars(t)||[],guest=>({...guest,k:'avatar'})),{...p,k:'avatar'},...V.keepsakes.filter(k=>!state.found.has(k.id)).map(k=>({...k,k:'note'}))].sort((a,b)=>a.y-b.y);
      let i=0,j=0;while(i<this.objects.length||j<live.length){
        const obj=j===live.length||(i<this.objects.length&&this.objects[i].y<live[j].y)?this.objects[i++]:live[j++];
        if(obj.x<left-150||obj.x>left+w/z+150||obj.y*tilt<top-30||obj.y*tilt>top+h/z+340)continue;
        const y=groundY(obj.x,obj.y);
        if(obj.k==='avatar'){
          const p=obj;
          const onBridge=C.water&&Math.abs(p.y-C.bridgeY)<=bridgeHalfDepth;
          const depth=C.wadeDepth(p.x,p.y);
          if(depth>0)oval(c,p.x,y,10+depth*3,3,'#b7e0d686');
          c.save();c.translate(p.x,onBridge?bridgeDeckY(p.x,p.y):y);
          if(depth>0){c.beginPath();c.rect(-48,-80,96,80);c.clip();c.translate(0,13*depth);}
          avatar(c,p);
          c.restore();
        }
        else if(obj.k==='house'){drawHouse(c,obj,y);}
        else if(obj.k==='note'){c.drawImage(this.notes[obj.id],obj.x-14,y-24,28,28);}
        else {const img=this.art[obj.k][obj.variant];c.drawImage(img,obj.x-88*obj.size,y-156*obj.size,img.width*obj.size,img.height*obj.size);}
        if(obj.id)this.hit.unshift({x:ox+obj.x*z,y:oy+(y-11)*z,r:18*z,id:obj.id});
      }
      for(const leaf of this.fallingLeaves){
        const fall=Math.min(1,leaf.age/leaf.duration);
        const sway=reduced?0:Math.sin(fall*tau*2)*leaf.sway*Math.sin(fall*Math.PI)*leaf.side;
        const x=leaf.startX+(leaf.x-leaf.startX)*fall+sway;
        const y=leaf.startY+(groundY(leaf.x,leaf.y)-leaf.startY)*fall;
        const opacity=leaf.age<=leaf.duration?Math.min(1,leaf.age/.2):Math.max(0,1-(leaf.age-leaf.duration)/leaf.fade);
        c.save();c.globalAlpha=opacity;
        const angle=reduced?.4:.4+Math.sin(fall*tau*2)*.9;
        paintLeaf(c,x,y,angle,leaf.color,1);
        c.restore();
      }
      c.restore();
      this.chat?.paint(this,groundY,ox,oy,z);
    }
    drawMap(canvas,state,p,large=false){
      const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;
      const d=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);
      const c=canvas.getContext('2d');c.scale(d,d);c.fillStyle=seaColor;c.fillRect(0,0,w,h);
      const m=mapTransform(w,h),xy=o=>[m.ox+o.x*m.s,m.oy+o.y*m.s];
      trace(c,xy);c.fillStyle=C.water?'#65968a':C.wood?'#9ea65f':C.earth?'#d6a64c':C.metal?'#a9a8ad':'#bd685f';c.fill();
      paintCoast(c,xy);
      if(C.water){
        paintRiver(c,xy);
        const [x,y]=xy({x:bridgeX,y:C.bridgeY});
        c.fillStyle='#b4b49d';c.fillRect(x-bridgeSpan*m.s,y-2,2*bridgeSpan*m.s,4);
      }
      for(let i=0;i<this.objects.length;i+=large?24:48){let o=this.objects[i];const [x,y]=xy(o),s=(large?.07:.045)*woodlandTreeScale(o.k);c.drawImage(this.art[o.k][o.variant],x-88*s,y-156*s,176*s,178*s);}
      for(const place of V.getPlaces()){const [x,y]=xy(place);oval(c,x,y,large?4:3,large?4:3,cream,ink);}
      const star=canvas.nextElementSibling;
      if(this.harvestSite&&star?.classList.contains('harvest-map-star')){
        const [x,y]=xy(this.harvestSite);
        star.style.left=x+canvas.clientLeft+'px';
        star.style.top=y+canvas.clientTop+'px';
      }
      for(const marker of m.markers){
        const {island,x,top,width}=marker;
        const iconScale=width/246;
        c.save();c.translate(x,top+108*iconScale);c.scale(iconScale,iconScale);drawIsland(c,island);c.restore();
        c.font='700 '+m.fontSize+'px system-ui,sans-serif';
        c.textAlign='center';c.fillStyle='#fff1cd';
        c.fillText(island.name,x,top+m.iconHeight+m.fontSize);
      }
      if(p){const [x,y]=xy(p);mapFace(c,x,y,large?11:8);}
      for(const [i,plot] of (state.plots||[]).entries()){
        const [x,y]=xy(plot);
        oval(c,x,y,10,10,i===state.selectedPlot?'#577253':'#fff0c8',ink);
        c.font='700 11px system-ui';c.textAlign='center';c.textBaseline='middle';
        c.fillStyle=i===state.selectedPlot?'#fffaf0':ink;c.fillText(i+1,x,y);
      }
      for(const house of [...(state.neighbors||[]),state.house].filter(Boolean)){
        const [x,y]=xy(house);
        oval(c,x,y,10,10,'#fff0c8',ink);
        c.save();c.translate(x,y);
        shape(c,'M-5 -1L0 -5L5 -1V5H-5Z',houseStyles[house.color].roof,ink,1);
        c.restore();
      }
    }
  }
    function islandIcon(canvas,island){
    canvas.width=246;canvas.height=132;
    const c=canvas.getContext('2d');c.translate(121,104);drawIsland(c,island);
  }
  Object.assign(V,{Scene,mapTransform,mapFace,islandIcon,loadIslandArt,houseStyles,drawHouse,drawHouseInterior,drawFurniture,furniture});
})();
