(function feedDays095(){
'use strict';
/* FEED DAYS v0.9.5 — persistent equipment rarity, +7 traits, opt-in sorting and pickup.
   No online claims: all character settings and loot remain local to this prototype. */
const TIERS=[
 null,
 {name:'ทั่วไป',icon:'⚪',color:'#d9e3e8'},
 {name:'พิเศษ',icon:'🟢',color:'#8ee4a5'},
 {name:'หายาก',icon:'🔵',color:'#83b9ff'},
 {name:'มหากาพย์',icon:'🟣',color:'#cf9cff'},
 {name:'ตำนาน',icon:'🟡',color:'#ffe08a'}
];
const TRAITS={
 attack:{label:'พลังอาวุธ',unit:' ATK',amount:n=>n*3},
 critical:{label:'ความเฉียบคม',unit:'% CRIT',amount:n=>n*2},
 magic:{label:'พลังอาคม',unit:' เวท',amount:n=>n*4},
 defense:{label:'เกราะพิทักษ์',unit:' DEF',amount:n=>n*3},
 hp:{label:'พลังชีวิต',unit:' HP',amount:n=>n*20},
 mp:{label:'พลังมานา',unit:' MP',amount:n=>n*12}
};
const rank=it=>TIERS[Math.max(1,Math.min(5,Number(it?.rarity)||1))];
function hashCode(text){let h=2166136261;for(const ch of String(text)){h=Math.imul(h^ch.charCodeAt(0),16777619)}return h>>>0}
function traitOptions(slot){
 if(slot==='petWeapon')return ['attack'];
 if(slot==='petArmor')return ['defense','hp'];
 if(slot==='petOrb')return ['attack','mp'];
 if(['right','left'].includes(slot))return ['attack','critical','magic'];
 return ['defense','hp','mp'];
}
function traitId(it){
 if(!it||it.type!=='gear'||(Number(it.enh)||0)<7)return null;
 const options=traitOptions(it.slot);
 if(it.affixId&&options.includes(it.affixId))return it.affixId;
 return options[hashCode((it.uid||'')+':'+it.name+':'+it.slot)%options.length];
}
function ensureTrait(it){
 if(!it||it.type!=='gear'||(Number(it.enh)||0)<7||it.affixId)return false;
 it.affixId=traitId(it);return true;
}
function traitLevel(it){const e=Number(it?.enh)||0;return e<7?0:e>=10?3:e>=9?2:1}
function traitText(it){
 const id=traitId(it);if(!id)return '';
 const trait=TRAITS[id],n=traitLevel(it);
 return '✨ '+trait.label+' +'+trait.amount(n)+trait.unit+' (ปลดล็อก +7; แข็งแกร่งขึ้นที่ +9/+10)';
}
function bonus(it){
 const result={attack:0,defense:0,hp:0,mp:0,critical:0,magic:0};
 if(!it||it.type!=='gear')return result;
 const t=Math.max(1,Math.min(5,Number(it.rarity)||1));
 // A tier adds to existing base ATK/DEF, not to already applied enhancements/stars.
 for(const [field,target] of [['atk','attack'],['def','defense']]){
   const base=Number(it[field])||0;
   if(base>0&&t>1)result[target]+=Math.round(base*(t-1)*.12)+(t-1);
 }
 const id=traitId(it);
 if(id)result[id]+=TRAITS[id].amount(traitLevel(it));
 return result;
}
function sum(items){
 const total={attack:0,defense:0,hp:0,mp:0,critical:0,magic:0};
 for(const it of items){const b=bonus(it);for(const k in total)total[k]+=b[k]}
 return total;
}
function playerBonus(){
 if(!p)return sum([]);
 return sum(Object.values(p.equippedItems||{}).filter(Boolean));
}
function petBonus(c){return sum(Object.values(c?.equippedItems||{}).filter(Boolean))}
function bonusText(it){
 if(!it||it.type!=='gear')return '';
 const b=bonus(it);const rows=[];
 if(b.attack)rows.push('ATK +'+b.attack);
 if(b.defense)rows.push('DEF +'+b.defense);
 if(b.hp)rows.push('HP +'+b.hp);
 if(b.mp)rows.push('MP +'+b.mp);
 if(b.critical)rows.push('คริติคอล +'+b.critical+'%');
 if(b.magic)rows.push('เวท +'+b.magic);
 return rows.join(' · ');
}
function orderItems(a,b){
 const tierA=Number(a.rarity)||1,tierB=Number(b.rarity)||1;
 if(tierA!==tierB)return tierB-tierA;
 const aGroup=a.type==='gear'?0:a.type==='skillScroll'?1:a.type==='petEgg'?2:a.type?.startsWith('potion')?4:3;
 const bGroup=b.type==='gear'?0:b.type==='skillScroll'?1:b.type==='petEgg'?2:b.type?.startsWith('potion')?4:3;
 if(aGroup!==bGroup)return aGroup-bGroup;
 const nameCompare=String(a.name||'').localeCompare(String(b.name||''),'th');
 if(nameCompare)return nameCompare;
 if((b.enh||0)!==(a.enh||0))return (b.enh||0)-(a.enh||0);
 if((b.stars||0)!==(a.stars||0))return (b.stars||0)-(a.stars||0);
 return 0;
}
function sortBag(){
 if(!p)return;
 // Manual layout remains untouched until the player explicitly requests sorting.
 p.items.sort(orderItems);
 p.items.forEach((it,i)=>it.bagSlot=i);
 save();showBag();toast('✅ จัดเรียงกระเป๋าตามความหายากเรียบร้อย');
}
function sortBank(tab='personal'){
 if(!p)return;
 const selected=tab==='shared'?account()?.sharedBank:p.bank;
 if(!selected||!Array.isArray(selected.items))return;
 selected.items.sort(orderItems);save();showBank(tab);
 toast('✅ จัดเรียง'+(tab==='shared'?'คลังรวม':'คลังตัวละคร')+'เรียบร้อย');
}
function rollRarity(boss=false){
 const r=Math.random()*100;
 const weights=boss?[20,30,26,18,6]:[60,25,10,4,1];
 let sum=0;
 for(let i=0;i<weights.length;i++){sum+=weights[i];if(r<sum)return i+1}
 return 5;
}
const previousMakeItem=makeItem;
makeItem=function(it,qty=1){
 const newItem=previousMakeItem(it,qty);
 if(newItem?.type==='gear'){
   newItem.rarity=Math.max(1,Math.min(5,Number(newItem.rarity)||1));
   ensureTrait(newItem);
 }
 return newItem;
};
const previousItemName=itemName;
itemName=function(it){
 if(!it)return '';
 return (it.type==='gear'?rank(it).icon+' '+rank(it).name+' · ':'')+previousItemName(it);
};
const previousAttackPower=attackPower,previousDefense=defense,previousMaxHP=maxHP,previousMaxMP=maxMP;
attackPower=function(){return previousAttackPower()+playerBonus().attack};
defense=function(){return previousDefense()+playerBonus().defense};
maxHP=function(){return previousMaxHP()+playerBonus().hp};
maxMP=function(){return previousMaxMP()+playerBonus().mp};
const previousPetPower=fdPetPower,previousPetDefense=fdPetDefense,previousPetHP=fdPetMaxHP,previousPetMP=fdPetMaxMP;
fdPetPower=function(c){return previousPetPower(c)+petBonus(c).attack};
fdPetDefense=function(c){return previousPetDefense(c)+petBonus(c).defense};
fdPetMaxHP=function(c){return previousPetHP(c)+petBonus(c).hp};
fdPetMaxMP=function(c){return previousPetMP(c)+petBonus(c).mp};
let initializedPlayer=null;
function initCharacter(){
 if(!p||p===initializedPlayer)return;
 initializedPlayer=p;let changed=false;
 if(typeof p.autoPickup!=='boolean'){p.autoPickup=false;changed=true}
 const containers=[p.items,Object.values(p.equippedItems||{}),p.bank?.items];
 try{const a=account();if(a?.sharedBank?.items)containers.push(a.sharedBank.items)}catch(e){}
 for(const c of p.companions||[]){containers.push(c.bag,Object.values(c.equippedItems||{}))}
 for(const container of containers){
   if(!Array.isArray(container))continue;
   for(const it of container){if(ensureTrait(it))changed=true}
 }
 syncAutoPickup();
 if(changed)save();
}
const previousShowScreen=showScreen;
showScreen=function(id){previousShowScreen(id);if(id==='game')initCharacter()};
const previousShowBank=showBank;
showBank=function(tab='personal'){
 previousShowBank(tab);
 const tabs=$('modalBody')?.querySelector('.tabs');if(!tabs)return;
 const button=document.createElement('button');button.type='button';button.className='button gold sm';
 button.textContent='🧹 จัดเรียงคลังอัตโนมัติ';
 button.title='เรียงความหายากสูงสุดก่อน แล้วตามประเภทและชื่อ ไม่ทิ้งของ';
 button.onclick=()=>sortBank(tab);
 tabs.insertAdjacentElement('afterend',button);
};
function syncAutoPickup(){
 const checkbox=$('fd95AutoPickup');
 if(checkbox)checkbox.checked=Boolean(p?.autoPickup);
 const text=$('fd95AutoPickupText');
 if(text)text.textContent=p?.autoPickup?'เปิด Auto Pickup':'ปิด Auto Pickup';
}
function setupAutoPickup(){
 const wrap=$('worldWrap');if(!wrap)return;
 const style=document.createElement('style');
 style.textContent='#fd95AutoPickupWrap{position:absolute;z-index:7;right:164px;bottom:calc(157px + env(safe-area-inset-bottom));'+
  'padding:7px 9px;border:1px solid #8bc8be;border-radius:10px;background:#143c3cdb;'+
  'color:#f5fffa;font-size:12px;box-shadow:0 3px 10px #0018;max-width:145px;touch-action:manipulation}'+
  '#fd95AutoPickupWrap input{accent-color:#9fe8b3;width:16px;height:16px;vertical-align:middle}'+
  '@media(max-width:600px){#fd95AutoPickupWrap{right:90px;bottom:calc(180px + env(safe-area-inset-bottom));'+
  'font-size:10px;padding:6px;max-width:125px}}';
 document.head.appendChild(style);
 const label=document.createElement('label');label.id='fd95AutoPickupWrap';
 label.innerHTML='<input type="checkbox" id="fd95AutoPickup"> <span id="fd95AutoPickupText">ปิด Auto Pickup</span>';
 wrap.appendChild(label);
 label.querySelector('input').addEventListener('change',e=>{
   if(!p){e.target.checked=false;return}
   p.autoPickup=Boolean(e.target.checked);save();syncAutoPickup();
   toast(p.autoPickup?'📦 เปิดเก็บไอเทมอัตโนมัติในระยะแล้ว':'ปิดเก็บไอเทมอัตโนมัติ');
 });
}
setupAutoPickup();
window.fd95RarityName=it=>rank(it).name;
window.fd95Tier=rank;
window.fd95TraitText=traitText;
window.fd95BonusText=bonusText;
window.fd95AwardAffix=ensureTrait;
window.fd95CritBonus=()=>playerBonus().critical/100;
window.fd95MagicBonus=()=>playerBonus().magic;
window.fd95RollRarity=rollRarity;
window.fd95SortBag=sortBag;
window.fd95SortBank=sortBank;
window.fd95SyncAutoPickup=syncAutoPickup;
window.fd95InitCharacter=initCharacter;
})();