/* The map uses the coordinate system of the uploaded island image. All coordinates
   on a character are at ground level, between its feet. */
(() => {
  'use strict';
  const V = window.Village = {};
  const coast = window.VillageCoast;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const spawn = (coast.metal||coast.earth)?coast.insetPoint(coast.shore[126],155):{x:2600, y:coast.shore[64].y-178};
  const keepsakes = [
    {id:'shell', name:'노을 조개', place:'노을 물가', x:coast.shore[60].x, y:coast.shore[60].y-38, color:'#bc785b', action:'조개 줍기', note:'바깥쪽은 살구색이고 안쪽은 우윳빛이에요. 파도가 물러간 자리에 놓여 있었어요.'},
    {id:'flower', name:'바람 들꽃', place:'불꽃 언덕', x:1700, y:2370, color:'#a8753c', action:'들꽃 따기', note:'가느다란 줄기 끝에 크림색 꽃이 피었어요. 말려 두어도 꽃잎의 빛깔이 남아요.'},
    {id:'stone', name:'호박빛 돌', place:'조약돌 언덕', x:3620, y:1480, color:'#b2803e', action:'돌 줍기', note:'모서리는 매끈하고 가운데에는 꿀빛 줄무늬가 있어요. 햇빛에 비추면 조금 더 선명해져요.'}
  ];
  if(coast.metal){
    Object.assign(keepsakes[0],{name:'은빛 조약돌',place:'은빛 물가',...coast.insetPoint(coast.shore[126],52),action:'조약돌 줍기',note:'파도가 닿던 가장자리에 은빛 조약돌이 놓여 있어요.'});
    Object.assign(keepsakes[1],{name:'암벽 풀꽃',place:'세 봉우리 아래',x:2420,y:1640,note:'바위 틈에 뿌리 내린 작은 풀꽃이에요.'});
    Object.assign(keepsakes[2],{name:'백금빛 원석',place:'바위 단상',x:3410,y:2850,note:'회색 돌결 사이에 은은하게 빛나는 광맥이 보여요.'});
  }
  if(coast.earth){
    Object.assign(keepsakes[0],{name:'황토 조약돌',place:'볕드는 물가',...coast.insetPoint(coast.shore[126],58),action:'조약돌 줍기',note:'햇볕을 머금은 듯 따뜻한 빛이 도는 돌이에요.'});
    Object.assign(keepsakes[1],{name:'황금 들꽃',place:'볕마루 언덕',x:1850,y:1370,note:'햇살이 오래 머무는 언덕에서 자란 작은 꽃이에요.'});
    Object.assign(keepsakes[2],{name:'꿀빛 원석',place:'너른 황토 들판',x:3170,y:2500,note:'황토 사이로 꿀빛 결이 보이는 원석이에요.'});
  }
  const fixedPlaces = [
    {id:'post', name:'들판 우체통', x:2820, y:spawn.y-160, action:'편지 읽기'},
    {id:'bench', name:'노을 벤치', x:2490, y:spawn.y-110, action:'벤치에 앉기'}
  ];
  if(coast.metal||coast.earth){
    Object.assign(fixedPlaces[0],{name:coast.name+' 우체통',x:spawn.x+120,y:spawn.y-65});
    Object.assign(fixedPlaces[1],{name:coast.earth?'볕마루 벤치':'은빛 벤치',x:spawn.x+(coast.earth?180:145),y:spawn.y+(coast.earth?40:110)});
  }
  // The footprint sits beneath the rock's visible base, leaving its backdrop walkable.
  const rockFormations=coast.metal?[
    {x:2600,y:1270,kind:'ore',size:3.2},{x:1830,y:1760,kind:'ore',size:2},
    {x:3370,y:1700,kind:'ore',size:2.2},{x:3410,y:2810,kind:'mesa',size:3},
    {x:spawn.x+220,y:spawn.y-145,kind:'ore',size:1.4}
  ]:[];
  const lamp = {x:2518,y:spawn.y-110};
  const getPlaces = () => [...fixedPlaces,...keepsakes.map(k=>({...k,name:k.place}))];
  function approach(place) {
    const offset = {post:14, bench:19}[place.id] || 9;
    return {x:place.x, y:place.y+offset};
  }
  function rng(seed) {
    let s=seed>>>0;
    return () => {s=(Math.imul(1664525,s)+1013904223)>>>0;return s/4294967296;};
  }
  const neighbors = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
  class Terrain {
    constructor() {
      this.cell=28;this.cols=Math.ceil(coast.width/this.cell);this.rows=Math.ceil(coast.height/this.cell);
      this.zoom=1;this.tilt=.72;
      this.walkable=Uint8Array.from({length:this.cols*this.rows},(_,i)=>{
        const x=(i%this.cols+.5)*this.cell,y=(Math.floor(i/this.cols)+.5)*this.cell;
        return coast.boundary(x,y)>2 && !this.blocked(x,y);
      });
    }
    blocked(x,y){
      return rockFormations.some(rock=>{
        const dx=(x-rock.x)/(69*rock.size+6);
        const dy=(y-rock.y+9*rock.size)/(19*rock.size+6);
        return dx*dx+dy*dy<1;
      })||fixedPlaces.some(p=>Math.abs(x-p.x)<(p.id==='bench'?20:6)&&Math.abs(y-p.y+3)<6);
    }
    allows(x,y){
      if(this.blocked(x,y))return false;
      const d=coast.boundary(x,y);
      if(d>=0)return true;
      if(-d*this.zoom*this.tilt>6)return false;
      const i=coast.edge(x,y),ring=coast.shore;
      for(let j=i-2;j<=i+2;j++){
        const a=ring[(j+ring.length)%ring.length],b=ring[(j+1+ring.length)%ring.length];
        const vx=b.x-a.x,vy=(b.y-a.y)*this.tilt,dx=x-a.x,dy=(y-a.y)*this.tilt;
        const t=clamp((dx*vx+dy*vy)/(vx*vx+vy*vy),0,1);
        if(Math.hypot(dx-t*vx,dy-t*vy)*this.zoom<=5)return true;
      }
      return false;
    }
    openCell(col,row) {
      return col>=0 && row>=0 && col<this.cols && row<this.rows && this.walkable[row*this.cols+col]===1;
    }
    segment(x,y,tx,ty) {
      const n=Math.max(1,Math.ceil(Math.hypot(tx-x,ty-y)/(4)));
      let lastX=x, lastY=y;
      for(let i=1;i<=n;i++){
        const nx=x+(tx-x)*i/n, ny=y+(ty-y)*i/n;
        if(!this.allows(nx,ny)||!this.allows(nx,lastY)||!this.allows(lastX,ny))return false;
        lastX=nx;lastY=ny;
      }
      return true;
    }
    route(from,to) {
      if(!this.allows(to.x,to.y)||!this.allows(from.x,from.y))return null;
      if(this.segment(from.x,from.y,to.x,to.y))return [to];
      const start=Math.floor(from.y/this.cell)*this.cols+Math.floor(from.x/this.cell);
      const goal=Math.floor(to.y/this.cell)*this.cols+Math.floor(to.x/this.cell);
      const previous=new Int32Array(this.walkable.length);previous.fill(-1);previous[start]=start;
      const queue=new Int32Array(previous.length);queue[0]=start;
      let head=0,tail=1;
      while(head<tail&&previous[goal]===-1){
        const here=queue[head++], col=here%this.cols, row=Math.floor(here/this.cols);
        for(const [dx,dy] of neighbors){
          const nx=col+dx,ny=row+dy,next=ny*this.cols+nx;
          if(!this.openCell(nx,ny)||previous[next]!==-1)continue;
          if(dx&&dy&&(!this.openCell(col,ny)||!this.openCell(nx,row)))continue;
          previous[next]=here;queue[tail++]=next;
        }
      }
      if(previous[goal]===-1)return null;
      const cells=[];
      for(let i=goal;i!==start;i=previous[i]){
        cells.push({x:(i%this.cols+.5)*this.cell,y:(Math.floor(i/this.cols)+.5)*this.cell});
      }
      cells.reverse();cells.push(to);
      const path=[];
      let at=from, i=0;
      while(i<cells.length){
        let j=i;
        while(j+1<cells.length && this.segment(at.x,at.y,cells[j+1].x,cells[j+1].y))j++;
        if(!this.segment(at.x,at.y,cells[j].x,cells[j].y))return null;
        at=cells[j];path.push(at);i=j+1;
      }
      return path;
    }
  }
  Object.assign(V,{clamp,distance,rng,spawn,keepsakes,fixedPlaces,rockFormations,lamp,getPlaces,approach,Terrain});
})();
