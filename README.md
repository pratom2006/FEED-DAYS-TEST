# FEED-DAYS-TEST

## Current playable build — Fantasy Realm v0.9.5

**Live GitHub Pages (when Pages is enabled):** https://pratom2006.github.io/FEED-DAYS-TEST/

The current `main/index.html` + `main/systems.js` + `main/v09.js` form a 2D top-down browser RPG prototype with simulated local login, up to six characters, town, three monster areas, quests, equipment, inventory, and other starter systems. **It is not yet multiplayer.** Player data and demo accounts are stored only in the current browser/device; do not use a real password.

### v0.9.5 — Five-tier gear rarity, +7 properties, bank sorting and opt-in auto pickup

- Gear now has **five visible tiers** (⚪ Common/ทั่วไป, 🟢 Uncommon/พิเศษ, 🔵 Rare/หายาก, 🟣 Epic/มหากาพย์, 🟡 Legendary/ตำนาน). Colored gear names, bag-slot outlines, equipment details and tooltips expose rarity. Existing items without rarity retain **tier 1**, with no rerolls on old saves.
- Rarity increases equipped gear's original ATK/DEF by an additive tier-scaled bonus; existing enhancement and star levels remain intact. New player equipment can drop alongside pet gear, with boss loot weighted toward higher rarities. The **overall 40% per-kill one-item drop chance remains unchanged**; the additional rarity roll happens only after equipment was chosen as the item.
- At **successful +7 enhancement**, each piece of equipment permanently receives **one deterministic, UID-stable property** matching its gear slot. Depending on slot/property: ATK, DEF, max HP, max MP, physical crit chance, or **actual magic-skill damage**. Trait strength automatically increases at **+9** and **+10**; its identity does not reroll when viewing the item or upgrading. Existing saved gear already ≥+7 receives a compatible property once, saved without losing old upgrades.
- The forge's existing +8/+9/+10 failure-destroys-item risk and star-upgrade behavior remain unchanged. Pet gear rarity and appropriate attack/defense/HP/MP bonuses are applied to the **pet**, not to the player.
- NPC **personal bank and account shared bank** now provide explicit **🧹 จัดเรียงคลังอัตโนมัติ**. Sorts highest rarity first, then item class/name/upgrade. No items, UID, enhancements, stars or properties are discarded. The bag also has an explicit sort button; **manual bag order remains untouched until the player taps it**.
- Character world UI has a **☑ Auto Pickup** checkbox, independent of treasure-skilled pet auto pickup. When enabled, the player automatically collects **all nearby eligible ground items within 75 world units** roughly every 700 ms (only if items are present). It obeys the owner's 1-minute pickup priority, 3-minute expiry, available inventory space, and map restrictions. Default **off**, persisted in the character's existing local save. Manual 📦 Collect All remains available.
- Tests: isolated JS rarity/traits/legacy migration/sorting checks passed; auto-pickup on/off, ownership, range, bag-full and expiry checks passed; syntax verified. **Actual iPad/touch/browser UI tests remain pending**. Not online multiplayer/server yet.
- Backup: `backup/before-v0-9-5-rarity-affixes-bank-sort-auto-pickup-2026-11-25`.

### v0.9.4 — Performance Foundation / iPad power-saving controls

- Added in-game **🌿 / ⚖️ / 🔥 performance settings** opened by the floating performance button in the top-left of the world view: **Eco 30 FPS**, **Balanced 45 FPS** (default), **High 60 FPS**. The FPS values are targets; actual device throughput may be lower.
- Settings apply to the device browser only via separate `localStorage` key `feed_days_performance_v1`, **not** character saves or server accounts.
- A fixed **30 Hz gameplay simulation** runs independently of the selected draw FPS, preserving time-based movement speed, attack cooldowns, enemy attacks, pet logic, item ownership/expiry, and numeric damage formulas. Catch-up work after a delay is limited to at most three updates to avoid runaway stutters.
- Cap backing canvas DPR by mode: **Eco 1.0×**, **Balanced 1.35×**, **High up to 2.0×**, constrained by the device's native DPR and a maximum of about 2.8M canvas pixels.
- Stop unnecessary per-frame rendering when no character is in the active game, browser tab is hidden, or the game/dialog is paused. Preserve the existing pause/re-enter flow.
- Cull off-camera monsters, NPCs, portals and ground items from drawing; **do not remove them from game simulation**. In Eco mode, disable glow/shadow blur for ground loot.
- Throttle repetitive `v09Init()` inventory normalization within the game update loop to approximately 1.5 seconds, retaining immediate initialization for inventory/pet actions and character switching.
- Show **observed FPS**, chosen FPS target, average JavaScript canvas render-call duration, and DPR in the settings panel to help the owner test on iPad. These measurements **are not device temperature or GPU profiling**.
- JavaScript syntax and 60 Hz simulated frame pacing checks passed for 30/45/60 drawing FPS, identical elapsed simulation time, halted updates on pause and no hidden-tab drawing. Actual iPad heat and visual/touch QA still required.
- Backup before changing v0.9.3: `backup/before-v0-9-4-performance-foundation-2026-11-25`.

### v0.9.3 — Combat damage number clarity

- Distinct **floating combat hit numbers** show **source/type** with bright icons after numeric damage and distinct colors:
  - **⚔️ Normal physical**: cream/white, e.g. `-20 ⚔️`.
  - **💥 Critical**: larger gold damage, with `CRIT!` above it, e.g. `-30 💥`.
  - **🔮 Magic attack**: purple, e.g. `-47 🔮`, for actual skills typed `เวทโจมตี`.
  - **🐺 / 🦊 / 🐎 / 🐉**: aqua pet and mount damage with the actual companion's emoji after the number.
  - **👹 Monster attacks**: red incoming damage on the player or at the affected pet's location.
  - **💚 Heal**: green positive numbers; companion healing includes that companion's icon.
- Hit popups stagger slightly if multiple hits occur near one another to reduce number overlap. Existing EXP text, buff labels and hit effects remain intact.
- Optional **ℹ️ ตัวเลขโจมตี** button in the world view toggles a Thai explanation of each icon/color.
- Verified against the previous v0.9.2 backup with deterministic simulated player physical, crit, magic, pet attack, and incoming monster-to-pet hit tests: **damage and HP results were unchanged**. JavaScript parsing passed. Actual iPad visual/touch QA is still pending.
- No new damage formulas, crit percentages, magic scaling or combat balance rules were introduced.
- Backup: `backup/before-v0-9-3-combat-damage-numbers-2026-11-25`.

### v0.9.2 — Star upgrade material rules and same-name selection

- **Star-upgrade failure protection:** the main equipment is never destroyed on failure, and its current stars, enhancement level and unique identity remain unchanged.
- **Every star attempt consumes one identically named equipment material and one star crystal**, regardless of success/failure. On success, the main item gains exactly +1 star. On failure, its stars do not change.
- Once a main equipment item is selected, the star-upgrade **material dropdown displays only other inventory equipment with exactly the same base name** (excludes the main item's unique ID). Empty when no matching material is available.
- The confirmation dialog clearly names the main and sacrificed items, lists the success chance, and warns about consumption on failure. The main selection persists across attempts for convenience.
- Existing weapon enhancement rules, monster drop chance, manual pickup, character/pet gear and v0.9.1 features are unchanged.
- **Additional new random bonus properties / extra status attributes from enhancement are only proposed**; they have not been implemented or balanced in this patch. Existing enhancement/star ATK and DEF formula bonuses continue.
- Backup: `backup/before-v0-9-2-star-upgrade-safety-2026-11-25`.
- Tested via isolated JS UI/logic checks: exact-name filtering, success and failure material consumption, main gear preservation, crystal consumption, warnings, no duplicate use, and persistent main selection. Full iPad UI remains to be user-tested.

### v0.9.1 — Collect all + 40% item drop chance

- **📦 เก็บทั้งหมด / Collect all**: one tap picks up **all nearby eligible ground items in the 75-unit pickup radius**. Items outside range, reserved for another player, expired, or unable to fit in the player bag remain uncollected. Tap a specific ground item still picks that one (or walks toward it).
- **Overall item drop chance is exactly 40% per defeated enemy**, including ordinary monsters **and bosses**. On a successful roll, one ground item is drawn from a rarity-weighted loot table. Boss tables still favor rarer items; 60% of kills drop no item. The old independent 75% materials / 22% crystals etc. rules no longer apply.
- **Gold and character EXP are unaffected**: gold is still awarded directly, while ground loot uses owner lock for 1 minute and expires after 3 minutes.
- Batch pickup saves and refreshes after collecting to avoid unnecessary repeated writes on iPad.
- Automated logic checks: 10,000 simulated kills produced ~40% item drops; owner lock, quantity, bag-full, expiration, and single-tap batch pickup checks passed. Real iPad interaction is still unverified.
- Backup: `backup/before-pickup-all-and-drop-rate-40-percent-2026-11-25`.

### v0.9 — Floating UI, item arrangement, ground loot and treasure hunter pets

- `v09.js` adds **modeless, semi-transparent, draggable floating windows** for player Bag, Equipment, Stats, and Pets. Open multiple at once; bring a window forward by touching it. Basic gameplay continues while these windows are open. NPC/dialogue modals remain modal.
- Existing equipped player and pet gear is migrated out of the bag into dedicated equipped item storage **without deleting its upgrade, rarity, UID or stars**. New gear replaces old gear atomically; the old gear takes the vacated inventory slot even when full. Unequipping is blocked if there is no bag space.
- Bag layout has 80 persistent logical slots using `bagSlot`. Tap an item for details **without resetting scroll position**. Long press ~420ms then drag to empty/occupied slots to move/swap. Swipe normally to scroll the bag. Item positions persist with the character's existing local save.
- A visible **🗑️ Drop** action drops player-carried items on the ground. Rare / enhanced / starred items require confirmation before drop or shop sale.
- Monster and boss item rewards appear **on the map**, with 1 minute initial collector ownership and 3 minute expiration. They can be collected with **📦 Pickup** (tap one, hold for continuous pickups with ~260ms cadence), or tap a specific ground item to walk toward it and collect when near. Manual pickup range is 75 in-world units. Pickup respects bag capacity.
- Treasure-skilled fox pets (incl. the starter fox) can enable Auto Pickup; set behavior (fight-first, balanced, prioritize loot), item rarity and type filters, and destination (player bag or own pet bag). The pet bag remains unavailable while that companion is incapacitated. Auto pickup only takes eligible nearby ground items.
- **Currency from monsters remains an automatic reward pending an explicit separate coin-loot decision**. This release switches **item drops**, not coins, to ground pickup.
- All timers and loot ownership are **local prototype simulation** in the browser's character save. There is no real shared-world loot, no online trading, no authoritative server, no live multiplayer, and no trusted anti-cheat yet. Actual online shared ownership will need a server.
- Script syntax and isolated logic tests passed: equipment migration/replacement, inventory slot swapping, inventory-full safety, ground ownership/expiration, rarity guards, and pet loot filtering. **Real iPad/fullscreen drag QA not performed**.
- Backup: `backup/before-v0-9-floating-inventory-ground-loot-2026-11-25`.

### v0.8 — Skill scrolls, 2 pets + mount, genetic breeding

- New `systems.js` contains a playable local prototype for classless skills and companion collection. It loads after the existing `index.html` game and keeps the previous world, HUD, local saves, maps, directional warps, and multi-touch combat.
- Players begin with no learned skills, and get a starter scroll. **Scrolls display skill name and category but not their effects in the bag**; using one unlocks it. Duplicate scrolls + valid skill usage earn skill XP. Skill ranks are not capped. Six assignable slots appear on the game screen. Existing characters retain already learned slash levels.
- Ten sample skill definitions, boss and ordinary-monster scroll drops (species-themed + random), and pet egg drops are implemented. An upgrade path for large-scale spell variety is documented in ROADMAP.
- One-time starter companion pack in the Pet menu: wolf, fox, and horse. Two combat pets and one mount can be active. AI pets attack, support and buff, while the mount can be set to Auto or Manual; manually use the mount action button while fighting.
- Each pet has stats, XP, HP/MP, 24-slot bag, configurable Auto HP and MP thresholds using potions **from that pet's bag only**, and no potion cooldown. Incapacitated pets have a **10-minute bag lock and summon lock**, preserved in the existing browser save.
- Pet equipment: weapon, armor and skill orb; compatible player gear may be transferred into the pet's bag and worn, and pet-specific gear offers higher stats. Enhance gear using crystals and evolve pets using materials and coins.
- Pets can breed without losing either parent: same species Lv.3+, cross species Lv.8+. Simple gene, skill, rarity and ancestry inheritance. **Both parents have a 5-hour cooldown**, stored as timestamp in local save; cooldowns are not server-authoritative yet.
- **Not implemented:** actual player-to-player free market/trades, synchronized online accounts or multiplayer, advanced recessive genetics, and an unrestricted remote pet database.
- **How to test:** sign in with a demo ID → Pet menu → claim starter companions once → Bag → use a starter scroll → Skill menu to assign slots → defeat monsters for eggs/scrolls → train pets and breed after meeting levels.
- JavaScript parse and simulated skill, pet, potion, breeding and cooldown checks passed; physical iPad testing still needed. Never use real passwords for this local prototype.
- Design handoff: [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md); progress: [DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md); milestones: [ROADMAP.md](ROADMAP.md).

### v0.7 — Fantasy pixel art visual refresh

- All four maps now have detailed procedural fantasy pixel-art surfaces, houses, paths, trees, rocks, plants, and water, with distinct palettes per biome.
- Animated fountain shimmer, enhanced warp portals, upgraded NPC/monster/character drawings, walking legs, and short slash impacts.
- Static ground and scenery are cached into one offscreen canvas per map so they are not re-painted every frame. Logic checks confirmed map caches build once and all four map render paths can draw.
- Game rules, movement, multi-touch combat, map transitions, accounts, inventory and original save structure are unchanged. iPad browser rendering and touch performance should be tested on-device.

### v0.6 — Directional map transitions

- From town **west/left** → Slime Forest: spawn near the **east/right** edge; return through the **east/right** portal, then reappear near town's west edge.
- From town **east/right** → Wolf Valley: spawn near the **west/left** edge; return through the **west/left** portal, then reappear near town's east edge.
- From town **south/bottom** → Magic Beach: spawn near the **north/top** edge; return through the **north/top** portal, then reappear near town's south edge.
- Arrival coordinates are safely outside portal triggers to prevent accidental ping-pong warps. Defeat respawns in the town's regular safe central position.
- Both portal visuals and trigger logic share one `MAP_PORTALS` table; test harness verified all six transitions and safe respawns.
- The previous map, NPC, combat, inventory, and login behavior are preserved.

### v0.5 — Move and attack simultaneously

- Multi-touch controls: keep one finger on the virtual joystick while tapping **โจมตี** or **สกิล** with another finger. Movement is no longer interrupted by combat-button taps.
- Hold the normal attack button for repeat attacks, respecting the existing 380 ms cooldown and target distance; release it to stop.
- Tapping skill casts once, subject to MP, weapon and 700 ms cooldown restrictions.
- Tap-to-move continues even while attacking. The normal attack now respects its 105-unit range for manually locked targets (skill range 150 units).
- Automated JavaScript pointer-event checks verified simultaneous joystick movement, normal attack, skill, and release behavior. On-device iPad testing remains necessary.
- This is still a local single-player prototype, not multiplayer combat.

### v0.4 HUD and layout

- The 2D map now renders edge-to-edge behind the HUD, with no full-width top or bottom opaque panels.
- Character level, HP, MP, EXP remain as compact floating controls in the upper-left corner; money, potions, exit stay upper-right.
- All 7 menus (bag, equipment, stats, skills, quests, pets, guide) are moved into a vertical dock on the right, above combat buttons. On short landscape screens the dock uses two columns and can scroll.
- Joystick stays at bottom left, while normal attack and skill buttons remain bottom right.
- Fullscreen behavior is still subject to iPadOS and browser restrictions.

### Immersive play on iPad

- Recommended: open the GitHub Pages game link in **Safari**, tap **Share → Add to Home Screen**, and enable **Open as Web App** where offered. Launch FEED DAYS from its Home Screen icon to hide browser tabs and the address bar.
- The web app includes `manifest.webmanifest` and iPad web-app meta tags.
- The **Play / เข้าเกม** tap requests fullscreen on browsers supporting the Fullscreen API.
- If the browser leaves fullscreen or the app is interrupted, the game pauses; choose **กลับเข้าเกมเต็มจอ**, **เล่นต่อในหน้าต่างปกติ**, or **ออกจากเกม**.
- Use **🚪 ออกเกม** in the HUD to save and return to character selection or log out. Web pages cannot forcibly lock operating-system gestures or close the browser itself.

**Backups:** `backup/before-fantasy-realm-v0-1-2026-11-24`, `backup/before-fullscreen-responsive-2026-11-24`, `backup/before-immersive-lock-2026-11-24`, `backup/before-hud-overlay-side-dock-2026-11-24`, `backup/before-move-and-attack-2026-11-25`, `backup/before-directional-portals-v0-6-2026-11-25`, `backup/before-pixel-art-visual-upgrade-v0-7-2026-11-25`, `backup/before-skill-pet-breeding-systems-v0-8-2026-11-25`.

---

## Historical Phaser 08 / Phase 1 notes (not the current v0.9 entry point)

Phase 1 — Phaser 08 Ring Town, structure-only refactor. Original visuals, character selection, movement, collision and A* navigation are retained. Single-player browser prototype; no server or account system yet.

## Run current v0.8
Serve the repository root with a static HTTP server (or GitHub Pages). Open `index.html`; its classic scripts load `systems.js` then `v09.js` relative to the page. No build step, no browser back-end, no Phaser dependency for the current v0.8 game.

## Structure (current v0.8 + historical files)
- `index.html`: current self-contained main game and HUD code
- `systems.js`: classless skill library, pets, mounts, breeding and AI gameplay extension
- `v09.js`: draggable floating windows, bag slots, equipped item separation, world loot, pickup and pet loot filters
- `PROJECT_CONTEXT.md`: agreed game-design rules and current implemented vs. planned states
- `DEVELOPMENT_LOG.md`: version history and release notes
- `ROADMAP.md`: next milestones and server-dependent features
- `index.html`: entry page and HUD markup (historical description; see above)
- `styles/game.css`: original styles
- `scripts/config.js`: world constants and asset paths
- `scripts/input.js`: UI and joystick input
- `scripts/town.js`: procedural map and buildings
- `scripts/navigation.js`: collision and A* navigation
- `scripts/game.js`: Phaser scene, animations, movement, startup
- `assets/characters/`: original PNG spritesheets, extracted without re-encoding
- `tests/navigation.test.cjs`: syntax, sprite signature, and navigation smoke checks

Scripts are classic browser scripts and must load in the order defined by `index.html`.

## Test
JavaScript parsing and isolated simulated skill/pet/cooldown behavior were checked for v0.8; v0.9 equipment, loot and drop logic smoke checks were also passed. Test the updated game on an iPad Home Screen web app before treating the features as reliable. Historical Phaser navigation test: `node --test tests/navigation.test.cjs`; it does not cover the current v0.8 systems.

## Backup
Original version: `backup/phaser-08-before-phase-1` (commit `740fd34546658924d28cad1ad32a8e3aab071cbe`).
