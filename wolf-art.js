(function(){
'use strict';
const atlas=new Image();atlas.src='./assets/wolf-atlas.png?v=140';
const ready=()=>atlas.complete&&atlas.naturalWidth===128&&atlas.naturalHeight===24;
const style=document.createElement('style');style.textContent='.fd-wolf-portrait{display:inline-block;vertical-align:middle;width:48px;height:36px;background:url("./assets/wolf-atlas.png?v=140") no-repeat 0 0 / 400% 100%;image-rendering:pixelated}.pc-portrait .fd-wolf-portrait{width:96px;height:72px}';document.head.appendChild(style);
window.fdWolfPortrait=c=>{const info=FD_WOLVES[c.species];return info?'<span class="fd-wolf-portrait" style="filter:'+info.filter+';border-bottom:2px solid '+info.color+'" aria-label="'+esc(c.name)+'"></span>':esc(c.icon||'🐾')};
window.fdDrawWolf=function(c,a,index,mount){
 const info=FD_WOLVES[c.species];if(!info||!ready())return false;
 const now=Date.now(),x=a.x,y=a.y,attack=now-(fdWolfAttackAt.get(c)||0)<300,frame=attack?3:a.moving?1+Math.floor(now/140)%2:0;
 const w=mount?90:57,h=w*.75,bob=a.moving?Math.sin(now/95)*1.5:0;
 ctx.save();circle(x,y+10,w*.28,'#11223280');
 if(c.species!=='wolf'){ctx.globalAlpha=.20;circle(x,y-7,w*.37,info.color);ctx.globalAlpha=1}
 ctx.translate(Math.round(x),Math.round(y+bob));if(a.facing===-1)ctx.scale(-1,1);ctx.imageSmoothingEnabled=false;
 ctx.filter=info.filter;ctx.drawImage(atlas,frame*32,0,32,24,-w/2,-h+13,w,h);ctx.filter='none';
 if(mount){rect(-7,-h*.4,16,7,'#6b452c');rect(-7,-h*.4,16,2,'#deb36e')}
 ctx.restore();
 textLabel(c.name,x,y-h-3,'#fff5c8',10);
 const bw=mount?42:32;rect(x-bw/2,y-h+8,bw,4,'#173746');rect(x-bw/2,y-h+8,bw*clamp(c.hp/fdPetMaxHP(c),0,1),4,'#6ed3a3');
 return true;
};
})();