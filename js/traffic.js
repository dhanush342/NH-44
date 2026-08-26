/* ══════════ Traffic AI (Cars, Trucks, Buses, Autos) ══════════ */
import {TRAFFIC_COLORS, LANES} from './config.js';

export const SpatialGrid = {
  cellSize: 20,
  cells: new Map(),
  clear() { this.cells.clear(); },
  key(z) { return Math.floor(z / this.cellSize); },
  insert(v) {
    if(!v.active) return;
    const k = this.key(v.z);
    if(!this.cells.has(k)) this.cells.set(k, []);
    this.cells.get(k).push(v);
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

export const Traffic = (() => {
  let list = [];
  let Scene = null, Models = null;

  function init(S, M) { Scene = S; Models = M; }

  function build() {
    list = [];
    for(let i = 0; i < 8; i++) {
      const v = Models.buildCarBody(TRAFFIC_COLORS[i]);
      Scene.scene.add(v.g); v.g.visible = false;
      list.push(Object.assign(v, {kind: 'car', active: false}));
    }
    for(let i = 0; i < 4; i++) {
      const v = Models.buildTruck(0x8a9099);
      Scene.scene.add(v.g); v.g.visible = false;
      list.push(Object.assign(v, {kind: 'truck', active: false}));
    }
    for(let i = 0; i < 3; i++) {
      const v = Models.buildBus();
      Scene.scene.add(v.g); v.g.visible = false;
      list.push(Object.assign(v, {kind: 'bus', active: false}));
    }
    for(let i = 0; i < 3; i++) {
      const v = Models.buildAuto();
      Scene.scene.add(v.g); v.g.visible = false;
      list.push(Object.assign(v, {kind: 'auto', active: false}));
    }
  }

  function spawn(oncoming, dist) {
    const lane = oncoming ? 0 : 1 + (Math.random() * 3 | 0);
    if(laneBlocked(lane, -165)) return;
    let kind;
    if(oncoming) kind = 'car';
    else {
      const roll = Math.random();
      kind = roll < 0.45 ? 'car' : roll < 0.63 ? 'truck' : roll < 0.8 ? 'bus' : 'auto';
    }
    let c = null;
    for(const t of list) if(!t.active && t.kind === kind) { c = t; break; }
    if(!c) for(const t of list) if(!t.active) { c = t; break; }
    if(!c) return;
    c.active = true; c.g.visible = true;
    c.lane = lane; c.x = LANES[lane]; c.z = -((Math.random() * 25) + 160);
    c.oncoming = oncoming;
    c.speed = oncoming ? rnd(24, 32) :
              kind === 'auto' ? rnd(9, 13) :
              kind === 'truck' ? rnd(12.5, 16) : rnd(13, 19);
    c.passed = false; c.dead = false; c.y = 0;
    c.changeT = 0; c.targetLane = lane;
    c.g.position.set(c.x, 0, c.z);
    c.g.rotation.set(0, oncoming ? Math.PI : 0, 0);
  }

  function laneBlocked(l, z) {
    for(const c of list)
      if(c.active && c.lane === l && c.z < z + 45) return true;
    return false;
  }

  function clear() {
    list.forEach(c => { c.active = false; c.g.visible = false; });
  }

  function populateMenu() {
    for(let i = 0; i < 3; i++) spawn(false);
    list.forEach(c => {
      if(c.active) { c.z = rnd(-140, -25); c.g.position.z = c.z; }
    });
  }

  const rnd = (a, b) => a + Math.random() * (b - a);

  return {
    init, build, spawn, clear, populateMenu, list: () => list, laneBlocked
  };
})();