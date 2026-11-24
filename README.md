# FEED DAYS — Phase 2

Online accounts + persistent SQLite database + original Phaser 08 Ring Town. The game itself is still single-player; multiplayer and character persistence arrive in later phases.

## Run
Requires Node.js 24 (built-in SQLite, no npm dependencies). Run `npm start`, then visit http://localhost:8080. Run `npm test` for navigation and account integration tests.

## Deploy
GitHub Pages cannot execute a Node server. Deploy the repository using its Dockerfile on a Node/Docker host such as Railway. Use one instance with a persistent writable volume mounted at /data. Set `NODE_ENV=production`, `PUBLIC_ORIGIN=https://your-real-hostname` (no trailing slash), and `DB_PATH=/data/feed-days.sqlite`. Use the host's HTTPS endpoint and keep backups of the database (SQLite online backup or stopped-service snapshot). Do not deploy with an ephemeral filesystem or multiple replicas. The server intentionally refuses production startup without PUBLIC_ORIGIN. Health endpoint: /health. Never commit database files or real credentials. For public scale-out, plan PostgreSQL and distributed rate limiting.

## Auth
Register an ID (3–24 ASCII letters, digits, underscores; case-insensitive) and password (10–128 characters). Login issues a seven-day random session cookie (HttpOnly, SameSite=Lax, Secure in production); the database stores a SHA-256 token digest and salted scrypt password hash, not passwords or raw session tokens. Requests require same origin. In-process throttling and bounded password hashing protect a single instance; reverse proxy IP sharing may affect limits. Logout revokes the session. There is no password recovery yet. No character data is saved in Phase 2.

## Files
- index.html: registration/login
- game.html: original Phase 1 entry page plus session bar
- scripts/account.js, scripts/session.js, styles/account.css: account UI
- server/server.cjs, server/database.cjs: HTTP server and schema
- scripts/config.js, input.js, town.js, navigation.js, game.js, styles/game.css and original PNG assets: unchanged Phase 1
- tests/: navigation and account tests

## Backups
Phase 1: backup/phase-1-before-phase-2 (a87d3225d47cc8f0b359a44aaca70d3b92e9b1cf).
Phase 0: backup/phaser-08-before-phase-1.
