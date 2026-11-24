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

## Loot rules — v0.9 local prototype
- Manual pickup: one tap picks one nearby item, hold pickup continuously (about 260ms interval), or tap ground loot and move closer. Target manual range 75 world units.
- Ground dropped items initially available only to the owner for 60 seconds, then public for 2 more minutes, and disappear after 180 seconds. Server authority needed later.
- Drop button for bag items; rare or enhanced gear needs confirmation before drop or sale. Coins remain auto-awarded pending an explicit later decision.
- Bag: 80 fixed logical slots; manual hold-and-drag rearrangement; tap only selects; scrolling not reset on item selection.
- Player and pet equipped items occupy equipment slots outside bag inventory. Changing equipment returns old item into vacated new item's slot, even if bag was full. Unequipping requires free bag space.
- Bag, equipment, stats and pets are independent semi-transparent movable floating windows and gameplay continues while they remain open.

## PvP and trade vision — not yet implemented
- PvE + PvP with safe towns, anti-bullying protections, no PvP death penalty, official tiered 1v1 tournaments with honor from official events only, no public Hall of Fame by default.
- Player-to-player free trade, escrow-confirmed trades, markets for scrolls, pet gear and other items; no forced scroll soulbinding.
- Server-side accounts, database, anti-cheat, persistence, marketplace and multiplayer on Railway/GitHub remain future work; do not claim a deployed server or functioning player-to-player economy.

## Current implementation status: v0.9 (code in main)
- `index.html`: original game world/HUD/menus, v0.7 pixel-art map, 3 paired directional portals, local login, 6 character slots, combat, inventory, forge and NPCs.
- `v09.js`: draggable multi-window interface (bag, equipped items, stats, pets), hold-to-drag 80-slot storage, no scroll reset, separated equipped player/pet gear, confirmation for dropping/selling rare gear, manual ground pickup (tap and hold), item ground drop with local 1-minute owner priority and 3-minute expiry, and fox treasure-hunter auto pickup with filters and destination.
- `systems.js`: skill-scroll discovery / duplicates / six-slot hotbar; sample 10 skill types; monster and boss scroll/egg drops; two AI combat pets + mount with auto/manual skill; pet HP/MP potions; inventory transfer and lock; equipment and enhance; stat points and evolution; breeding with inherited genes and 5h parental cooldown.
- **Test sample content only**: 10 registered skills, several companion species; thousands of skills, deep DNA simulation, full trading and networking are planned, not yet live.
- Existing characters are migrated lazily without clearing saves. Data remains browser-specific localStorage. Don't use real passwords.
- QA: JavaScript parse passed. Simulated tests passed for initial/duplicate scroll, pet team, breeding, 5h cooldown, auto potions, locked bag and 10m recovery; for v0.9 also item migration/swap, full-bag safety, loot owner timer, ground expiry, rarity, and pet auto-loot filters. Real iPad drag and fullscreen QA is pending.
- Backup before v0.8: `backup/before-skill-pet-breeding-systems-v0-8-2026-11-25`.
- Backup before v0.9: `backup/before-v0-9-floating-inventory-ground-loot-2026-11-25`.

## Engineering norms
- Always backup main first. Preserve maps, graphics, UI, existing saves, all existing game mechanics unless explicitly approved.
- Distinguish implemented and discussed-only content. Test browser runtime, touch inputs, and migration before declaring feature production-ready.
- On each update, bump version and update README, DEVELOPMENT_LOG and ROADMAP if relevant.
- Don't presume GitHub Pages deploy has propagated from the git commit; allow the user to refresh/reopen the Home Screen web app.
