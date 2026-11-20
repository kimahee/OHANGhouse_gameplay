(() => {
  'use strict';
  const V=window.Village, W=window.VillageCoast.width, H=window.VillageCoast.height;
  const TAU=Math.PI*2;
  const glyphs={
    mute:'M3 9h4l5-4v14l-5-4H3z M16 9l5 6m0-6-5 6',
    sound:'M3 9h4l5-4v14l-5-4H3z M16 8q5 4 0 8 M19 5q8 7 0 14',
    controller:'M7 7h10q3 0 4 5l1 4q0 4-3 3l-4-3H9l-4 3q-3 1-3-3l1-4q1-5 4-5z M7.5 9.5v5m-2.5-2.5h5 M15.7 11.5h.1m2.7 1.7h.1',
    pin:'M19 9q0 5-7 12Q5 14 5 9a7 7 0 1 1 14 0z M14.5 9a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0',
    sun:'M16 12a4 4 0 1 1-8 0 4 4 0 1 1 8 0 M12 2v3m0 14v3 M2 12h3m14 0h3 M4.9 4.9l2.2 2.2m9.8 9.8 2.2 2.2 M4.9 19.1l2.2-2.2m9.8-9.8 2.2-2.2',
    map:'M3 5l6-2 6 3 6-2v15l-6 2-6-3-6 2z M9 3v15m6-12v15',
    check:'M4 12l5 5L20 6', arrow:'M4 12h15m-6-6 6 6-6 6', chevron:'m9 5 7 7-7 7',
    expand:'M5 10V5h5m4 0h5v5m0 4v5h-5m-4 0H5v-5',
    close:'M5 5l14 14 M19 5 5 19',touch:'M9 12V6q0-3 3-2l1 6 4 1q4 1 3 5l-1 5h-9l-5-7q-1-4 2-3l2 2',
    run:'M14 5a1.6 1.6 0 1 0 0-.1 M5 12l4-4 4 2 3 3h4 M12 10l-2 5 5 2-1 5 M10 15l-4 5H2'
  };
  function path(c,d,fill,stroke,width=1.3){
    const p=new Path2D(d);
    if(fill){c.fillStyle=fill;c.fill(p);}
    if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke(p);}
  }
  function ellipse(c,x,y,rx,ry,color,angle=0){
    c.beginPath();c.ellipse(x,y,Math.max(.02,rx),Math.max(.02,ry),angle,0,TAU);c.fillStyle=color;c.fill();
  }
  function icon(node,name){
    if(!node)return;
    const cv=node.tagName==='CANVAS'?node:document.createElement('canvas');
    cv.width=cv.height=80;
    if(cv!==node)node.replaceChildren(cv);
    const c=cv.getContext('2d');c.scale(80/24,80/24);c.lineCap=c.lineJoin='round';
    if(name==='brand'){
      ellipse(c,12,12,11.5,11.5,'#a05340');
      c.save();c.beginPath();c.arc(12,12,9.2,0,TAU);c.clip();
      ellipse(c,15.5,8.4,2.35,2.35,'#fae4b9');
      path(c,'M1.5 14Q7 12.7 10 8.8q1.1-1.1 1.9.5 2.7 3.7 9.9 4.8 M1.5 17q4-2.2 8.5-.7 4.5 1.2 7.7-.3 2-1 5.5-1 M2 19.2q4.6-1.7 8.8-.3 4.4 1 7.8-.6',null,'#f8e5be',1);
      c.restore();return;
    }
    path(c,glyphs[name]||glyphs.chevron,null,getComputedStyle(node).color||'#465142',1.65);
  }
  // Original small illustrations for field notes, the meadow.
  function specimen(c,id) {
    c.save();c.lineCap=c.lineJoin='round';
    if(id==='shell'){
      path(c,'M-3 12Q-6 8-12 5q-5-3-3.5-6.5.3-2.5 3-2.5-.8-4.1 3-4.3 1.2-4 4.6-2.4 2-4.1 5-1.9 3.5-2.1 5.3 1.4 4-1 5.5 3.2 3.9.1 3.8 3.5 3.4 1.5 2 5.2-1.7 4.6-8.8 7.9L3.3 12Z','#eab197','#815948',1.35);
      path(c,'M-.6 8Q-8 3-12-3M-.4 8.5q-6-7.3-8.5-16M.6 8Q-3-.4-4.5-9M1.8 8.4Q.5-.8.8-10.8M3 8Q6 1.3 6-8.1M4.1 8q5.5-7 6.8-12.8M4.4 8.4q6.8-3.9 9.2-8.6',null,'#b97967',.85);
      path(c,'M-3.4 11q3.4-2 6.9-.1l.5 3q-4.5 1.1-8.3-1z','#d6977c','#815948',.8);
    }else if(id==='flower'){
      path(c,'M-6 13Q0 7 .5-1M-5 12q4-4 9-5',null,'#67764c',1.7);
      path(c,'M-3.8 9.4Q-10 .1-11 4q.7 4.7 7.2 5.4 M-1.4 7q5.5-9.7 8.4-6.1-.4 4.7-8.4 6.1','#87905b','#69784d',.7);
      for(let i=0;i<6;i++){
        const a=i*TAU/6;
        ellipse(c,2+Math.sin(a)*4.5,-4.5+Math.cos(a)*4.4,2.85,4.15,'#bb9670',-a);
        ellipse(c,2+Math.sin(a)*4.65,-4.9+Math.cos(a)*4.4,2.48,3.72,'#fff1ca',-a);
      }
      ellipse(c,2,-4.6,3,3,'#d59944');ellipse(c,1.3,-5.3,1,1,'#f9cf7a');
    }else{
      path(c,'M-12 4l3-10 7-5 9 1 6 5 1 9-5.4 6-13.2 1z','#cf9653','#795d46',1.2);
      path(c,'M-9-4l8-5 7 1 4 4-5 3-9-.9z','#edc17a',null);
      path(c,'M-11 3l6-4.6 9 .8-5 7-8 1z','#d4a15f',null);
      path(c,'M0 9l5-9 7-3-.8 7-4.9 4.2z','#ad794a',null);
      path(c,'M-9 4q8-.5 10-3t9-2',null,'#f5d391',1.25);
    }
    c.restore();
  }
  function drawSpecimen(cv,id){
    cv.width=cv.height=100;
    const c=cv.getContext('2d');c.translate(50,50);c.scale(2.55,2.55);specimen(c,id);
  }
  Object.assign(V,{icon,specimen:drawSpecimen});
})();
