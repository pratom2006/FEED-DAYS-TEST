# FEED DAYS — AI Creative Studio / Phase 1

## Scope
A separate static authoring tool at creative-studio/index.html. It does not load, edit or save any gameplay state. No dependency, API key, AI billing or backend added. GPT is the primary creative operator in ChatGPT: generate and revise original art, create animation sheets and effect artwork, inspect assets, propose metadata and prepare approved integration changes. The owner approves art and tests on iPad. The studio imports output files manually; it does not call GPT or image generation itself.

## Initial art direction (proposed, pending approval)
Non-pixel illustrated 2D fantasy, top-down/three-quarter gameplay view, consistent approved character model, silhouette, clothing and palette. Use the owner-approved male model from the prior art discussion; do not invent a replacement reference. Produce one walk sheet first; subtle hair movement and a single blink on frame 6 in each direction with visible eyes, as previously requested. Do not assume a direction count; use the actual approved sheet. No new art is approved or published by this Phase 1 commit.

## Workflow
1. GPT creates or revises a PNG sprite sheet with transparent background. Preserve source separately.
2. Owner imports the output image from Files/Photos in the studio. PNG/WebP/JPEG accepted up to 16 MiB and 16 megapixels; PNG preferred for transparent sprites.
3. Set rows, columns, number of used frames, selected row, direction and FPS. Preview one direction at a time. The tool verifies grid divisibility; it does not detect empty cells, alignment, blinks or transparent background.
4. Use notes to record prompt, reference version, animation name, row mapping and QA. Mark draft, review or approved manually. Save metadata explicitly.
5. Export original image and JSON manifest separately. Manifest is metadata only and cannot restore the image library by itself. IndexedDB is browser/device-local and can be evicted or cleared. Keep backups in Files or a private storage location.
6. GPT prepares a separate integration patch only from approved assets, checks file dimensions, transparent edges, pivot and performance, preserves the procedural fallback and existing save schema, and requests owner visual QA. Do not commit secrets or private artwork to the public repository without permission.

## Proposed asset organization for future approved production files
- assets/characters/<character-id>/<animation>_vNN.png
- assets/pets/<species-id>/<animation>_vNN.png
- assets/monsters/<species-id>/<animation>_vNN.png
- assets/equipment/<item-id>_vNN.png
- assets/environment/<biome-id>/<asset-id>_vNN.png
- assets/vfx/<effect-id>_vNN.png
- assets/ui/<asset-id>_vNN.png

This is a proposed naming convention, not directories populated with artwork yet. Preserve source images and unique IDs. Start with a small sprite atlas, limit texture dimensions based on actual iPad profiling, and retain the 30/45/60 FPS gameplay modes. Target initial preview 8 FPS, adjustable. The VFX lab is a procedural slash preview only, not an AI render or exportable effect.

## Validation and limitations
- Six isolated grid validation cases passed: two valid configurations, invalid dimensions, too many frames, invalid row and invalid FPS.
- Static check: DOM IDs unique and all literal JS ID references present.
- Browser runtime, IndexedDB persistence, downloads, visual/touch and iPad performance are not yet verified.
- Manual QA: open via static HTTP server, import a 6-column sheet, play and stop, change row/FPS, save and reload, export image and manifest, confirm invalid grid rejected, delete only after backup, test VFX and verify game unchanged.
- No live deployment, no AI API integration, no generated/approved production sprite, no cloud sync, no game renderer integration or server changes in this branch.
