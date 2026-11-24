# FEED-DAYS-TEST

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
