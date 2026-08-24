/* ══════════ Particle Systems ══════════ */
export const Particles = (() => {
  let Scene = null;
  let bursts = [], dusts = [], streaks = [], skids = [];
  let burstMats = {};
  let streakMat = null, wearM = null;
  const GOLD = 0xffd23f, CYAN = 0x41e0ff, RED = 0xff5040;

  function init(S) {
    Scene = S;
    const bMat = c => burstMats[c] || (burstMats[c] = new THREE.MeshBasicMaterial({color: c}));
    for(let i = 0; i < 70; i++) {
      const m = new THREE.Mesh(Scene.geo.box, bMat(GOLD));
      m.visible = false; Scene.scene.add(m);
      bursts.push({m, active: false, v: new THREE.Vector3(), t: 0,
                   life: 0.6, spin: 0, grav: 10, size: 0.16});
    }
    for(let i = 0; i < 12; i++) {
      const m = new THREE.Mesh(Scene.geo.cir, new THREE.MeshBasicMaterial({
        color: 0xb0a896, transparent: true, opacity: 0.5, depthWrite: false
      }));
      m.rotation.x = -Math.PI/2; m.visible = false; Scene.scene.add(m);
      dusts.push({m, active: false, t: 0, life: 0.6, gr: 1});
    }
    streakMat = new THREE.MeshBasicMaterial({
      color: 0xbfe8ff, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    for(let i = 0; i < 24; i++) {
      const m = new THREE.Mesh(Scene.geo.box, streakMat);
      m.scale.set(0.06, 0.06, rnd(5, 9));
      m.visible = false; Scene.scene.add(m);
      streaks.push({m, active: false});
    }
    for(let i = 0; i < 48; i++) {
      const m = new THREE.Mesh(Scene.geo.plane, new THREE.MeshBasicMaterial({
        color: 0x14161c, transparent: true, opacity: 0, depthWrite: false
      }));
      m.rotation.x = -Math.PI/2; m.scale.set(0.26, 1.15, 1);
      m.visible = false; Scene.scene.add(m);
      skids.push({m, life: 0});
    }
  }

  const rnd = (a, b) => a + Math.random() * (b - a);

  function burst(pos, color, n, spd, life, grav, size) {
    const bMat = c => burstMats[c] || (burstMats[c] = new THREE.MeshBasicMaterial({color: c}));
    let c = 0;
    for(const b of bursts) {
      if(b.active) continue;
      b.active = true; b.m.visible = true;
      b.m.material = bMat(color); b.m.position.copy(pos);
      b.v.set(rnd(-1,1), rnd(0.2, 1.2), rnd(-1, 1)).normalize().multiplyScalar(rnd(0.3, 1) * spd);
      b.t = 0; b.life = life; b.spin = rnd(-6, 6); b.grav = grav; b.size = size || 0.16;
      b.m.scale.set(b.size, b.size, b.size);
      if(++c >= n) break;
    }
  }

  function dust(pos, n, gr) {
    let c = 0;
    for(const d of dusts) {
      if(d.active) continue;
      d.active = true; d.m.visible = true;
      d.m.position.set(pos.x + rnd(-0.6, 0.6), 0.08, pos.z + rnd(-0.6, 0.6));
      d.t = 0; d.life = rnd(0.4, 0.7); d.gr = gr || rnd(1.5, 3);
      d.m.scale.set(0.5, 0.5, 0.5);
      if(++c >= n) break;
    }
  }

  function skid(x, z) {
    for(const s of skids) {
      if(s.life > 0) continue;
      s.life = 1; s.m.visible = true;
      s.m.position.set(x, 0.032, z); s.m.material.opacity = 0.3;
      return;
    }
  }

  function update(dt, dz, S, streakOn, reducedMotion) {
    const v = new THREE.Vector3();
    if(streakOn && Math.random() < dt * 40) {
      for(const s of streaks) {
        if(s.active) continue;
        s.active = true; s.m.visible = true;
        s.m.position.set((Math.random()<0.5?-1:1) * rnd(3, 11), rnd(0.4, 4.5), -rnd(10, 70));
        break;
      }
    }
    streakMat.opacity = streakOn ? clamp((S.speed - 30) / 20, 0.15, 0.5) + (S.nitroOn ? 0.25 : 0) : 0;
    for(const s of streaks) {
      if(!s.active) continue;
      s.m.position.z += S.speed * 2.6 * dt;
      if(s.m.position.z > 12) { s.active = false; s.m.visible = false; }
    }
    for(const b of bursts) {
      if(!b.active) continue;
      b.t += dt;
      b.m.position.addScaledVector(b.v, dt);
      b.v.y -= b.grav * dt;
      const k = 1 - b.t / b.life;
      if(k <= 0) { b.active = false; b.m.visible = false; continue; }
      b.m.scale.set(b.size * k + 0.02, b.size * k + 0.02, b.size * k + 0.02);
      b.m.rotation.x += b.spin * dt;
      b.m.rotation.y += b.spin * dt;
    }
    for(const d of dusts) {
      if(!d.active) continue;
      d.t += dt;
      const k = d.t / d.life;
      if(k >= 1) { d.active = false; d.m.visible = false; continue; }
      const s = 0.5 + d.gr * d.t * 3;
      d.m.scale.set(s, s, s);
      d.m.material.opacity = 0.5 * (1 - k);
    }
    for(const s of skids) {
      if(s.life <= 0) continue;
      s.life -= dt * 0.32;
      s.m.position.z += dz;
      if(s.life <= 0 || s.m.position.z > 24) { s.life = 0; s.m.visible = false; }
      else s.m.material.opacity = 0.3 * Math.min(1, s.life);
    }
  }

  function clear() {
    bursts.forEach(b => { b.active = false; b.m.visible = false; });
    streaks.forEach(s => { s.active = false; s.m.visible = false; });
  }

  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  return { init, burst, dust, skid, update, clear };
})();