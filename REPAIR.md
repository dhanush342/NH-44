# NH-44 — Complete repaired project

This package contains the full supplied NH-44 project with the known cross-file wiring fixes applied.

## Applied fixes
- Replaced the broken `js/audio.js` duplicate of `scene.js` with the actual WebAudio `Audio` module.
- Removed the dead `btnCopyPause` binding from `js/main.js`.
- Added the missing `goBiome` element to the game-over metadata so `ui.js` can populate it.
- Pinned Three.js to `0.128.0` in `index.html`, matching the legacy `outputEncoding` API used by the scene code.
- Preserved all supplied JS, CSS, HTML, configuration, save, social, model, traffic, particle, and deployment files.

## Structure

- `index.html` — application shell
- `js/main.js` — application bootstrap and module wiring
- `js/audio.js` — WebAudio
- `js/scene.js` — Three.js scene
- `js/models.js` — player/traffic models
- `js/traffic.js` — traffic AI
- `js/particles.js` — particles
- `js/game.js` — game loop/gameplay
- `js/ui.js` — UI
- `js/input.js` — keyboard/touch input
- `js/save.js` — persistence/save codes
- `js/social.js` — leaderboard/friends/challenges
- `js/config.js` — game data
- `css/` — styling
- `vercel.json` — deployment configuration
- `tools/verify-project.mjs` — structural verification

## Verification

All JavaScript files pass `node --check`, and `tools/verify-project.mjs` passes on this package.

## Three.js note

The project uses a pinned CDN build because the supplied project did not contain a local `three.min.js`. The application therefore remains deployable without adding an unverified binary library to the archive.
