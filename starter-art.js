/* FEED DAYS v1.2 — male starter art extracted from approved concept sheet.
   Atlas: 21 cells, 24x28, nearest-neighbor rendering. Existing gameplay is unchanged. */
(function(){
'use strict';
const atlas=new Image();atlas.src='./assets/starter-male.png?v=120';
const FRAMES={front:0,back:1,left:2,right:3,walk:[4,5],run:[6,7],attack:[8,9,10],cast:[11,12,13],hurt:[14,15],fall:[16,17,18],idle:[19,20]};
const state={owner:null,map:null,dir:'front',movingUntil:0,speed:0,action:null,started:0,until:0,death:null};
const loaded=()=>atlas.complete&&atlas.naturalWidth===504&&atlas.naturalHeight===28;
const male=()=>p&&p.gender==='male';
function reset(){
 if(state.owner!==p||state.map!==p?.map){Object.assign(state,{owner:p,map:p?.map,dir:'front',movingUntil:0,speed:0,action:null,started:0,until:0,death:null})}
}
function face(dx,dy){if(Math.hypot(dx,dy)<.01)return;state.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'back':'front')}
function action(type,ms){reset();state.action=type;state.started=Date.now();state.until=state.started+ms}
function frameFor(now,armed){
 let dir=state.dir,frame=FRAMES[dir],flip=false,bob=0;
 if(state.action&&now<state.until){
  let seq=FRAMES[state.action];
  if(state.action==='attack')seq=[FRAMES[dir],dir==='left'||dir==='right'?4:FRAMES[dir],FRAMES[dir]];
  const i=Math.min(seq.length-1,Math.floor((now-state.started)/(state.until-state.started)*seq.length));
  frame=seq[Math.max(0,i)];flip=dir==='left'&&(state.action==='fall'||(state.action==='attack'&&frame===4));
 }else if(now<state.movingUntil){
  const fast=state.speed>190;
  if(dir==='left'||dir==='right'){const seq=fast?FRAMES.run:FRAMES.walk;frame=seq[Math.floor(now/(fast?110:155))%seq.length];flip=dir==='left'}
  else{frame=FRAMES[dir];bob=Math.abs(Math.sin(now/75))*3}
 }else if(dir==='front'){frame=FRAMES.idle[Math.floor(now/850)%2]}
 return {frame,flip,bob};
}
function drawSprite(frame,x,y,flip=false,bob=0){
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(Math.round(x),Math.round(y-bob));if(flip)ctx.scale(-1,1);
 ctx.drawImage(atlas,frame*24,0,24,28,-30,-37,60,70);ctx.restore();
}
const oldDraw=drawPlayer;
drawPlayer=function(){
 if(!male()||!loaded()){
  if(!p||typeof window.fdPaperDollLayers!=='function')return oldDraw();
  reset();const now=Date.now(),busy=state.action&&now<state.until,params={x:p.x,y:p.y,dir:state.dir,now,moving:now<state.movingUntil,speed:state.speed,act:busy?state.action:null,t:busy?clamp((now-state.started)/Math.max(1,state.until-state.started),0,1):0,bob:0};
  window.fdPaperDollLayers('back',params);oldDraw();window.fdPaperDollLayers('front',params);return;
 }
 reset();const now=Date.now(),x=p.x,y=p.y,head=getEq(p.equip.head),armor=getEq(p.equip.armor),right=getEq(p.equip.right),left=getEq(p.equip.left),arms=getEq(p.equip.arms),feet=getEq(p.equip.feet);
 const strongest=Math.max(0,...Object.values(p.equip).map(uid=>getEq(uid)?.enh||0));
 const visual=frameFor(now,Boolean(right||left)),busy=state.action&&now<state.until;
 ctx.save();circle(x,y+28,18,'#091d3280');
 if(strongest>=7){ctx.globalAlpha=.24+Math.sin(now/190)*.09;circle(x,y-5,32,strongest>=10?'#bd7bff':strongest===9?'#65caff':'#ffdc66');ctx.globalAlpha=1}
 const layer={x,y,dir:state.dir,now,moving:now<state.movingUntil,speed:state.speed,act:busy?state.action:null,t:busy?clamp((now-state.started)/Math.max(1,state.until-state.started),0,1):0,bob:visual.bob};
 if(typeof window.fdPaperDollLayers==='function')window.fdPaperDollLayers('back',layer);
 drawSprite(visual.frame,x,y,visual.flip,visual.bob);
 // Keep readable equipment indications; full layered clothing sprites are a separate art pass.
 if(state.action!=='fall'||!busy){
  const by=y-visual.bob;
  if(armor){rect(x-10,by+1,20,13,'#45617e');rect(x-8,by+2,16,3,'#8ca8c1')}
  if(head){rect(x-14,by-37,28,4,'#a28e65');rect(x-9,by-43,18,7,'#746077')}
  if(arms){rect(x-16,by+7,5,6,'#96704d');rect(x+11,by+7,5,6,'#96704d')}
  if(feet){rect(x-10,by+24,8,4,'#a18a68');rect(x+2,by+24,8,4,'#a18a68')}
  if(typeof window.fdPaperDollLayers!=='function'){if(right){rect(x+19,by-15,4,27,'#d5e9ee');rect(x+14,by+7,14,4,'#b98b5b');rect(x+19,by+11,4,7,'#493b39')}if(left){rect(x-22,by-8,4,20,'#d4e5e7');rect(x-26,by+8,12,3,'#bba16e')}}
 }
 if(typeof window.fdPaperDollLayers==='function')window.fdPaperDollLayers('front',layer);
 ctx.restore();
 textLabel(p.name,x,y-51,'#fff5dc',13);textLabel('Lv.'+p.lvl,x,y-66,'#f9df84',11);
};
const oldStep=step,oldWarp=warp;
warp=function(dest,options={}){
 if(options.respawn&&male()&&loaded()){
  reset();if(!state.death){action('fall',650);state.death={dest,options,owner:p};state.movingUntil=0;walkTarget=null;heldAttackPointer=null;moveDir={x:0,y:0}}
  return;
 }
 state.death=null;return oldWarp(dest,options);
};
step=function(dt){
 if(!p)return oldStep(dt);
 reset();
 if(state.death){if(Date.now()>=state.until){const job=state.death;state.death=null;if(p===job.owner){oldWarp(job.dest,job.options);reset()}}return}
 const owner=p,map=p.map,x=p.x,y=p.y;
 const result=oldStep(dt);
 if(p===owner&&p.map===map&&!state.death){const dx=p.x-x,dy=p.y-y,d=Math.hypot(dx,dy);if(d>.05){if(!state.action||Date.now()>=state.until)face(dx,dy);state.movingUntil=Date.now()+110;state.speed=d*1000/Math.max(1,dt)}}
 else if(!state.death)reset();
 return result;
};
const oldAttack=attack;
attack=function(skill,silent=false){
 if(state.death&&state.owner===p)return false;
 const target=p&&!skill?(enemies.find(e=>e.uid===targetEnemy&&e.hp>0&&dist(e,p)<105)||enemies.filter(e=>e.hp>0&&dist(e,p)<105).sort((a,b)=>dist(a,p)-dist(b,p))[0]):null;
 const result=oldAttack(skill,silent);
 if(result&&!skill&&p){reset();if(target)face(target.x-p.x,target.y-p.y);action('attack',320)}
 return result;
};
const oldCast=fdCastSkill;
fdCastSkill=function(id,silent=false){if(state.death&&state.owner===p)return false;const result=oldCast(id,silent);if(result&&p)action('cast',540);return result};
const oldNumber=pushCombatNumber;
pushCombatNumber=function(x,y,amount,kind='physical',ownerIcon=''){const result=oldNumber(x,y,amount,kind,ownerIcon);if(kind==='monster'&&male()&&!state.death)action('hurt',260);return result};
const style=document.createElement('style');style.textContent='.fd-starter-preview{display:inline-block;width:48px;height:56px;background-image:url("./assets/starter-male.png?v=120");background-size:2100% 100%;background-repeat:no-repeat;image-rendering:pixelated;vertical-align:middle}.fd-starter-hud{width:30px;height:35px}.fd-starter-create{width:72px;height:84px}.fd-starter-createbox{display:flex;align-items:center;justify-content:center;gap:12px;min-height:88px;background:#193649;border:1px solid #657c8c;border-radius:10px;padding:7px}';
document.head.appendChild(style);
function preview(cls=''){const span=document.createElement('span');span.className='fd-starter-preview '+cls;span.setAttribute('aria-label','ตัวละครชายชุดเริ่มต้น');return span}
const oldChars=renderChars;
renderChars=function(){const result=oldChars();$('charSlots').querySelectorAll('.slot').forEach(node=>{const c=account().characters[Number(node.dataset.i)],el=node.querySelector('.miniChar');if(c?.gender==='male'&&el)el.replaceChildren(preview())});return result};
const oldCreate=openCreate;
openCreate=function(i){const result=oldCreate(i),box=document.createElement('div');box.className='fd-starter-createbox';
 const label=document.createElement('span');label.textContent='ชุดเริ่มต้น · เสื้อขาว กางเกงขาสั้นสีดำ';box.append(preview('fd-starter-create'),label);
 const maleBtn=$('maleBtn'),femaleBtn=$('femaleBtn');maleBtn.parentElement.insertAdjacentElement('beforebegin',box);
 maleBtn.addEventListener('click',()=>{box.replaceChildren(preview('fd-starter-create'),label);label.textContent='ชุดเริ่มต้น · เสื้อขาว กางเกงขาสั้นสีดำ'});
 femaleBtn.addEventListener('click',()=>{const icon=document.createElement('span');icon.textContent='👩‍🎤';icon.style.fontSize='48px';label.textContent='ตัวละครหญิง · ภาพเดิม';box.replaceChildren(icon,label)});
 return result};
const oldHUD=refreshHUD;
refreshHUD=function(){const result=oldHUD();if(male())$('hudAvatar').replaceChildren(preview('fd-starter-hud'));return result};
window.fdStarterArtReady=loaded;
})();
