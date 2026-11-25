/* FEED DAYS v0.9.6: larger scrolling zones, reusable terrain chunks, roaming monsters.
   Offline/local prototype; server authoritative mobs and multiplayer are future work. */
(function(){
'use strict';
const ZONES={
 meadow:{name:'🌿 ทุ่งเขียวคราม · Lv18–32',w:2300,h:1500,level:[18,32],count:32,biome:'meadow',
   mobs:[
    {name:'กระต่ายเขา',emoji:'🐇',mood:'normal',level:19,hp:125,atk:9,xp:300,coin:45,color:'#d7cba2',speed:23},
    {name:'กวางเรืองแสง',emoji:'🦌',mood:'peaceful',level:24,hp:210,atk:13,xp:510,coin:65,color:'#88c5c9',speed:35},
    {name:'หมาป่ารัตติกาล',emoji:'🐺',mood:'aggressive',level:29,hp:285,atk:17,xp:720,coin:85,color:'#7776a7',speed:49}
   ],
   boss:{name:'จ้าวหมาป่าเงา',emoji:'🐺',mood:'aggressive',level:34,hp:1650,atk:24,xp:2600,coin:430,color:'#a68be0',speed:43}
 },
 ruins:{name:'🏛️ ซากนครอาคม · Lv30–48',w:2880,h:1800,level:[30,48],count:38,biome:'ruins',
   mobs:[
    {name:'โกเลมหินโบราณ',emoji:'🪨',mood:'normal',level:32,hp:345,atk:21,xp:880,coin:110,color:'#a5a7a0',speed:19},
    {name:'ผู้พิทักษ์ศิลา',emoji:'🗿',mood:'peaceful',level:38,hp:435,atk:27,xp:1280,coin:170,color:'#a6c7bc',speed:28},
    {name:'วิญญาณอาฆาต',emoji:'👻',mood:'aggressive',level:44,hp:480,atk:33,xp:1760,coin:200,color:'#b6b5ed',speed:50}
   ],
   boss:{name:'ราชาวิญญาณ',emoji:'👑',mood:'aggressive',level:51,hp:3400,atk:42,xp:5600,coin:1000,color:'#d19bff',speed:40}
 },
 ashlands:{name:'🌋 แดนเถ้าอัคคี · Lv45–65',w:3200,h:2100,level:[45,65],count:44,biome:'ashlands',
   mobs:[
    {name:'ค้างคาวเพลิง',emoji:'🦇',mood:'normal',level:47,hp:560,atk:36,xp:1650,coin:230,color:'#d78a63',speed:35},
    {name:'โกเลมลาวา',emoji:'🪨',mood:'peaceful',level:54,hp:850,atk:48,xp:2500,coin:350,color:'#e39b62',speed:27},
    {name:'ลูกมังกรอัคคี',emoji:'🐉',mood:'aggressive',level:61,hp:980,atk:61,xp:3750,coin:480,color:'#e56c65',speed:54}
   ],
   boss:{name:'ราชามังกรเถ้า',emoji:'🐲',mood:'aggressive',level:68,hp:7200,atk:84,xp:11000,coin:2200,color:'#ffad65',speed:43}
 }
};
const OLD={
 left:{count:16,mobs:[
  {name:'สไลม์',emoji:'🟢',mood:'normal',level:2,hp:40,atk:4,xp:28,coin:16,color:'#5de0a4',speed:23},
  {name:'สไลม์เขียว',emoji:'🟢',mood:'peaceful',level:5,hp:70,atk:5,xp:49,coin:22,color:'#7be1b0',speed:25},
  {name:'สไลม์หนาม',emoji:'🦔',mood:'aggressive',level:8,hp:94,atk:7,xp:75,coin:29,color:'#b9d98a',speed:35}],
  boss:{name:'ราชาสไลม์',emoji:'👑',mood:'aggressive',level:12,hp:260,atk:10,xp:160,coin:100,color:'#6de49c',speed:28}},
 right:{count:18,mobs:[
  {name:'หมาป่า',emoji:'🐺',mood:'normal',level:9,hp:80,atk:9,xp:47,coin:30,color:'#a9a2a3',speed:33},
  {name:'หมาป่าฝูง',emoji:'🐺',mood:'peaceful',level:13,hp:118,atk:12,xp:95,coin:40,color:'#b8aaa0',speed:40},
  {name:'หมาป่าดุร้าย',emoji:'🐺',mood:'aggressive',level:17,hp:175,atk:15,xp:152,coin:55,color:'#b28786',speed:49}],
  boss:{name:'ราชาหมาป่า',emoji:'👑',mood:'aggressive',level:20,hp:480,atk:19,xp:430,coin:210,color:'#cfb6a4',speed:43}},
 bottom:{count:17,mobs:[
  {name:'ปูเวท',emoji:'🦀',mood:'normal',level:10,hp:70,atk:6,xp:38,coin:24,color:'#ee9c76',speed:20},
  {name:'เต่าคลื่น',emoji:'🐢',mood:'peaceful',level:15,hp:155,atk:12,xp:135,coin:45,color:'#82c4ae',speed:25},
  {name:'ปูเพลิง',emoji:'🦀',mood:'aggressive',level:19,hp:190,atk:17,xp:200,coin:67,color:'#e1837f',speed:43}],
  boss:{name:'ราชาปูเวท',emoji:'👑',mood:'aggressive',level:23,hp:570,atk:22,xp:610,coin:230,color:'#eaa986',speed:37}}
};
const MOOD={
 normal:{label:'ปกติ',symbol:'⚪',color:'#e8e3d7'},
 peaceful:{label:'รักสงบ · ช่วยกันเมื่อโดนตี',symbol:'🟢',color:'#83edb5'},
 aggressive:{label:'ดุร้าย · ไล่เมื่อเห็นผู้เล่น',symbol:'🔴',color:'#ff9894'}
};
const CHUNK=400,CACHE_LIMIT=27,terrain=new Map();
let aiAccumulator=0,mapCanvas=null,mapCanvasCtx=null,mapUIOpen=false,mapLastPaint=0;
function zone(id){return ZONES[id]||OLD[id]||null}
function extendMaps(){
 for(const [id,z] of Object.entries(ZONES))MAPS[id]={name:z.name,color:z.biome==='meadow'?'#62926b':z.biome==='ruins'?'#687c88':'#ab6354'};
 const gate=(x,y,side,to,label,color='#a9eddb')=>({x,y,side,to,label,color});
 // Existing town + three legacy areas remain reachable exactly as before.
 MAP_PORTALS.right.push(gate(912,308,'east','meadow','🌿 ทุ่ง Lv18–32'));
 MAP_PORTALS.meadow=[gate(48,750,'west','right','หุบเขาหมาป่า'),gate(2252,750,'east','ruins','🏛️ ซากนคร Lv30–48','#e4c19c')];
 MAP_PORTALS.ruins=[gate(48,900,'west','meadow','ทุ่งเขียวคราม'),gate(2832,900,'east','ashlands','🌋 แดนเถ้า Lv45–65','#f6b38d')];
 MAP_PORTALS.ashlands=[gate(48,1050,'west','ruins','ซากนครอาคม')];
 MAP_ENTRIES.right.meadow={x:789,y:308};
 MAP_ENTRIES.meadow={right:{x:164,y:750},ruins:{x:2136,y:750},default:{x:164,y:750}};
 MAP_ENTRIES.ruins={meadow:{x:170,y:900},ashlands:{x:2690,y:900},default:{x:170,y:900}};
 MAP_ENTRIES.ashlands={ruins:{x:164,y:1050},default:{x:164,y:1050}};
}
extendMaps();
function configureWorld(){
 if(!p)return;
 const z=ZONES[p.map];
 WORLD.w=z?.w||960;WORLD.h=z?.h||600;
 if(Number.isFinite(p.x))p.x=clamp(p.x,25,WORLD.w-25);
 if(Number.isFinite(p.y))p.y=clamp(p.y,38,WORLD.h-36);
 aiAccumulator=0;
}
const baseSpawn=spawnEnemies;
function chooseSpec(z){
 const roll=Math.random();
 return z.mobs[roll<.33?0:roll<.66?1:2];
}
function nearGate(x,y){
 return (MAP_PORTALS[p?.map]||[]).some(g=>Math.hypot(g.x-x,g.y-y)<130);
}
function findSpawn(spec,around=null){
 let x=0,y=0;
 for(let attempt=0;attempt<24;attempt++){
  if(around){x=clamp(around.x+(Math.random()-.5)*550,95,WORLD.w-95);
   y=clamp(around.y+(Math.random()-.5)*450,95,WORLD.h-95);}
  else{x=100+Math.random()*(WORLD.w-200);y=100+Math.random()*(WORLD.h-200)}
  if(!nearGate(x,y)&&dist({x,y},p)>135)break;
 }
 return {x,y};
}
function makeMob(spec,x,y,boss=false){
 const e={uid:guid(),name:spec.name,emoji:spec.emoji||'👾',
  mood:spec.mood||'normal',group:spec.name,level:spec.level||1,
  hp:spec.hp,max:spec.hp,atk:spec.atk,xp:spec.xp,coin:spec.coin,color:spec.color,
  speed:spec.speed||34,vision:spec.vision||(boss?265:215),
  x,y,homeX:x,homeY:y,wanderX:x,wanderY:y,wanderUntil:0,
  aggroUntil:0,hitUntil:0,lastAttack:0,boss,fd96:true};
 if(boss)e.bossTitle='👑 '+spec.name;
 return e;
}
function spawnOne(spec,near=null,boss=false){
 const pos=near?findSpawn(spec,near):findSpawn(spec);
 const mob=makeMob(spec,pos.x,pos.y,boss);enemies.push(mob);return mob;
}
function spawnInitial(){
 configureWorld();enemies=[];
 if(!p||p.map==='town')return;
 const z=zone(p.map);if(!z){baseSpawn();return}
 // Place some ordinary monsters near the arrival area so the new huge maps
 // do not appear empty, but leave a safe radius around the entry.
 for(let i=0;i<z.count;i++){
  const spec=chooseSpec(z);
  const nearby=i<Math.min(5,Math.round(z.count/6));
  spawnOne(spec,nearby?{x:p.x+240,y:p.y+(i-2)*100}:null);
 }
 if(z.boss){
  const x=ZONES[p.map]?WORLD.w*.72:WORLD.w*.62;
  const y=ZONES[p.map]?WORLD.h*.6:WORLD.h*.77;
  enemies.push(makeMob(z.boss,x,y,true));
 }
 updateMinimap(true);
}
spawnEnemies=spawnInitial;
const previousShowScreen=showScreen;
showScreen=function(id){
 if(id==='game'&&p){configureWorld();updateMinimap(true)}
 previousShowScreen(id);
};
function markHit(mon){
 if(!mon||!mon.fd96||!p)return;
 const now=Date.now();
 mon.hitUntil=now+9000;
 if(mon.mood==='peaceful'){
  // Peaceful mobs defend the SAME species nearby as a pack.
  for(const other of enemies){
   if(other.fd96&&other.hp>0&&other.mood==='peaceful'&&other.group===mon.group&&
      dist(mon,other)<265){other.aggroUntil=now+10500}
  }
 }else if(mon.mood==='aggressive'){
  mon.aggroUntil=now+10500;
 }
 // Normal mobs only retaliate if you stand within their melee range:
 // they NEVER run at a player from a distance.
}
function moveToward(e,x,y,speed,seconds){
 const dx=x-e.x,dy=y-e.y,d=Math.hypot(dx,dy);
 if(d<3)return;
 const step=Math.min(d,speed*seconds);
 e.x=clamp(e.x+dx/d*step,35,WORLD.w-35);
 e.y=clamp(e.y+dy/d*step,48,WORLD.h-48);
}
function monsterTick(dt){
 if(!p||p.map==='town')return;
 aiAccumulator+=dt;
 if(aiAccumulator<120)return;
 const elapsed=Math.min(210,aiAccumulator)/1000;aiAccumulator=0;
 const now=Date.now();
 for(const m of enemies){
  if(m.hp<=0||!m.fd96)continue;
  const d=dist(m,p);
  // Only simulate detailed wandering/combat near the player; distant monsters
  // stay alive, wait in their spots, and wake when players approach.
  if(d>820)continue;
  const homeDist=Math.hypot(m.x-m.homeX,m.y-m.homeY);
  const leash=m.boss?480:365;
  if(homeDist>leash){
   m.aggroUntil=0;
   moveToward(m,m.homeX,m.homeY,m.speed,elapsed);
   continue;
  }
  const aggressive=m.mood==='aggressive';
  const peaceful=m.mood==='peaceful';
  const alerted=aggressive&&(d<=m.vision||now<m.aggroUntil)||
                peaceful&&now<m.aggroUntil;
  if(alerted){
   if(aggressive&&d<=m.vision)m.aggroUntil=now+3200;
   if(d>54)moveToward(m,p.x,p.y,m.speed,elapsed);
  }else{
   // Roam 35–110 units from the original spawn, then rest 1–4s.
   if(!m.wanderUntil){m.wanderUntil=now+600+Math.random()*1200}
   if(now>=m.wanderUntil){
    const angle=Math.random()*Math.PI*2,r=36+Math.random()*82;
    m.wanderX=clamp(m.homeX+Math.cos(angle)*r,55,WORLD.w-55);
    m.wanderY=clamp(m.homeY+Math.sin(angle)*r,60,WORLD.h-60);
    m.wanderUntil=now+2200+Math.random()*3200;
   }
   if(now<m.wanderUntil-650&&Math.hypot(m.wanderX-m.x,m.wanderY-m.y)>5)
     moveToward(m,m.wanderX,m.wanderY,m.speed*.58,elapsed);
  }
  const normalCanFight=m.mood==='normal'&&now<m.hitUntil;
  const isThreat=alerted||normalCanFight;
  if(isThreat&&d<=62&&now-m.lastAttack>=Math.max(1100,1950-(m.level||1)*7)){
   m.lastAttack=now;
   if(typeof fdMobHitsCompanion==='function'&&fdMobHitsCompanion(m))continue;
   const damage=Math.max(1,m.atk-Math.floor(defense()*.4)-(p.petShieldUntil>Date.now()?6:0));
   p.hp-=damage;
   pushCombatNumber(p.x,p.y-23,damage,'monster');
   if(p.hp<=0){
    p.hp=maxHP();p.mp=maxMP();warp('town',{respawn:true});
    toast('💤 พ่ายแพ้! กลับเมืองรุ่งอรุณแล้ว');
    break;
   }
  }
 }
 if(now-mapLastPaint>=190)updateMinimap();
}
function scheduleRespawn(dead,map){
 if(!p||!dead)return;
 const originalCharacter=p;
 const mobSpec={name:dead.name,emoji:dead.emoji,mood:dead.mood,
  level:dead.level,hp:dead.max,atk:dead.atk,xp:dead.xp,coin:dead.coin,
  color:dead.color,speed:dead.speed,vision:dead.vision};
 const x=dead.homeX||dead.x,y=dead.homeY||dead.y;
 setTimeout(()=>{
  if(p!==originalCharacter||p?.map!==map||map==='town')return;
  const z=zone(map),max=(z?.count||16)+1;
  if(enemies.length>=max)return;
  if(dead.boss){
   enemies.push(makeMob(mobSpec,x,y,true));
  }else{
   const pos=findSpawn(mobSpec,{x,y});
   enemies.push(makeMob(mobSpec,pos.x,pos.y,false));
  }
 },dead.boss?70000:3200+Math.floor(Math.random()*2000));
}
const SEED={meadow:17,ruins:31,ashlands:53};
const COLORS={
 meadow:{floor:['#648e6d','#6b9870','#759b72','#598668'],path:'#adab7b',light:'#b9c78a',dark:'#3a7055',water:'#639eaf'},
 ruins:{floor:['#687a77','#71827c','#778581','#63746e'],path:'#afaa91',light:'#b0b2a8',dark:'#53646c',water:'#6c99a5'},
 ashlands:{floor:['#755650','#80615b','#89655b','#714d4b'],path:'#c18c66',light:'#e49c62',dark:'#523e41',water:'#e26a40'}
};
function hash(x,y,seed){let a=Math.imul((x+103*seed)|0,374761393)^Math.imul((y+73*seed)|0,668265263);
 a=Math.imul(a^(a>>>13),1274126177);return ((a^(a>>>16))>>>0)/4294967295}
function createChunk(map,cx,cy){
 const z=ZONES[map],colors=COLORS[z.biome],seed=SEED[map];
 const tile=20,surface=document.createElement('canvas');
 surface.width=CHUNK;surface.height=CHUNK;
 const g=surface.getContext('2d');
 for(let yy=0;yy<CHUNK;yy+=tile){
  for(let xx=0;xx<CHUNK;xx+=tile){
   const worldX=cx*CHUNK+xx,worldY=cy*CHUNK+yy;
   if(worldX>=z.w||worldY>=z.h)continue;
   const tx=Math.floor(worldX/tile),ty=Math.floor(worldY/tile);
   const h=hash(tx,ty,seed),a=hash(tx,ty,seed+1),b=hash(tx,ty,seed+3);
   const onMainPath=Math.abs(worldY-z.h/2)<37;
   const onCrossPath=Math.abs(worldX-z.w*.48)<28;
   const onRoad=onMainPath||onCrossPath;
   let floor=colors.floor[Math.min(3,Math.floor(h*4))];
   if(onRoad)floor=colors.path;
   g.fillStyle=floor;g.fillRect(xx,yy,tile,tile);
   if(onRoad){
     g.fillStyle='#e2d4ae55';g.fillRect(xx+2,yy+13,12,2);
     if(b>.78){g.fillStyle='#806d6466';g.fillRect(xx+7,yy+5,7,2)}
     continue;
   }
   if(h>.89&&a>.42){
    const isRock=z.biome==='ruins'||(z.biome==='ashlands'&&b>.35);
    g.fillStyle=colors.dark;g.fillRect(xx+8,yy+8,9,7);
    g.fillStyle=isRock?colors.light:colors.dark;
    g.beginPath();g.arc(xx+10,yy+5,isRock?8:10,0,Math.PI*2);g.fill();
    g.fillStyle=colors.light;g.fillRect(xx+8,yy+1,4,3);
   }else if(h<.11){
    g.fillStyle=colors.light;g.fillRect(xx+3,yy+8,3,6);g.fillRect(xx+8,yy+4,4,9);
    if(a>.65){g.fillStyle=z.biome==='ashlands'?'#ffbc70':'#e9bedc';g.fillRect(xx+7,yy+3,4,4)}
   }else if(h>.67){
    g.fillStyle=colors.dark;g.fillRect(xx+14,yy+13,3,3);
    g.fillStyle=colors.light;g.fillRect(xx+4,yy+5,2,3);
   }
   if(z.biome==='ashlands'&&b>.985){
    g.fillStyle=colors.water;g.fillRect(xx+3,yy+10,13,4);
   }
  }
 }
 // Larger but cached landmarks give each environment character at low cost.
 for(let i=0;i<10;i++){
  const gx=Math.floor(hash(cx,i+cy,seed+6)*(CHUNK-46));
  const gy=Math.floor(hash(cy,i+cx,seed+9)*(CHUNK-46));
  const wx=cx*CHUNK+gx,wy=cy*CHUNK+gy;
  if(Math.abs(wy-z.h/2)<65||Math.abs(wx-z.w*.48)<55)continue;
  const variation=hash(wx,wy,seed+12);
  if(z.biome==='meadow'){
   g.fillStyle='#364f37';g.fillRect(gx+9,gy+15,8,22);
   for(const [dx,dy,r,col] of [[10,14,16,'#315f47'],[20,11,14,'#477f56'],[15,0,16,'#55936b']]){
    g.fillStyle=col;g.beginPath();g.arc(gx+dx,gy+dy,r,0,Math.PI*2);g.fill();
   }
  }else if(z.biome==='ruins'){
   g.fillStyle='#4e5758';g.fillRect(gx,gy+16,29,9);
   g.fillStyle='#b5b0a0';g.fillRect(gx+4,gy,6,23);g.fillRect(gx+18,gy+3,7,19);
   g.fillStyle='#807e78';g.fillRect(gx+2,gy-3,25,6);
  }else{
   g.fillStyle='#493d40';g.fillRect(gx+3,gy+14,30,11);
   g.fillStyle=variation>.5?'#d77246':'#e99c51';
   g.beginPath();g.moveTo(gx+4,gy+18);g.lineTo(gx+18,gy-16);g.lineTo(gx+35,gy+18);g.fill();
   g.fillStyle='#f6b270';g.fillRect(gx+12,gy+11,6,5);
  }
 }
 return surface;
}
function chunkFor(map,cx,cy){
 const key=map+':'+cx+':'+cy;
 if(terrain.has(key)){const item=terrain.get(key);terrain.delete(key);terrain.set(key,item);return item}
 const surface=createChunk(map,cx,cy);
 terrain.set(key,surface);
 while(terrain.size>CACHE_LIMIT){const oldest=terrain.keys().next().value;terrain.delete(oldest)}
 return surface;
}
function drawLandscape(map){
 if(!ZONES[map])return false;
 const z=ZONES[map],scale=view.scale||1;
 const left=clamp(Math.floor((-view.x/scale)/CHUNK),0,Math.ceil(z.w/CHUNK)-1);
 const right=clamp(Math.floor(((view.cw-view.x)/scale)/CHUNK),0,Math.ceil(z.w/CHUNK)-1);
 const top=clamp(Math.floor((-view.y/scale)/CHUNK),0,Math.ceil(z.h/CHUNK)-1);
 const bottom=clamp(Math.floor(((view.ch-view.y)/scale)/CHUNK),0,Math.ceil(z.h/CHUNK)-1);
 let created=0;
 for(let cy=top;cy<=bottom;cy++)for(let cx=left;cx<=right;cx++){
  const key=map+':'+cx+':'+cy;
  if(!terrain.has(key)&&created>=3){
   ctx.fillStyle=COLORS[z.biome].floor[0];ctx.fillRect(cx*CHUNK,cy*CHUNK,CHUNK,CHUNK);
  }else{
   if(!terrain.has(key))created++;
   ctx.drawImage(chunkFor(map,cx,cy),cx*CHUNK,cy*CHUNK);
  }
 }
 return true;
}
function drawEnemy(m){
 if(!m?.fd96)return false;
 // Preserve the detailed legacy art for familiar original species.
 if((m.name==='สไลม์'||m.name==='หมาป่า'||m.name==='ปูเวท')&&!m.boss){
   drawMonster(m);
   const mood=MOOD[m.mood]||MOOD.normal;
   textLabel(mood.symbol+' Lv.'+m.level,m.x,m.y-67,mood.color,11);
   return true;
 }
 const {x,y}=m,large=Boolean(m.boss),r=large?31:21;
 const wave=Math.sin(Date.now()/360+x)*2;
 ctx.save();
 ctx.globalAlpha=.45;
 circle(x,y+17,r+4,'#0a1926');
 ctx.globalAlpha=1;
 circle(x,y+wave,r,m.color||'#8cc6a2');
 ctx.fillStyle='#ffffff44';ctx.beginPath();ctx.arc(x-r*.35,y-r*.25,r*.29,0,Math.PI*2);ctx.fill();
 ctx.restore();
 textLabel(m.emoji||'👾',x,y+4+wave,'#fff',large?27:20);
 rect(x-r-3,y-r-21,(r+3)*2,7,'#283744');
 rect(x-r,y-r-19,r*2*clamp(m.hp/m.max,0,1),3,m.boss?'#ffbf6c':'#f17e7b');
 const mood=MOOD[m.mood]||MOOD.normal;
 const label=(large?'👑 ':'')+m.name+' · Lv.'+(m.level||1);
 textLabel(label,x,y-r-36,large?'#ffdaa4':'#fff4d7',large?13:11);
 textLabel(mood.symbol,x+r+3,y-r-17,mood.color,10);
 if(targetEnemy===m.uid){ctx.strokeStyle='#fff3a8';ctx.lineWidth=2;ctx.strokeRect(x-r-6,y-r-24,r*2+12,13)}
 if(m.boss){ctx.strokeStyle='#ffd37b';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,39,0,Math.PI*2);ctx.stroke()}
 return true;
}
function updateMinimap(force=false){
 if(!p||!mapUIOpen||!mapCanvasCtx)return;
 const now=Date.now();if(!force&&now-mapLastPaint<180)return;
 mapLastPaint=now;
 const width=mapCanvas.width,height=mapCanvas.height;
 const z=ZONES[p.map],colors=z?COLORS[z.biome]:null;
 mapCanvasCtx.fillStyle=colors?.floor?.[0]||'#4c7868';
 mapCanvasCtx.fillRect(0,0,width,height);
 mapCanvasCtx.strokeStyle='#d7e4d22b';mapCanvasCtx.lineWidth=1;
 for(let i=1;i<5;i++){
  mapCanvasCtx.beginPath();mapCanvasCtx.moveTo(width*i/5,0);mapCanvasCtx.lineTo(width*i/5,height);mapCanvasCtx.stroke();
 }
 const sx=x=>x/WORLD.w*width,sy=y=>y/WORLD.h*height;
 mapCanvasCtx.fillStyle='#94f9ff';
 for(const gate of MAP_PORTALS[p.map]||[]){mapCanvasCtx.fillRect(sx(gate.x)-2,sy(gate.y)-2,5,5)}
 mapCanvasCtx.fillStyle='#f29f8a';
 for(const mob of enemies){if(mob.hp<=0)continue;
   mapCanvasCtx.fillStyle=mob.boss?'#ffe08c':mob.mood==='aggressive'?'#ee7d75':mob.mood==='peaceful'?'#8adcb6':'#c4cbd2';
   mapCanvasCtx.fillRect(sx(mob.x)-1,sy(mob.y)-1,mob.boss?5:2,mob.boss?5:2);
 }
 mapCanvasCtx.fillStyle='#fefbf0';
 mapCanvasCtx.beginPath();mapCanvasCtx.arc(sx(p.x),sy(p.y),4,0,Math.PI*2);mapCanvasCtx.fill();
 mapCanvasCtx.strokeStyle='#283b47';mapCanvasCtx.stroke();
 const state=document.getElementById('fd96ZoneText');
 if(state)state.textContent=(MAPS[p.map]?.name||p.map)+' · '+Math.round(p.x)+','+Math.round(p.y);
}
function setupMinimap(){
 const wrap=$('worldWrap');
 if(!wrap)return;
 const style=document.createElement('style');
 style.textContent='#fd96MapToggle{position:absolute;left:10px;top:54px;z-index:6;min-height:33px;'+
  'border:1px solid #8bb7b3;border-radius:9px;background:#10384ce3;color:#effff8;padding:6px 10px;font-size:12px}'+
  '#fd96MiniPanel{position:absolute;left:10px;top:95px;z-index:6;width:205px;max-width:72vw;'+
  'padding:9px;border:1px solid #8bb7b3;border-radius:11px;background:#102a39ee;box-shadow:0 4px 16px #0008;'+
  'color:#fff;font-size:11px}#fd96MiniPanel canvas{width:100%;height:auto;border-radius:6px;image-rendering:pixelated}'+
  '#fd96MiniPanel .fd96Hint{font-size:10px;line-height:1.45;margin-top:4px;color:#e2e5d1}';
 document.head.appendChild(style);
 const button=document.createElement('button');
 button.id='fd96MapToggle';button.type='button';button.textContent='🧭 แผนที่';button.setAttribute('aria-expanded','false');
 const panel=document.createElement('div');panel.id='fd96MiniPanel';panel.classList.add('hide');
 panel.innerHTML='<b>🧭 แผนที่ย่อ</b><div id="fd96ZoneText" style="margin-bottom:4px"></div>'+
 '<canvas id="fd96MiniCanvas" width="182" height="110"></canvas>'+
 '<div class="fd96Hint">⚪ ปกติ: ไม่ไล่ · 🟢 รักสงบ: เพื่อนมาช่วยเมื่อถูกตี · 🔴 ดุร้าย: ไล่โจมตีเอง<br>💠 ตัวเรา · สีฟ้า = ประตูไปแผนที่อื่น</div>';
 wrap.appendChild(button);wrap.appendChild(panel);
 mapCanvas=panel.querySelector('canvas');mapCanvasCtx=mapCanvas.getContext('2d');
 button.addEventListener('click',()=>{
  mapUIOpen=panel.classList.toggle('hide')===false;
  button.setAttribute('aria-expanded',String(mapUIOpen));
  if(mapUIOpen)updateMinimap(true);
 });
}
setupMinimap();
window.fd96DrawLandscape=drawLandscape;
window.fd96DrawEnemy=drawEnemy;
window.fd96MonstersTick=monsterTick;
window.fd96MarkMonsterHit=markHit;
window.fd96ScheduleRespawn=scheduleRespawn;
// Exposed helpers for regression tests and future maps, not account/server APIs.
window.fd96ZoneInfo=key=>ZONES[key]||null;
window.fd96MonsterMood=m=>MOOD[m]?.label||'ไม่ระบุ';
window.fd96ConfigureWorld=configureWorld;
window.fd96MakeMob=makeMob;
})();