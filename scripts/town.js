'use strict';
  // Same town coordinates drive both visual layout and collision.
  // FEED DAYS — purely programmatic wooden ring town (no pre-rendered town PNG).
  // Map geometry and collision parameters share the same TOWN config.
  const TOWN = {cx:1024, cy:1024, inner:310, outer:710, routeHalf:138, fence:707};
  const HOUSES = [
    {id:'nw',name:'ศาลาช่างไม้',x:590,y:676,w:350,h:245,style:0},
    {id:'ne',name:'ร้านสมุนไพร',x:1458,y:676,w:350,h:245,style:1},
    {id:'west',name:'บ้านไม้ตะวันตก',x:436,y:1275,w:340,h:235,style:2},
    {id:'east',name:'บ้านไม้ตะวันออก',x:1612,y:1275,w:340,h:235,style:3},
    {id:'sw',name:'โรงช่าง',x:646,y:1695,w:350,h:240,style:4},
    {id:'se',name:'คลังไม้',x:1402,y:1695,w:350,h:240,style:5}
  ];
  function rng(seed=2806){return ()=>{seed|=0;seed=(seed+0x6d2b79f5)|0;let t=Math.imul(seed^(seed>>>15),1|seed);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
  const seeded=rng(93);
  function circle(g,x,y,r,color,stroke=null,sw=1){g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fillStyle=color;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=sw;g.stroke();}}
  function round(g,x,y,w,h,r,fill,stroke=null,sw=1){g.beginPath();g.roundRect(x,y,w,h,r);g.fillStyle=fill;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=sw;g.stroke();}}
  function path(g,points,fill,stroke=null,sw=1){g.beginPath();points.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.lineWidth=sw;g.strokeStyle=stroke;g.stroke();}}
  function line(g,points,color,width=3){g.beginPath();points.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.strokeStyle=color;g.lineWidth=width;g.stroke();}
  function foliage(g,x,y,scale=1,flowers=false,seed=0){
    g.save();g.translate(x,y);g.scale(scale,scale);circle(g,0,0,36,'#1b623d');
    const rs=rng(62+seed);
    for(let i=0;i<20;i++){const a=rs()*Math.PI*2,r=rs()*31;circle(g,Math.cos(a)*r,Math.sin(a)*r,11+rs()*10,i%4===0?'#b1d44f':i%3===0?'#4b9c4a':'#387e3e');}
    if(flowers){for(let k=0;k<16;k++){const a=rs()*6.283,rad=rs()*30;circle(g,Math.cos(a)*rad,Math.sin(a)*rad,3, k%3===0?'#ffeff3':'#ffb4d1');}}
    g.restore();
  }
  function tree(g,x,y,s=1,pink=false,n=0){
    const r=rng(101+n);g.save();g.translate(x,y);g.scale(s,s);
    g.fillStyle='#172e25bb';g.beginPath();g.ellipse(10,47,62,22,0,0,6.283);g.fill();
    round(g,-11,-3,23,68,6,'#825025','#b7824b',3);
    for(let i=0;i<25;i++){const theta=r()*6.283,rad=r()*52;circle(g,Math.cos(theta)*rad,Math.sin(theta)*rad-40,18+r()*18,pink?(i%3===0?'#ffdeed':i%3===1?'#f5a4cb':'#e06ca5'):(i%3===0?'#a8cb42':i%3===1?'#5db84e':'#2b7a3d'));}
    if(pink){for(let i=0;i<50;i++){const th=r()*6.283,rad=r()*54;circle(g,Math.cos(th)*rad,Math.sin(th)*rad-40,2.1+r()*3.1,i%2?'#ffe5ec':'#fff4f3');}}
    g.restore();
  }
  function wood(g){
    g.fillStyle='#bd7d3f';g.fillRect(0,0,2048,2048);
    // many small wood plank lines clipped to paths by caller
    const r=rng(811);
    g.strokeStyle='#74461f77';g.lineWidth=2;
    for(let y=0;y<2048;y+=37){g.beginPath();g.moveTo(0,y);g.lineTo(2048,y);g.stroke();
      for(let x=(Math.floor(y/37)%2)*70;x<2048;x+=138){g.beginPath();g.moveTo(x,y);g.lineTo(x,y+37);g.stroke();}}
    for(let i=0;i<2200;i++){const x=r()*2048,y=r()*2048;g.fillStyle=r()>.5?'#edb77166':'#67411e44';g.fillRect(x,y,2+r()*20,1.5);}
  }
  function circleRail(g,r,angle0,angle1){
    g.beginPath();g.arc(TOWN.cx,TOWN.cy,r,angle0,angle1);g.strokeStyle='#4a301c';g.lineWidth=21;g.stroke();
    g.beginPath();g.arc(TOWN.cx,TOWN.cy,r,angle0,angle1);g.strokeStyle='#d49d58';g.lineWidth=13;g.stroke();
    g.beginPath();g.arc(TOWN.cx,TOWN.cy,r,angle0,angle1);g.strokeStyle='#f2c482';g.lineWidth=3;g.stroke();
    const inc=0.12;for(let a=angle0+0.06;a<angle1-0.03;a+=inc){const x=TOWN.cx+Math.cos(a)*r,y=TOWN.cy+Math.sin(a)*r;
      circle(g,x,y,10,'#492a17','#ffe0a0',3);circle(g,x,y-2,4,'#ddaa6c');}
  }
  function drawTown(g){
    const {cx,cy,inner,outer,routeHalf}=TOWN;
    const random=rng(20261124), W=2048,H=2048;
    const gr=g.createLinearGradient(0,0,W,H);gr.addColorStop(0,'#4ca749');gr.addColorStop(.5,'#87b948');gr.addColorStop(1,'#2c7651');g.fillStyle=gr;g.fillRect(0,0,W,H);
    // grass details and tiny flowers around the town exterior
    for(let i=0;i<3000;i++){
      let x=random()*W,y=random()*H;const r=Math.hypot(x-cx,y-cy);
      if(r<730||Math.abs(x-cx)<155||Math.abs(y-cy)<155)continue;
      g.fillStyle=i%7===0?'#eedeb2':i%4===0?'#f5bdce':i%3===0?'#a9d54d':'#205e3c';
      g.fillRect(x,y,2+random()*5,2+random()*4);
    }
    // exterior flowing water visible around the wooden ring, stops under bridges
    g.beginPath();g.arc(cx,cy,850,0,6.283);g.arc(cx,cy,728,0,6.283,true);g.fillStyle='#1697b1';g.fill('evenodd');
    for(let i=0;i<1200;i++){const a=random()*6.283,r=730+random()*115,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;
      circle(g,x,y,1.2+random()*2.5,i%4===0?'#bcf5ed':i%2===0?'#59d8da':'#0a738e');}
    for(let i=0;i<190;i++){const a=random()*6.283,r=852+random()*50,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;
      circle(g,x,y,7+random()*11,i%2?'#899a86':'#626c64','#405e52',1);}
    // wooden bridges form four unobstructed city exits
    function crossRect(x,y,w,h){g.fillStyle='#6b3f22';g.fillRect(x-9,y-9,w+18,h+18);g.fillStyle='#c28a50';g.fillRect(x,y,w,h);}
    crossRect(0,cy-routeHalf,W,routeHalf*2);
    crossRect(cx-routeHalf,0,routeHalf*2,H);
    // ring plaza, corridor junction
    g.beginPath();g.arc(cx,cy,outer,0,6.283);g.arc(cx,cy,inner,0,6.283,true);g.fillStyle='#a56734';g.fill('evenodd');
    g.beginPath();g.arc(cx,cy,outer-8,0,6.283);g.arc(cx,cy,inner+8,0,6.283,true);g.fillStyle='#e0a35e';g.fill('evenodd');
    // wooden planks only in ring and bridges
    g.save();g.beginPath();g.arc(cx,cy,outer-8,0,6.283);g.arc(cx,cy,inner+8,0,6.283,true);g.clip('evenodd');wood(g);g.restore();
    g.save();g.beginPath();g.rect(0,cy-routeHalf,W,routeHalf*2);g.rect(cx-routeHalf,0,routeHalf*2,H);g.clip();wood(g);g.restore();
    // Keep the center garden closed after the crossing corridors are painted.
    circle(g,cx,cy,inner+8,'#79532e');
    // rewrite wood base colors as warm overlay to blend seams
    g.strokeStyle='#fbe1a154';g.lineWidth=4;g.beginPath();g.arc(cx,cy,outer-8,0,6.283);g.stroke();
    // center turquoise garden pond
    const pond=g.createRadialGradient(cx,cy,30,cx,cy,inner);pond.addColorStop(0,'#0d8aaa');pond.addColorStop(.7,'#0d93b1');pond.addColorStop(1,'#0b667c');circle(g,cx,cy,inner-12,pond,'#5d3822',13);
    const pr=rng(656);for(let i=0;i<200;i++){const a=pr()*6.283,r=150+pr()*122;circle(g,cx+Math.cos(a)*r,cy+Math.sin(a)*r,3+pr()*3,pr()>.5?'#b3eff0':'#43c1c9');}
    for(let i=0;i<30;i++){const a=pr()*6.283,r=190+pr()*75;const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;circle(g,x,y,8,pr()>.5?'#76b550':'#416c38');}
    circle(g,cx,cy+35,146,'#517d43','#9cae7d',15);
    for(let i=0;i<28;i++){const a=i/28*6.283,r=151+pr()*6;circle(g,cx+Math.cos(a)*r,cy+35+Math.sin(a)*r,12,pr()>.5?'#7a8172':'#a5a695','#495a56',3);}
    for(let i=0;i<12;i++){const a=pr()*6.283,r=80+pr()*60;foliage(g,cx+Math.cos(a)*r,cy+Math.sin(a)*r+38,.40,true,i);}
    tree(g,cx,cy+25,1.72,true,25);
    // fountain lip, pond inner and outer fences; main garden inaccessible
    for(let i=0;i<4;i++){const x=cx-18+i*12,y=cy+163;
      round(g,x,y,9,39,3,'#c8eafa');}
    circleRail(g,inner+1,0,6.283);
    // outer boundary railing, with FOUR missing gaps for road links
    const gap=.205;
    for(let q=0;q<4;q++){const c=q*Math.PI/2;circleRail(g,outer,c+gap,c+Math.PI/2-gap);}
    // wooden bridge parallel rails without blocking the paths
    for(const s of [-1,1]){
      const x=cx+s*(routeHalf+11), y=cy+s*(routeHalf+11);
      line(g,[[x,0],[x,310]],'#6d4024',12);line(g,[[x,0],[x,310]],'#e0ac6f',6);
      line(g,[[x,1750],[x,2048]],'#6d4024',12);line(g,[[x,1750],[x,2048]],'#e0ac6f',6);
      line(g,[[0,y],[305,y]],'#6d4024',12);line(g,[[0,y],[305,y]],'#e0ac6f',6);
      line(g,[[1740,y],[2048,y]],'#6d4024',12);line(g,[[1740,y],[2048,y]],'#e0ac6f',6);
    }
    // Forest clusters outside town; only decorative (path bounds control navigation)
    for(let i=0;i<85;i++){
      const a=random()*6.283,r=876+random()*590,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;
      if(x<50||x>W-50||y<30||y>H-40)continue;
      if(Math.abs(x-cx)<225||Math.abs(y-cy)<225)continue;
      tree(g,x,y,.55+random()*.7,i%5===0,i);
    }
    // inset grass/rug planters near buildings, outside the walking lanes
    for(let i=0;i<18;i++){
      const a=random()*6.283,r=763+random()*18,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;
      foliage(g,x,y,.30+random()*.27,i%3===0,i);
    }
    // Labelled exit stones, no lampposts and no flags on any walkways.
    for(const [x,y,t] of [[cx,1880,'ใต้'],[cx,165,'เหนือ'],[155,cy,'ตะวันตก'],[1895,cy,'ตะวันออก']]){
      g.fillStyle='#87562c';g.beginPath();g.ellipse(x,y+22,55,20,0,0,6.283);g.fill();
      g.font='700 21px system-ui, sans-serif';g.textAlign='center';g.strokeStyle='#563a24';g.lineWidth=5;g.strokeText(t,x,y+3);g.fillStyle='#fff0c5';g.fillText(t,x,y+3);
    }
  }
  function makeHouseCanvas(h){
    const c=document.createElement('canvas');c.width=h.w;c.height=h.h;const g=c.getContext('2d');
    const W=h.w,H=h.h,door=W/2;g.shadowColor='#0b2524ac';g.shadowBlur=14;g.shadowOffsetY=7;
    round(g,33,104,W-66,H-46,8,'#8b522c','#382019',7);
    g.shadowColor='transparent';
    for(let i=0;i<8;i++){const x=43+i*(W-86)/8;g.fillStyle=i%2?'#ad713c':'#bf814a';g.fillRect(x,114,(W-86)/8,H-72);}
    for(let x=44;x<W-40;x+=28){line(g,[[x,110],[x,H-45]],'#653d23',2);}
    // architectural eaves: blue-glazed roofs with gilded curves
    path(g,[[13,107],[W*.14,69],[W*.31,71],[W*.45,35],[W*.52,18],[W*.62,51],[W*.88,70],[W-13,101],[W-8,117],[12,117]],'#21427a','#dfa954',6);
    path(g,[[26,108],[W*.15,82],[W*.36,82],[W*.52,40],[W*.66,80],[W*.86,81],[W-26,108]],'#315e9b','#ffe2a2',3);
    for(let j=0;j<3;j++){g.strokeStyle=j===0?'#8dace0aa':'#214b82aa';g.lineWidth=2;g.beginPath();g.moveTo(50,92+j*5);g.lineTo(W-50,92+j*5);g.stroke();}
    for(let x=50;x<W-44;x+=21){g.strokeStyle='#9fc2e080';g.lineWidth=2;g.beginPath();g.moveTo(x,82);g.lineTo(x+2,111);g.stroke();}
    // central golden roof and gold crest
    path(g,[[W*.33,77],[W*.50,31],[W*.67,77]],null,'#f6d18d',6);
    circle(g,door,52,9,'#e4a740','#583519',2);
    // glowing windows
    const windowX=[W*.19,W*.75];for(const x of windowX){
      round(g,x,143,53,53,3,'#34261f','#dfa456',5);
      round(g,x+6,149,41,41,2,'#ffd37f','#623d2b',2);
      line(g,[[x+26,149],[x+26,190]],'#66422b',3);line(g,[[x+6,169],[x+47,169]],'#66422b',3);
    }
    // wooden doorway and steps
    round(g,door-32,128,64,81,4,'#673c23','#e1a768',5);
    line(g,[[door,129],[door,209]],'#a76b38',3);
    circle(g,door-8,173,3,'#f7d17c');circle(g,door+8,173,3,'#f7d17c');
    round(g,door-49,211,98,14,3,'#a48c6e','#f1d8ab',3);
    round(g,door-59,224,118,12,3,'#d0af80','#f2d3a1',2);
    // flower boxes and warm firefly lights, no freestanding lamp posts
    for(const x of [25,W-43]){
      round(g,x,165,20,29,5,'#dd9e58','#674121',3);
      circle(g,x+10,164,9,'#fff2ac','#9e692c',2);
      circle(g,x+10,164,4,'#ffe9a5');
    }
    for(const x of [53,W-105]){
      round(g,x,210,59,17,4,'#714b2b','#dab06d',3);
      const rr=rng(h.style*17+x);for(let j=0;j<17;j++){circle(g,x+rr()*56,209+rr()*8,3.5,rr()>.4?'#f7abc3':'#a8d05d');}
    }
    // Different building details without adding barriers in road.
    if(h.style===1||h.style===3){round(g,W*.71,203,37,17,3,'#d07652','#ffe0a0',3);}
    if(h.style===4){g.fillStyle='#ad6c3f';g.fillRect(56,176,20,42);g.fillRect(77,188,25,28);}
    if(h.style===5){round(g,51,185,50,31,3,'#9d6e43','#e3b777',3);line(g,[[51,185],[101,216]],'#704323',2);}
    return c;
  }

