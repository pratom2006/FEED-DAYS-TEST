'use strict';
  const shapes = HOUSES.map(h=>{
    // A foundation/side-wall polygon, not the oversized roof silhouette.
    const x=h.x,y=h.y;
    return { id:'house_'+h.id, kind:'poly', points:[
      [x-137,y-136],[x+137,y-136],[x+137,y-43],
      [x+42,y-43],[x+42,y-83],[x-42,y-83],
      [x-42,y-43],[x-137,y-43]
    ]};
  });
  // Central pond/garden is a solid, unclimbable island behind the inner railing.
  const walkways = [];
  const covers = [];
  for(const s of shapes) {
    if(s.kind==='poly') {
      const xs=s.points.map(p=>p[0]),ys=s.points.map(p=>p[1]);
      s.bounds=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
    } else {
      const rx=s.kind==='ellipse'?s.rx:s.r,ry=s.kind==='ellipse'?s.ry:s.r;
      s.bounds=[s.x-rx,s.y-ry,s.x+rx,s.y+ry];
    }
  }
  function inPoly(x,y,vertices) {
    let inside=false;
    for(let i=0,j=vertices.length-1;i<vertices.length;j=i++) {
      const a=vertices[i],b=vertices[j];
      if(((a[1]>y)!==(b[1]>y))&&(x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]))inside=!inside;
    }
    return inside;
  }
  function distSegmentSquared(x,y,a,b) {
    const dx=b[0]-a[0],dy=b[1]-a[1];
    const t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));
    return (x-a[0]-t*dx)**2+(y-a[1]-t*dy)**2;
  }
  function shapeBlocks(shape,x,y,pad) {
    const bb=shape.bounds;
    if(x<bb[0]-pad||x>bb[2]+pad||y<bb[1]-pad||y>bb[3]+pad)return false;
    if(shape.kind==='circle')return Math.hypot(x-shape.x,y-shape.y)<=shape.r+pad;
    if(shape.kind==='ellipse')return ((x-shape.x)/(shape.rx+pad))**2+((y-shape.y)/(shape.ry+pad))**2<=1;
    if(inPoly(x,y,shape.points))return true;
    for(let i=0;i<shape.points.length;i++)
      if(distSegmentSquared(x,y,shape.points[i],shape.points[(i+1)%shape.points.length])<=pad*pad)return true;
    return false;
  }
  function walkable(x,y) {
    if(!Number.isFinite(x)||!Number.isFinite(y))return false;
    const m=WORLD.margin+WORLD.radius;
    if(x<m||y<m||x>WORLD.width-m||y>WORLD.height-m)return false;
    // Walk only on wooden ring or four wooden exit roads; no invisible collision on decorative eaves.
    const dx=x-TOWN.cx,dy=y-TOWN.cy,r=Math.hypot(dx,dy);
    if(r<TOWN.inner+WORLD.radius+7)return false;
    const onRing=r<=TOWN.outer-WORLD.radius-3;
    const onBridge=Math.abs(dx)<=TOWN.routeHalf-WORLD.radius || Math.abs(dy)<=TOWN.routeHalf-WORLD.radius;
    if(!onRing&&!onBridge)return false;
    return !shapes.some(shape=>shapeBlocks(shape,x,y,WORLD.radius));
  }
  function visible(a,b) {
    const distance=Math.hypot(a.x-b.x,a.y-b.y);
    const steps=Math.max(1,Math.ceil(distance/6));
    for(let i=0;i<=steps;i++) {
      const t=i/steps;
      if(!walkable(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t))return false;
    }
    return true;
  }
  // A* search: 8-direction grid; no diagonal corner cutting.
  const nav=(()=>{
    const cell=18, columns=Math.ceil(WORLD.width/cell),rows=Math.ceil(WORLD.height/cell);
    const nodeCount=columns*rows, allow=new Uint8Array(nodeCount);
    const point=id=>({x:Math.min(WORLD.width-1,(id%columns+.5)*cell), y:Math.min(WORLD.height-1,(Math.floor(id/columns)+.5)*cell)});
    for(let i=0;i<nodeCount;i++){const p=point(i);allow[i]=walkable(p.x,p.y)?1:0;}
    function nearest(p) {
      const col=Math.max(0,Math.min(columns-1,Math.floor(p.x/cell)));
      const row=Math.max(0,Math.min(rows-1,Math.floor(p.y/cell)));
      let best=-1,bestDist=Infinity;
      for(let rad=0;rad<=5;rad++) {
        for(let ry=Math.max(0,row-rad);ry<=Math.min(rows-1,row+rad);ry++)
          for(let rx=Math.max(0,col-rad);rx<=Math.min(columns-1,col+rad);rx++) {
            const id=ry*columns+rx;
            if(!allow[id])continue;
            const q=point(id),d=(q.x-p.x)**2+(q.y-p.y)**2;
            if(d<bestDist&&visible(p,q)){bestDist=d;best=id;}
          }
        if(best!==-1)return best;
      }
      return -1;
    }
    function h(a,b) {
      const dx=Math.abs(a%columns-b%columns),dy=Math.abs(Math.floor(a/columns)-Math.floor(b/columns));
      return (dx+dy)+(Math.SQRT2-2)*Math.min(dx,dy);
    }
    function route(start,goal) {
      if(!walkable(start.x,start.y)||!walkable(goal.x,goal.y))return null;
      if(visible(start,goal))return [goal];
      const s=nearest(start),t=nearest(goal);
      if(s<0||t<0)return null;
      const cost=new Float64Array(nodeCount).fill(Infinity);
      const prev=new Int32Array(nodeCount).fill(-1),closed=new Uint8Array(nodeCount);
      const heap=[];
      function push(id,priority){heap.push({id,priority});let i=heap.length-1;while(i>0){let parent=(i-1)>>1;if(heap[parent].priority<=priority)break;heap[i]=heap[parent];i=parent;}heap[i]={id,priority};}
      function pop(){const head=heap[0],end=heap.pop();if(heap.length){let i=0;while(true){let child=i*2+1;if(child>=heap.length)break;if(child+1<heap.length&&heap[child+1].priority<heap[child].priority)child++;if(end.priority<=heap[child].priority)break;heap[i]=heap[child];i=child;}heap[i]=end;}return head.id;}
      cost[s]=0;push(s,h(s,t));let found=false;
      while(heap.length) {
        const id=pop();if(closed[id])continue;
        if(id===t){found=true;break;}closed[id]=1;
        const x=id%columns,y=Math.floor(id/columns);
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++) {
          if(!dx&&!dy)continue;
          const nx=x+dx,ny=y+dy;
          if(nx<0||ny<0||nx>=columns||ny>=rows)continue;
          const ni=ny*columns+nx;
          if(!allow[ni]||closed[ni])continue;
          if(dx&&dy&&(!allow[y*columns+nx]||!allow[ny*columns+x]))continue;
          // Avoid polygon corners even when adjacent cells are passable.
          if(!visible(point(id),point(ni)))continue;
          const candidate=cost[id]+(dx&&dy?Math.SQRT2:1);
          if(candidate<cost[ni]){cost[ni]=candidate;prev[ni]=id;push(ni,candidate+h(ni,t));}
        }
      }
      if(!found)return null;
      const cells=[];let id=t;
      while(id!==s&&id>=0){cells.push(point(id));id=prev[id];}
      if(id!==s)return null;
      cells.reverse();cells.push(goal);
      // Do not smooth past a blocked segment; same exact geometry as direct movement.
      const simplified=[];let anchor=start;
      for(let i=0;i<cells.length;) {
        let farthest=i;
        for(let j=i+1;j<cells.length;j++){
          if(visible(anchor,cells[j]))farthest=j;
          else break;
        }
        simplified.push(cells[farthest]);anchor=cells[farthest];i=farthest+1;
      }
      return simplified;
    }
    return {route,cell,grid:{columns,rows},point,walkable,visible};
  })();
  // Navigation geometry is reachable in a local QA harness without running Phaser.
  window.FEED_DAYS_QA={walkable,visible,route:nav.route,shapes,walkways,covers,WORLD,TOWN,HOUSES};

