# NH-44 — India's Highway Racer

A browser-first 3D endless highway racer running on Three.js/WebGL with procedural Web Audio. Race Srinagar → Kanyakumari, unlock cars and bikes, build combos, collect nitro/coins, dodge traffic, and climb the local/friend leaderboard.

## New gameplay upgrade
- 14 unlockable cars/bikes (10 original + 4 new performance vehicles)
- Combo milestone bonuses at 10/20/30+ hits
- High-speed "Speed Bank" bonus gates
- Clean-distance checkpoint bonuses
- New Speed Bank and Clean Driver challenges
- Live local leaderboard rank in the HUD
- Horn on `H` and a mobile HORN control
- Layered car/bike engine audio, horn, checkpoint, level-up, skid and pickup sounds
- Stronger crash/noise feedback and nitro audio
- Save format v3 with 14-vehicle ownership and backward decoding for v2 saves
- Game-over report includes speed-bank gates and clean distance
- Existing garage, upgrades, friend saves, achievements and leaderboard remain intact

## Open-source engineering
The renderer remains Three.js and the sound layer uses the browser Web Audio API. Architecture and gameplay patterns were reviewed against several open-source engines; see `THIRD_PARTY.md` for the exact projects and licenses.

## Run locally
```powershell
py -m http.server 8080
```
Then open `http://localhost:8080`.

## Deploy
Push the project to GitHub and let the connected Vercel project deploy it, or use the Vercel CLI.
# NH-44
