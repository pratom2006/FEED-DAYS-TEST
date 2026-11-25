# FEED DAYS — Project Context (2026-11-25)

This file is the canonical design and state handoff for new ChatGPT conversations. Always inspect current GitHub source before changing code. Backup the current main branch before modifying working systems. The original owner uses iPad/iPhone only. Stay within low-cost, browser-first development.

## Project identity
- Title: FEED DAYS; prototype also labels itself Fantasy Realm.
- Genre: fantasy 2D pixel-art top-down exploration MMORPG **vision**. Current build: local, single-player browser prototype, not a real online MMORPG.
- Main repo: `pratom2006/FEED-DAYS-TEST`, GitHub Pages: `https://pratom2006.github.io/FEED-DAYS-TEST/`.
- Inputs: touch joystick, touch-to-move, simultaneous multi-touch combat; Safari Add to Home Screen recommended.
- Growth: classless character; STR, VIT, AGI, DEX, INT, LUX, 10 status points per level, ambition of expandable/unlimited levels, PvE and PvP. Maintain balance through diminishing returns and server validation later.

## Agreed skill rules
- Skills **never require an equipped weapon or fixed class**. They are learned by **using a matching skill scroll**.
- Scrolls immediately display skill **name and category/type**, not complete skill effects; unlearned skills are hidden entirely from the skill library.
- A used scroll unlocks the skill permanently on that character. A duplicate scroll adds skill EXP, and actual skill use also gains EXP. Skills have no planned maximum advancement rank, but costs and potency need scaling balance.
- Character has six assignable active skill slots (current prototype); users may change skill selections at any time, including during combat.
- Different monsters and bosses may drop both species-specific scrolls and random scrolls. No full undiscovered skill encyclopedia.
- All scroll types should be freely player-tradable in the future; no forced soulbinding. Trading requires an authoritative online backend; it is NOT live in v0.8.
- Theme: “กากที่ไม่กาก” — low-tier skills can grow formidable after sustained investment, but skill identities stay distinct.

## Agreed pet & mount rules
- Unlimited **collection goal**, practical storage limits in current localStorage prototype. Up to **2 summoned combat pets + 1 active mount** simultaneously.
- Combat pets attack, cast support skills and buffs automatically. Mounts can use Auto or player-controlled Manual skill mode; some mounts are travel-only and some combat-capable as the bestiary grows.
- Every companion has level, XP, stats, HP/MP, skills, bag, and gear. Base companions evolve and can improve; low-rarity companions need not become worthless.
- 3 companion equipment slots: weapon, armor, skill orb. Compatible player gear is equip-able by companions; pet-specific gear is stronger at comparable level; upgrades/enhancement work on companion gear.
- Each companion has their **own bag** with auto-HP/MP potions taken **only from its own bag**, individually configurable HP/MP percentage thresholds, with **no potion cooldown**.
- At HP 0, the companion is incapacitated for **10 real minutes**. Its bag cannot be opened, transferred from, or changed while down. Items and gear remain safe. Cooldown must persist across game restarts; in future online mode the server must own the timer.
- Both pet and mount capture, egg hatching, and rare boss drops are desired acquisition paths.

## Breeding / bloodlines — latest decision
- Collect pets without intended upper limit. Pets may breed within a species, or across species under requirements.
- **Both parents remain alive, owned and reusable** after breeding. Each parent has its own **5-hour real-time breeding cooldown**, persisted through save/load.
- Offspring has genes/stats inherited from parents, with random positive and negative deviations, potential rarity changes, some inherited abilities/buffs, occasional mutation, and limited ancestry records with possible hidden ancestral traits in future.
- Pets do not disappear/merge upon breeding; no guaranteed upgrades every generation.
- Current prototype requires both parents Lv.3 for same species, Lv.8 for cross-species and uses basic inheritance. Recessive/ancestral allele simulation and advanced special species recipes are a future milestone.

## Gear and storage improvements — v0.9.5 implemented
- Added separate `v095.js` extension loaded after `systems.js` and `v09.js`; preserves all older main game code and player data. Old gear without rarity remains tier 1.
- Five tier gear rarity: ⚪ทั่วไป (1), 🟢พิเศษ (2), 🔵หายาก (3), 🟣มหากาพย์ (4), 🟡ตำนาน (5). Gear rarity names/colors show in name, inventory slot, tooltip, equipment, bank and shops. Equipped base ATK/DEF gain additive rarity bonuses without resetting existing + enhancement/stars. Pet gear similarly boosts only its companion.
- A piece of equipment receives a deterministic permanent property on **successful enhancement to +7**, and older +7 or higher gear gets one upon loading. Depending on gear slot: flat ATK/DEF/HP/MP, crit chance or magic skill damage. Trait improves at +9 and +10 but does not reroll; forge's original risk of item destruction when failing +8/+9/+10 is unchanged. Player traits affect actual damage and HP/MP, pet traits affect pets.
- New regular and boss item drops can include player or pet equipment with tier-weighted rarity, but **overall item drop remains 40% chance of one item per defeated mob/boss**. Boss tier distribution is better than normal mobs.
- NPC personal bank and shared bank offer explicit auto sort by rarity, type, name then enhancement/stars. Player's manually arranged 80-slot bag also has a separate explicit sort action. No passive rearrangement of manual inventory slots.
- Character **☑ Auto Pickup** setting saves locally per character (default OFF). Enabled player collects every nearby eligible item within 75 units at roughly 700ms polling. No pickup through full bag, rights lock, expiry or distant loot; no chat/server required. Pet treasure auto-pickup remains independent, using its existing filters and chosen destination.
- QA: JavaScript source parsed, simulated tier bonuses/trait persistence/old +7 migration/personal and shared bank sorting/bag UID preservation passed; simulated pickup on/off, owner lock/expiry, range, and full bag passed. Real iPad UI/thermal QA pending.

## Performance Foundation — v0.9.4 implemented
- Performance control accessible from **🌿/⚖️/🔥 top-left button within world**, with Eco 30 FPS, Balanced 45 FPS (default), High 60 FPS target. Device-local preference stored at `feed_days_performance_v1`, independent of character localStorage key.
- Independently run gameplay at fixed 30 Hz and draw at 30/45/60 FPS target, maintaining time-based movement and attack cooldowns. Cap backlog to 3 updates following stalls to reduce stutter, rather than simulating hundreds of updates after long background pauses.
- Adaptive canvas DPR by mode (1.0, 1.35, 2.0, bounded by native DPR and maximum ~2.8M backing pixels). Skip rendering when browser is hidden or game/character screen inactive, and stop frame redraws behind paused modal except initial snapshot.
- Camera culling for monster/NPC/portal/ground item drawing; all remain in simulation and can be interacted with when relevant. Eco mode reduces loot glow effects.
- Inventory normalization is throttled in `v09Tick`; item/pet interactions still force immediate `v09Init`. Existing player saves, skill/loot/forge/companions and 40% item drop rules preserved.
- Settings panel measures actual frame rate and JS Canvas render-call time, not thermal temperature. 60 Hz simulated 10 s tests yielded 300/450/600 frames for 30/45/60 targets and equal simulation times. **Real iPad battery/heat tests not performed yet**.

## Floating combat numbers — v0.9.3 implemented
- Floating actual hit amount at target; white/cream **⚔️** for player physical; large gold **💥 CRIT!** for player critical; purple **🔮** for player magic attack-type skills; aqua number plus actual companion species icon for pet/mount attacks; red **👹** for monster damage dealt to the player or pet; green positive **💚** for healing.
- Collisions between simultaneous hit numbers are offset/staggered. Optional Thai **ℹ️ ตัวเลขโจมตี** legend toggles on/off from the world.
- Does **not** change damage formulas or add a separate magic damage stat. Pet baseline damage is the game's original generic pet attack; do not mislabel pet magical traits as an independently simulated magic damage formula.
- Compared deterministic old/new HP and hit amounts for physical, critical, magic skills, companion hits and monster-to-companion damage; tests passed. Actual iPad visual validation still pending.

## Star upgrades — v0.9.2 implemented
- Open the NPC forge's **🌟 เพิ่มดาว** tab. Choose **main equipment** first. Second dropdown filters to *other distinct item IDs* having the **exact same base name** as main, excluding other names and the main item.
- Each star upgrade attempt always consumes **one matching gear item plus one star crystal**, regardless of outcome. Success increases main stars by 1; failure leaves main equipment alive and its enhancement/stars unchanged.
- The confirmation dialog names both items, shows probability and explicitly warns material consumption on failure. Main selection stays in the UI after attempting.
- Only unequipped, player-inventory gear is selectable in this forge as currently designed. Equipped gear resides in separate slots and must be unequipped into available bag space first.
- Weapon enhancement already contributes to ATK/DEF in the original formulas. Additional new stat bonuses and custom weapon properties are a future design proposal, **not implemented yet**.
- UI/logic simulations for same-name options, missing material, star success/failure, material/crystal consumption, main identity, and confirmation passed. Actual iPad visual/touch QA is still required.

## Loot rules — v0.9 local prototype
- **Latest v0.9.1 decision:** tap the **📦 เก็บทั้งหมด (Collect all)** button **once** to collect every eligible item in a radius of **75 world units**. No hold is necessary. Tapping a specific ground drop still picks that single item (or walks toward it). Respect ownership, expiration and bag capacity.
- Defeating any monster **or boss** now has **40% chance to drop one ground item** (60% none). On success, use weighted tables with stronger boss rarity. Money and EXP stay automatic. This supersedes v0.9's independent per-item rolls.
- Ground dropped items initially available only to the owner for 60 seconds, then public for 2 more minutes, and disappear after 180 seconds. Server authority needed later.
- Drop button for bag items; rare or enhanced gear needs confirmation before drop or sale. Coins remain auto-awarded pending an explicit later decision.
- Bag: 80 fixed logical slots; manual hold-and-drag rearrangement; tap only selects; scrolling not reset on item selection.
- Player and pet equipped items occupy equipment slots outside bag inventory. Changing equipment returns old item into vacated new item's slot, even if bag was full. Unequipping requires free bag space.
- Bag, equipment, stats and pets are independent semi-transparent movable floating windows and gameplay continues while they remain open.

## PvP and trade vision — not yet implemented
- PvE + PvP with safe towns, anti-bullying protections, no PvP death penalty, official tiered 1v1 tournaments with honor from official events only, no public Hall of Fame by default.
- Player-to-player free trade, escrow-confirmed trades, markets for scrolls, pet gear and other items; no forced scroll soulbinding.
- Server-side accounts, database, anti-cheat, persistence, marketplace and multiplayer on Railway/GitHub remain future work; do not claim a deployed server or functioning player-to-player economy.

## Current implementation status: v0.9.5 (code in main)
- `index.html`: original game world/HUD/menus, v0.7 pixel-art map, 3 paired directional portals, local login, 6 character slots, combat, inventory, forge and NPCs.
- `v09.js`: draggable multi-window interface (bag, equipped items, stats, pets), hold-to-drag 80-slot storage, no scroll reset, separated equipped player/pet gear, confirmation for dropping/selling rare gear, manual ground pickup (tap and hold), item ground drop with local 1-minute owner priority and 3-minute expiry, and fox treasure-hunter auto pickup with filters and destination.
- `systems.js`: skill-scroll discovery / duplicates / six-slot hotbar; sample 10 skill types; monster and boss scroll/egg drops; two AI combat pets + mount with auto/manual skill; pet HP/MP potions; inventory transfer and lock; equipment and enhance; stat points and evolution; breeding with inherited genes and 5h parental cooldown.
- **Test sample content only**: 10 registered skills, several companion species; thousands of skills, deep DNA simulation, full trading and networking are planned, not yet live.
- Existing characters are migrated lazily without clearing saves. Data remains browser-specific localStorage. Don't use real passwords.
- QA: JavaScript parse passed. Simulated v0.8 pet/skill and v0.9 gear/ground loot tests passed. v0.9.1 tests verified pickup-all, rights, full bags, 40% exact boundary and ~40% 10,000 simulated kills. Real iPad drag and fullscreen QA is pending.
- Backup before v0.8: `backup/before-skill-pet-breeding-systems-v0-8-2026-11-25`.
- Backup before v0.9: `backup/before-v0-9-floating-inventory-ground-loot-2026-11-25`.
- Backup before v0.9.1: `backup/before-pickup-all-and-drop-rate-40-percent-2026-11-25`.
- Backup before v0.9.2: `backup/before-v0-9-2-star-upgrade-safety-2026-11-25`.
- Backup before v0.9.3: `backup/before-v0-9-3-combat-damage-numbers-2026-11-25`.
- Backup before v0.9.4: `backup/before-v0-9-4-performance-foundation-2026-11-25`.
- Backup before v0.9.5: `backup/before-v0-9-5-rarity-affixes-bank-sort-auto-pickup-2026-11-25`.

## Engineering norms
- Always backup main first. Preserve maps, graphics, UI, existing saves, all existing game mechanics unless explicitly approved.
- Distinguish implemented and discussed-only content. Test browser runtime, touch inputs, and migration before declaring feature production-ready.
- On each update, bump version and update README, DEVELOPMENT_LOG and ROADMAP if relevant.
- Don't presume GitHub Pages deploy has propagated from the git commit; allow the user to refresh/reopen the Home Screen web app.
