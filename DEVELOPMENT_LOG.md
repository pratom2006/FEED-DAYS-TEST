# FEED DAYS — Development log

## 2026-11-25 — v0.9.4
- Backed up v0.9.3 to `backup/before-v0-9-4-performance-foundation-2026-11-25` before code edits.
- Added three device-local graphics presets with editable 30/45/60 FPS drawing caps, separately timed fixed 30Hz gameplay updates, bounded catch-up ticks, and adaptive Canvas DPR.
- Avoid drawing hidden/inactive/paused world, cull off-camera monster/NPC/portal/ground loot art, and simplify loot glow in Eco mode.
- Reduce repeat inventory migration/normalization checks by throttling `v09Init` on the simulation path without affecting immediate UI initialization.
- Added actual measured FPS, Canvas CPU render-call time and resolution scale to an on-screen performance panel.
- JavaScript syntax and deterministic 60Hz pacing simulations passed: 30/45/60 FPS, ~10 seconds simulation time all modes, pause and hidden-tab stops.
- Not yet measured actual temperature or browser CPU/GPU load on an iPad. Preserve v0.9.3 attack/crit/magic/pet numbers, 40% item drops, bag and forge rules.

## 2026-11-25 — v0.9.3
- Backed up v0.9.2 to `backup/before-v0-9-3-combat-damage-numbers-2026-11-25`.
- Added styled floating hit values: normal ⚔️, crit 💥 + CRIT! gold banner, skill magic 🔮 purple, per-species pet/mount icons in aqua, monster 👹 incoming red, and green 💚 healing. Pet hit location aligns with the actual companion position.
- Added compact toggleable Thai in-world legend under **ℹ️ ตัวเลขโจมตี**. Simultaneous hit labels are lightly staggered.
- No damage formula or combat-balance changes. Deterministic head-to-head simulation against v0.9.2 produced matching HP values for physical, crit, spell, pet and monster-hit-pet paths. JavaScript syntax checks passed.
- Real iPad visual and multi-touch QA pending.

## 2026-11-25 — v0.9.2
- Backed up v0.9.1 to `backup/before-v0-9-2-star-upgrade-safety-2026-11-25`.
- Fixed forge star upgrade: main gear is never lost and stars stay unchanged on failure; matching-name gear material and star crystal are **consumed on both success and failure**.
- Material selection now dynamically filters by the selected main item's exact base name and excludes the main item's UID.
- Updated confirmation to show both gear items, success rate and permanent ingredient usage; retains main selection between attempts.
- Existing enhancement +1–10 behavior unchanged. Suggested future extra stat/property bonuses not added yet.
- JavaScript syntax and simulated success/failure, matching-name filter, main-identity retention, resource consumption, UI state and warnings checked. Real iPad QA pending.

## 2026-11-25 — v0.9.1
- Changed **📦 เก็บของ** from one-at-a-time/hold to **📦 เก็บทั้งหมด**: one tap sweeps all eligible items within 75 world units, with ownership, expiry, and inventory capacity checks.
- Replaced independent per-item random rolls with a single **40% chance per kill of one item** on ordinary monsters and bosses; weighted tables choose which item drops, with boss rarity advantages. No item 60% of the time.
- Automatic money and EXP rewards remain unchanged. Ground item ownership 1 minute and expiration after 3 minutes remain unchanged.
- Backed up v0.9 to `backup/before-pickup-all-and-drop-rate-40-percent-2026-11-25`.
- JavaScript parsed; deterministic boundary and simulation checks, plus 10,000 randomized kill rolls, passed. Real iPad QA pending.

## 2026-11-25 — v0.9
- Backed up v0.8 to `backup/before-v0-9-floating-inventory-ground-loot-2026-11-25`.
- Added `v09.js`: movable, modeless inventory/equipment/pet/stat windows; persistent 80-slot bag order and touch long-press drag; equipped items leave bag; safety on equip swap/full bag.
- World loot from monsters/bosses and manual dropped items; each drop has owner lock 1m, expires after 3m. Tap/pickup button, hold repeat, walk-to-tap pickup.
- Rare/enchanted item disposal and sale confirmation; pet treasure AI filter by rarity/type and destination, fight/loot/balanced priority.
- Existing v0.8 systems and legacy save key remain. Currency still enters the player automatically, pending design decision.
- JS parsing and 13 isolated behavior assertions passed for v0.9 equipment/loot/filters. iPad touch/browser UI not verified.
- No new online server, multiplayer or shared loot authority.

## 2026-11-25 — v0.8
- Added `systems.js` while retaining legacy in-game UI and the pixel-art world.
- Ten sample classless skills and six hotbar slots; scroll name/type visible in bag; first use unlocks; duplicate scroll grants XP; casting grants XP and can be swapped among slots.
- Monster/boss themed and random scroll loot; eggs and pet-only gear; bosses added to each monster map.
- Companion test group, independent pet inventory and auto potions, cooldown and lock on pet defeat, pet equipment / enhancement, XP/stat allocation / evolution, mount Auto/Manual.
- Basic genetics: parents remain and have individual persisted five-hour cooldown; inheritance and mutation for offspring.
- Preserved local save key `feed_days_realm_v01`.
- JavaScript syntax and simulated skill/pet/breeding tests passed; **real-world iPad interaction and deployment not independently confirmed**.
- Backed up v0.7 to `backup/before-skill-pet-breeding-systems-v0-8-2026-11-25`.

## Earlier builds
- v0.7: fantasy pixel-art visual upgrade, cached backgrounds.
- v0.6: directional map portals and safe return coordinates.
- v0.5: two-finger movement with attacks and hold-to-attack.
- v0.4: edge-to-edge map and floating HUD/sidebar menus.
- v0.3: Home Screen web app support, exit-game/paused fullscreen recovery.
- v0.2: immersive responsive fullscreen.
- v0.1: self-contained baseline RPG prototype with accounts local to the browser.

Always use actual GitHub code as the authoritative technical source before making subsequent changes.
