/* FEED DAYS v1.6.4 — clean diagonal sword attack atlas, normalized height and grip sockets.
   Legacy hook names retained; actual movement drives the visual only. */
(function(){
'use strict';
const atlas=new Image(),idle=new Image(),ne=new Image(),idleSix=new Image(),combatEast=new Image(),combatSE=new Image(),combatSouth=new Image(),combatNorth=new Image(),combatNE=new Image(),attackEast=new Image(),attackSE=new Image();
attackSE.src='./assets/characters/starter-male-attack-se.webp?v=164';
attackEast.src='./assets/characters/starter-male-attack-east.webp?v=159';
combatNE.src='./assets/characters/starter-male-combat-ne.webp?v=157';
combatNorth.src='./assets/characters/starter-male-combat-north.webp?v=156';
combatSouth.src='./assets/characters/starter-male-combat-south.webp?v=154';
combatSE.src='./assets/characters/starter-male-combat-se.webp?v=153';
combatEast.src='./assets/characters/starter-male-combat-east.webp?v=151';
idleSix.src='./assets/characters/starter-male-idle-six.webp?v=145';
const idleCols=[-1,0,1,2,-1,3,4,5]; // E, SE, S, SW, W, NW, N, NE
ne.src='./assets/characters/starter-male-ne.webp?v=143';
atlas.src='./assets/characters/starter-male-six.webp?v=142';
idle.src='./assets/characters/starter-male-east.webp?v=141';
const rows=[0,1,2,3,4,-1,5,-1]; // E, SE, S, SW, W, NW, N, NE
const ready=(img,w,h)=>img.complete&&img.naturalWidth===w&&img.naturalHeight===h;
let owner=null,map=null,dir=0,moving=false,elapsed=0,attackPose=null;
function motion(ch,dx,dy,dt){
 if(owner!==ch||map!==ch.map){owner=ch;map=ch.map;dir=0;moving=false;elapsed=0;attackPose=null}
 if(Math.hypot(dx,dy)<=.001){moving=false;elapsed=0;return}
 const next=(Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8;
 if(!moving||next!==dir)elapsed=0;
 else elapsed=(elapsed+Math.max(0,Math.min(dt,100)))%600;
 dir=next;moving=true;
}

// Each entry: right hand x,y then left hand x,y, in the final displayed 96px cell.
// Measured from the actual approved atlases. Mirrored directions swap anatomical hands.
const mirrorHands=p=>[95-p[2],p[3],95-p[0],p[1]];
const eastHands=[[36,60,67,53],[44,61,60,56],[65,54,38,61],[51,62,59,59]];
const seHands=[[36,55,62,57],[36,60,59,56],[34,55,60,58],[46,59,59,52]];
const neHands=[[33,56,62,46],[59,53,35,50],[64,44,34,57],[60,53,35,49]];
const runHands=[
 eastHands,seHands,
 [[42,56,61,58],[37,61,57,55],[39,57,57,56],[43,55,61,61]],
 seHands.map(mirrorHands),
 [[31,52,61,58],[36,56,53,61],[59,61,34,54],[38,58,47,60]],
 neHands.map(mirrorHands),
 [[60,47,37,60],[61,61,39,49],[61,59,39,48],[59,50,37,62]],
 neHands
];
const idleHands=[[47,65,54,64],[39,64,61,62],[36,64,60,64],[34,62,56,64],[41,64,48,65],[58,61,39,64],[61,64,36,64],[57,65,36,62]];
// Far-side weapons render behind the sprite; near-side weapons above it.
// In front/back views both hands are visible.
const farSide=[1,1,-1,0,0,0,-1,1];
// Absolute angle from vertically downward, per running frame.
// 135° is diagonally upward; 150° is closer to vertical.
const rightRunLift=[
 [135,125,150,140], // E
 [140,125,150,135], // SE
 [135,125,130,150], // S
 [130,140,125,150], // SW
 [150,140,125,135], // W
 [150,140,125,140], // NW
 [150,125,135,140], // N
 [135,140,150,140]  // NE
];
// Keep blade on a consistent screen side throughout each four-frame cycle.
// Select side to favor clearance from body/face; no sign flip when a fist crosses center.
const rightRunSide=[1,-1,-1,-1,-1,1,1,1];
// Independent per-hand motion profiles. Opposite phase gives a counter-swing;
// opposite screen side separates the two blade tips without flipping within a cycle.
// This is for two independent one-handed weapons, not one two-handed weapon.
const leftRunLift=rightRunLift.map(frames=>frames.map((_,i)=>frames[(i+2)%4]));
const leftRunSide=rightRunSide.map(side=>-side);
const runWeaponProfiles=[
 {lift:rightRunLift,side:rightRunSide},
 {lift:leftRunLift,side:leftRunSide}
];
// Experimental Combat Front: both fists are forward in all four east frames.
// Coordinates measured on the actual 96px cells, right (near), left (far).
const combatEastHands=[[54,55,62,54],[53,55,59,54],[53,55,62,54],[52,55,60,54]];
// Keep the approved nominal angles. A smooth 600ms counter-sway replaces
// the old frame-stepped +/-2 degree wobble, rotating about the fist only.
const combatEastMotion=[135,140];
// Reuse the approved east atlas, mirror coordinates and swap anatomical hands.
const combatWestHands=combatEastHands.map(mirrorHands);
// Fist centers from the approved southeast sprite, in 96px cells.
const combatSEHands=[[52,53,63,52],[51,53,62,52],[51,53,63,52],[51,53,64,52]];
const combatSWHands=combatSEHands.map(mirrorHands);
// Front-facing character: anatomical right is screen-left.
const combatSouthHands=[[39.8,55,59.4,54.8],[39.8,54.7,58.5,54.4],[39.6,55,59,55],[39.7,54.9,59,54.3]];
// Owner-approved near-vertical blades; face overlap is intentional.
const combatSouthMotion=[170,170];
const combatSwayDegrees=5;
function combatBladeLift(hand){
 const base=(dir===2||dir>=5?combatSouthMotion:combatEastMotion)[hand];
 return base+(hand===0?1:-1)*combatSwayDegrees*Math.sin(elapsed*Math.PI/300);
}
// Back view: anatomical right is screen-right. Both weapons behind the body.
const combatNorthHands=[[58,44,36,44],[59,44,36,44],[58,44,36,44],[59,44,36,44]];
// NE right fist visible; left grip is estimated behind the head/body.
const combatNEHands=[[68,47,59,43],[63,48,55,44],[67,50,58,45],[60,48,53,44]];
const combatNWHands=combatNEHands.map(mirrorHands);
function isOneHandBlade(item){
 if(!item||item.twoHanded||item.hands===2||item.grip==='twoHanded')return false;
 const name=String(item.name||'');
 return /ดาบ|มีด|sword|dagger/i.test(name)&&!/ดาบใหญ่|ดาบสองมือ|สองมือ|greatsword|two.hand/i.test(name);
}
function drawHeldSword(x,top,size,hx,hy,liftDeg=0,bladeSide=1){
 const k=size/96;
 ctx.save();
 ctx.translate(x+(hx-48)*k,top+hy*k);
 ctx.scale(k,k);
 // Rotate around the existing fist socket, not the blade tip.
 // Idle rendering keeps the old base angle for either hand.
 const baseAngle=-Math.atan2(hx-48,13);
 const angle=liftDeg===0?baseAngle:-bladeSide*liftDeg*Math.PI/180;
 ctx.rotate(angle);
 ctx.lineJoin='round';
 ctx.lineWidth=1.4;ctx.strokeStyle='#51464b';
 ctx.fillStyle='#d5e9ee';
 ctx.beginPath();ctx.moveTo(-3.1,7);ctx.lineTo(3.1,7);ctx.lineTo(2.8,29);ctx.lineTo(0,34);ctx.lineTo(-2.8,29);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#fff6cf';ctx.beginPath();ctx.moveTo(-1.7,8);ctx.lineTo(-.2,8);ctx.lineTo(-.2,30);ctx.lineTo(-1.7,27);ctx.closePath();ctx.fill();
 // Leave the center of the grip uncovered so the hand remains visible.
 ctx.fillStyle='#493b39';ctx.fillRect(-2.3,-7,4.6,4);ctx.fillRect(-2.3,3,4.6,3);
 ctx.fillStyle='#b98b5b';ctx.fillRect(-3.5,-8,7,2.5);ctx.fillRect(-7,5,14,3);
 ctx.restore();
}
function drawPose(img,col,row,flip,x,top,size,hands,right,left,runFrame=-1,combatFront=false){
 const far=farSide[dir];
 const held=[right,left];
 function pass(behind){
  for(let hand=0;hand<2;hand++){
   const behindBody=(combatFront&&dir===6)||hand===far;
   if(!held[hand]||behindBody!==behind)continue;
   const profile=runWeaponProfiles[hand];
   const lift=combatFront?combatBladeLift(hand):runFrame<0?0:profile.lift[dir][runFrame];
   drawHeldSword(x,top,size,hands[hand*2],hands[hand*2+1],lift,combatFront?(dir===6?(hand===0?1:-1):dir===2?(hand===0?-1:1):dir===3||dir===4||dir===5?-1:1):profile.side[dir]);
  }
 }
 pass(true);
 ctx.save();ctx.imageSmoothingEnabled=true;
 if(flip){ctx.translate(x,0);ctx.scale(-1,1);ctx.drawImage(img,col*96,row*96,96,96,-size/2,top,size,size)}
 else ctx.drawImage(img,col*96,row*96,96,96,x-size/2,top,size,size);
 ctx.restore();
 pass(false);
}

// Visual attack clock follows the duration snapshot supplied by the gameplay scheduler.
const attackHands=[[37.2,58.9],[32.3,22.2],[83.5,54.3],[41.9,60.2]];
const attackAngles=[45,70,90,45],attackSides=[1,-1,1,1];
const attackSEHands=[[30.46,52.88],[31.52,37.05],[68.31,61.32],[32.7,59.34]];
const attackSEAngles=[45,145,55,27],attackSESides=[-1,-1,1,1];
function attackAtlas(facing){return facing===1||facing===3?attackSE:attackEast}
const attackColors={normal:'#dce6ef',fire:'#ff651c',ice:'#39caff',lightning:'#f8dd39',thunder:'#f8dd39',dark:'#ae42ef',divine:'#ffbc42',poison:'#60d832',blood:'#ed2549'};
function attackColor(w){
 const raw=w.slashColor;
 if(typeof raw==='string'&&/^#[0-9a-f]{6}$/i.test(raw))return raw;
 const element=String(w.element||'').toLowerCase();
 return Object.prototype.hasOwnProperty.call(attackColors,element)?attackColors[element]:'#39caff';
}
function isAttackSword(w){
 return isOneHandBlade(w)&&/ดาบ|sword/i.test(String(w.name||''));
}
function startAttack(ch,tx,ty,right,left,now,duration=380){
 attackPose=null;
 if(!ch||ch.gender!=='male'||ch.riding||!isAttackSword(right)||left||!Number.isFinite(now)||!Number.isFinite(duration)||duration<=0)return false;
 const dx=tx-ch.x,dy=ty-ch.y;
 if(!Number.isFinite(dx)||!Number.isFinite(dy)||Math.hypot(dx,dy)<.001)return false;
 const facing=(Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8;
 if(![0,1,3,4].includes(facing)||!ready(attackAtlas(facing),384,96))return false;
 attackPose={ch,map:ch.map,weapon:right,uid:right.uid,start:now,duration,color:attackColor(right),facing};
 // Face the actual accepted target rather than the previous movement direction.
 if(owner===ch&&map===ch.map)dir=facing;
 return true;
}
function attackSlash(x,top,size,t,color,diagonal=false){
 // Separate, recolorable procedural crescent. No effect pixels in the character sprite.
 if(t<110||t>=330)return;
 const opacity=t<165?(t-110)/55:t<230?1:1-(t-230)/100;
 if(opacity<=0)return;
 const k=size/96;
 ctx.save();ctx.translate(x,top+(diagonal?57:49)*k);ctx.scale(k,k);
 if(diagonal)ctx.rotate(Math.PI/6);
 ctx.globalAlpha*=opacity;ctx.shadowColor=color;ctx.shadowBlur=9;
 ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(18,-36);
 ctx.bezierCurveTo(67,-39,86,-5,62,14);
 ctx.bezierCurveTo(43,29,17,28,0,22);
 ctx.bezierCurveTo(42,20,65,2,49,-16);
 ctx.bezierCurveTo(42,-25,30,-32,18,-36);
 ctx.closePath();ctx.fill();
 ctx.shadowBlur=0;ctx.strokeStyle='#f5ffff';ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(35,-31);ctx.bezierCurveTo(76,-17,78,10,32,24);ctx.stroke();
 ctx.restore();
}
function drawAttack(ch,x,top,size,right,left){
 const a=attackPose;if(!a)return false;
 const age=Date.now()-a.start;
 const t=age*380/a.duration;
 if(a.ch!==ch||a.map!==ch.map||ch.riding||!isAttackSword(right)||left||(a.uid?a.uid!==right.uid:a.weapon!==right)||gamePaused||ui||age<0||age>=a.duration||!ready(attackAtlas(a.facing),384,96)){attackPose=null;return false}
 const frame=t<110?0:t<165?1:t<230?2:3;
 // Mirror the entire visual coordinate system around the player for west.
 // Sprite, grip, weapon rotation, and crescent reflect together; no extra atlas.
 const west=a.facing===4||a.facing===3,diagonal=a.facing===1||a.facing===3;
 if(west){ctx.save();ctx.translate(x,0);ctx.scale(-1,1)}
 const anchor=west?0:x;
 ctx.save();ctx.imageSmoothingEnabled=true;
 ctx.drawImage(attackAtlas(a.facing),frame*96,0,96,96,anchor-size/2,top,size,size);
 ctx.restore();
 const hand=(diagonal?attackSEHands:attackHands)[frame];
 drawHeldSword(anchor,top,size,hand[0],hand[1],(diagonal?attackSEAngles:attackAngles)[frame],(diagonal?attackSESides:attackSides)[frame]);
 attackSlash(anchor,top,size,t,a.color,diagonal);
 if(west)ctx.restore();
 return true;
}

function draw(ch,x,y,right,left){
 if(ch.gender!=='male'||ch!==owner||ch.map!==map||ch.riding)return false;
 const active=moving&&!gamePaused&&(!ui||ui==='📜 สกิล');
 const row=rows[dir],size=80,top=y+35-size*92/96;
 if(drawAttack(ch,x,top,size,right,left))return true;
 if(active){
  const frame=Math.floor(elapsed/150);
  const diagonal=dir===1||dir===3;
  const upper=dir===5||dir===7;
  const combat=upper?combatNE:dir===6?combatNorth:dir===2?combatSouth:diagonal?combatSE:combatEast;
  if(isOneHandBlade(right)&&isOneHandBlade(left)&&right!==left&&(!right.uid||!left.uid||right.uid!==left.uid)&&ready(combat,384,96)){
   const west=dir===3||dir===4||dir===5;
   const hands=upper?(west?combatNWHands:combatNEHands):dir===6?combatNorthHands:dir===2?combatSouthHands:diagonal?(west?combatSWHands:combatSEHands):(west?combatWestHands:combatEastHands);
   drawPose(combat,frame,0,west,x,top,size,hands[frame],right,left,frame,true);
   return true;
  }
  const isNW=dir===5,isUpperDiagonal=isNW||dir===7;
  const img=isUpperDiagonal?ne:atlas;
  if((!isUpperDiagonal&&row<0)||!ready(img,384,isUpperDiagonal?96:576))return false;
  drawPose(img,frame,isUpperDiagonal?0:row,isNW,x,top,size,runHands[dir][frame],right,left,frame);
  return true;
 }
 // Standing pose uses the most recent movement direction. Preserve the original E/W idle.
 const col=idleCols[dir],side=dir===0||dir===4;
 const still=side?idle:idleSix;
 if(!ready(still,576,96))return false;
 drawPose(still,side?0:col,0,dir===4,x,top,size,idleHands[dir],right,left);
 return true;
}
window.fdEastMotion=motion;window.fdEastDraw=draw;window.fdStartSwordAttack=startAttack;window.fdCancelSwordAttack=()=>{attackPose=null};
})();