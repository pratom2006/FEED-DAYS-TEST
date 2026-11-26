/* FEED DAYS v1.4.5 — eight running directions and eight standing directions.
   Legacy hook names retained; actual movement drives the visual only. */
(function(){
'use strict';
const atlas=new Image(),idle=new Image(),ne=new Image(),idleSix=new Image();
idleSix.src='./assets/characters/starter-male-idle-six.webp?v=145';
const idleCols=[-1,0,1,2,-1,3,4,5]; // E, SE, S, SW, W, NW, N, NE
ne.src='./assets/characters/starter-male-ne.webp?v=143';
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
  const isNW=dir===5,isUpperDiagonal=isNW||dir===7;
  const img=isUpperDiagonal?ne:atlas;
  if((!isUpperDiagonal&&row<0)||!ready(img,384,isUpperDiagonal?96:576))return false;
  const frame=Math.floor(elapsed/150);
  ctx.save();ctx.imageSmoothingEnabled=true;
  if(isNW){ctx.translate(x,0);ctx.scale(-1,1);ctx.drawImage(img,frame*96,0,96,96,-size/2,top,size,size)}
  else ctx.drawImage(img,frame*96,isUpperDiagonal?0:row*96,96,96,x-size/2,top,size,size);
  ctx.restore();return true;
 }
 // Standing pose uses the most recent movement direction. Preserve the original E/W idle.
 const col=idleCols[dir],side=dir===0||dir===4;
 const still=side?idle:idleSix;
 if(!ready(still,576,96))return false;
 ctx.save();ctx.imageSmoothingEnabled=true;
 if(dir===4){ctx.translate(x,0);ctx.scale(-1,1);ctx.drawImage(still,0,0,96,96,-size/2,top,size,size)}
 else ctx.drawImage(still,(side?0:col)*96,0,96,96,x-size/2,top,size,size);
 ctx.restore();return true;
}
window.fdEastMotion=motion;window.fdEastDraw=draw;
})();