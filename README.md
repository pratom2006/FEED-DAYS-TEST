# FEED-DAYS-TEST

## Current playable build — Fantasy Realm v0.6

**Live GitHub Pages (when Pages is enabled):** https://pratom2006.github.io/FEED-DAYS-TEST/

The current `main/index.html` is a self-contained 2D top-down browser RPG prototype with simulated local login, up to six characters, town, three monster areas, quests, equipment, inventory, and other starter systems. **It is not yet multiplayer.** Player data and demo accounts are stored only in the current browser/device; do not use a real password.

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

**Backups:** `backup/before-fantasy-realm-v0-1-2026-11-24`, `backup/before-fullscreen-responsive-2026-11-24`, `backup/before-immersive-lock-2026-11-24`, `backup/before-hud-overlay-side-dock-2026-11-24`, `backup/before-move-and-attack-2026-11-25`, `backup/before-directional-portals-v0-6-2026-11-25`.

---

## Historical Phaser 08 / Phase 1 notes

Phase 1 — Phaser 08 Ring Town, structure-only refactor. Original visuals, character selection, movement, collision and A* navigation are retained. Single-player browser prototype; no server or account system yet.

## Run
Serve the repository root with a static HTTP server (or GitHub Pages). Open `index.html` through that server. Phaser 3.90.0 is still loaded from the original CDN; internet access is required. No build step.

## Structure
- `index.html`: entry page and HUD markup
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
With Node.js 18 or later: `node --test tests/navigation.test.cjs`. This checks navigation and source syntax, not rendering or device touch behavior.

## Backup
Original version: `backup/phaser-08-before-phase-1` (commit `740fd34546658924d28cad1ad32a8e3aab071cbe`).
