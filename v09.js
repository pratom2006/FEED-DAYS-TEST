(function v09Feature(){
'use strict';
const RULES={pickupRange:75,petRange:95,ownerMs:60000,expireMs:180000,holdMs:420,dropChance:0.40};
// Absolute egg probability per kill; unused egg weight becomes upgrade material.
const EGG_DROP={normal:.025,peaceful:.03,aggressive:.035,boss:.075};
const rarityNames=['','ทั่วไป','พิเศษ','หายาก','มหากาพย์','ตำนาน'];
const originals={fdInit,fdPetGear,fdShowPet,showScreen};
let currentUid=null,highestZ=40,lastPetPickup=0,lastAutoPickup=0,lastSweep=0,pendingLootId=null;
let v09LastTickInit=0,v09LastTickPlayer=null;
const windowMap=new Map();
const here=()=>Boolean(p&&$('game')&&!$('game').classList.contains('hide'));
function safeItemName(it){return esc(itemName(it))}
function critical(it){return !!it&&((it.rarity||1)>=3||(it.enh||0)>0||(it.stars||0)>0)}
function nameType(it){
 if(it.type==='gear')return it.slot?.includes('pet')?'อุปกรณ์สัตว์':'อาวุธ/เกราะ';
 if(it.type==='skillScroll')return 'คัมภีร์';
 if(it.type==='petEgg')return 'ไข่สัตว์';
 if(it.type==='material'||it.type==='enhCrystal'||it.type==='starCrystal')return 'วัสดุ';
 if(it.type==='potionHP'||it.type==='potionMP')return 'ยา HP/MP';
 if(it.type==='coin')return 'เหรียญ';
 return 'อื่น ๆ';
}
function ensureSlots(){
 if(!p)return;
 const busy=new Set();
 for(const it of p.items){
   if(!Number.isInteger(it.bagSlot)||it.bagSlot<0||it.bagSlot>=80||busy.has(it.bagSlot)){
     let i=0;while(busy.has(i)&&i<80)i++;it.bagSlot=i;
   }
   busy.add(it.bagSlot);
 }
}
function v09Init(){
 if(!p)return;
 if(!Array.isArray(p.items))p.items=[];
 if(!p.equippedItems||typeof p.equippedItems!=='object')p.equippedItems={};
 if(!Array.isArray(p.groundLoot))p.groundLoot=[];
 if(!p.v09InventoryMigrated){
   for(const [slot,uid] of Object.entries(p.equip||{})){
     if(!uid)continue;
     if(p.equippedItems[slot])continue;
     const i=p.items.findIndex(it=>it.uid===uid);
     if(i>=0)p.equippedItems[slot]=p.items.splice(i,1)[0];
   }
   for(const c of p.companions||[]){
     if(!c.equippedItems)c.equippedItems={};
     for(const [slot,uid] of Object.entries(c.equip||{})){
       if(!uid||c.equippedItems[slot])continue;
       const i=c.bag?.findIndex(it=>it.uid===uid)??-1;
       if(i>=0)c.equippedItems[slot]=c.bag.splice(i,1)[0];
     }
   }
   p.v09InventoryMigrated=true;
   ensureSlots();save();
 }
 for(const c of p.companions||[]){
   if(!c.equippedItems)c.equippedItems={};
   if(c.species==='fox'&&!c.skills.includes('treasure'))c.skills.push('treasure');
   if(!c.lootTypes)c.lootTypes=['อาวุธ/เกราะ','อุปกรณ์สัตว์','คัมภีร์','ไข่สัตว์','วัสดุ','ยา HP/MP'];
   if(!Number.isFinite(c.lootRarity))c.lootRarity=1;
   if(c.lootMode!=='combat'&&c.lootMode!=='loot')c.lootMode='balanced';
   if(c.lootTarget!=='pet')c.lootTarget='player';
   if(typeof c.lootEnabled!=='boolean')c.lootEnabled=false;
 }
 ensureSlots();
}
fdInit=function(){originals.fdInit();v09Init()};
getEq=function(uid){
 if(!p||!uid)return null;
 for(const it of Object.values(p.equippedItems||{}))if(it?.uid===uid)return it;
 return p.items.find(x=>x.uid===uid)||null;
};
recheckEquipment=function(){
 v09Init();
 for(const [slot,uid] of Object.entries(p.equip||{})){
   if(uid&&!getEq(uid))p.equip[slot]=null;
 }
};
fdPetGear=function(c,key){
 return c?.equippedItems?.[key]||originals.fdPetGear(c,key);
};
function v09PetEquip(c,slot,index){
 if(!c||c.knockedUntil>Date.now())return toast('สัตว์กำลังพักฟื้น');
 const it=c.bag[index];if(!it||it.type!=='gear')return;
 const allowed={weapon:['right','left','petWeapon'],armor:['armor','petArmor'],orb:['petOrb']}[slot];
 if(!allowed||!allowed.includes(it.slot))return toast('อุปกรณ์ไม่ตรงช่อง');
 const old=c.equippedItems?.[slot]||null;
 c.bag.splice(index,1);
 if(old)c.bag.push(old);
 c.equippedItems[slot]=it;c.equip[slot]=it.uid;save();fdShowPet();v09Refresh();
}
fdEquipPet=v09PetEquip;
function v09UnequipPet(c,slot){
 if(!c||c.knockedUntil>Date.now())return toast('สัตว์ยังพักฟื้น');
 const it=c.equippedItems?.[slot];if(!it)return;
 if(c.bag.length>=24)return toast('กระเป๋าสัตว์เต็ม ถอดไม่ได้');
 c.bag.push(it);c.equippedItems[slot]=null;c.equip[slot]=null;save();fdShowPet();v09Refresh();
}
function equipFromBag(index,preferred){
 v09Init();const it=p.items[index];if(!it||it.type!=='gear')return;
 if(!Object.prototype.hasOwnProperty.call(SLOTS,it.slot))return toast('อุปกรณ์เฉพาะสัตว์ต้องใส่ในหน้าต่างสัตว์');
 const slot=['right','left'].includes(it.slot)?(['right','left'].includes(preferred)?preferred:it.slot):it.slot;
 const old=p.equippedItems[slot]||null;
 p.items.splice(index,1);
 if(old){old.bagSlot=it.bagSlot;p.items.push(old)}
 p.equippedItems[slot]=it;p.equip[slot]=it.uid;
 save();refreshHUD();v09Refresh();
 toast('สวมใส่ '+it.name+(old?' (สลับอุปกรณ์เดิมกลับกระเป๋า)':''));
}
equipItem=equipFromBag;
function unequipPlayer(slot){
 v09Init();const it=p.equippedItems[slot];if(!it)return;
 if(p.items.length>=80)return toast('กระเป๋าเต็ม ต้องเว้นช่องก่อนถอด');
 it.bagSlot=undefined;p.items.push(it);p.equippedItems[slot]=null;p.equip[slot]=null;
 ensureSlots();save();refreshHUD();v09Refresh();
}
function css(){
 const st=document.createElement('style');
 st.textContent=`
 #overlay:not(.hide){z-index:100!important}
 #overlay:not(.hide):has(#fdHatchPanel){z-index:100000!important}
 .v09-window{position:fixed;display:flex;flex-direction:column;z-index:41;background:rgba(16,33,49,.92);backdrop-filter:blur(5px);border:1px solid #91b1bf;border-radius:13px;color:#f2f6fa;box-shadow:0 12px 35px #0009;min-width:245px;min-height:180px;max-width:96vw;max-height:80dvh;overflow:hidden;font-size:13px}
 .v09-head{display:flex;align-items:center;justify-content:space-between;gap:4px;padding:9px;background:#27445ae8;touch-action:none;cursor:grab;user-select:none}
 .v09-head b{flex:1}.v09-head button{width:29px;height:27px;background:#142a39;border:1px solid #88a6b3;border-radius:6px;color:white;cursor:pointer}
 .v09-content{overflow:auto;overscroll-behavior:contain;min-height:0;flex:1;padding:10px;touch-action:pan-y}
 .v09-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px}
 .v09-cell{position:relative;min-height:57px;border-radius:7px;border:1px solid #49667b;background:#1b394c;color:white;font-size:24px;touch-action:none;user-select:none;display:flex;align-items:center;justify-content:center}
 .v09-cell.v09-selected{outline:2px solid #f1cf76}.v09-cell small{font-size:10px;position:absolute;right:2px;bottom:0;color:#f1f0e9}
 .v09-cell.v09-target{border-color:#fff0ae;background:#65774a}
 .v09-bag-scroll{height:min(38dvh,365px);overflow:auto;overscroll-behavior:contain;border:1px solid #476474;border-radius:9px;padding:5px;background:#081c29}
 .v09-bag-detail{margin-top:8px;padding:10px;border-radius:9px;background:#122738;min-height:86px}
 .v09-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.v09-actions button{font-size:12px}
 .v09-dragging{position:fixed;z-index:99999;pointer-events:none;width:51px;height:51px;border:2px solid #ffe0a1;border-radius:8px;background:#3c526cde;display:grid;place-items:center;font-size:29px;transform:translate(-50%,-50%);box-shadow:0 3px 14px #000a}
 #v09PickupBtn{position:absolute;z-index:6;right:164px;bottom:calc(92px + env(safe-area-inset-bottom));border:2px solid #d0c38e;border-radius:40px;background:#4b695bcc;color:#fff;font-size:13px;font-weight:700;padding:9px 10px;touch-action:none;min-width:90px;min-height:55px}

 .v09-window[data-name="pet"]{width:min(1050px,96vw)!important;max-height:88dvh;background:linear-gradient(145deg,#152a3f,#0b1d2c);border:2px solid #bc9b60;font-size:14px}
 .v09-window[data-name="pet"] .v09-head{background:linear-gradient(90deg,#18394d,#345c70,#18394d);color:#ffe4a8;border-bottom:1px solid #b99b64;font-size:17px}
 .pc-layout{display:grid;grid-template-columns:minmax(145px,1fr) minmax(250px,2.15fr) minmax(155px,1.05fr);grid-template-areas:"team center nav";gap:10px;align-items:start}
 .pc-team{grid-area:team}.pc-nav{grid-area:nav}.pc-center{grid-area:center;min-width:0}.pc-team,.pc-nav{display:grid;gap:8px;padding:9px;background:#102739;border:1px solid #466579;border-radius:12px}
 .pc-team h3,.pc-nav h3{margin:0;text-align:center;color:#f1d49a;padding:7px;border-bottom:1px solid #426b7c;font-size:15px}
 .pc-slot,.pc-system,.pc-tab{background:linear-gradient(145deg,#25485e,#142c40);border:1px solid #52758b;color:#f3f5f4;border-radius:9px;min-height:44px;padding:9px;text-align:left;touch-action:manipulation;overflow-wrap:anywhere}
 .pc-slot{display:grid;gap:5px;width:100%}.pc-slot-label{font-size:12px;color:#dfc994}.pc-slot-body{display:flex;align-items:center;gap:8px;min-width:0}.pc-avatar{font-size:27px;flex-shrink:0;background:#142c40;border:1px solid #7198b2;border-radius:8px;padding:5px}.pc-slot small,.pc-system small{display:block;font-size:11px;color:#b5d4df;margin-top:3px}
 .pc-selected{border-color:#f5cf7e!important;box-shadow:inset 0 0 0 1px #f5cf7e;background:linear-gradient(145deg,#39566b,#2d485a)!important}
 .pc-system{display:flex;align-items:center;gap:8px;width:100%}.pc-system>span:first-child{font-size:24px}.pc-system>span:last-child{min-width:0}.pc-hatch-status{color:#ffe0a2!important}
 .pc-center{background:#102739;border:1px solid #648498;border-radius:12px;overflow:hidden}.pc-tabs{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;padding:6px;background:#1d394c}.pc-tab{text-align:center;padding:6px 2px;font-size:12px}
 .pc-current{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:8px 10px;border-bottom:1px solid #426579;color:#f5dca9}.pc-current button{margin-left:auto}
 .pc-main{padding:10px;gap:10px;min-width:0}.pc-main h3{margin:0;color:#f5dca9}.pc-main .button{min-height:40px}.pc-hero{display:flex;align-items:center;gap:14px;padding:14px;background:radial-gradient(ellipse at 25% 30%,#346679,#203b50 60%,#163042);border:1px solid #658d99;border-radius:10px}.pc-portrait{font-size:clamp(45px,7vw,78px);line-height:1.2}.pc-hero h3{margin-bottom:5px}
 .pc-live{display:grid;gap:9px}.pc-track{height:9px;background:#0c1b29;border-radius:6px;overflow:hidden;margin-top:4px}.pc-track i{display:block;height:100%;border-radius:6px}.pc-vital{font-size:12px}
 .pc-statgrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px}.pc-statgrid div{background:#203c50;border:1px solid #47697c;border-radius:7px;padding:8px 4px;text-align:center}.pc-statgrid b,.pc-statgrid small{display:block}.pc-chips,.pc-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px}.pc-chips span{border:1px solid #6d8a9a;border-radius:7px;background:#24465a;padding:5px 9px}.pc-actions .button{flex:1 1 105px}
 .pc-roster{display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:8px}.pc-items{display:grid;gap:5px;max-height:220px;overflow:auto;margin-top:7px}.pc-main .section{margin:0;min-width:0}.pc-main .input{max-width:100%}
 @media(max-width:880px){.pc-layout{grid-template-columns:minmax(0,1fr) minmax(0,2fr);grid-template-areas:"team center" "nav center"}.pc-team,.pc-nav{padding:7px}.pc-system small{font-size:11px}}
 @media(max-width:600px){.v09-window[data-name="pet"]{width:96vw!important;max-height:90dvh}.pc-layout{grid-template-columns:minmax(0,1fr);grid-template-areas:"team" "nav" "center"}.pc-team{grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}.pc-team h3,.pc-team>.pc-system,.pc-team>#pcStarter{grid-column:1/-1}.pc-slot{padding:5px}.pc-slot-body{flex-direction:column;text-align:center;gap:3px}.pc-avatar{font-size:24px}.pc-nav{grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}.pc-nav h3{grid-column:1/-1}.pc-system{padding:6px;font-size:12px}.pc-system>span:first-child{font-size:20px}.pc-tabs{gap:2px}.pc-tab{font-size:11px}.pc-roster{grid-template-columns:repeat(2,minmax(0,1fr))}}
 @media(max-width:600px){.v09-window{width:min(350px,92vw)!important}.v09-content{padding:7px}#v09PickupBtn{right:90px;bottom:calc(124px + env(safe-area-inset-bottom));font-size:11px;padding:7px;min-width:82px;min-height:47px}}
 `;
 document.head.appendChild(st);
}
css();
function clampWindow(node,left,top){
 const rect=node.getBoundingClientRect();
 const width=rect.width||330,height=rect.height||280;
 node.style.left=Math.max(2,Math.min(window.innerWidth-width-2,left))+'px';
 node.style.top=Math.max(2,Math.min(window.innerHeight-Math.min(height,60)-2,top))+'px';
}
function v09Window(key,title){
 let node=windowMap.get(key);
 if(!node){
   const defaults={bag:{x:16,y:70,w:375},equip:{x:405,y:85,w:320},stats:{x:140,y:130,w:300},pet:{x:16,y:42,w:1050}};
   const config=defaults[key]||defaults.bag;
   node=document.createElement('section');node.className='v09-window';node.dataset.name=key;node.style.width='min('+config.w+'px,94vw)';
   node.style.left=Math.min(config.x,Math.max(2,window.innerWidth-config.w-5))+'px';
   node.style.top=Math.min(config.y,window.innerHeight-85)+'px';node.style.display='none';
   node.innerHTML='<div class="v09-head"><b class="v09-title"></b><button type="button" class="v09-reset" title="คืนตำแหน่ง">⟲</button><button type="button" class="v09-close" title="ปิด">✕</button></div><div class="v09-content"></div>';
   document.body.appendChild(node);windowMap.set(key,node);
   node.querySelector('.v09-close').onclick=()=>{node.style.display='none'};
   node.querySelector('.v09-reset').onclick=()=>clampWindow(node,config.x,config.y);
   node.addEventListener('pointerdown',()=>{node.style.zIndex=String(++highestZ)});
   const head=node.querySelector('.v09-head');
   head.addEventListener('pointerdown',e=>{
     if(e.target.closest('button'))return;
     e.preventDefault();node.style.zIndex=String(++highestZ);
     const x=e.clientX,y=e.clientY,box=node.getBoundingClientRect();
     head.setPointerCapture(e.pointerId);
     const move=ev=>{if(ev.pointerId!==e.pointerId)return;clampWindow(node,box.left+ev.clientX-x,box.top+ev.clientY-y)};
     const done=()=>{head.removeEventListener('pointermove',move);head.removeEventListener('pointerup',done);head.removeEventListener('pointercancel',done)};
     head.addEventListener('pointermove',move);head.addEventListener('pointerup',done);head.addEventListener('pointercancel',done);
   });
 }
 node.querySelector('.v09-title').textContent=title;const wasHidden=node.style.display==='none';node.style.display='flex';if(wasHidden)node.style.zIndex=String(++highestZ);
 return node;
}
function closeAllWindows(){for(const node of windowMap.values())node.style.display='none'}
showScreen=function(id){if(id!=='game')closeAllWindows();return originals.showScreen(id)};
function bagSelectedItem(){return p?.items?.find(x=>x.uid===currentUid)||null}
function v09Detail(){
 const win=windowMap.get('bag');if(!win||win.style.display==='none')return;
 win.querySelectorAll('.v09-cell').forEach(b=>b.classList.toggle('v09-selected',b.dataset.uid&&b.dataset.uid===currentUid));
 const detail=win.querySelector('.v09-bag-detail');if(!detail)return;
 const it=bagSelectedItem();
 if(!it){detail.innerHTML='แตะไอเทมเพื่อดูรายละเอียด · กดค้าง 0.4 วินาทีแล้วลากเพื่อจัดเรียง';return}
 let info=it.type==='skillScroll'?'ประเภท: '+(FD_SKILLS[it.skill]?.type||'สกิล')+' · ใช้คัมภีร์แล้วจึงเห็นพลังสกิล':(it.desc||it.type);
 detail.innerHTML='<b>'+esc(it.icon||'📦')+' '+safeItemName(it)+'</b><div class="dim tiny">'+esc(info)+' · จำนวน '+(it.qty||1)+'</div>'+
 (it.type==='gear'&&typeof fd95BonusText==='function'?'<div class="tiny" style="margin-top:6px;color:'+(typeof fd95Tier==='function'?fd95Tier(it).color:'#f7e5ba')+'">'+
 'ความหายาก: '+esc(fd95RarityName(it))+' · '+esc(fd95BonusText(it)||'ยังไม่มีโบนัสเพิ่มเติม')+'</div>'+
 '<div class="tiny" style="margin-top:4px;color:#f5d59b">'+esc(fd95TraitText(it)||'ตีบวกถึง +7 เพื่อเปิดคุณสมบัติพิเศษ')+'</div>':'')+
 '<div class="v09-actions">'+
 (it.type==='gear'?'<button class="button gold sm" data-act="equip">⚔️ สวมใส่</button>':'')+
 (it.type?.startsWith('potion')?'<button class="button gold sm" data-act="use">🧪 ใช้ยา</button>':'')+
 (it.type==='skillScroll'?'<button class="button gold sm" data-act="scroll">📜 ใช้คัมภีร์</button>':'')+
 (it.type==='petEgg'?'<button class="button gold sm" data-act="hatch">🥚 เปิดห้องฟักไข่</button>':'')+
 '<button class="button red sm" data-act="drop">🗑️ ทิ้งไอเทม</button></div>';
 detail.querySelectorAll('[data-act]').forEach(button=>button.onclick=()=>{
   const idx=p.items.findIndex(x=>x.uid===currentUid);if(idx<0)return;
   switch(button.dataset.act){
     case 'equip':equipFromBag(idx);return;
     case 'use':usePotion(idx);break;
     case 'scroll':fdUseScroll(idx);break;
     case 'hatch':fdHatch(idx);return;
     case 'drop':v09Discard(idx);return;
   }
   currentUid=null;v09ShowBag();
 });
}
function v09SwapSlots(a,b){
 v09Init();if(a===b)return;
 const first=p.items.find(it=>it.bagSlot===a),second=p.items.find(it=>it.bagSlot===b);
 if(!first)return;
 if(second)second.bagSlot=a;
 first.bagSlot=b;save();v09ShowBag();
}
function v09BindBagCells(win,viewport){
 let pointerState=null,ghost=null,dragTimer=null;
 function cleanup(){
   if(dragTimer!==null){clearTimeout(dragTimer);dragTimer=null}
   if(ghost){ghost.remove();ghost=null}
   win.querySelectorAll('.v09-target').forEach(el=>el.classList.remove('v09-target'));
 }
 win.querySelectorAll('.v09-cell').forEach(cell=>{
   cell.addEventListener('pointerdown',e=>{
     if(!p||e.button>0)return;
     const from=Number(cell.dataset.slot),item=p.items.find(it=>it.bagSlot===from);
     if(!item)return;
     const startX=e.clientX,startY=e.clientY,scrollAt=viewport.scrollTop;
     pointerState={id:e.pointerId,from,item,downX:startX,downY:startY,scrollAt,scrolling:false,dragging:false};
     try{cell.setPointerCapture(e.pointerId)}catch(err){}
     dragTimer=setTimeout(()=>{
       if(!pointerState||pointerState.id!==e.pointerId||pointerState.scrolling)return;
       pointerState.dragging=true;
       ghost=document.createElement('div');ghost.className='v09-dragging';ghost.textContent=item.icon||'📦';document.body.appendChild(ghost);
       ghost.style.left=startX+'px';ghost.style.top=startY+'px';
     },RULES.holdMs);
     e.preventDefault();
   });
   cell.addEventListener('pointermove',e=>{
     if(!pointerState||e.pointerId!==pointerState.id||pointerState.from!==Number(cell.dataset.slot))return;
     const dx=e.clientX-pointerState.downX,dy=e.clientY-pointerState.downY;
     if(!pointerState.dragging&&Math.hypot(dx,dy)>9){
       pointerState.scrolling=true;
       if(dragTimer!==null){clearTimeout(dragTimer);dragTimer=null}
     }
     if(pointerState.scrolling){viewport.scrollTop=pointerState.scrollAt-dy;return}
     if(pointerState.dragging){
       if(ghost){ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px'}
       win.querySelectorAll('.v09-target').forEach(el=>el.classList.remove('v09-target'));
       const hit=document.elementFromPoint(e.clientX,e.clientY)?.closest('.v09-cell');
       if(hit&&win.contains(hit))hit.classList.add('v09-target');
     }
   });
   const finish=e=>{
     if(!pointerState||e.pointerId!==pointerState.id||pointerState.from!==Number(cell.dataset.slot))return;
     const state=pointerState;pointerState=null;
     const hit=document.elementFromPoint(e.clientX,e.clientY)?.closest('.v09-cell');
     cleanup();
     if(state.dragging){
       if(hit&&win.contains(hit))v09SwapSlots(state.from,Number(hit.dataset.slot));
     }else if(!state.scrolling){
       currentUid=state.item.uid;v09Detail();
     }
   };
   cell.addEventListener('pointerup',finish);cell.addEventListener('pointercancel',()=>{pointerState=null;cleanup()});
 });
}
function v09ShowBag(){
 if(!p)return;v09Init();const win=v09Window('bag','🎒 กระเป๋า · จัดช่องด้วยการกดค้างลาก');
 const holder=win.querySelector('.v09-content'),prior=holder.querySelector('.v09-bag-scroll')?.scrollTop||0;
 const bySlot=new Map(p.items.map(it=>[it.bagSlot,it]));
 holder.innerHTML='<div class="line space"><b>'+p.items.length+'/80 ช่อง</b><span class="coin">🪙 '+p.coins.toLocaleString('th-TH')+'</span></div>'+
 '<button type="button" class="button sm ghost" id="fd95SortBag">🧹 จัดเรียงกระเป๋าตามความหายาก</button>'+
 '<p class="dim tiny" style="margin:5px 0">แตะดูของ · กดค้างแล้วลากเพื่อย้ายหรือสลับ · ปัดเลื่อนรายการได้</p>'+
 '<div class="v09-bag-scroll"><div class="v09-grid">'+
 Array.from({length:80},(_,i)=>{const it=bySlot.get(i),rarity=it?.type==='gear'&&typeof fd95Tier==='function'?fd95Tier(it):null;
 return '<button type="button" class="v09-cell" data-slot="'+i+'" '+(it?'data-uid="'+esc(it.uid)+'"':'')+
 (rarity?' style="border-color:'+rarity.color+'" title="'+esc(itemName(it))+'"':'')+'>'+
 (it?esc(it.icon||ITEM_ICONS[it.type]||'📦')+'<small>'+(it.qty>1?'×'+it.qty:'')+(it.enh?' +'+it.enh:'')+'</small>':'·')+'</button>'}).join('')+
 '</div></div><div class="v09-bag-detail"></div>';
 const viewport=holder.querySelector('.v09-bag-scroll');viewport.scrollTop=prior;
 v09BindBagCells(win,viewport);v09Detail();
 const sortBtn=holder.querySelector('#fd95SortBag');
 if(sortBtn)sortBtn.onclick=()=>{if(typeof fd95SortBag==='function')fd95SortBag()};
}
showBag=v09ShowBag;
window.fdHatchRefreshBag=()=>{const bag=windowMap.get('bag');if(bag&&bag.style.display!=='none'){currentUid=null;v09ShowBag()}};
function v09ShowEquip(){
 if(!p)return;v09Init();
 const win=v09Window('equip','🛡️ อุปกรณ์ที่สวมอยู่');
 const row=Object.entries(SLOTS).map(([slot,label])=>{
   const it=p.equippedItems[slot];
   return '<div class="line space" style="margin:7px 0;gap:6px"><span>'+esc(label)+'<br><b style="color:'+(it&&typeof fd95Tier==='function'?fd95Tier(it).color:'#f0f0f0')+'">'+(it?safeItemName(it):'ว่าง')+'</b>'+
 (it&&typeof fd95TraitText==='function'?'<div class="tiny dim">'+esc(fd95BonusText(it)||'')+'<div>'+esc(fd95TraitText(it)||'')+'</div></div>':'')+
 '</span>'+
     (it?'<button type="button" class="button sm ghost" data-unequip="'+slot+'">ถอด</button>':'')+'</div>';
 }).join('');
 win.querySelector('.v09-content').innerHTML='<div class="section"><b>'+esc(p.name)+'</b> Lv.'+p.lvl+'<p class="dim tiny">สวมใส่แล้วไม่กินช่องกระเป๋า · ถอดต้องมีช่องว่าง</p><p>ATK '+attackPower()+' · DEF '+defense()+'</p></div><div class="section">'+row+'</div>';
 win.querySelectorAll('[data-unequip]').forEach(b=>b.onclick=()=>unequipPlayer(b.dataset.unequip));
}
showEquip=v09ShowEquip;
function v09ShowStats(){
 if(!p)return;
 const win=v09Window('stats','💪 สเตตัสตัวละคร');
 win.querySelector('.v09-content').innerHTML='<div class="line space"><b>'+esc(p.name)+' Lv.'+p.lvl+'</b><span class="pill">แต้ม '+p.sp+'</span></div>'+
 '<div class="section">'+Object.entries(STATS).map(([k,desc])=>'<div class="statrow"><div><b>'+k+' '+p.stats[k]+'</b><div class="dim tiny">'+esc(desc)+'</div></div><button type="button" class="button sm" data-stat="'+k+'" '+(p.sp<1?'disabled':'')+'>+1</button></div>').join('')+'</div>'+
 '<div class="notice">HP '+maxHP()+' · MP '+maxMP()+' · ATK '+attackPower()+' · DEF '+defense()+'</div>';
 win.querySelectorAll('[data-stat]').forEach(b=>b.onclick=()=>{
   if(p.sp<1||!Object.prototype.hasOwnProperty.call(p.stats,b.dataset.stat))return;
   p.stats[b.dataset.stat]++;p.sp--;p.hp=clamp(p.hp,0,maxHP());p.mp=clamp(p.mp,0,maxMP());
   save();refreshHUD();v09ShowStats();
 });
}
showStats=v09ShowStats;
function petLootPanel(win){
 const selected=p.companions[fdPetIndex];
 if(!selected||fdPetTab!=='settings')return;
 const hasSkill=selected.skills?.includes('treasure');
 const panel=document.createElement('div');panel.className='section stack';
 const disabled=hasSkill&&selected.knockedUntil<=Date.now()?'':'disabled';
 panel.innerHTML='<h3>💎 AI สัตว์เก็บสมบัติ</h3>'+
 (hasSkill?'<p class="tiny dim">ตั้งค่าเฉพาะสัตว์ตัวนี้ · เก็บเฉพาะของที่มีสิทธิ์และไม่เกินระยะ</p>':'<div class="notice">สัตว์ตัวนี้ยังไม่มีสกิลค้นหาสมบัติ · ตัวอย่างสัตว์ที่มีสกิลนี้: จิ้งจอกเวท</div>')+
 '<label><input type="checkbox" data-loot="enabled" '+(selected.lootEnabled?'checked':'')+' '+disabled+'> เปิด Auto Pickup</label>'+
 '<label>พฤติกรรม<select class="input" data-loot="mode" '+disabled+'><option value="combat">⚔️ ต่อสู้ก่อน</option><option value="loot">💎 เน้นสมบัติ</option><option value="balanced">⚖️ สมดุล</option></select></label>'+
 '<label>ส่งไอเทมไป<select class="input" data-loot="target" '+disabled+'><option value="player">🎒 กระเป๋าตัวละคร</option><option value="pet">🐾 กระเป๋าสัตว์ตัวนี้</option></select></label>'+
 '<label>ระดับขั้นต่ำ<select class="input" data-loot="rarity" '+disabled+'>'+rarityNames.slice(1).map((name,i)=>'<option value="'+(i+1)+'">'+name+' ขึ้นไป</option>').join('')+'</select></label>'+
 '<b class="tiny">ประเภทที่ให้เก็บ</b><div class="v09-actions">'+['อาวุธ/เกราะ','อุปกรณ์สัตว์','คัมภีร์','ไข่สัตว์','วัสดุ','ยา HP/MP'].map(type=>'<label class="tiny"><input type="checkbox" data-loottype="'+type+'" '+(selected.lootTypes.includes(type)?'checked':'')+' '+disabled+'>'+type+'</label>').join('')+'</div>';
 (win.querySelector('.pc-main')||win.querySelector('.v09-content')).appendChild(panel);
 if(!hasSkill)return;
 panel.querySelector('[data-loot="mode"]').value=selected.lootMode;
 panel.querySelector('[data-loot="target"]').value=selected.lootTarget;
 panel.querySelector('[data-loot="rarity"]').value=selected.lootRarity;
 panel.querySelectorAll('[data-loot]').forEach(el=>el.onchange=()=>{
   const type=el.dataset.loot;
   if(type==='enabled')selected.lootEnabled=el.checked;
   if(type==='mode')selected.lootMode=el.value;
   if(type==='target')selected.lootTarget=el.value;
   if(type==='rarity')selected.lootRarity=Number(el.value);
   save();toast('บันทึกการตั้งค่าเก็บสมบัติแล้ว');
 });
 panel.querySelectorAll('[data-loottype]').forEach(el=>el.onchange=()=>{
   const type=el.dataset.loottype;
   selected.lootTypes=el.checked?[...new Set([...selected.lootTypes,type])]:selected.lootTypes.filter(x=>x!==type);
   save();
 });
}
/* v1.1: Pet Management Center. Uses existing inventory, pet, breeding and hatchery actions. */
const PC_TABS=[['team','🏠','ภาพรวม'],['stats','📊','สเตตัส'],['gear','⚔️','อุปกรณ์'],['bag','🎒','กระเป๋า'],['settings','⚙️','ตั้งค่า']];
const PC_SYSTEMS=[['hatch','🥚','ห้องฟักไข่','ไข่ อาหาร และเวลาฟัก'],['breed','🧬','ผสมพันธุ์','สายเลือดและรุ่นลูก'],['bag','🎒','กระเป๋าสัตว์','ย้ายและจัดการไอเทม'],['settings','⚙️','ตั้งค่าการต่อสู้','ยาอัตโนมัติและเก็บสมบัติ'],['evolve','🌟','วิวัฒนาการ','พัฒนาความแข็งแกร่ง']];
const PC_SKILLS={bite:'กัด',buff:'บัฟ',magic:'เวทโจมตี',heal:'รักษา',fire:'ไฟ',kick:'เตะ',treasure:'ค้นหาสมบัติ'};
let pcOwner=null,pcSearch='';
function pcStatus(c){return !c?'ว่าง':c.knockedUntil>Date.now()?'พักฟื้น':p.activeMount===c.id?(p.riding?'กำลังขี่':'สัตว์ขี่'):p.activePets.includes(c.id)?'กำลังใช้งาน':'อยู่ในคอก'}
function pcBar(label,current,max,color){return '<div class="pc-vital"><div class="line space"><b>'+label+'</b><span>'+Math.floor(current)+' / '+Math.floor(max)+'</span></div><div class="pc-track"><i style="width:'+clamp(current/Math.max(1,max)*100,0,100)+'%;background:'+color+'"></i></div></div>'}
function pcSlot(label,c,selected){return '<button class="pc-slot '+(c&&c===selected?'pc-selected':'')+'" '+(c?'data-pc-pet="'+esc(c.id)+'"':'data-pc-view="stable"')+'><span class="pc-slot-label">'+label+'</span><span class="pc-slot-body"><span class="pc-avatar">'+esc(c?.icon||'＋')+'</span><span><b>'+esc(c?.name||'เลือกสัตว์')+'</b><small>'+(c?'Lv.'+c.level+' · '+esc(pcStatus(c)):'เปิดคอกสัตว์')+'</small></span></span></button>'}
function pcItem(it){return '<span>'+esc(it.icon||'📦')+' '+esc(itemName(it))+' <small>×'+(it.qty||1)+'</small></span>'}
function pcGearSlot(it){return ['right','left','petWeapon'].includes(it.slot)?'weapon':['armor','petArmor'].includes(it.slot)?'armor':it.slot==='petOrb'?'orb':null}
function pcContent(c,all){
 const view=fdPetTab;
 if(view==='stable'){
  const q=pcSearch.toLowerCase(),list=all.filter(x=>!q||(x.name+' '+x.species+' '+x.level).toLowerCase().includes(q));
  return '<h3>🏡 คอกสัตว์ทั้งหมด · '+all.length+' ตัว</h3><input class="input" id="pcSearch" placeholder="ค้นหาชื่อสัตว์ / สายพันธุ์" value="'+esc(pcSearch)+'"><div class="pc-roster">'+list.map(x=>pcSlot('รุ่น '+x.generation,x,c)).join('')+'</div>'+(list.length?'':'<div class="notice">ไม่พบสัตว์ในคอก</div>');
 }
 if(view==='breed'){
  const options=all.map((x,i)=>'<option value="'+esc(x.id)+'">'+esc(x.name)+' Lv.'+x.level+(x.breedReadyAt>Date.now()?' · รอ '+fdRemaining(x.breedReadyAt):'')+'</option>').join('');
  return '<h3>🧬 ห้องผสมพันธุ์</h3><div class="notice">สายพันธุ์เดียวกัน Lv.3 ขึ้นไป · ข้ามสายพันธุ์ Lv.8 ขึ้นไป · พ่อแม่พัก 5 ชั่วโมงหลังผสมพันธุ์</div><label>พ่อแม่ตัวที่ 1<select class="input" id="pcParentA">'+options+'</select></label><label>พ่อแม่ตัวที่ 2<select class="input" id="pcParentB">'+options+'</select></label><div class="notice" id="pcBreedReason"></div><button class="button gold full" id="pcBreed" '+(all.length<2?'disabled':'')+'>🧬 ผสมพันธุ์</button>';
 }
 if(!c)return '<div class="notice">ยังไม่มีสัตว์ในคอก · รับสัตว์เริ่มต้นหรือเปิดห้องฟักไข่</div>';
 const down=c.knockedUntil>Date.now(),dis=down?'disabled':'',gear=fdPetGear;
 if(view==='stats')return '<h3>📊 สเตตัส · '+esc(c.name)+'</h3><div class="notice">แต้มคงเหลือ <b>'+(c.sp||0)+'</b></div>'+['STR','VIT','AGI','INT'].map(k=>'<div class="statrow"><b>'+k+' · '+c.genes[k]+'</b><button class="button gold" data-pc-stat="'+k+'" '+(down||!c.sp?'disabled':'')+'>+1</button></div>').join('')+'<div class="section">ATK '+Math.floor(fdPetPower(c))+' · DEF '+Math.floor(fdPetDefense(c))+'</div>';
 if(view==='gear')return '<h3>⚔️ อุปกรณ์ · '+esc(c.name)+'</h3>'+['weapon','armor','orb'].map((slot,i)=>{const it=gear(c,slot),available=c.bag.filter(x=>x.type==='gear'&&pcGearSlot(x)===slot);return '<div class="section stack"><b>'+['⚔️ อาวุธ','🛡️ เกราะ','🔮 ลูกแก้ว'][i]+'</b><div>'+ (it?pcItem(it):'ว่าง')+'</div>'+(it?'<div class="line" style="flex-wrap:wrap"><button class="button gold" data-pc-enhance="'+slot+'" '+dis+'>ตีบวก</button><button class="button ghost" data-pc-unequip="'+slot+'" '+dis+'>ถอด</button></div>':'')+'<select class="input" data-pc-gearselect="'+slot+'" '+dis+'><option value="">เลือกของจากกระเป๋าสัตว์</option>'+available.map(x=>'<option value="'+esc(x.uid)+'">'+esc(itemName(x))+'</option>').join('')+'</select><button class="button ghost" data-pc-equip="'+slot+'" '+(down||!available.length?'disabled':'')+'>สวมใส่</button></div>'}).join('');
 if(view==='bag'){
  if(down)return '<div class="notice">🔒 กระเป๋าถูกล็อกระหว่างพักฟื้น '+fdRemaining(c.knockedUntil)+'</div>';
  return '<h3>🎒 กระเป๋า · '+esc(c.name)+'</h3><div class="section"><b>ของสัตว์ '+c.bag.length+'/24 ช่อง</b><div class="pc-items">'+(c.bag.map(it=>'<div class="fd-item">'+pcItem(it)+'<button class="button ghost sm" data-pc-take="'+esc(it.uid)+'">รับคืน</button></div>').join('')||'<div class="dim">กระเป๋าว่าง</div>')+'</div></div><div class="section"><b>ของตัวละคร '+p.items.length+'/80 ช่อง</b><div class="pc-items">'+(p.items.map(it=>'<div class="fd-item">'+pcItem(it)+'<button class="button ghost sm" data-pc-give="'+esc(it.uid)+'">ให้สัตว์</button></div>').join('')||'<div class="dim">กระเป๋าว่าง</div>')+'</div></div><div class="notice">ย้ายทั้งกอง · อุปกรณ์สัตว์อยู่ในเมนูอุปกรณ์</div>';
 }
 if(view==='settings')return '<h3>⚙️ ตั้งค่า · '+esc(c.name)+'</h3><div class="section stack"><b>🧪 ใช้ยาอัตโนมัติ</b>'+['HP','MP'].map(k=>'<label class="line" style="flex-wrap:wrap"><input id="pcAuto'+k+'" type="checkbox" '+(c['auto'+k]?'checked':'')+' '+dis+'> ใช้ยา '+k+' เมื่อ ≤ <input class="input" type="number" min="0" max="100" id="pcThreshold'+k+'" value="'+c[k.toLowerCase()+'Threshold']+'" style="width:75px" '+dis+'>%</label>').join('')+'<button class="button gold" id="pcSaveSettings" '+dis+'>บันทึกการใช้ยา</button></div>'+(p.activeMount===c.id?'<div class="section stack"><b>🐎 การควบคุมสัตว์ขี่</b><button class="button ghost" id="pcMountMode" '+dis+'>'+ (p.mountMode==='auto'?'Auto · โจมตีอัตโนมัติ':'Manual · สั่งโจมตีเอง')+'</button></div>':'');
 if(view==='evolve')return '<h3>🌟 ห้องวิวัฒนาการ</h3><div class="section stack"><b>'+esc(c.name)+' · ขั้น +'+c.evolution+'</b><div>ขั้นถัดไป +'+(c.evolution+1)+'</div><div>วัสดุพัฒนา '+(3+c.evolution)+' ชิ้น · '+(50+c.evolution*25)+' เหรียญ</div><button class="button gold" id="pcEvolve" '+dis+'>พัฒนาสัตว์ +1</button></div>';
 return '<div class="pc-hero"><span class="pc-portrait">'+esc(c.icon||'🐾')+'</span><div><h3>'+esc(c.name)+' · Lv.'+c.level+'</h3><div>'+esc(pcStatus(c))+' · รุ่น '+c.generation+' · '+'⭐'.repeat(clamp(c.rarity||1,1,5))+'</div><small>'+ (fdIsRideable(c)?'สามารถใช้เป็นสัตว์ขี่':'สัตว์เลี้ยง')+' · วิวัฒนาการ +'+c.evolution+'</small></div></div><div class="pc-live">'+pcBar('❤️ HP',c.hp,fdPetMaxHP(c),'#e16a66')+pcBar('💧 MP',c.mp,fdPetMaxMP(c),'#63a9ed')+pcBar('⭐ EXP',c.xp,Math.ceil(25*Math.pow(c.level,1.3)),'#73d29b')+'</div><div class="pc-statgrid">'+['STR','VIT','AGI','INT'].map(k=>'<div><small>'+k+'</small><b>'+c.genes[k]+'</b></div>').join('')+'</div><div class="section"><b>⚡ สกิล</b><div class="pc-chips">'+c.skills.map(k=>'<span>'+esc(PC_SKILLS[k]||k)+'</span>').join('')+'</div></div><div class="section stack"><b>จัดทีม</b><div class="pc-actions">'+[0,1,'mount'].filter(k=>k!=='mount'||fdIsRideable(c)).map(k=>'<button class="button '+((k==='mount'?p.activeMount:p.activePets[k])===c.id?'selected':'gold')+'" data-pc-slot="'+k+'" '+dis+'>'+ (k==='mount'?'🐎 สัตว์ขี่':'🐾 สัตว์เลี้ยง '+(k+1))+((k==='mount'?p.activeMount:p.activePets[k])===c.id?' ✓':'')+'</button>').join('')+'</div>'+(p.activePets.includes(c.id)||p.activeMount===c.id?'<button class="button ghost" id="pcRemove" '+dis+'>ถอดออกจากทีม</button>':'')+(p.activeMount===c.id?'<button class="button gold" id="pcRide" '+dis+'>'+(p.riding?'ลงจากสัตว์ขี่':'ขึ้นขี่')+'</button>':'')+'</div>'+(down?'<div class="notice">💤 พักฟื้น '+fdRemaining(c.knockedUntil)+'</div>':'')+(c.lineage?.length?'<div class="tiny dim">บรรพบุรุษ: '+c.lineage.map(x=>esc(x.name)).join(' · ')+'</div>':'');
}
fdShowPet=function(){
 if(!p)return;
 fdInit();fdWakePets();
 if(pcOwner!==p){pcOwner=p;pcSearch='';fdPetTab='team';fdPetIndex=p.companions.length?clamp(fdPetIndex,0,p.companions.length-1):0}
 const all=p.companions,c=all[fdPetIndex]||all[0]||null;
 if(c)fdPetIndex=all.indexOf(c);
 if(![...PC_TABS.map(x=>x[0]),'stable','breed','evolve'].includes(fdPetTab))fdPetTab='team';
 const win=v09Window('pet','🐾 ศูนย์จัดการสัตว์เลี้ยง');
 win.style.zIndex=String(++highestZ);
 const content=win.querySelector('.v09-content'),oldScroll=content.scrollTop;
 const tabs=PC_TABS.map(([key,icon,label])=>'<button class="pc-tab '+(fdPetTab===key?'pc-selected':'')+'" data-pc-view="'+key+'">'+icon+' '+label+'</button>').join('');
 const systems=PC_SYSTEMS.map(([key,icon,label,desc])=>'<button class="pc-system '+(fdPetTab===key?'pc-selected':'')+'" data-pc-view="'+key+'"><span>'+icon+'</span><span><b>'+label+'</b><small>'+desc+'</small>'+(key==='hatch'&&p.hatchJob?'<small class="pc-hatch-status">'+(Date.now()>=p.hatchJob.readyAt?'พร้อมรับสัตว์':'กำลังฟัก · '+fdRemaining(p.hatchJob.readyAt))+'</small>':'')+'</span></button>').join('');
 content.innerHTML='<div class="pc-layout"><aside class="pc-team"><h3>🐾 ทีมใช้งาน</h3>'+pcSlot('สัตว์เลี้ยง 1',fdPetById(p.activePets[0]),c)+pcSlot('สัตว์เลี้ยง 2',fdPetById(p.activePets[1]),c)+pcSlot('สัตว์ขี่',fdPetById(p.activeMount),c)+'<button class="pc-system" data-pc-view="stable">🏡 คอกสัตว์ทั้งหมด ('+all.length+')</button>'+(!p.starterPetsClaimed?'<button class="button gold full" id="pcStarter">🎁 รับสัตว์เริ่มต้น</button>':'')+'</aside><aside class="pc-nav"><h3>ระบบสัตว์เลี้ยง</h3>'+systems+'</aside><section class="pc-center"><div class="pc-tabs">'+tabs+'</div>'+(c?'<div class="pc-current">'+esc(c.icon)+' <b>'+esc(c.name)+'</b> · Lv.'+c.level+' <button class="button ghost sm" data-pc-view="stable">เปลี่ยนสัตว์</button></div>':'')+'<div class="pc-main stack">'+pcContent(c,all)+'</div></section></div>';
 content.scrollTop=oldScroll;
 const find=id=>content.querySelector('#'+id),on=(id,fn)=>{const el=find(id);if(el)el.onclick=fn};
 const go=view=>{if(view==='hatch'){fdShowHatch();return}fdPetTab=view;content.scrollTop=0;fdShowPet()};
 content.querySelectorAll('[data-pc-view]').forEach(b=>b.onclick=()=>go(b.dataset.pcView));
 content.querySelectorAll('[data-pc-pet]').forEach(b=>b.onclick=()=>{const i=p.companions.findIndex(x=>x.id===b.dataset.pcPet);if(i>=0){fdPetIndex=i;go('team')}});
 const search=find('pcSearch');if(search)search.oninput=()=>{pcSearch=search.value;const q=pcSearch.toLowerCase();const roster=content.querySelector('.pc-roster');roster.innerHTML=all.filter(x=>!q||(x.name+' '+x.species+' '+x.level).toLowerCase().includes(q)).map(x=>pcSlot('รุ่น '+x.generation,x,c)).join('');roster.querySelectorAll('[data-pc-pet]').forEach(b=>b.onclick=()=>{fdPetIndex=all.findIndex(x=>x.id===b.dataset.pcPet);go('team')})};
 on('pcStarter',fdStarterPets);
 const valid=()=>p===pcOwner&&c&&p.companions.includes(c)&&c.knockedUntil<=Date.now();
 content.querySelectorAll('[data-pc-slot]').forEach(b=>b.onclick=()=>{if(valid())fdSetPet(b.dataset.pcSlot==='mount'?'mount':Number(b.dataset.pcSlot),c.id)});
 on('pcRemove',()=>{if(!valid())return;const slot=p.activePets.indexOf(c.id);if(p.activeMount===c.id)fdSetPet('mount',c.id);else if(slot>=0)fdSetPet(slot,c.id)});
 on('pcRide',()=>{if(valid()&&p.activeMount===c.id){p.riding=!p.riding;save();fdShowPet()}});
 content.querySelectorAll('[data-pc-stat]').forEach(b=>b.onclick=()=>{if(!valid()||!c.sp||!['STR','VIT','AGI','INT'].includes(b.dataset.pcStat))return;c.sp--;c.genes[b.dataset.pcStat]++;c.hp=Math.min(fdPetMaxHP(c),c.hp);c.mp=Math.min(fdPetMaxMP(c),c.mp);save();fdShowPet()});
 content.querySelectorAll('[data-pc-enhance]').forEach(b=>b.onclick=()=>{if(valid())fdEnhancePetGear(c,b.dataset.pcEnhance)});
 content.querySelectorAll('[data-pc-unequip]').forEach(b=>b.onclick=()=>{if(valid())v09UnequipPet(c,b.dataset.pcUnequip)});
 content.querySelectorAll('[data-pc-equip]').forEach(b=>b.onclick=()=>{if(!valid())return;const slot=b.dataset.pcEquip,uid=content.querySelector('[data-pc-gearselect="'+slot+'"]').value;const i=c.bag.findIndex(x=>x.uid===uid);if(i>=0)fdEquipPet(c,slot,i);else toast('เลือกอุปกรณ์ก่อน')});
 content.querySelectorAll('[data-pc-take]').forEach(b=>b.onclick=()=>{if(valid()){const i=c.bag.findIndex(x=>x.uid===b.dataset.pcTake);if(i>=0)fdTransferItem(c,i,false)}});
 content.querySelectorAll('[data-pc-give]').forEach(b=>b.onclick=()=>{if(valid()){const i=p.items.findIndex(x=>x.uid===b.dataset.pcGive);if(i>=0)fdTransferItem(c,i,true)}});
 on('pcSaveSettings',()=>{if(!valid())return;for(const k of ['HP','MP']){c['auto'+k]=find('pcAuto'+k).checked;c[k.toLowerCase()+'Threshold']=clamp(Number(find('pcThreshold'+k).value)||0,0,100)}save();fdShowPet();toast('บันทึกการใช้ยาแล้ว')});
 on('pcMountMode',()=>{if(valid()&&p.activeMount===c.id){p.mountMode=p.mountMode==='auto'?'manual':'auto';save();fdUpdateHotbar();fdShowPet()}});
 on('pcEvolve',()=>{if(valid())fdEvolvePet(c)});
 if(fdPetTab==='settings'&&c)petLootPanel(win);
 const a=find('pcParentA'),b=find('pcParentB');if(a&&b){if(all.length>1)b.selectedIndex=1;const update=()=>{const reason=fdCanBreed(fdPetById(a.value),fdPetById(b.value));find('pcBreedReason').textContent=reason||'พร้อมผสมพันธุ์';find('pcBreed').disabled=Boolean(reason)};a.onchange=b.onchange=update;update();on('pcBreed',()=>fdBreed(a.value,b.value))}
};
showPet=fdShowPet;
setInterval(()=>{
 const win=windowMap.get('pet');if(!p||p!==pcOwner||!win||win.style.display==='none')return;
 const status=win.querySelector('.pc-hatch-status');if(status&&p.hatchJob)status.textContent=Date.now()>=p.hatchJob.readyAt?'พร้อมรับสัตว์':'กำลังฟัก · '+fdRemaining(p.hatchJob.readyAt);
 const c=p.companions[fdPetIndex],live=win.querySelector('.pc-live');if(c&&live)live.innerHTML=pcBar('❤️ HP',c.hp,fdPetMaxHP(c),'#e16a66')+pcBar('💧 MP',c.mp,fdPetMaxMP(c),'#63a9ed')+pcBar('⭐ EXP',c.xp,Math.ceil(25*Math.pow(c.level,1.3)),'#73d29b');
},1000);
function v09Refresh(){
 for(const [key,node] of windowMap){
   if(node.style.display==='none')continue;
   if(key==='bag')v09ShowBag();
   if(key==='equip')v09ShowEquip();
   if(key==='stats')v09ShowStats();
 }
}
function v09SpawnGround(it,x,y,source){
 if(!p||!it)return;
 v09Init();
 const created=Date.now(),n=p.groundLoot.filter(x=>x.map===p.map).length;
 const targetX=clamp(x+Math.sin(n*2.4)*20,30,WORLD.w-30),targetY=clamp(y+Math.cos(n*2.1)*16,45,WORLD.h-45);
 const ground={id:guid(),item:makeItem(it,it.qty||1),x:targetX,y:targetY,map:p.map,
   owner:accountId||'local',ownerChar:p.name,createdAt:created,publicAt:created+RULES.ownerMs,expiresAt:created+RULES.expireMs,source:source||'drop'};
 delete ground.item.bagSlot;
 p.groundLoot.push(ground);save();return ground;
}
function v09Discard(index){
 if(!p||index<0)return;
 const it=p.items[index];if(!it)return;
 if(critical(it)&&!confirm('⚠️ ไอเทมหายาก/ตีบวก: ต้องการทิ้ง '+itemName(it)+' จริงหรือไม่?'))return;
 let qty=it.qty||1;
 if(isStack(it)&&qty>1){
   const raw=prompt('ทิ้งจำนวนเท่าไร (1–'+qty+')?',String(qty));
   if(raw===null)return;
   qty=Math.floor(Number(raw));if(!Number.isSafeInteger(qty)||qty<1||qty>it.qty)return toast('จำนวนไม่ถูกต้อง');
 }
 v09SpawnGround({...it,qty},p.x+18,p.y+20,'player');
 consume(p.items,index,qty);currentUid=null;save();v09ShowBag();toast('🗑️ ทิ้ง '+it.name+' ×'+qty+' ลงพื้นแล้ว');
}
function v09DropMonsterLoot(mon){
 // Precisely 40% of monster/boss kills drop ONE item. A successful roll
 // then chooses the item category; boss rewards have better quality weights.
 if(Math.random()>=RULES.dropChance)return false;
 const roll=Math.random();
 const boss=Boolean(mon.boss);
 const eggWeight=(boss?EGG_DROP.boss:(EGG_DROP[mon.mood]??EGG_DROP.normal))/RULES.dropChance;
 let item;
 if(boss){
   if(roll<.36){
     const ids={left:['slash','fire','heal'],right:['roar','thunder','wind'],bottom:['wave','ice','guard']}[p.map]||['slash'];
     const id=Math.random()<.7?ids[rand(0,ids.length-1)]:FD_SCROLL_IDS[rand(0,FD_SCROLL_IDS.length-1)];
     item={...fdMakeScroll(id),rarity:4,qty:1};
   }else if(roll<.36+eggWeight){
     const sp={left:'slime',right:'wolf',bottom:'crab'}[p.map]||'wolf';
     item={name:'ไข่สัตว์: '+FD_SPECIES[sp].name,icon:'🥚',type:'petEgg',species:sp,rarity:4,qty:1,desc:'ฟักเป็นสัตว์เลี้ยง'};
   }else if(roll<.65){
     item={name:'วัสดุพัฒนา',icon:'🧱',type:'material',desc:'วัสดุอัปเกรด',rarity:1,qty:1};
   }else if(roll<.89){
     item={...(Math.random()<.55?SHOP[rand(0,5)]:FD_PET_GEAR[rand(0,FD_PET_GEAR.length-1)]),rarity:4,qty:1};
   }else if(roll<.97){
     item={...SHOP[9],rarity:3,qty:1};
   }else{
     item={...SHOP[8],rarity:2,qty:1};
   }
 }else{
   if(roll<.48){
     item={name:'วัสดุพัฒนา',icon:'🧱',type:'material',desc:'วัสดุอัปเกรด',rarity:1,qty:1};
   }else if(roll<.63){
     item={...SHOP[8],rarity:2,qty:1};
   }else if(roll<.69){
     item={...SHOP[9],rarity:3,qty:1};
   }else if(roll<.87){
     const ids={left:['slash','fire','heal'],right:['roar','thunder','wind'],bottom:['wave','ice','guard']}[p.map]||['slash'];
     const id=Math.random()<.6?ids[rand(0,ids.length-1)]:FD_SCROLL_IDS[rand(0,FD_SCROLL_IDS.length-1)];
     item={...fdMakeScroll(id),rarity:2,qty:1};
   }else if(roll<.87+eggWeight){
     const sp=['wolf','fox','horse','slime','crab'][rand(0,4)];
     item={name:'ไข่สัตว์: '+FD_SPECIES[sp].name,icon:'🥚',type:'petEgg',species:sp,rarity:2,qty:1,desc:'ฟักเป็นสัตว์เลี้ยง'};
   }else if(roll<.96){
     item={name:'วัสดุพัฒนา',icon:'🧱',type:'material',desc:'วัสดุอัปเกรด',rarity:1,qty:1};
   }else{
     item={...(Math.random()<.7?SHOP[rand(0,5)]:FD_PET_GEAR[rand(0,FD_PET_GEAR.length-1)]),rarity:2,qty:1};
   }
 }
 if(item.type==='gear'&&typeof fd95RollRarity==='function')item.rarity=fd95RollRarity(boss);
 return Boolean(v09SpawnGround(item,mon.x,mon.y,'monster'));
}
function v09KillEnemy(mon){
 const idx=enemies.findIndex(e=>e.uid===mon.uid);
 if(idx>=0)enemies.splice(idx,1);
 p.coins+=mon.coin; // Keep the original v0.8 automatic coin reward until the owner decides.
 gainExp(mon.xp);
 if(p.quest.active&&!p.quest.done)p.quest.kills++;
 const dropped=v09DropMonsterLoot(mon);save();
 effects.push({x:mon.x,y:mon.y-50,text:'EXP +'+mon.xp,life:1100,max:1100,color:'#f9da8a'});
 toast((mon.boss?'👑 บอส ':'กำจัด ')+mon.name+' สำเร็จ! '+(dropped?'มีไอเทมตกบนพื้น 📦':'ครั้งนี้ไม่มีไอเทมดรอป'));
 const map=p.map;
 if(typeof window.fd96ScheduleRespawn==='function')window.fd96ScheduleRespawn(mon,map);
 else setTimeout(()=>{
   if(p&&p.map===map&&map!=='town'&&enemies.length<7){
     enemies.push({uid:guid(),x:rand(120,830),y:rand(145,510),
       hp:map==='left'?40:map==='right'?80:60,max:map==='left'?40:map==='right'?80:60,
       name:map==='left'?'สไลม์':map==='right'?'หมาป่า':'ปูเวท',
       color:map==='left'?'#5de0a4':map==='right'?'#a9a2a3':'#ee9c76',
       atk:map==='left'?4:map==='right'?9:6,xp:map==='left'?28:map==='right'?47:38,
       coin:map==='left'?16:map==='right'?30:24,lastAttack:0});
   }
 },2400);
}
function v09CanCollect(drop){
 return drop&&drop.expiresAt>Date.now()&&(drop.owner===accountId||Date.now()>=drop.publicAt);
}
function v09Pickup(drop,targetPet,quiet,deferSync=false){
 if(!p||!drop)return false;
 if(!v09CanCollect(drop)){if(!quiet)toast('🔒 ยังอยู่ในช่วงสิทธิ์เก็บของเจ้าของ 1 นาที');return false}
 if(drop.map!==p.map)return false;
 if(dist(p,drop)> (targetPet?RULES.petRange:RULES.pickupRange))return false;
 const bag=targetPet?.lootTarget==='pet'?targetPet.bag:p.items;
 const max=bag===p.items?80:24;
 if(!addItem(bag,drop.item,drop.item.qty||1,max)){
   if(!quiet)toast('🎒 กระเป๋าปลายทางเต็ม');
   return false;
 }
 const idx=p.groundLoot.findIndex(it=>it.id===drop.id);
 if(idx>=0)p.groundLoot.splice(idx,1);
 if(!deferSync){save();v09Refresh()}
 if(!quiet)toast('📦 เก็บ '+drop.item.name+' สำเร็จ');
 return true;
}
function v09CollectAll(quiet=false){
 // One tap collects every eligible drop in pickup range. Locked/out-of-range
 // drops stay on the ground, and bag-full drops are never consumed.
 if(!p||gamePaused||ui)return 0;
 const candidates=(p.groundLoot||[])
   .filter(x=>x.map===p.map&&x.expiresAt>Date.now()&&dist(p,x)<=RULES.pickupRange)
   .sort((a,b)=>dist(p,a)-dist(p,b));
 let collected=0,full=false,locked=0;
 for(const drop of candidates){
   if(!v09CanCollect(drop)){locked++;continue}
   if(v09Pickup(drop,null,true,true)){collected++}
   else{full=true}
 }
 if(collected){save();v09Refresh();if(!quiet)toast('📦 เก็บได้ '+collected+' ชิ้น'+(full?' · กระเป๋าเต็ม ยังมีของเหลือบนพื้น':' สำเร็จ'))}
 else if(!quiet){
   if(full)toast('🎒 กระเป๋าเต็ม เก็บของเพิ่มไม่ได้');
   else if(locked)toast('🔒 ของที่อยู่ใกล้ยังเป็นสิทธิ์ของผู้เล่นอื่น');
   else toast('ไม่มีไอเทมที่เก็บได้ในระยะ');
 }
 return collected;
}

function v09TapLoot(id){
 const drop=p.groundLoot.find(x=>x.id===id);
 if(!drop)return;
 if(!v09CanCollect(drop))return toast('🔒 ยังไม่ครบ 1 นาทีของเจ้าของ');
 if(dist(p,drop)<=RULES.pickupRange)return v09Pickup(drop,null,false);
 walkTarget={x:drop.x,y:drop.y};pendingLootId=drop.id;
 toast('กำลังเดินไปเก็บ '+drop.item.name);
}
function v09DrawGroundLoot(){
 if(!p)return;
 const now=Date.now();
 // Skip drawing off-camera world loot while keeping its gameplay/timers intact.
 const scale=view.scale||1;
 const minX=-view.x/scale-52,maxX=(view.cw-view.x)/scale+52;
 const minY=-view.y/scale-52,maxY=(view.ch-view.y)/scale+52;
 const eco=typeof perfMode!=='undefined'&&perfMode==='eco';
 for(const drop of p.groundLoot||[]){
   if(drop.map!==p.map||drop.expiresAt<=now||
     drop.x<minX||drop.x>maxX||drop.y<minY||drop.y>maxY)continue;
   const rarity=drop.item.rarity||1;
   const color=['','#d1e8e1','#93d89c','#80afff','#c68bff','#f7d179'][rarity]||'#d1e8e1';
   ctx.save();ctx.shadowColor=color;ctx.shadowBlur=eco?0:(rarity>=3?12:2);
   ctx.textAlign='center';ctx.font='24px Arial';ctx.fillText(drop.item.icon||'📦',drop.x,drop.y+4);
   ctx.shadowBlur=0;ctx.fillStyle=color;ctx.font='10px sans-serif';
   ctx.fillText(String(drop.item.name||'ไอเทม').slice(0,17),drop.x,drop.y-20);
   if(!v09CanCollect(drop)){ctx.fillStyle='#ffdd9d';ctx.fillText('🔒',drop.x+24,drop.y+4)}
   ctx.restore();
 }
}
function v09PetAutoPickup(){
 const threats=enemies.filter(x=>x.hp>0&&dist(p,x)<180);
 for(const c of fdActivePets()){
   if(!c.skills?.includes('treasure')||!c.lootEnabled)continue;
   if(c.lootMode==='combat'&&threats.length)continue;
   if(c.lootMode==='balanced'&&threats.some(x=>dist(x,p)<110))continue;
   const target=(p.groundLoot||[]).filter(x=>x.map===p.map&&dist(p,x)<=RULES.petRange&&v09CanCollect(x)&&
      (x.item.rarity||1)>=c.lootRarity&&c.lootTypes.includes(nameType(x.item)))
      .sort((a,b)=>dist(p,a)-dist(p,b))[0];
   if(target){v09Pickup(target,c,true);break}
 }
}
function v09Tick(dt){
 if(!p)return;
 const now=Date.now();
 // Inventory migration/matching remains available immediately via fdInit/UI,
 // but the heavier full inventory normalization need not run every simulation tick.
 if(p!==v09LastTickPlayer||!p.v09InventoryMigrated||now-v09LastTickInit>=1500){
   v09LastTickPlayer=p;v09LastTickInit=now;v09Init();
 }
 if(now-lastSweep>=1000){
   lastSweep=now;
   const before=p.groundLoot.length;
   p.groundLoot=p.groundLoot.filter(x=>x.expiresAt>now);
   if(before!==p.groundLoot.length)save();
 }
 if(pendingLootId){
   const drop=p.groundLoot.find(x=>x.id===pendingLootId&&x.map===p.map);
   if(!drop){pendingLootId=null}
   else if(dist(p,drop)<=RULES.pickupRange){pendingLootId=null;walkTarget=null;v09Pickup(drop,null,false)}
 }
 if(p.autoPickup&&now-lastAutoPickup>=700){
   lastAutoPickup=now;
   if((p.groundLoot||[]).some(x=>x.map===p.map&&dist(p,x)<=RULES.pickupRange&&v09CanCollect(x))){
     v09CollectAll(true);
   }
 }
 if(now-lastPetPickup>=600){
   lastPetPickup=now;v09PetAutoPickup();
 }
}
window.v09Tick=v09Tick;
window.v09DrawGroundLoot=v09DrawGroundLoot;
window.v09KillEnemy=v09KillEnemy;
window.v09CriticalItem=critical;
function installPickup(){
 const button=document.createElement('button');button.id='v09PickupBtn';button.type='button';button.textContent='📦 เก็บทั้งหมด';
 $('worldWrap').appendChild(button);
 button.addEventListener('pointerdown',e=>{
   if(!p||gamePaused||ui)return;
   e.preventDefault();e.stopPropagation();
   v09CollectAll();
 });
 canvas.addEventListener('pointerdown',e=>{
   if(!p||gamePaused||ui||!here())return;
   const m=pointerWorld(e);
   const target=(p.groundLoot||[]).filter(x=>x.map===p.map&&x.expiresAt>Date.now()&&dist(x,m)<32)
       .sort((a,b)=>dist(a,m)-dist(b,m))[0];
   if(target){e.stopImmediatePropagation();e.preventDefault();v09TapLoot(target.id)}
 },true);
}
installPickup();
window.addEventListener('resize',()=>{
 for(const node of windowMap.values()){
   const rect=node.getBoundingClientRect();clampWindow(node,rect.left,rect.top);
 }
});
})();