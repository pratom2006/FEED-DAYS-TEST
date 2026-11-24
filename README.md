# FEED-DAYS-TEST

## Current playable build — Fantasy Realm v0.8

**Live GitHub Pages (when Pages is enabled):** https://pratom2006.github.io/FEED-DAYS-TEST/

The current `main/index.html` + `main/systems.js` form a 2D top-down browser RPG prototype with simulated local login, up to six characters, town, three monster areas, quests, equipment, inventory, and other starter systems. **It is not yet multiplayer.** Player data and demo accounts are stored only in the current browser/device; do not use a real password.

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

## Historical Phaser 08 / Phase 1 notes (not the current v0.8 entry point)

Phase 1 — Phaser 08 Ring Town, structure-only refactor. Original visuals, character selection, movement, collision and A* navigation are retained. Single-player browser prototype; no server or account system yet.

## Run current v0.8
Serve the repository root with a static HTTP server (or GitHub Pages). Open `index.html`; its classic script loads `systems.js` relative to the page. No build step, no browser back-end, no Phaser dependency for the current v0.8 game.

## Structure (current v0.8 + historical files)
- `index.html`: current self-contained main game and HUD code
- `systems.js`: classless skill library, pets, mounts, breeding and AI gameplay extension
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
JavaScript parsing and isolated simulated skill/pet/cooldown behavior were checked for v0.8. Test the updated game on an iPad Home Screen web app before treating the features as reliable. Historical Phaser navigation test: `node --test tests/navigation.test.cjs`; it does not cover the current v0.8 systems.

## Backup
Original version: `backup/phaser-08-before-phase-1` (commit `740fd34546658924d28cad1ad32a8e3aab071cbe`).
