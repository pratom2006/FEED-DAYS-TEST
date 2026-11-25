'use strict';
/* FEED DAYS v0.8 — local playable adventure systems. No multiplayer authority.
   All timers persist as absolute timestamps in the character's existing local save. */
const FD_PET_COOLDOWN=10*60*1000,FD_BREED_COOLDOWN=5*60*60*1000;
const FD_SKILLS={
 slash:{name:'ฟันสายลม',type:'โจมตี',icon:'⚔️',mp:13,cd:650,range:125,power:1.4},
 fire:{name:'ลูกไฟน้อย',type:'เวทโจมตี',icon:'🔥',mp:11,cd:850,range:175,power:1.25},
 ice:{name:'เข็มน้ำแข็ง',type:'เวทโจมตี',icon:'❄️',mp:13,cd:1000,range:180,power:1.4},
 thunder:{name:'ประกายอัสนี',type:'เวทโจมตี',icon:'⚡',mp:17,cd:1250,range:190,power:1.7},
 wind:{name:'พายุหมุน',type:'โจมตีหมู่',icon:'🌪️',mp:22,cd:2100,range:145,power:1.06,aoe:true},
 heal:{name:'แสงเยียวยา',type:'รักษา',icon:'💚',mp:14,cd:1700,power:1},
 guard:{name:'เกราะพลัง',type:'บัฟ',icon:'🛡️',mp:16,cd:5500,power:1},
 poison:{name:'ละอองพิษ',type:'เวทโจมตี',icon:'☠️',mp:16,cd:1600,range:170,power:1.5},
 roar:{name:'คำรามราชัน',type:'โจมตีหมู่',icon:'🐺',mp:21,cd:2100,range:140,power:1.35,aoe:true},
 wave:{name:'คลื่นสมุทร',type:'โจมตีหมู่',icon:'🌊',mp:20,cd:1900,range:150,power:1.15,aoe:true}
};
const FD_SPECIES={
 wolf:{name:'หมาป่า',icon:'🐺',rideable:true,genes:{STR:7,VIT:5,AGI:7,INT:3},skills:['bite','buff'],element:'wolf'},
 fox:{name:'จิ้งจอกเวท',icon:'🦊',rideable:false,genes:{STR:4,VIT:4,AGI:7,INT:8},skills:['magic','heal'],element:'fox'},
 horse:{name:'ม้าผจญภัย',icon:'🐎',rideable:true,genes:{STR:4,VIT:8,AGI:9,INT:3},skills:['kick','buff'],element:'horse'},
 dragon:{name:'ลูกมังกร',icon:'🐉',rideable:true,genes:{STR:9,VIT:8,AGI:5,INT:9},skills:['fire','buff'],element:'dragon'},
 slime:{name:'สไลม์',icon:'🟢',rideable:false,genes:{STR:3,VIT:7,AGI:3,INT:5},skills:['magic','heal'],element:'slime'},
 crab:{name:'ปูเวท',icon:'🦀',rideable:false,genes:{STR:6,VIT:8,AGI:3,INT:6},skills:['bite','buff'],element:'crab'},
 hybrid:{name:'สัตว์สายเลือดผสม',icon:'🧬',rideable:true,genes:{STR:6,VIT:6,AGI:6,INT:6},skills:['bite','buff'],element:'hybrid'}
};
const FD_PET_GEAR=[
 {name:'เขี้ยวพิทักษ์',icon:'🗡️',type:'gear',slot:'petWeapon',atk:13,def:1,price:220,petOnly:true,desc:'อาวุธเฉพาะสัตว์ · ATK สูงกว่าอุปกรณ์ทั่วไป'},
 {name:'เกราะอสูร',icon:'🛡️',type:'gear',slot:'petArmor',atk:1,def:14,price:230,petOnly:true,desc:'เกราะเฉพาะสัตว์ · DEF สูงกว่าอุปกรณ์ทั่วไป'},
 {name:'ลูกแก้วจิตวิญญาณ',icon:'🔮',type:'gear',slot:'petOrb',atk:7,def:7,price:275,petOnly:true,desc:'ลูกแก้วเพิ่มพลังสกิลสัตว์'}
];
const FD_SCROLL_IDS=Object.keys(FD_SKILLS);
let fdSkillSelect=0,fdPetTab='team',fdPetIndex=0,fdLastTick=0,fdLastPetSave=0;
function fdMakeScroll(id){const sk=FD_SKILLS[id]||FD_SKILLS.slash;return {type:'skillScroll',name:'คัมภีร์'+sk.name,icon:'📜',skill:id,desc:'ประเภท: '+sk.type+' · ต้องใช้คัมภีร์เพื่อเรียนรู้'};}
function fdInit(){
 if(!p)return;
 if(!p.skills||typeof p.skills!=='object')p.skills={};
 if(!p.skillExp||typeof p.skillExp!=='object')p.skillExp={};
 if(!Array.isArray(p.skillSlots))p.skillSlots=Object.keys(p.skills).filter(k=>FD_SKILLS[k]).slice(0,6);
 p.skillSlots=Array.from({length:6},(_,i)=>p.skillSlots[i]||null);
 if(!p.skillTimes||typeof p.skillTimes!=='object')p.skillTimes={};
 if(!Array.isArray(p.companions))p.companions=[];
 if(!Array.isArray(p.activePets))p.activePets=[];
 p.activePets=p.activePets.filter(id=>p.companions.some(c=>c.id===id)).slice(0,2);
 if(!p.activeMount||!p.companions.some(c=>c.id===p.activeMount))p.activeMount=null;
 if(p.mountMode!=='manual')p.mountMode='auto';
 if(typeof p.riding!=='boolean')p.riding=false;
 if(!Number.isFinite(p.petBuffUntil))p.petBuffUntil=0;
 if(!Number.isFinite(p.petShieldUntil))p.petShieldUntil=0;
 for(const c of p.companions){
   c.bag=Array.isArray(c.bag)?c.bag:[];
   c.equip=c.equip&&typeof c.equip==='object'?c.equip:{};
   for(const key of ['weapon','armor','orb'])if(!c.equip.hasOwnProperty(key))c.equip[key]=null;
   c.skills=Array.isArray(c.skills)?c.skills:['bite'];
   c.genes=c.genes||{...FD_SPECIES[c.species]?.genes||FD_SPECIES.wolf.genes};
   c.hpThreshold=Number.isFinite(c.hpThreshold)?clamp(c.hpThreshold,0,100):40;
   c.mpThreshold=Number.isFinite(c.mpThreshold)?clamp(c.mpThreshold,0,100):30;
   c.autoHP=c.autoHP!==false;c.autoMP=c.autoMP!==false;
   c.breedReadyAt=Number.isFinite(c.breedReadyAt)?c.breedReadyAt:0;
   c.knockedUntil=Number.isFinite(c.knockedUntil)?c.knockedUntil:0;
   if(!Number.isFinite(c.evolution))c.evolution=0;
   if(!Number.isFinite(c.xp))c.xp=0;
   if(!Number.isFinite(c.level))c.level=1;
   if(!Number.isFinite(c.sp))c.sp=0;
   if(!Number.isFinite(c.rarity))c.rarity=1;
   if(!Number.isFinite(c.hp))c.hp=fdPetMaxHP(c);
   if(!Number.isFinite(c.mp))c.mp=fdPetMaxMP(c);
 }
}
function fdCreatePet(species='wolf',opts={}){
 const base=FD_SPECIES[species]||FD_SPECIES.hybrid;
 const genes={};
 for(const stat of ['STR','VIT','AGI','INT'])genes[stat]=clamp((opts.genes?.[stat]??base.genes[stat]),1,40);
 const c={id:guid(),species, name:opts.name||base.name,icon:opts.icon||base.icon,rarity:opts.rarity||1,generation:opts.generation||1,
  lineage:opts.lineage||[],genes,level:1,xp:0,sp:0,evolution:0,skills:[...(opts.skills||base.skills)],bag:[],equip:{weapon:null,armor:null,orb:null},
  hp:0,mp:0,autoHP:true,autoMP:true,hpThreshold:40,mpThreshold:30,knockedUntil:0,breedReadyAt:0,lastAttack:0,sex:Math.random()<.5?'male':'female'};
 c.hp=fdPetMaxHP(c);c.mp=fdPetMaxMP(c);return c;
}
function fdPetGear(c,key){return c?.bag?.find(it=>it.uid===c.equip?.[key])||null}
function fdPetMaxHP(c){return 75+c.level*13+c.genes.VIT*10+(c.rarity-1)*12+c.evolution*14+(fdPetGear(c,'armor')?.def||0)*3+(fdPetGear(c,'armor')?.enh||0)*9}
function fdPetMaxMP(c){return 40+c.level*6+c.genes.INT*6+c.evolution*5+(fdPetGear(c,'orb')?.enh||0)*6}
function fdPetPower(c){const w=fdPetGear(c,'weapon'),orb=fdPetGear(c,'orb');return 4+c.level*1.5+c.genes.STR*2+(c.rarity-1)*2+c.evolution*3+(w?.atk||0)+(w?.enh||0)*3+(orb?.atk||0)+(orb?.enh||0)*2}
function fdPetDefense(c){const a=fdPetGear(c,'armor');return c.genes.VIT*.75+c.evolution*1.5+(a?.def||0)+(a?.enh||0)*2}
function fdReady(c){return c&&(!c.knockedUntil||c.knockedUntil<=Date.now())&&c.hp>0}
function fdPetById(id){return p?.companions?.find(c=>c.id===id)||null}
function fdActivePets(){return (p?.activePets||[]).map(fdPetById).filter(fdReady)}
function fdActiveMount(){const c=fdPetById(p?.activeMount);return fdReady(c)?c:null}
function fdAllActive(){const all=fdActivePets(),mount=fdActiveMount();if(mount&&!all.includes(mount))all.push(mount);return all}
function fdRemaining(until){let secs=Math.max(0,Math.ceil(((until||0)-Date.now())/1000));return String(Math.floor(secs/3600)).padStart(2,'0')+':'+String(Math.floor((secs%3600)/60)).padStart(2,'0')+':'+String(secs%60).padStart(2,'0')}
function fdWakePets(){
 if(!p)return;
 let changed=false;
 for(const c of p.companions){
   if(c.knockedUntil&&c.knockedUntil<=Date.now()){
     c.knockedUntil=0;c.hp=Math.max(1,Math.ceil(fdPetMaxHP(c)*.6));c.mp=Math.ceil(fdPetMaxMP(c)*.6);changed=true;
   }
 }
 if(changed){save();toast('🐾 สัตว์เลี้ยงพักฟื้นเรียบร้อยแล้ว')}
}
function fdStarterPets(){
 fdInit();
 if(p.starterPetsClaimed)return toast('รับคู่หูเริ่มต้นไปแล้ว');
 for(const id of ['wolf','fox','horse']){
   const c=fdCreatePet(id);c.bag.push(makeItem(SHOP[6],5),makeItem(SHOP[7],5));
   p.companions.push(c);
   if(id==='horse')p.activeMount=c.id;else p.activePets.push(c.id);
 }
 p.activePets=p.activePets.slice(0,2);p.starterPetsClaimed=true;save();fdShowPet();
 toast('ได้รับหมาป่า จิ้งจอก และม้าผจญภัย! 🐾');
}
function fdUseScroll(index){
 fdInit();const it=p.items[index];if(!it||it.type!=='skillScroll')return;
 const id=it.skill||'slash',sk=FD_SKILLS[id];
 if(!sk)return toast('คัมภีร์นี้ยังไม่มีข้อมูลสกิล');
 const known=Number(p.skills[id])>0;
 consume(p.items,index,1);
 if(!known){
   p.skills[id]=1;p.skillExp[id]=0;
   const free=p.skillSlots.findIndex(x=>!x);
   if(free>=0)p.skillSlots[free]=id;
   toast('✨ ค้นพบสกิล '+sk.name+'! Lv.1');
 }else{
   fdGainSkillExp(id,45+Math.ceil(p.skills[id]*2));
   toast('📜 คัมภีร์ซ้ำ! เพิ่ม EXP '+sk.name);
 }
 save();fdUpdateHotbar();selectedItem=-1;showBag();
}
function fdSkillNeed(lvl){return Math.max(15,Math.floor(22+lvl*8+Math.pow(lvl,1.26)*2))}
function fdGainSkillExp(id,amount){
 if(!p||!p.skills[id])return;
 p.skillExp[id]=(p.skillExp[id]||0)+amount;
 let leveled=false;let count=0;
 while(p.skillExp[id]>=fdSkillNeed(p.skills[id])&&count++<100){
   p.skillExp[id]-=fdSkillNeed(p.skills[id]);p.skills[id]++;leveled=true;
 }
 if(leveled)toast('🌟 '+FD_SKILLS[id].name+' ขั้น '+p.skills[id]+'!');
}
function fdCastSkill(id,silent=false){
 fdInit();const sk=FD_SKILLS[id];
 if(!p||!sk||!p.skills[id]||gamePaused||ui)return false;
 const now=Date.now(),lvl=p.skills[id],cost=sk.mp+Math.floor(lvl/8);
 if(now<(p.skillTimes[id]||0))return false;
 if(p.mp<cost){if(!silent)toast('MP ไม่พอสำหรับ '+sk.name);return false}
 const isSupport=sk.type==='รักษา'||sk.type==='บัฟ';
 if(!isSupport&&p.map==='town'){if(!silent)toast('ใช้โจมตีได้ในแผนที่มอนสเตอร์');return false}
 let targets=[];
 if(!isSupport){
   const close=enemies.filter(e=>e.hp>0&&dist(e,p)<sk.range).sort((a,b)=>dist(a,p)-dist(b,p));
   if(!close.length){if(!silent)toast('ไม่มีศัตรูในระยะ '+sk.name);return false}
   targets=sk.aoe?close.slice(0,4):[close.find(e=>e.uid===targetEnemy)||close[0]];
 }
 p.mp-=cost;p.skillTimes[id]=now+sk.cd;
 if(isSupport&&typeof window.fdCombatVfx==='function')window.fdCombatVfx(id,p.x,p.y,p.x,p.y);
 if(sk.type==='รักษา'){
   const heal=Math.round(30+lvl*1.5+p.stats.INT*2.5);
   p.hp=Math.min(maxHP(),p.hp+heal);
   pushCombatNumber(p.x,p.y-30,heal,'heal');
 }else if(sk.type==='บัฟ'){
   p.petBuffUntil=now+Math.min(30000,12000+lvl*100);
   p.petShieldUntil=now+Math.min(30000,12000+lvl*100);
   effects.push({x:p.x,y:p.y-32,text:'🛡️ บัฟ',life:850,max:850,color:'#8ee8fb'});
 }else{
   for(const t of targets){
     let dmg=Math.max(1,Math.round((attackPower()*.35+p.stats.INT*1.7+10+lvl*2.8)*sk.power+(sk.type.includes('เวท')&&typeof fd95MagicBonus==='function'?fd95MagicBonus():0)));
     t.hp-=dmg;if(typeof window.fd96MarkMonsterHit==='function')window.fd96MarkMonsterHit(t);pushCombatNumber(t.x,t.y-26,dmg,sk.type.includes('เวท')?'magic':'physical');
     if(typeof window.fdCombatVfx!=='function'||!window.fdCombatVfx(id,p.x,p.y,t.x,t.y))effects.push({kind:'swing',x:t.x,y:t.y,life:290,max:290,color:'#8ae2ff'});
     if(t.hp<=0)killEnemy(t);
   }
 }
 fdGainSkillExp(id,isSupport?3:4+targets.length);
 refreshHUD();return true;
}
function fdAssignSkill(id,slot){fdInit();if(!p.skills[id])return;for(let i=0;i<6;i++)if(p.skillSlots[i]===id)p.skillSlots[i]=null;p.skillSlots[slot]=id;save();fdUpdateHotbar();fdShowSkills();}
function fdShowSkills(){
 fdInit();const known=Object.keys(p.skills).filter(k=>FD_SKILLS[k]&&p.skills[k]>0);
 const bar=Array.from({length:6},(_,i)=>{const id=p.skillSlots[i],sk=FD_SKILLS[id];return `<button class="fd-slot ${fdSkillSelect===i?'fd-chosen':''}" data-choose="${i}">${sk?sk.icon:'＋'}<small>ช่อง ${i+1}</small></button>`}).join('');
 const rows=known.map(id=>{
   const sk=FD_SKILLS[id],lvl=p.skills[id],xp=p.skillExp[id]||0,need=fdSkillNeed(lvl);
   return `<div class="section fd-row"><div class="line space"><b>${sk.icon} ${esc(sk.name)} · ขั้น ${lvl}</b><span>${esc(sk.type)}</span></div><div class="dim tiny">EXP ${Math.floor(xp)}/${need} · MP ${sk.mp+Math.floor(lvl/8)}</div><div class="fd-bar"><span style="width:${clamp(xp/need*100,0,100)}%"></span></div><button class="button gold sm" data-skill="${id}">ใส่ช่อง ${fdSkillSelect+1}</button></div>`;
 }).join('');
 openModal('📜 สกิล',`<div class="stack"><div class="notice">คัมภีร์ที่ยังไม่ได้ใช้จะไม่ปรากฏที่นี่ · เรียนสกิลได้ไม่จำกัด · เปลี่ยนช่องได้ทุกเวลา รวมถึงระหว่างการต่อสู้ · คูลดาวน์ติดตามแต่ละสกิล</div><div class="fd-hot-choose">${bar}</div><div class="line space"><b>คลังสกิลที่ค้นพบ ${known.length}</b><button id="fdClearSlot" class="button sm ghost">ล้างช่อง ${fdSkillSelect+1}</button></div>${rows||'<div class="notice">ยังไม่ได้เรียนสกิล เปิดกระเป๋าและกดใช้คัมภีร์ก่อนครับ!</div>'}</div>`);
 $('modalBody').querySelectorAll('[data-choose]').forEach(b=>b.onclick=()=>{fdSkillSelect=Number(b.dataset.choose);fdShowSkills()});
 $('modalBody').querySelectorAll('[data-skill]').forEach(b=>b.onclick=()=>fdAssignSkill(b.dataset.skill,fdSkillSelect));
 $('fdClearSlot').onclick=()=>{p.skillSlots[fdSkillSelect]=null;save();fdUpdateHotbar();fdShowSkills()};
}
showSkills=fdShowSkills;
function fdUpdateHotbar(){
 const bar=$('fdHotbar');if(!bar)return;
 if(!p){bar.innerHTML='';return}
 fdInit();
 bar.innerHTML=p.skillSlots.map((id,i)=>{
   const sk=FD_SKILLS[id];
   return `<button type="button" class="fd-hot-btn" data-hot="${i}" aria-label="สกิลช่อง ${i+1}" title="${sk?esc(sk.name):'เลือกสกิลในเมนู 📜'}">${sk?sk.icon:'＋'}<small>${i+1}</small></button>`;
 }).join('');
 bar.querySelectorAll('[data-hot]').forEach(el=>el.addEventListener('pointerdown',e=>{
   e.preventDefault();if(!p)return;
   const id=p.skillSlots[Number(el.dataset.hot)];
   if(id)fdCastSkill(id);else fdShowSkills();
 }));
 const mb=$('fdMountSkill');if(mb)mb.classList.toggle('hide',!fdActiveMount()||p.mountMode!=='manual');
}
function fdDropLoot(mon){
 fdInit();if(!p)return;
 for(const pet of fdAllActive())fdPetGainExp(pet,Math.max(2,Math.round((mon.xp||25)*.65)));
 if(Math.random()<(mon.boss?.85:.22)){
   const themed={left:['slash','fire','heal'],right:['roar','thunder','wind'],bottom:['wave','ice','guard']}[p.map]||['slash'];
   const id=Math.random()<.6?themed[rand(0,themed.length-1)]:FD_SCROLL_IDS[rand(0,FD_SCROLL_IDS.length-1)];
   if(addItem(p.items,fdMakeScroll(id),1,80))toast('📜 ได้รับคัมภีร์'+FD_SKILLS[id].name+'!');
 }
 if(mon.boss||Math.random()<.09){
   const species=mon.boss?({left:'slime',right:'wolf',bottom:'crab'}[p.map]||'wolf'):(['wolf','fox','horse','slime','crab'][rand(0,4)]);
   const egg={type:'petEgg',species,name:'ไข่สัตว์: '+FD_SPECIES[species].name,icon:'🥚',desc:'ใช้เพื่อฟักเป็นคู่หูใหม่'};
   if(addItem(p.items,egg,1,80))toast('🥚 พบไข่สัตว์!');
 }
 if(Math.random()<(mon.boss?.55:.08))addItem(p.items,FD_PET_GEAR[rand(0,2)],1,80);
}
/* Timed hatchery: one persistent job per character, absolute device timestamp. */
const FD_HATCH_FEEDS={hatchFood:{minutes:5,label:'อาหารสัตว์'},hatchTea:{minutes:3,label:'ชาบำรุงไข่'}};
const FD_HATCH_TITLE='🥚 ห้องฟักไข่';
function fdHatchQty(item){return item?Number(item.qty??1):0}
function fdHatchDuration(egg,feed){
 const spec=FD_HATCH_FEEDS[feed?.type];
 return spec?spec.minutes*60000*((egg?.rarity||1)>=4?2:1):0;
}
function fdHatchStart(eggUid,feedUid,now=Date.now()){
 if(!p)return {error:'ยังไม่ได้เลือกตัวละคร'};
 if(p.hatchJob)return {error:'มีไข่ในตู้ฟักอยู่แล้ว'};
 const egg=p.items.find(x=>x.uid===eggUid&&x.type==='petEgg');
 const feed=p.items.find(x=>x.uid===feedUid&&Object.prototype.hasOwnProperty.call(FD_HATCH_FEEDS,x.type));
 if(fdHatchQty(egg)<1)return {error:'กรุณาเลือกไข่ที่อยู่ในกระเป๋า'};
 if(fdHatchQty(feed)<1)return {error:'กรุณาใส่อาหารหรือชา 1 ชิ้น'};
 const duration=fdHatchDuration(egg,feed);
 if(!duration)return {error:'อาหารไม่ถูกต้อง'};
 const job={id:guid(),species:FD_SPECIES[egg.species]?egg.species:'wolf',eggName:egg.name,eggRarity:egg.rarity||1,
  feedType:feed.type,feedName:feed.name,startedAt:now,readyAt:now+duration,petRarity:Math.random()<.08?2:1};
 // Resolve each UID again after removal so index shifts cannot consume the wrong item.
 consume(p.items,p.items.findIndex(x=>x.uid===eggUid),1);
 consume(p.items,p.items.findIndex(x=>x.uid===feedUid),1);
 p.hatchJob=job;save();return {job};
}
function fdHatchClaim(now=Date.now()){
 if(!p?.hatchJob)return {error:'ไม่มีไข่ในตู้ฟัก'};
 const job=p.hatchJob;
 if(now<job.readyAt)return {error:'ไข่ยังฟักไม่เสร็จ'};
 const pet=fdCreatePet(job.species,{rarity:job.petRarity});
 p.companions.push(pet);p.hatchJob=null;save();return {pet};
}
function fdHatch(index){
 if(!p)return;
 fdInit();
 fdShowHatch(p.items[index]?.type==='petEgg'?p.items[index].uid:'');
}
function fdShowHatch(eggUid='',feedUid=''){
 if(!p)return;
 fdInit();const owner=p,job=p.hatchJob;
 const eggs=p.items.filter(x=>x.type==='petEgg'&&fdHatchQty(x)>0);
 const feeds=p.items.filter(x=>Object.prototype.hasOwnProperty.call(FD_HATCH_FEEDS,x.type)&&fdHatchQty(x)>0);
 if(!eggs.some(x=>x.uid===eggUid))eggUid='';
 if(!feeds.some(x=>x.uid===feedUid))feedUid='';
 const opts=(items,chosen,label)=>'<option value="">'+label+'</option>'+items.map(it=>'<option value="'+esc(it.uid)+'" '+(it.uid===chosen?'selected':'')+'>'+esc(it.icon||'')+' '+esc(itemName(it))+' ×'+fdHatchQty(it)+'</option>').join('');
 let body='<div id="fdHatchPanel" class="stack"><div style="text-align:center;font-size:56px;line-height:1.1">🥚</div>';
 if(job){
   body+='<div class="section stack" style="text-align:center"><b>'+esc(job.eggName)+'</b><div class="dim tiny">ใช้ '+esc(job.feedName)+'</div><b id="fdHatchClock">--:--:--</b><div class="fd-bar"><span id="fdHatchProgress" style="width:0%"></span></div><div class="dim tiny" id="fdHatchStatus">กำลังฟักไข่</div></div>'+
   '<button class="button gold full" id="fdHatchClaim" disabled>🐣 รับสัตว์ที่ฟักแล้ว</button><div class="notice">ปิดหน้าต่างหรือออกเกมได้ เวลาอ้างอิงจากเวลาบนอุปกรณ์ · กลับมารับสัตว์เมื่อครบเวลา</div>';
 }else{
   body+='<div class="section stack"><label>ช่องไข่สัตว์<select class="input" id="fdHatchEggSelect">'+opts(eggs,eggUid,'เลือกไข่ 1 ฟอง')+'</select></label>'+
   '<label>ช่องอาหารหรือชา<select class="input" id="fdHatchFeedSelect">'+opts(feeds,feedUid,'เลือกอาหารหรือชา 1 ชิ้น')+'</select></label>'+
   '<div class="notice" id="fdHatchEstimate"></div><button class="button gold full" id="fdHatchStart" disabled>เริ่มฟักไข่</button></div>'+
   '<div class="tiny dim">ซื้ออาหารสัตว์ 25 เหรียญ หรือชาบำรุงไข่ 50 เหรียญ ที่ NPC ร้านค้า · ฟักได้ครั้งละ 1 ฟอง · ใช้ไข่และอาหาร/ชาอย่างละ 1 ชิ้นเมื่อเริ่มฟัก</div>';
   if(!eggs.length)body+='<div class="notice">ไม่มีไข่สัตว์ในกระเป๋าตัวละคร</div>';
   if(!feeds.length)body+='<div class="notice">ไม่มีอาหารหรือชาสำหรับฟักไข่ กรุณาซื้อจากร้านค้า</div>';
 }
 body+='<button class="button ghost" id="fdHatchBack">กลับหน้าสัตว์เลี้ยง</button></div>';
 openModal(FD_HATCH_TITLE,body);
 $('fdHatchBack').onclick=()=>{closeModal();fdPetTab='team';fdShowPet()};
 if(job){
   $('fdHatchClaim').onclick=()=>{
     if(p!==owner)return;
     const result=fdHatchClaim();if(result.error)return toast(result.error);
     fdPetIndex=p.companions.length-1;fdPetTab='team';closeModal();fdShowPet();toast('🐣 ฟักไข่ได้ '+result.pet.name+'!');
   };
   fdHatchUpdateClock();
 }else{
   const eggSelect=$('fdHatchEggSelect'),feedSelect=$('fdHatchFeedSelect');
   const update=()=>{
     const egg=p.items.find(it=>it.uid===eggSelect.value&&it.type==='petEgg');
     const feed=p.items.find(it=>it.uid===feedSelect.value);
     const duration=fdHatchDuration(egg,feed);
     $('fdHatchEstimate').textContent=egg&&duration?'เวลาฟัก '+duration/60000+' นาที · ใช้ไข่ 1 ฟอง + '+feed.name+' 1 ชิ้น':'เลือกไข่และอาหารหรือชาก่อนเริ่มฟัก';
     $('fdHatchStart').disabled=!(fdHatchQty(egg)>=1&&fdHatchQty(feed)>=1&&duration>0);
   };
   eggSelect.onchange=feedSelect.onchange=update;update();
   $('fdHatchStart').onclick=()=>{
     if(p!==owner)return;
     const result=fdHatchStart(eggSelect.value,feedSelect.value);if(result.error)return toast(result.error);
     if(typeof window.fdHatchRefreshBag==='function')window.fdHatchRefreshBag();
     fdShowHatch();toast('🥚 เริ่มฟักไข่แล้ว');
   };
 }
}
function fdHatchUpdateClock(){
 if(!p||ui!==FD_HATCH_TITLE||!p.hatchJob||!$('fdHatchClock'))return;
 const job=p.hatchJob,now=Date.now(),ready=now>=job.readyAt;
 const progress=clamp((now-job.startedAt)/Math.max(1,job.readyAt-job.startedAt),0,1);
 $('fdHatchClock').textContent=ready?'ฟักเสร็จแล้ว!':fdRemaining(job.readyAt);
 $('fdHatchProgress').style.width=(progress*100)+'%';
 $('fdHatchStatus').textContent=ready?'พร้อมรับสัตว์เลี้ยง':'กำลังฟักไข่ · '+Math.floor(progress*100)+'%';
 $('fdHatchClaim').disabled=!ready;
}
setInterval(fdHatchUpdateClock,1000);
function fdPetGainExp(c,amount){
 if(!c||!fdReady(c))return;
 c.xp+=amount;let up=0;
 while(c.xp>=Math.ceil(25*Math.pow(c.level,1.3))&&up++<10){
   const req=Math.ceil(25*Math.pow(c.level,1.3));c.xp-=req;c.level++;c.sp=(c.sp||0)+4;
   c.hp=fdPetMaxHP(c);c.mp=fdPetMaxMP(c);
 }
}
function fdPetAutoPotion(c){
 for(const [kind,enabled,threshold] of [['potionHP',c.autoHP,c.hpThreshold],['potionMP',c.autoMP,c.mpThreshold]]){
   if(!enabled)continue;
   const max=kind==='potionHP'?fdPetMaxHP(c):fdPetMaxMP(c),val=kind==='potionHP'?c.hp:c.mp;
   if(val>=max||val/max*100>threshold)continue;
   const i=c.bag.findIndex(it=>it.type===kind);
   if(i<0)continue;
   if(kind==='potionHP')c.hp=Math.min(max,c.hp+50);else c.mp=Math.min(max,c.mp+30);
   consume(c.bag,i,1);
 }
}
/* v0.9.7: transient companion movement; never stored in character saves. */
const FD_HUNT_RANGE=340,FD_LEASH_RANGE=380,FD_MELEE_RANGE=44;
const fdCompanionMotion=new Map(),fdCompanionHits=new WeakMap();
let fdMotionOwner=null,fdMotionMap=null;
function fdFollowPoint(c){
 const mount=p.activeMount===c.id,index=p.activePets.indexOf(c.id);
 return {x:clamp(p.x+(mount?0:index===0?-52:52),25,WORLD.w-25),
 y:clamp(p.y+(mount?65:38),38,WORLD.h-36)};
}
function fdMotion(c){
 if(fdMotionOwner!==p||fdMotionMap!==p.map){
   fdCompanionMotion.clear();fdMotionOwner=p;fdMotionMap=p.map;
 }
 let a=fdCompanionMotion.get(c);
 const point=fdFollowPoint(c);
 if(!a){a={...point,foe:null,returning:false,manual:false,moving:false,mounted:false};fdCompanionMotion.set(c,a)}
 const mounted=p.activeMount===c.id&&p.riding;
 if(mounted){Object.assign(a,{x:p.x,y:p.y+36,foe:null,manual:false,returning:false,moving:false,mounted:true})}
 else if(a.mounted||dist(a,p)>FD_LEASH_RANGE+180){
   Object.assign(a,{...point,foe:null,manual:false,returning:false,moving:false,mounted:false});
 }
 return a;
}
function fdCompanionPosition(c){return fdMotion(c)}
function fdMoveCompanion(a,goal,speed,dt,stop=0){
 const d=dist(a,goal),travel=Math.min(Math.max(0,d-stop),speed*Math.min(100,Math.max(0,dt))/1000);
 a.moving=travel>.05;
 if(travel>0){
   a.x=clamp(a.x+(goal.x-a.x)/d*travel,25,WORLD.w-25);
   a.y=clamp(a.y+(goal.y-a.y)/d*travel,38,WORLD.h-36);
 }
}
function fdNearestFoe(range,origin=p){
 let best=null,bestD=Infinity;
 for(const e of enemies){
   if(e.hp<=0||dist(e,p)>range)continue;
   const d=dist(e,origin);if(d<bestD){best=e;bestD=d}
 }
 return best;
}
function fdLootPriority(c){
 return c.lootEnabled&&c.lootMode==='loot'&&c.skills.includes('treasure')&&
 p.groundLoot?.some(g=>g.map===p.map&&g.expiresAt>Date.now()&&
 dist(g,p)<=95&&((g.owner===accountId)||Date.now()>=g.publicAt)&&
 (g.item.rarity||1)>=(c.lootRarity||1)&&c.lootTypes?.includes(
 g.item.type==='skillScroll'?'คัมภีร์':g.item.type==='petEgg'?'ไข่สัตว์':
 g.item.type==='gear'?(g.item.slot||'').startsWith('pet')?'อุปกรณ์สัตว์':'อาวุธ/เกราะ':
 ['material','enhCrystal','starCrystal'].includes(g.item.type)?'วัสดุ':
 ['potionHP','potionMP'].includes(g.item.type)?'ยา HP/MP':'อื่น ๆ'));
}
function fdCompanionStrike(c,foe,damage,kind){
 foe.hp-=damage;
 fdCompanionHits.set(foe,{c,owner:p,map:p.map,until:Date.now()+9000});
 if(typeof window.fd96MarkMonsterHit==='function')window.fd96MarkMonsterHit(foe);
 pushCombatNumber(foe.x,foe.y-25,damage,kind,c.icon||'🐾');
 effects.push({kind:'swing',x:foe.x,y:foe.y,life:220,max:220,color:'#79e8d4'});
 if(foe.hp<=0)killEnemy(foe);
}
function fdCompanionThreat(mob){
 const hit=fdCompanionHits.get(mob);
 if(!hit||hit.owner!==p||hit.map!==p.map||hit.until<Date.now()||!fdAllActive().includes(hit.c))return null;
 return dist(mob,fdCompanionPosition(hit.c))<=62?hit.c:null;
}
function fdTickPets(dt){
 if(!p)return;
 fdWakePets();const active=fdAllActive();
 if(fdMotionOwner!==p||fdMotionMap!==p.map){fdCompanionMotion.clear();fdMotionOwner=p;fdMotionMap=p.map}
 for(const c of fdCompanionMotion.keys())if(!active.includes(c))fdCompanionMotion.delete(c);
 if(!active.length)return;
 const now=Date.now(),combatTick=now-fdLastTick>=330;
 if(combatTick)fdLastTick=now;
 for(const c of active){
   if(combatTick)fdPetAutoPotion(c);
   const mount=p.activeMount===c.id,mounted=mount&&p.riding,a=fdMotion(c);
   const point=fdFollowPoint(c),manualMode=mount&&p.mountMode==='manual';
   if(!manualMode)a.manual=false;
   if(p.map==='town'||(!a.manual&&manualMode)||(!a.manual&&fdLootPriority(c))){
     a.foe=null;a.manual=false;
   }else if(!mounted){
     if(dist(a,p)>FD_LEASH_RANGE){a.returning=true;a.foe=null;a.manual=false}
     if(a.foe&&(!enemies.includes(a.foe)||a.foe.hp<=0||dist(a.foe,p)>FD_LEASH_RANGE)){
       if(dist(a,p)>100)a.returning=true;
       a.foe=null;a.manual=false;
     }
     if(a.returning&&dist(a,p)<100)a.returning=false;
     if(!a.returning&&!a.foe&&!manualMode&&combatTick)a.foe=fdNearestFoe(FD_HUNT_RANGE,a);
   }
   if(!mounted){
     const goal=a.foe&&!a.returning?a.foe:point;
     const speed=Math.max(205,(138+p.stats.AGI*1.5)*(p.riding&&fdActiveMount()?1.45:1)*1.22)+c.genes.AGI*2;
     fdMoveCompanion(a,goal,speed,dt,goal===point?9:FD_MELEE_RANGE-7);
   }
   if(p.map==='town'||(!combatTick&&!a.manual)||now<(c.lastAttack||0))continue;
   if(manualMode&&!a.manual)continue;
   if(!a.manual&&fdLootPriority(c))continue;
   const foe=mounted?fdNearestFoe(220):a.foe;
   if(!foe||foe.hp<=0||dist(foe,p)>FD_LEASH_RANGE)continue;
   const cost=mount?12:8;
   if(a.manual){
     if(dist(a,foe)>FD_MELEE_RANGE)continue;
     if(c.mp<15){a.manual=false;a.foe=null;toast('MP สัตว์ขี่ไม่เพียงพอ');continue}
     c.mp-=15;c.lastAttack=now+1200;a.manual=false;a.foe=null;
     fdPetGainExp(c,4);fdCompanionStrike(c,foe,Math.floor(fdPetPower(c)*1.7),'mount');save();continue;
   }
   if(c.skills.includes('heal')&&p.hp/maxHP()<.65&&c.mp>=cost){
     c.mp-=cost;const heal=Math.round(15+fdPetPower(c)*.7);
     p.hp=Math.min(maxHP(),p.hp+heal);
     pushCombatNumber(p.x,p.y-40,heal,'petHeal',(c.icon||'🐾')+'💚');
     c.lastAttack=now+2500;fdPetGainExp(c,2);refreshHUD();continue;
   }
   if(c.skills.includes('buff')&&p.petBuffUntil<now&&c.mp>=cost){
     c.mp-=cost;p.petBuffUntil=now+10000;
     effects.push({x:p.x,y:p.y-42,text:'✨ บัฟ',life:850,max:850,color:'#d2f2a5'});
     c.lastAttack=now+2600;fdPetGainExp(c,2);continue;
   }
   if(!mounted&&dist(a,foe)>FD_MELEE_RANGE)continue;
   if(c.mp>=cost)c.mp-=cost;
   const damage=Math.max(1,Math.round(fdPetPower(c)*(c.mp>=cost?.95:.65)));
   c.lastAttack=now+Math.max(650,1550-c.genes.AGI*24);
   fdPetGainExp(c,3);fdCompanionStrike(c,foe,damage,mount?'mount':'pet');
   if(foe.hp<=0)a.foe=null;
 }
 if(now-fdLastPetSave>4500){fdLastPetSave=now;save();refreshHUD()}
}
function fdCompanionBuffBonus(){return p&&p.petBuffUntil>Date.now()?8:0}
function fdMobHitsCompanion(mob,preferred=null){
 const active=fdAllActive().filter(c=>dist(mob,fdCompanionPosition(c))<=76);
 if(!active.length||(!preferred&&Math.random()>.5))return false;
 const c=preferred&&active.includes(preferred)?preferred:active[rand(0,active.length-1)];
 const dmg=Math.max(1,mob.atk-Math.floor(fdPetDefense(c)*.4));
 c.hp-=dmg;
 const a=fdCompanionPosition(c);
 pushCombatNumber(a.x,a.y-20,dmg,'monsterPet');
 if(c.hp<=0){
   c.hp=0;c.knockedUntil=Date.now()+FD_PET_COOLDOWN;
   p.activePets=p.activePets.filter(id=>id!==c.id);
   if(p.activeMount===c.id){p.activeMount=null;p.riding=false}
   save();fdUpdateHotbar();toast(c.name+' พ่ายแพ้! พักฟื้น 10 นาที · ล็อกกระเป๋า');
 }
 return true;
}
function fdPetBody(c,index,mount=false){
 const a=fdCompanionPosition(c),x=a.x,y=a.y,bob=a.moving?Math.sin(Date.now()/105+index)*3:0;
 if(typeof perfVisibleInCamera==='function'&&!perfVisibleInCamera(x,y))return;
 ctx.save();
 circle(x,y+11,17,mount?'#223d5080':'#0d2f3388');
 circle(x,y-7+bob,mount?24:16,c.species==='dragon'?'#9e4547':c.species==='wolf'?'#78939c':c.species==='fox'?'#c48353':c.species==='horse'?'#8d7351':'#5a9679');
 circle(x-5,y-12+bob,6,'#ffffff55');
 ctx.restore();
 textLabel(c.icon,x,y-6+bob,'#fff',mount?22:18);
 textLabel(c.name.slice(0,9),x,y-(mount?43:34)+bob,'#fff5c8',10);
 const width=mount?42:32;
 rect(x-width/2,y-(mount?33:26),width,4,'#173746');
 rect(x-width/2,y-(mount?33:26),width*clamp(c.hp/fdPetMaxHP(c),0,1),4,'#6ed3a3');
}
function fdDrawCompanions(){
 if(!p)return;
 fdActivePets().forEach((c,i)=>fdPetBody(c,i,false));
 const mount=fdActiveMount();if(mount)fdPetBody(mount,0,true);
}
function fdMountSkill(){
 fdInit();const c=fdActiveMount();if(!c||p.mountMode!=='manual'||gamePaused||ui)return;
 const now=Date.now();
 if(now<(c.lastAttack||0)||p.map==='town')return;
 const a=fdMotion(c),t=fdNearestFoe(p.riding?210:FD_HUNT_RANGE,a);
 if(!t)return toast('สัตว์ขี่ไม่พบเป้าหมาย');
 if(c.mp<15)return toast('MP สัตว์ขี่ไม่เพียงพอ');
 if(!p.riding){a.foe=t;a.manual=true;a.returning=false;return}
 c.mp-=15;c.lastAttack=now+1200;
 const dmg=Math.floor(fdPetPower(c)*1.7);
 fdPetGainExp(c,4);fdCompanionStrike(c,t,dmg,'mount');save();
}
function fdCanBreed(a,b){
 if(!a||!b||a.id===b.id)return 'เลือกพ่อแม่สองตัวที่แตกต่างกัน';
 if(a.knockedUntil>Date.now()||b.knockedUntil>Date.now())return 'สัตว์ที่กำลังพักฟื้นยังผสมพันธุ์ไม่ได้';
 if(a.breedReadyAt>Date.now()||b.breedReadyAt>Date.now())return 'พ่อแม่ต้องพักจนครบ 5 ชั่วโมงก่อน';
 const cross=a.species!==b.species;
 if(a.level<(cross?8:3)||b.level<(cross?8:3))return cross?'ข้ามสายพันธุ์ต้อง Lv.8 ทั้งคู่':'สายพันธุ์เดียวกันต้อง Lv.3 ทั้งคู่';
 return '';
}
function fdBreed(aId,bId){
 fdInit();const a=fdPetById(aId),b=fdPetById(bId),reason=fdCanBreed(a,b);
 if(reason)return toast(reason);
 if(!confirm('ผสมพันธุ์ '+a.name+' กับ '+b.name+' ? พ่อแม่ยังอยู่ แต่พักผสมพันธุ์ 5 ชั่วโมง'))return;
 const cross=a.species!==b.species,species=cross?'hybrid':a.species;
 const genes={};
 for(const stat of ['STR','VIT','AGI','INT'])genes[stat]=clamp(Math.round((a.genes[stat]+b.genes[stat])/2)+rand(-3,3),1,40);
 const rare=clamp(Math.max(1,Math.round((a.rarity+b.rarity)/2))+(Math.random()<.15?1:0)-(Math.random()<.13?1:0),1,5);
 const skills=[...new Set([a.skills[rand(0,a.skills.length-1)]||'bite',b.skills[rand(0,b.skills.length-1)]||'buff'])];
 if(Math.random()<.09)skills.push(['heal','magic','fire','buff'][rand(0,3)]);
 const name=cross?'ลูกผสม '+a.name+'–'+b.name:FD_SPECIES[species].name+'รุ่นใหม่';
 const child=fdCreatePet(species,{name,genes,skills:[...new Set(skills)],rarity:rare,generation:Math.max(a.generation,b.generation)+1,
  lineage:[{id:a.id,name:a.name,gen:a.generation},{id:b.id,name:b.name,gen:b.generation},...(a.lineage||[]).slice(0,2),...(b.lineage||[]).slice(0,2)].slice(0,6)});
 if(cross&&!(FD_SPECIES[a.species]?.rideable||FD_SPECIES[b.species]?.rideable))child.rideable=false;
 p.companions.push(child);
 a.breedReadyAt=b.breedReadyAt=Date.now()+FD_BREED_COOLDOWN;
 save();fdPetIndex=p.companions.length-1;fdPetTab='team';fdShowPet();
 toast('🧬 ได้ลูกสายเลือดใหม่! รุ่นที่ '+child.generation);
}
function fdIsRideable(c){return c?.rideable!==false&&(c?.species==='hybrid'||!!FD_SPECIES[c?.species]?.rideable)}
function fdSetPet(slot,id){
 fdInit();const c=fdPetById(id);if(!c)return;
 if(c.knockedUntil>Date.now())return toast('สัตว์พักฟื้นอีก '+fdRemaining(c.knockedUntil));
 if(slot==='mount'){
   if(!fdIsRideable(c))return toast('สายพันธุ์นี้ยังไม่สามารถเป็นสัตว์ขี่');
   p.activeMount=p.activeMount===id?null:id;
   p.activePets=p.activePets.filter(x=>x!==id);
   if(!p.activeMount)p.riding=false;
 }else{
   if(p.activePets[slot]===id)p.activePets.splice(slot,1);
   else{
     p.activePets=p.activePets.filter(x=>x!==id);
     p.activePets[slot]=id;
     p.activePets=p.activePets.filter(Boolean).slice(0,2);
     if(p.activeMount===id){p.activeMount=null;p.riding=false}
   }
 }
 save();fdUpdateHotbar();fdShowPet();
}
function fdTransferItem(c,index,fromPlayer){
 if(!c||c.knockedUntil>Date.now())return toast('กระเป๋าสัตว์ถูกล็อกระหว่างพักฟื้น');
 const src=fromPlayer?p.items:c.bag,dst=fromPlayer?c.bag:p.items,cap=fromPlayer?24:80;
 const it=src[index];if(!it)return;
 if(!fromPlayer&&Object.values(c.equip).includes(it.uid))return toast('ถอดอุปกรณ์สัตว์ก่อนนำออก');
 if(fromPlayer&&Object.values(p.equip).includes(it.uid))return toast('ถอดอุปกรณ์ผู้เล่นก่อนย้าย');
 if(!isStack(it)&&dst.length>=cap)return toast('กระเป๋าปลายทางเต็ม');
 if(isStack(it)){
   const other=dst.find(x=>x.type===it.type&&x.name===it.name&&x.skill===it.skill&&(x.rarity||1)===(it.rarity||1)&&(x.enh||0)===(it.enh||0)&&(x.stars||0)===(it.stars||0));
   if(!other&&dst.length>=cap)return toast('กระเป๋าปลายทางเต็ม');
   if(other)other.qty=(other.qty||1)+(it.qty||1);else dst.push(it);
 }else dst.push(it);
 src.splice(index,1);
 save();fdShowPet();
}
function fdEquipPet(c,slot,index){
 if(c.knockedUntil>Date.now())return toast('สัตว์กำลังพักฟื้น');
 const it=c.bag[index];if(!it||it.type!=='gear')return;
 const allowed={weapon:['right','left','petWeapon'],armor:['armor','petArmor'],orb:['petOrb']}[slot];
 if(!allowed.includes(it.slot))return toast('อุปกรณ์นี้ไม่ตรงช่อง '+slot);
 for(const k of ['weapon','armor','orb'])if(c.equip[k]===it.uid)c.equip[k]=null;
 c.equip[slot]=it.uid;save();fdShowPet();
}
function fdEnhancePetGear(c,slot){
 if(c.knockedUntil>Date.now())return toast('สัตว์ยังพักฟื้นอยู่');
 const it=fdPetGear(c,slot);if(!it)return;
 const ix=p.items.findIndex(x=>x.type==='enhCrystal');
 if(ix<0)return toast('ไม่มีผลึกตีบวกในกระเป๋าผู้เล่น');
 consume(p.items,ix,1);it.enh=(it.enh||0)+1;save();fdShowPet();toast('ตีบวก '+it.name+' สำเร็จ +'+it.enh);
}
function fdEvolvePet(c){
 if(c.knockedUntil>Date.now())return toast('สัตว์กำลังพักฟื้น');
 const i=p.items.findIndex(x=>x.type==='material'),need=3+c.evolution;
 if(i<0||p.items[i].qty<need)return toast('ต้องใช้วัสดุพัฒนา '+need+' ชิ้น');
 const coins=50+c.evolution*25;if(p.coins<coins)return toast('เงินไม่เพียงพอ');
 consume(p.items,i,need);p.coins-=coins;c.evolution++;
 c.genes[['STR','VIT','AGI','INT'][c.evolution%4]]+=1;
 c.hp=fdPetMaxHP(c);c.mp=fdPetMaxMP(c);
 save();fdShowPet();refreshHUD();toast('🌟 พัฒนาสัตว์สำเร็จ ขั้น '+c.evolution);
}
function fdSetPetSetting(c,key,value){
 if(!c)return;c[key]=value;save();
}
function fdShowPet(){
 fdInit();fdWakePets();
 const all=p.companions,selected=all[fdPetIndex]||null;
 const tabs=`<div class="tabs"><button class="button ${fdPetTab==='team'?'selected':'ghost'}" data-ptab="team">🐾 ทีม / คอก</button><button class="button ${fdPetTab==='bag'?'selected':'ghost'}" data-ptab="bag">🎒 กระเป๋า</button><button class="button ${fdPetTab==='breed'?'selected':'ghost'}" data-ptab="breed">🧬 ผสมพันธุ์</button></div>`;
 const collection=`<div class="fd-list">${all.map((c,i)=>`<button class="button ${i===fdPetIndex?'selected':'ghost'} sm" data-pick="${i}">${c.icon} ${esc(c.name)} Lv.${c.level} ${c.knockedUntil>Date.now()?'💤':''}</button>`).join('')}</div>`;
 const activeNames=p.activePets.map(id=>fdPetById(id)?.name||'-');
 const state=`<div class="notice">สัตว์เลี้ยง 2 ตัว: ${activeNames.map(esc).join(' / ')||'ว่าง'} · สัตว์ขี่: ${esc(fdPetById(p.activeMount)?.name||'ว่าง')} · โหมดสัตว์ขี่: ${p.mountMode==='auto'?'Auto':'Manual'}<br>สะสมได้ไม่จำกัดตามพื้นที่บันทึกของอุปกรณ์ · พ่ายแพ้พัก 10 นาทีและเปิดกระเป๋าไม่ได้</div>`;
 let body='<button class="button gold full" id="fdOpenHatch">🥚 ห้องฟักไข่'+(p.hatchJob?(Date.now()>=p.hatchJob.readyAt?' · พร้อมรับสัตว์':' · กำลังฟัก'):'')+'</button>';
 if(!p.starterPetsClaimed)body+='<button class="button gold full" id="fdStarter">🎁 รับสัตว์เริ่มต้น 3 ตัวเพื่อทดลองระบบ (ครั้งเดียว)</button>';
 if(fdPetTab==='team'){
   body+=state+collection;
   if(selected){
     const down=selected.knockedUntil>Date.now();
     body+=`<div class="section stack">
      <h3>${selected.icon} ${esc(selected.name)} · Lv.${selected.level} · รุ่น ${selected.generation} · ความหายาก ${'⭐'.repeat(selected.rarity)}</h3>
      <div>❤️ ${Math.floor(selected.hp)}/${fdPetMaxHP(selected)} · 💧 ${Math.floor(selected.mp)}/${fdPetMaxMP(selected)} · EXP ${Math.floor(selected.xp)} · วิวัฒนาการ +${selected.evolution}</div>
      <div class="tiny dim">STR ${selected.genes.STR} · VIT ${selected.genes.VIT} · AGI ${selected.genes.AGI} · INT ${selected.genes.INT} · สกิล ${selected.skills.map(esc).join(', ')}</div>
      <div class="line" style="flex-wrap:wrap"><b>แต้มสเตตัสคงเหลือ: ${selected.sp||0}</b>${['STR','VIT','AGI','INT'].map(k=>`<button class="button sm ghost" data-pstat="${k}" ${!selected.sp||down?'disabled':''}>+ ${k}</button>`).join('')}</div>
      ${down?`<div class="notice">💤 พักฟื้นอีก ${fdRemaining(selected.knockedUntil)} · ห้ามเรียก/เปิดกระเป๋า/เปลี่ยนของ</div>`:''}
      <div class="line" style="flex-wrap:wrap">
       <button class="button sm gold" data-setslot="0" ${down?'disabled':''}>สัตว์เลี้ยง 1 ${p.activePets[0]===selected.id?'✓':''}</button>
       <button class="button sm gold" data-setslot="1" ${down?'disabled':''}>สัตว์เลี้ยง 2 ${p.activePets[1]===selected.id?'✓':''}</button>
       ${fdIsRideable(selected)?`<button class="button sm gold" data-setslot="mount" ${down?'disabled':''}>สัตว์ขี่ ${p.activeMount===selected.id?'✓':''}</button>`:''}
      </div>
      <button id="fdEvolve" class="button ghost" ${down?'disabled':''}>🌟 พัฒนาสัตว์ +1 (วัสดุ ${3+selected.evolution} · เงิน ${50+selected.evolution*25})</button>
      ${p.activeMount===selected.id?`<div class="line"><button class="button sm ${p.riding?'selected':'ghost'}" id="fdRide">${p.riding?'ลงจากสัตว์ขี่':'ขึ้นขี่สัตว์'}</button><button class="button sm ghost" id="fdMountMode">ควบคุม: ${p.mountMode==='auto'?'Auto':'Manual'}</button></div>`:''}
      <div class="section"><b>อุปกรณ์สัตว์ 3 ช่อง</b>${['weapon','armor','orb'].map((slot,i)=>{const gear=fdPetGear(selected,slot);return `<div class="line space" style="margin-top:6px"><span>${['⚔️ อาวุธ','🛡️ เกราะ','🔮 ลูกแก้ว'][i]}: ${gear?esc(itemName(gear)):'ว่าง'}</span><span>${gear?`<button class="button sm ghost" data-enhance="${slot}" ${down?'disabled':''}>ตีบวก</button><button class="button sm ghost" data-unequip="${slot}" ${down?'disabled':''}>ถอด</button>`:''}</span></div>`}).join('')}</div>
      <div class="section"><b>ยาฟื้นอัตโนมัติ (เฉพาะกระเป๋าสัตว์ · ไม่มีคูลดาวน์)</b>
       <label class="line"><input id="fdAutoHP" type="checkbox" ${selected.autoHP?'checked':''} ${down?'disabled':''}> ใช้ยา HP เมื่อ ≤ <input id="fdHpThreshold" type="number" min="0" max="100" step="5" value="${selected.hpThreshold}" class="input" style="width:70px" ${down?'disabled':''}>%</label>
       <label class="line"><input id="fdAutoMP" type="checkbox" ${selected.autoMP?'checked':''} ${down?'disabled':''}> ใช้ยา MP เมื่อ ≤ <input id="fdMpThreshold" type="number" min="0" max="100" step="5" value="${selected.mpThreshold}" class="input" style="width:70px" ${down?'disabled':''}>%</label>
       <button id="fdSaveSettings" class="button sm gold" ${down?'disabled':''}>บันทึกการตั้งค่า</button>
      </div>
      ${selected.lineage?.length?`<div class="tiny dim">บรรพบุรุษ: ${selected.lineage.map(a=>esc(a.name)).join(' · ')}</div>`:''}
      </div>`;
   }else body+='<div class="notice">ยังไม่มีสัตว์ · กดรับสัตว์เริ่มต้น หรือฟักไข่ที่ดรอปจากมอนสเตอร์</div>';
 }else if(fdPetTab==='bag'){
   body+=state+collection;
   if(selected){
     const down=selected.knockedUntil>Date.now();
     if(down)body+=`<div class="notice">🔒 กระเป๋าสัตว์ถูกล็อกระหว่างพักฟื้นอีก ${fdRemaining(selected.knockedUntil)} — นำของออกไม่ได้</div>`;
     else body+=`<div class="stack">
      <div class="section"><b>🎒 กระเป๋า ${esc(selected.name)} (${selected.bag.length}/24 ช่อง)</b>
      <div class="fd-list">${selected.bag.map((it,i)=>`<div class="fd-item"><span>${it.icon||'📦'} ${esc(itemName(it))} ${it.qty>1?'×'+it.qty:''}</span><div class="line"><button class="button sm ghost" data-take="${i}" ${Object.values(selected.equip).includes(it.uid)?'disabled':''}>รับคืน</button>${it.type==='gear'?`<button class="button sm gold" data-wear="${i}">สวม</button>`:''}</div></div>`).join('')}</div></div>
      <div class="section"><b>🎒 ย้ายของจากกระเป๋าผู้เล่น (${p.items.length}/80)</b>
      <div class="fd-list">${p.items.map((it,i)=>`<div class="fd-item"><span>${it.icon||ITEM_ICONS[it.type]||'📦'} ${esc(itemName(it))} ${it.qty>1?'×'+it.qty:''}</span><button class="button sm ghost" data-give="${i}">ให้สัตว์</button></div>`).join('')}</div></div>
      <div class="notice">ย้ายไอเทมที่ซ้อนกันเป็นทั้งกอง · ต้องถอดของที่สวมก่อน · อุปกรณ์ผู้เล่นบางชนิดให้สัตว์ใส่ได้</div>
      </div>`;
   }
 }else{
   body+=state+`<div class="section stack"><b>🧬 ห้องผสมพันธุ์</b><div>พ่อแม่ไม่หาย แต่ทั้งคู่ต้องพักผสมพันธุ์ <b>5 ชั่วโมงจริง</b> หลังให้กำเนิดลูก</div>
    <div class="tiny dim">สายพันธุ์เดียวกันต้อง Lv.3 · ข้ามสายพันธุ์ต้อง Lv.8 · สืบทอดยีน สกิล ความหายาก และบรรพบุรุษบางส่วน</div>
    <label>พ่อแม่ตัวที่ 1<select id="fdParentA" class="input">${all.map((c,i)=>`<option value="${c.id}">${esc(c.name)} Lv.${c.level} ${c.breedReadyAt>Date.now()?'· รอ '+fdRemaining(c.breedReadyAt):''}</option>`).join('')}</select></label>
    <label>พ่อแม่ตัวที่ 2<select id="fdParentB" class="input">${all.map((c,i)=>`<option value="${c.id}" ${i===1?'selected':''}>${esc(c.name)} Lv.${c.level} ${c.breedReadyAt>Date.now()?'· รอ '+fdRemaining(c.breedReadyAt):''}</option>`).join('')}</select></label>
    <button id="fdBreed" class="button gold" ${all.length<2?'disabled':''}>🧬 ผสมพันธุ์และค้นพบรุ่นลูก</button>
    </div>`;
 }
 openModal('🐾 สัตว์เลี้ยง / สัตว์ขี่',`<div class="stack">${tabs}${body}</div>`);
 $('modalBody').querySelectorAll('[data-ptab]').forEach(b=>b.onclick=()=>{fdPetTab=b.dataset.ptab;fdShowPet()});
 $('modalBody').querySelectorAll('[data-pick]').forEach(b=>{b.onclick=()=>{fdPetIndex=Number(b.dataset.pick);fdShowPet()}});
 if($('fdOpenHatch'))$('fdOpenHatch').onclick=()=>fdShowHatch();
 if($('fdStarter'))$('fdStarter').onclick=fdStarterPets;
 if($('fdEvolve'))$('fdEvolve').onclick=()=>fdEvolvePet(selected);
 $('modalBody').querySelectorAll('[data-setslot]').forEach(b=>b.onclick=()=>fdSetPet(b.dataset.setslot==='mount'?'mount':Number(b.dataset.setslot),selected.id));
 $('modalBody').querySelectorAll('[data-pstat]').forEach(b=>b.onclick=()=>{
   if(!selected||selected.knockedUntil>Date.now()||(selected.sp||0)<1)return;
   const stat=b.dataset.pstat;if(!['STR','VIT','AGI','INT'].includes(stat))return;
   selected.sp--;selected.genes[stat]++;selected.hp=Math.min(fdPetMaxHP(selected),selected.hp);selected.mp=Math.min(fdPetMaxMP(selected),selected.mp);
   save();fdShowPet();
 });
 $('modalBody').querySelectorAll('[data-unequip]').forEach(b=>b.onclick=()=>{selected.equip[b.dataset.unequip]=null;save();fdShowPet()});
 $('modalBody').querySelectorAll('[data-enhance]').forEach(b=>b.onclick=()=>fdEnhancePetGear(selected,b.dataset.enhance));
 if($('fdRide'))$('fdRide').onclick=()=>{p.riding=!p.riding;save();fdShowPet()};
 if($('fdMountMode'))$('fdMountMode').onclick=()=>{p.mountMode=p.mountMode==='auto'?'manual':'auto';save();fdUpdateHotbar();fdShowPet()};
 if($('fdSaveSettings'))$('fdSaveSettings').onclick=()=>{
   fdSetPetSetting(selected,'autoHP',$('fdAutoHP').checked);fdSetPetSetting(selected,'autoMP',$('fdAutoMP').checked);
   fdSetPetSetting(selected,'hpThreshold',clamp(Number($('fdHpThreshold').value)||0,0,100));
   fdSetPetSetting(selected,'mpThreshold',clamp(Number($('fdMpThreshold').value)||0,0,100));
   fdShowPet();toast('บันทึก Auto HP/MP แล้ว');
 };
 $('modalBody').querySelectorAll('[data-take]').forEach(b=>b.onclick=()=>fdTransferItem(selected,Number(b.dataset.take),false));
 $('modalBody').querySelectorAll('[data-give]').forEach(b=>b.onclick=()=>fdTransferItem(selected,Number(b.dataset.give),true));
 $('modalBody').querySelectorAll('[data-wear]').forEach(b=>b.onclick=()=>{
   const index=Number(b.dataset.wear),it=selected.bag[index];
   const slot=['right','left','petWeapon'].includes(it.slot)?'weapon':['armor','petArmor'].includes(it.slot)?'armor':'orb';
   fdEquipPet(selected,slot,index);
 });
 if($('fdBreed'))$('fdBreed').onclick=()=>fdBreed($('fdParentA').value,$('fdParentB').value);
}
showPet=fdShowPet;
function fdInjectUI(){
 const style=document.createElement('style');style.textContent=`
 #fdHotbar{position:absolute;z-index:5;bottom:calc(20px + env(safe-area-inset-bottom));left:38%;right:188px;display:flex;justify-content:center;gap:3px;pointer-events:auto}
 .fd-hot-btn,.fd-slot{position:relative;touch-action:none;background:#15374bdb;border:1px solid #92bbcc;color:#fff;border-radius:10px;min-width:0;width:46px;height:49px;font-size:23px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 9px #0017}
 .fd-hot-btn small{position:absolute;bottom:1px;right:4px;font-size:10px;color:#e2e9ce}
 .fd-hot-choose{display:grid;grid-template-columns:repeat(6,1fr);gap:5px}.fd-slot{width:100%;height:53px;flex-direction:column}.fd-slot small{font-size:10px}.fd-chosen{border-color:#f6d381;box-shadow:0 0 0 2px #f6d38166}
 .fd-list{display:flex;flex-wrap:wrap;gap:5px;max-height:185px;overflow:auto}.fd-list>.button{max-width:100%}
 .fd-item{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;padding:8px;border-radius:8px;background:#0c2435;border:1px solid #4b6477;flex-wrap:wrap}
 .fd-item span{overflow-wrap:anywhere}.fd-row{display:grid;gap:7px}.fd-bar{height:7px;border-radius:8px;background:#2d3c48;overflow:hidden}.fd-bar span{display:block;height:100%;background:#b8a66f}
 #fdMountSkill{position:absolute;z-index:5;bottom:calc(92px + env(safe-area-inset-bottom));right:calc(21px + env(safe-area-inset-right));border:2px solid #e5ca8f;color:white;background:#72518fdd;border-radius:50%;width:62px;height:62px;touch-action:none;font-weight:bold}
 @media(max-width:750px){#fdHotbar{left:28%;right:164px;bottom:calc(97px + env(safe-area-inset-bottom));flex-wrap:wrap;gap:2px}.fd-hot-btn{width:36px;height:37px;font-size:19px}}
 @media(max-width:560px){#fdHotbar{left:147px;right:84px;bottom:calc(10px + env(safe-area-inset-bottom))}.fd-hot-btn{width:33px;height:35px;font-size:17px}.fd-hot-choose{grid-template-columns:repeat(3,1fr)}}
 `;document.head.appendChild(style);
 const hot=document.createElement('div');hot.id='fdHotbar';hot.setAttribute('aria-label','ช่องสกิลใช้งาน 6 ช่อง');
 $('worldWrap').appendChild(hot);
 const mount=document.createElement('button');mount.id='fdMountSkill';mount.type='button';mount.className='hide';mount.textContent='🐉 ท่าสัตว์';
 $('worldWrap').appendChild(mount);
 mount.addEventListener('pointerdown',e=>{e.preventDefault();fdMountSkill()});
 mount.onclick=()=>fdMountSkill();
}
fdInjectUI();
