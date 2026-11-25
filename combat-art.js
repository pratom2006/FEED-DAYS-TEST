/* FEED DAYS v1.3: lightweight Canvas paper-doll weapons and combat VFX.
   Visual-only; no damage, cooldown, range or inventory modifications. */
(function(){
'use strict';
const COLORS={basic:['#ffe6ac','#e6af58'],slash:['#eaffff','#75d8fc'],fire:['#fff0a4','#ff692e'],ice:['#f5ffff','#80cfff'],thunder:['#f4ebff','#a58cff'],wind:['#e7fff6','#69e4b9'],heal:['#f0ffcd','#61dc8c'],guard:['#fff2b3','#78cbff'],poison:['#eaffab','#98cc49'],roar:['#fff2c4','#eaa656'],wave:['#e6ffff','#39b9f0']};
const DURATION={basic:280,slash:420,fire:650,ice:680,thunder:530,wind:750,heal:900,guard:900,poison:850,roar:680,wave:750};
let active=[],owner=null,map=null;
function sync(){if(owner!==p||map!==p?.map){active=[];owner=p;map=p?.map}}
function enhancement(e){return e>=10?'#c584ff':e>=9?'#60d7ff':e>=8?'#ffb94e':e>=7?'#ffe17a':e>=4?'#b8eaff':null}
function weaponType(it){const n=String(it?.name||'');return /ธนู|bow/i.test(n)?'bow':/ไม้เท้า|คทา|staff/i.test(n)?'staff':/โล่|shield/i.test(n)?'shield':/หอก|spear/i.test(n)?'spear':/ขวาน|axe/i.test(n)?'axe':/มีด|dagger/i.test(n)?'dagger':/ไม้|wood/i.test(n)?'wood':'sword'}
function pose(dir,hand,now,moving,speed,action,progress){
 const right=hand==='right',sign=right?1:-1,walk=Math.sin(now/(speed>190?80:120));
 const side=dir==='left'?-1:1;
 let x=sign*15,y=10,angle=sign*.28;
 if(dir==='left'||dir==='right'){x=side*(right?13:5);y=right?9:13;angle=side*.38}
 if(dir==='back'){x=-sign*15;angle=-sign*.34}
 if(moving){angle+=(dir==='front'||dir==='back'?sign:side)*walk*.45;y+=walk*sign*2.8}
 if(action==='attack'){const t=clamp(progress,0,1);const sweep=-1.8+3.6*t;angle=(dir==='left'?-1:dir==='back'?-sign:1)*sweep* (right?1:.8);x+=(dir==='left'?-1:dir==='right'?1:sign)*4;y-=4*Math.sin(t*Math.PI)}
 if(action==='cast'){angle=sign*.95;y-=6*Math.sin(clamp(progress,0,1)*Math.PI)}
 return {x,y,angle};
}
function poly(points,fill,stroke=null,width=1){ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke()}}
function line(points,color,width=1){ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke()}
function arc(x,y,rx,ry,start,end,color,w=1){ctx.beginPath();ctx.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,start,end);ctx.strokeStyle=color;ctx.lineWidth=w;ctx.stroke()}
function ring(x,y,r,color,w=1){arc(x,y,r,r,0,Math.PI*2,color,w)}
function dot(x,y,r,color){ctx.beginPath();ctx.arc(x,y,Math.max(.2,r),0,Math.PI*2);ctx.fillStyle=color;ctx.fill()}
function spark(x,y,r,color){line([[x-r,y],[x+r,y]],color,1.5);line([[x,y-r],[x,y+r]],color,1.5)}
function drawWeapon(it,hand,x,y,dir,now,moving,speed,act,t,bob=0){
 if(!it)return;
 const q=pose(dir,hand,now,moving,speed,act,t),type=weaponType(it),enh=Number(it.enh)||0,glow=enhancement(enh),eco=perfMode==='eco';
 const rarity=typeof fd95Tier==='function'?fd95Tier(it).color:'#c4dbe1',wood=type==='wood';
 const length=type==='dagger'?19:type==='spear'?49:type==='staff'?41:32;
 ctx.save();ctx.translate(Math.round(x+q.x),Math.round(y+q.y-bob));ctx.rotate(q.angle);ctx.lineJoin='round';ctx.lineCap='round';
 if(glow){ctx.shadowColor=glow;ctx.shadowBlur=eco?0:enh>=7?10:5;ctx.globalAlpha=.30+.12*Math.sin(now/170);line([[0,4],[0,-length]],glow,enh>=7?9:5);ctx.globalAlpha=1}
 const blade=wood?'#b3824d':rarity,edge=wood?'#f0c385':'#f4faff';
 if(type==='shield'){poly([[-10,-12],[10,-12],[11,0],[0,12],[-11,0]],'#3a637e','#142334',2);poly([[-7,-9],[7,-9],[6,0],[0,8],[-6,0]],rarity);line([[0,-7],[0,5]],'#fff4c6',2)}
 else if(type==='bow'){ctx.beginPath();ctx.ellipse(0,-12,10,22,0,-Math.PI/2,Math.PI/2);ctx.strokeStyle='#c69558';ctx.lineWidth=4;ctx.stroke();line([[0,-34],[0,10]],'#dfe9df',1)}
 else if(type==='staff'||type==='spear'){line([[0,11],[0,-length]],'#3b2b29',6);line([[0,10],[0,-length]],'#a7794f',3);if(type==='staff'){poly([[0,-length-8],[7,-length],[0,-length+7],[-7,-length]],rarity,'#d9f7ff',2)}else poly([[0,-length-8],[6,-length+5],[0,-length+9],[-6,-length+5]],blade,'#21323c',1.5)}
 else if(type==='axe'){line([[0,12],[0,-29]],'#96643e',4);poly([[0,-30],[14,-35],[18,-25],[12,-17],[0,-22]],blade,'#1e303e',2)}
 else {poly([[-4,-4],[-4,-length+8],[0,-length],[5,-length+8],[4,-4]],blade,'#222c39',1.8);line([[0,-length+5],[0,-6]],edge,1.5);line([[-8,-3],[8,-3]],wood?'#85532d':'#d8aa62',4);line([[0,0],[0,10]],'#48302b',5);line([[0,1],[0,8]],'#ad8252',2);dot(0,11,2.5,'#d1b074')}
 ctx.shadowBlur=0;
 if(glow&&enh>=7){const n=eco?2:5;for(let i=0;i<n;i++){const z=(now/650+i/n)%1;spark(Math.sin(i*2.7+now/420)*7,-length*z,1.5+z*2,glow)}}
 ctx.restore();
}
function layers(phase,params){
 const {x,y,dir,now,moving,speed,act,t,bob}=params;
 if(act==='fall')return;
 for(const hand of ['left','right']){
  const behind=dir==='back'||(dir==='right'&&hand==='left')||(dir==='left'&&hand==='right');
  if((phase==='back')!==behind)continue;
  const it=getEq(p.equip[hand]);drawWeapon(it,hand,x,y,dir,now,moving,speed,act,t,bob);
 }
}
function enqueue(kind,x,y,tx,ty){
 if(!p||!COLORS[kind]||![x,y,tx,ty].every(Number.isFinite))return false;
 sync();const max=perfMode==='eco'?10:24;
 if(active.length>=max)active.splice(0,active.length-max+1);
 active.push({kind,x,y,tx,ty,start:Date.now(),duration:DURATION[kind],angle:Math.atan2(ty-y,tx-x)});return true;
}
function particles(x,y,t,color,count,radius,up=0){
 const n=perfMode==='eco'?Math.max(3,Math.ceil(count/3)):count;
 for(let i=0;i<n;i++){const theta=i*2.39996,rad=radius*(.2+t)*(.65+(i%4)*.12);const px=x+Math.cos(theta)*rad,py=y+Math.sin(theta)*rad-up*t;ctx.globalAlpha=Math.max(0,(1-t)*.9);if(i%3===0)spark(px,py,2.5,color);else dot(px,py,1.6+(i%3),color)}
}
function renderOne(e,t){
 const [light,color]=COLORS[e.kind],x=e.tx,y=e.ty-10,rad=18+42*t,fade=1-t;
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.globalAlpha=Math.min(1,fade*2.5);
 switch(e.kind){
 case 'basic':case 'slash':{
  const a=e.angle,reach=18+20*t;
  ctx.translate(x,y);ctx.rotate(a);
  arc(0,0,reach,reach,-1.25,1.25,color,8*fade+2);arc(0,0,reach-4,reach-4,-1.15,1.15,light,3);
  particles(6,0,t,light,10,28);break}
 case 'fire':{
  const f=Math.min(1,t*3),px=e.x+(x-e.x)*f,py=e.y-12+(y-(e.y-12))*f-22*Math.sin(f*Math.PI);
  if(t<.36){dot(px,py,12,color);dot(px,py,6,light);line([[px-10*Math.cos(e.angle),py-10*Math.sin(e.angle)],[px-28*Math.cos(e.angle),py-28*Math.sin(e.angle)]],color,7)}
  else{const u=(t-.36)/.64;ring(x,y,10+38*u,color,5);dot(x,y,18*(1-u)+4,light);particles(x,y,u,color,17,43,20)}break}
 case 'ice':{
  const n=perfMode==='eco'?3:6;for(let i=0;i<n;i++){const a=i*6.283/n,px=x+Math.cos(a)*20*t,py=y+Math.sin(a)*12*t;poly([[px,py-25*(.3+t)],[px+7,py-4],[px,py+10],[px-7,py-4]],color,light,1.5)}
  arc(x,y+14,rad,rad*.45,0,Math.PI*2,light,2);particles(x,y,t,light,13,40,5);break}
 case 'thunder':{
  const zig=[[x-20,y-115],[x+8,y-80],[x-9,y-66],[x+15,y-36],[x,y]];
  line(zig,color,9*fade+3);line(zig,light,3);ring(x,y+7,rad,color,3);particles(x,y,t,light,14,43);break}
 case 'wind':{
  for(let i=0;i<3;i++){const r=18+13*i+18*t;arc(e.x,e.y-8-i*10,r,r*.48,t*7+i*1.5,t*7+i*1.5+4.1,color,3);arc(e.x,e.y-8-i*10,r-4,(r-4)*.48,t*7+i*1.5,t*7+i*1.5+2.2,light,2)}particles(x,y,t,color,12,39,10);break}
 case 'heal':{
  arc(x,y+29,28+10*t,13+4*t,0,Math.PI*2,color,3);
  for(let i=0;i<4;i++){const a=i*1.57+t*4;spark(x+Math.cos(a)*27,y-45*t+Math.sin(a)*10,5,light)}particles(x,y,t,color,12,28,55);break}
 case 'guard':{
  ring(x,y+3,35+5*Math.sin(t*3.14),color,3);
  const points=Array.from({length:6},(_,i)=>[x+Math.cos(i*1.047+t*.6)*29,y+3+Math.sin(i*1.047+t*.6)*29]);poly(points,null,light,2);
  particles(x,y,t,light,10,35,8);break}
 case 'poison':{
  for(let i=0;i<5;i++){const a=i*1.256;ctx.globalAlpha=.26*fade;dot(x+Math.cos(a)*22*t,y+Math.sin(a)*13*t-18*t,15+10*t,color)}
  ctx.globalAlpha=fade;particles(x,y,t,light,14,32,36);break}
 case 'roar':{
  for(let i=0;i<3;i++){const r=18+Math.max(0,t-i*.12)*75;arc(e.x,e.y+10,r,r*.55,0,Math.PI*2,i===0?light:color,4*fade+1)}particles(x,y,t,light,10,30);break}
 case 'wave':{
  for(let i=0;i<3;i++){const r=10+Math.max(0,t-i*.08)*52;arc(x,y+16,r,r*.55,0,Math.PI*2,i===0?light:color,5-i)}
  for(let i=0;i<5;i++){const a=i*1.256;dot(x+Math.cos(a)*rad*.8,y+Math.sin(a)*rad*.45-20*Math.sin(t*Math.PI),3,light)}break}
 }
 ctx.restore();
}
function draw(){if(!p)return;sync();const now=Date.now();active=active.filter(e=>now-e.start<e.duration);for(const e of active){if(perfVisibleInCamera(e.tx,e.ty,135)||perfVisibleInCamera(e.x,e.y,135))renderOne(e,clamp((now-e.start)/e.duration,0,1))}}
function guard(){if(!p||!(p.petShieldUntil>Date.now()))return;const a=.2+.1*Math.sin(Date.now()/230);ctx.save();ctx.globalAlpha=a;ring(p.x,p.y-4,38,'#8bd7ff',2);arc(p.x,p.y+25,26,9,0,Math.PI*2,'#ffdc8a',2);ctx.restore()}
window.fdCombatVfx=enqueue;
window.fdDrawCombatVfx=draw;
window.fdDrawGuardAura=guard;
window.fdPaperDollLayers=layers;
})();
