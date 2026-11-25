# FEED DAYS — Planned milestones

## Implemented prototype — v0.9.3
- Local browser RPG with top-down pixel world, controls, NPCs, quests, maps and monster battles.
- Scroll-name/category-before-use; discovered skills in a 6-slot hotbar, duplication XP, no preset max tier.
- Playable pet/mount core: two AI companions + mount, manual mount attack toggle, independent potions, companion bag and equipment, enhancement, breeding cooldown 5h and 10m incapacitation.
- Lightweight boss fights and scroll/egg drops.
- Draggable multi-window bag, player equipment and pet management. Hold-drag manual slot order; independent equipment slots and rare-item confirmation.
- Distinct real-time floating hit numbers for player physical/critical/magic, companion and mount attacks with species icons, monster incoming damage, and healing. Optional Thai in-game legend; original damage formulas unchanged.
- Forge star-upgrade material dropdown shows only identical-name equipment; every attempt consumes one matching gear plus one star crystal, while failure preserves main gear and its stars.
- Real-time local ground loot items with ownership unlock after 1m and expiration after 3m; tap specific items or one-tap **collect all nearby** (v0.9.1); fox treasure AI filters and player/pet bag destination.

## Next: stability and gameplay polish
- Real-device iPad smoke tests: save migrations, Home Screen launch, multi-touch, 6-slot hotbar spacing, floating window drag and item long-press, pet windows, offline resume, ground loot taps and pickup button.
- Verify v0.9.3 damage-number legibility on a real iPad at multiple text sizes and different numbers of pets on screen.
- Design additional meaningful enhancement-linked status attributes, weapon traits or affixes (not yet implemented); decide balancing/caps before coding.
- Rebalance drop table and boss rarity after playtesting: v0.9.1 starts at **40% per kill (one item)** for regular monsters and bosses, with money still auto-awarded.
- Decide whether monster coins should drop on the ground or remain auto-awarded (v0.9.1 keeps automatic money).
- Sprite animation upgrades, boss telegraphs and visible status effects.
- Expand scroll registry and skills beyond ten examples; separate pet skill scrolls and improve skill-orb effects.
- Robust pet capture; hatchery, creature breeding GUI refinements, selectable breeding pairs and rarity balance.
- Save export/import for safety before browser storage is cleared; avoid real credentials.

## Future: online foundations
- Railway server + database + authentication, server authoritative cooldown, inventory, item identity, damage, genes and economy.
- Player-to-player direct trades with dual confirmation, markets/auctions, secure escrow; scroll trade fully free.
- Multiplayer presence, parties, shared bosses, PvP safe-zone and anti-grief protections.
- Structured asset packs, more zones, mount visuals, pet AI tuning and skills.
- Official 1v1 tournaments / honor under evolution tiers, no public Hall of Fame by default.

**Reminder:** GitHub Pages serves static files only. Currently no persistent multiplayer game server; do not label mock accounts/trading as secure online functionality.
