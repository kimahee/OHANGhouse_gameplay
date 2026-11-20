// Ground coordinates use x (east), y (south). The sea surface is at height zero.
(() => {
  const requested=new URLSearchParams(window.location?.search).get('island');
  const metal=requested==='metal',earth=requested==='earth';
  const id=metal?'metal':earth?'earth':'fire';
  const name=metal?'금섬':earth?'토섬':'화섬';
  const cx=2600, cy=2200, count=256, tau=2*Math.PI;
  const shore=Array.from({length:count},(_,i)=>{
    const a=i*tau/count;
    const r=1+.09*Math.sin(3*a+.5)+.045*Math.cos(5*a-.7)+.021*Math.sin(9*a);
    const outline=earth?1+.07*Math.sin(4*a+.75)+.035*Math.cos(9*a):metal?1+.10*Math.sin(3*a-.9)+.046*Math.cos(8*a)+.027*Math.sin(11*a):r;
    return {x:cx+2110*outline*Math.cos(a),y:cy+1710*outline*Math.sin(a)};
  });
  const angleAt=i=>Math.atan2(Math.sin(i*tau/count),Math.cos(i*tau/count));
  const smooth=t=>{const v=Math.max(0,Math.min(1,t));return v*v*(3-2*v);};
  const beachAt=i=>{
    const angle=Math.abs(angleAt(i));
    return smooth((.92-(metal||earth?Math.PI-angle:angle))/.28);
  };
  function insetPoint(point,inset){
    const radius=Math.hypot(point.x-cx,point.y-cy);
    return {x:point.x+(cx-point.x)*inset/radius,y:point.y+(cy-point.y)*inset/radius};
  }
  const beachWidth=i=>beachAt(i)*(126+15*Math.cos(angleAt(i)*9));
  const easternNeighbors=[
    {index:232,name:'금섬',destination:'metal',colors:['#85858c','#b0abaf','#e5dac9'],
      ridge:'M-110 -7L-92 -27L-78 -31L-63 -61L-37 -65L-24 -40L-9 -42L9 -72L38 -77L54 -55L73 -59L101 -30L113 -10Z',
      detail:'M-80 -27L-63 -61L-52 -61L-58 -40L-66 -28Z M-20 -19L-9 -42L9 -72L21 -74L14 -53L4 -48L-1 -34Z M42 -39L54 -55L73 -59L82 -49L63 -48L55 -37Z',
      veins:'M-89 -25L-71 -32L-62 -43L-43 -49M-34 -21L-17 -29L-7 -48L9 -54L24 -69M45 -24L60 -29L65 -36L84 -41'},
    {index:0,name:'토섬',destination:'earth',colors:['#ba854a','#d8ae6e','#ebc58a'],ridge:'M-111 -8Q-86 -20 -70 -44Q-45 -79 -8 -60Q26 -42 54 -56Q78 -67 111 -14L88 4Z',detail:'M-110 -7Q-68 -45 -35 -43Q-5 -43 12 -29Q32 -16 59 -38Q77 -52 111 -14L87 4Z'},
    {index:25,name:'목섬',colors:['#6f8059','#9aa16a','#bcc085'],ridge:'M-108 -5Q-77 -29 -60 -42Q-41 -53 -11 -39Q16 -25 39 -45Q75 -69 112 -11L88 4Z',detail:'M-111 -6Q-79 -37 -46 -28Q-12 -16 13 -26Q61 -48 93 -22L110 -11L83 5Z'}
  ];
  const fireIsland={index:96,name:'화섬',destination:'fire',colors:['#ad6057','#d98a65','#eeb184'],
     ridge:'M-110 -8Q-89 -29 -62 -36Q-40 -62 -14 -50Q12 -47 39 -58Q75 -55 112 -12Z',
     detail:'M-105 -10Q-70 -40 -43 -34Q-8 -16 20 -38Q47 -53 80 -30L109 -12Z'};
  const neighbors=(metal?[fireIsland,{...easternNeighbors[1],index:64}]:earth?[{...fireIsland,index:128},{...easternNeighbors[0],index:192}]:easternNeighbors).map(island=>({...island,shore:shore[island.index],center:insetPoint(shore[island.index],-222)}));
  const arrivalIndex=metal?126:232;
  function edge(x,y){
    const a=(Math.atan2((y-cy)/1710,(x-cx)/2110)+tau)%tau;
    return Math.floor(a*count/tau)%count;
  }
  function boundary(x,y){
    const i=edge(x,y),p=shore[i],q=shore[(i+1)%count];
    const dx=q.x-p.x,dy=q.y-p.y;
    return (dx*(y-p.y)-dy*(x-p.x))/Math.hypot(dx,dy);
  }
  function height(x,y){
    const d=boundary(x,y);
    if(d<=0)return 0;
    const blend=Math.min(1,d/200);
    if(metal){
      const peaks=[[2600,1270,87,510],[1830,1760,46,320],[3370,1700,59,370]];
      const mountains=peaks.reduce((height,[px,py,h,r])=>height+h*Math.exp(-((x-px)**2+(y-py)**2)/r**2),0);
      const mesa=36*smooth((1-Math.hypot((x-3410)/510,(y-2850)/440))/.38);
      return (13+mountains+mesa)*smooth(blend);
    }
    if(earth){
      const ridge=(px,py,rx,ry)=>Math.exp(-(((x-px)/rx)**2+((y-py)/ry)**2));
      return (12+94*ridge(1850,1250,840,520)+65*ridge(3300,1490,720,500)+42*ridge(2620,2050,1240,540))*smooth(blend);
    }
    const hills=62+24*Math.sin(x/260)*Math.cos(y/320)+31*Math.sin((y+x*.22)/404)
       +65*Math.exp(-(((x-1780)/390)**2+((y-2300)/440)**2));
    return hills*blend*blend*(3-2*blend)+Math.min(d,65)*.12;
  }
  window.VillageCoast={id,name,metal,earth,arrivalIndex,width:5200,height:4400,cx,cy,shore,beachAt,beachWidth,insetPoint,neighbors,edge,boundary,elevation:height};
})();
