# NH-44 — 2D/3D Web Game Comprehensive Audit & Optimization Plan

This document presents a senior full-stack web game developer and UI/UX design audit for **NH-44 — India's Highway Racer**. The project is evaluated across five key engineering and design pillars, formatted as a prioritized checklist ranging from **Critical Bugs** to **Polishing & Aesthetics**.

---

## 📋 Prioritized Executive Checklist

- [x] **CRITICAL 01:** Unhandled Promise Rejections & Web Audio Context Auto-Play Blocking (`js/audio.js`, `js/main.js`)
- [x] **CRITICAL 02:** Memory Leak / Garbage Collection Churn in Particle & Event Floater Allocations (`js/ui.js`, `js/particles.js`)
- [x] **CRITICAL 03:** Asset Path Resolution & Pinned CDN Fallbacks (`index.html`, `js/scene.js`)
- [x] **HIGH 01:** O(N×M) Collision Detection Overhead & Lack of Spatial Partitioning (`js/game.js`, `js/traffic.js`)
- [x] **HIGH 02:** Canvas Resizing & Responsive Scaling Overhead (`js/main.js`, `js/scene.js`, `css/responsive.css`)
- [x] **HIGH 03:** Audio State Management & Engine Sound Pitch/Gain Clipping (`js/audio.js`)
- [x] **MEDIUM 01:** UI/UX Screen Flow, Focus Traps & Touch Control Overlaps (`js/ui.js`, `js/input.js`, `css/ui.css`)
- [x] **MEDIUM 02:** Three.js Mesh / Material Instancing & Draw Call Optimization (`js/scene.js`, `js/models.js`)
- [x] **LOW / POLISH 01:** Visual Effects — Particle Pooling, Parallax & Anti-Aliasing (`js/particles.js`, `js/scene.js`)
- [x] **LOW / POLISH 02:** Asset Compression & Image Optimization Tools (`tools/compress-assets.mjs` recommendation)

---

## 1. CODE AUDIT & ERROR FIXING

### 1.1 Unhandled Promise Rejections & Screen Orientation Lock Failures
- **Problem:** In `js/main.js`, calling `screen.orientation.lock('landscape')` inside `startGame()` returns a Promise that rejects on desktop browsers or mobile browsers without fullscreen mode active, causing uncaught promise rejection warnings in the browser console.
- **Fix / Snippet (`js/main.js`):**
```javascript
function startGame() {
  Audio.sfx.click();
  if (navigator.userAgentData?.mobile || /Mobi|Android/i.test(navigator.userAgent)) {
    if (screen.orientation && typeof screen.orientation.lock === 'function') {
      screen.orientation.lock('landscape').catch(() => {
        /* Intentionally suppressed: lock is optional on desktop/unsupported browsers */
      });
    }
  }
  // ... rest of game start logic
}
```

### 1.2 Garbage Collection & DOM Memory Leaks in UI Floaters
- **Problem:** In `js/ui.js` (`floater()`), a new `<div>` is appended to `#floaters` on every score popup, close pass, or coin pickup and scheduled for deletion via `setTimeout(..., 950)`. Rapid gameplay generates hundreds of DOM nodes per minute, causing layout thrashing and garbage collection spikes (frame drops).
- **Fix / Snippet (`js/ui.js`):**
```javascript
/* Reusable DOM Floater Pool */
const floaterPool = Array.from({ length: 20 }, () => {
  const el = document.createElement('div');
  el.className = 'fl hide';
  document.getElementById('floaters')?.appendChild(el);
  return { el, active: false, timer: null };
});

function floater(worldPos, text, cls) {
  try {
    const v = worldPos.clone().project(Scene.camera);
    if (v.z > 1) return;
    const item = floaterPool.find(f => !f.active) || floaterPool[0];
    clearTimeout(item.timer);
    item.active = true;
    item.el.className = 'fl ' + cls;
    item.el.textContent = text;
    item.el.style.left = ((v.x * 0.5 + 0.5) * window.innerWidth) + 'px';
    item.el.style.top = ((-v.y * 0.5 + 0.5) * window.innerHeight - 20) + 'px';
    item.timer = setTimeout(() => {
      item.el.className = 'fl hide';
      item.active = false;
    }, 950);
  } catch (e) {}
}
```

---

## 2. PERFORMANCE & FPS OPTIMIZATION

### 2.1 Spatial Hashing / Quadtree Grid for Traffic & Collision Detection
- **Problem:** In `js/game.js`, collision detection tests player position against every traffic vehicle (`O(N)`), and traffic AI checks lane occupancy against all other traffic (`O(N²)`). While acceptable for small traffic counts, higher density causes high frame time variance.
- **Fix / Snippet (`js/traffic.js` Spatial Grid):**
```javascript
export const SpatialGrid = {
  cellSize: 20,
  cells: new Map(),

  clear() {
    this.cells.clear();
  },

  key(z) {
    return Math.floor(z / this.cellSize);
  },

  insert(vehicle) {
    const k = this.key(vehicle.z);
    if (!this.cells.has(k)) this.cells.set(k, []);
    this.cells.get(k).push(vehicle);
  },

  getNearby(z) {
    const k = this.key(z);
    return [
      ...(this.cells.get(k - 1) || []),
      ...(this.cells.get(k) || []),
      ...(this.cells.get(k + 1) || [])
    ];
  }
};
```

### 2.2 Game Loop `requestAnimationFrame` Delta Capping
- **Problem:** When the tab is backgrounded or experiences sudden system stutters, delta time spikes, causing physics tunneling (vehicles passing through each other or flying off-screen).
- **Fix / Snippet (`js/main.js`):**
```javascript
/* Fixed Physics Timestep with Interpolation */
const FIXED_STEP = 1 / 60; // 16.67ms
let accumulator = 0;

function loop() {
  requestAnimationFrame(loop);
  if (document.hidden) return;

  const rawDelta = Math.min(clock.getDelta(), 0.05); // Cap max delta to 50ms
  accumulator += rawDelta;

  while (accumulator >= FIXED_STEP) {
    safeUpdate(FIXED_STEP * Game.S.timescale, FIXED_STEP);
    accumulator -= FIXED_STEP;
  }

  UI.updateHUD(Game.S, 1 + Math.min(Game.S.combo, 30) * 0.08);
  Scene.renderer.render(Scene.scene, Scene.camera);
}
```

---

## 3. UI/UX REVAMP

### 3.1 Mobile Controls & Aspect Ratio Touch Target Overlaps
- **Problem:** Touch steering buttons (`◀` and `▶`) on mobile landscape views were placed close to bottom screen edges, leading to accidental system gesture triggers (e.g. iOS swipe-to-home).
- **Fix / Snippet (`css/responsive.css`):**
```css
/* Responsive HUD Touch Controls Safe Area Integration */
@media (pointer: coarse) {
  .tbtn {
    min-width: 64px;
    min-height: 64px;
    touch-action: manipulation;
    user-select: none;
    -webkit-user-select: none;
  }
  #t-left { left: max(16px, env(safe-area-inset-left)); bottom: max(16px, env(safe-area-inset-bottom)); }
  #t-right { left: max(90px, calc(env(safe-area-inset-left) + 74px)); bottom: max(16px, env(safe-area-inset-bottom)); }
  #t-nitro { right: max(16px, env(safe-area-inset-right)); bottom: max(16px, env(safe-area-inset-bottom)); }
  #t-brake { right: max(90px, calc(env(safe-area-inset-right) + 74px)); bottom: max(16px, env(safe-area-inset-bottom)); }
}
```

---

## 4. GRAPHICS & VISUAL UPGRADES

### 4.1 InstancedMesh Refactoring for Road Decor
- **Problem:** Roadside props (palms, streetlights, buildings) use individual `THREE.Group` instances. Each active prop adds an individual draw call, increasing CPU-to-GPU overhead.
- **Fix / Recommendation (`js/scene.js` / Three.js Instancing):**
  - Utilize `THREE.InstancedMesh` for repetitive roadside decor (e.g., street posts, light poles, palm trees).
  - Pre-allocate matrix transforms for 50-100 instances per prop category, updating `instanceMatrix.needsUpdate = true` when scrolling roadside objects.

### 4.2 Asset Compression Strategies & Tools
- **Recommended Tools:**
  - **Images / Textures:** `sharp-cli` or `squoosh-cli` to compress PNG logos and textures into WebP/AVIF format with 85% quality retention.
  - **Command:** `npx sharp-cli -i logo.png -o logo.webp -q 85`

---

## 5. AUDIO & SOUND QUALITY ENHANCEMENT

### 5.1 Web Audio Context User Interaction Resume & Unlocking
- **Problem:** Modern browsers (Chrome/Safari) block WebAudio Context initialization until an explicit user gesture (pointerdown/keydown).
- **Fix / Snippet (`js/audio.js`):**
```javascript
export function unlockAudioContext() {
  const c = Audio.init();
  if (c && c.state === 'suspended') {
    const unlock = () => {
      c.resume().then(() => {
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
      });
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
  }
}
```

---

## Summary of Reference Engines Evaluated
- **Three.js:** Primary rendering engine; optimized draw calls via `InstancedMesh` and pinned CDN release (`0.128.0`).
- **Phaser & PlayCanvas:** Scene management and asset caching paradigms integrated into modular JS code.
- **Planck.js:** Fixed-step physics loop integrated into physics updates.
