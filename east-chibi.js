/* FEED DAYS — East-only male starter visual. Does not change gameplay or saves.
   Atlas cells: idle, four source walking poses, one reused passing pose.
   Only the exact east sector uses the new art; other directions retain existing art. */
(function(){
'use strict';
const atlas=new Image();
atlas.src='./assets/characters/starter-male-east.webp?v=141';
let owner=null,map=null,east=false,moving=false,elapsed=0;
function motion(ch,dx,dy,dt){
 if(owner!==ch||map!==ch.map){owner=ch;map=ch.map;east=false;moving=false;elapsed=0}
 if(Math.hypot(dx,dy)<=.001){moving=false;elapsed=0;return}
 const nextEast=dx>0&&Math.abs(dy)<=dx*.41421356;
 if(!nextEast||!east||!moving)elapsed=0;
 else elapsed=(elapsed+Math.max(0,Math.min(dt,100)))%500;
 east=nextEast;moving=nextEast;
}
function draw(ch,x,y){
 if(ch.gender!=='male'||ch!==owner||ch.map!==map||!east||ch.riding||!atlas.complete||atlas.naturalWidth!==576||atlas.naturalHeight!==96)return false;
 const active=moving&&!gamePaused&&(!ui||ui==='📜 สกิล');
 const frame=active?1+Math.floor(elapsed/100):0;
 const size=80;
 ctx.save();ctx.imageSmoothingEnabled=true;
 ctx.drawImage(atlas,frame*96,0,96,96,x-size/2,y+35-size*92/96,size,size);
 ctx.restore();
 return true;
}
window.fdEastMotion=motion;window.fdEastDraw=draw;
})();
