/* FEED DAYS v1.4.2 — six approved directions, four unique frames each.
   Legacy hook names retained; actual movement drives the visual only. */
(function(){
'use strict';
const atlas=new Image(),idle=new Image();
atlas.src='./assets/characters/starter-male-six.webp?v=142';
idle.src='./assets/characters/starter-male-east.webp?v=141';
const rows=[0,1,2,3,4,-1,5,-1]; // E, SE, S, SW, W, NW, N, NE
const ready=(img,w,h)=>img.complete&&img.naturalWidth===w&&img.naturalHeight===h;
let owner=null,map=null,dir=0,moving=false,elapsed=0;
function motion(ch,dx,dy,dt){
 if(owner!==ch||map!==ch.map){owner=ch;map=ch.map;dir=0;moving=false;elapsed=0}
 if(Math.hypot(dx,dy)<=.001){moving=false;elapsed=0;return}
 const next=(Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8;
 if(!moving||next!==dir)elapsed=0;
 else elapsed=(elapsed+Math.max(0,Math.min(dt,100)))%600;
 dir=next;moving=true;
}
function draw(ch,x,y){
 if(ch.gender!=='male'||ch!==owner||ch.map!==map||ch.riding)return false;
 const active=moving&&!gamePaused&&(!ui||ui==='📜 สกิล');
 const row=rows[dir],size=80,top=y+35-size*92/96;
 if(active){
  if(row<0||!ready(atlas,384,576))return false;
  const frame=Math.floor(elapsed/150);
  ctx.save();ctx.imageSmoothingEnabled=true;
  ctx.drawImage(atlas,frame*96,row*96,96,96,x-size/2,top,size,size);
  ctx.restore();return true;
 }
 // Only E/W have a separate existing idle image. Never use a moving pose for idle.
 if((dir!==0&&dir!==4)||!ready(idle,576,96))return false;
 ctx.save();ctx.imageSmoothingEnabled=true;
 if(dir===4){ctx.translate(x,0);ctx.scale(-1,1);ctx.drawImage(idle,0,0,96,96,-size/2,top,size,size)}
 else ctx.drawImage(idle,0,0,96,96,x-size/2,top,size,size);
 ctx.restore();return true;
}
window.fdEastMotion=motion;window.fdEastDraw=draw;
})();