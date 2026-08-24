/* ══════════ Bootstrap — FPS auto-tuner + crash-proof loop ══════════ */
import {Scene} from './scene.js';
import {Models} from './models.js';
import {Traffic} from './traffic.js';
import {Particles} from './particles.js';
import {Game} from './game.js';
import {UI} from './ui.js';
import {Input} from './input.js';
import {Audio} from './audio.js';
import {SaveManager} from './save.js';

(function(){
  const $ = id => document.getElementById(id);
  window.addEventListener('error', e => {
    try{ const d = $('dbg');
      if(d){ d.textContent = '⚠ Error: ' + (e.message || e.type || 'unknown'); d.classList.add('show'); }
    }catch(_){}
  });
  setTimeout(() => {
    if(!window.__nh44Boot){
      const d = $('dbg');
      if(d){ d.textContent = '⚠ NH-44 failed to boot: Three.js could not load.'; d.classList.add('show'); }
    }
  }, 3500);
  if(!window.THREE){ $('err').classList.remove('hide'); return; }

  const app = $('app');
  let W = innerWidth, H = innerHeight;
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MOBILE = /Mobi|Android/i.test(navigator.userAgent);
  const LOW_POWER = !!(navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)
    || !!(navigator.deviceMemory && navigator.deviceMemory <= 4);

  function fit(){
    const vw = innerWidth, vh = innerHeight;
    if(vh > vw){ W = vh; H = vw;
      app.style.width = W+'px'; app.style.height = H+'px';
      app.style.transformOrigin = '0 0';
      app.style.transform = `translateX(${vw}px) rotate(90deg)`;
    }else{ W = vw; H = vh;
      app.style.width = W+'px'; app.style.height = H+'px';
      app.style.transform = 'none'; }
    document.documentElement.style.setProperty('--ui-scale',
      Math.min(1.2, Math.max(0.65, Math.min(W,H)/800)));
    if(Scene.renderer) Scene.resize(W,H);
  }
  let resizeTimer = null;
  function scheduleFit(){
    if(resizeTimer) cancelAnimationFrame(resizeTimer);
    resizeTimer = requestAnimationFrame(fit);
  }
  addEventListener('resize', scheduleFit);
  addEventListener('orientationchange', () => setTimeout(fit, 120));
  fit();

  if(!Scene.init(W,H)){ $('err').classList.remove('hide'); return; }
  Models.init(Scene);
  Traffic.init(Scene, Models);
  Particles.init(Scene);
  Game.init(REDUCED);
  UI.init();
  Game.populateDecor();

  /* ══════════ FPS AUTO-TUNER ══════════ */
  const Perf = {level: REDUCED || LOW_POWER ? 0 : (MOBILE ? 1 : 2), t: 0, f: 0, bad: 0};
  function setShadowSize(s){
    const d = Scene.dir;
    if(!d || !d.shadow) return;
    d.shadow.mapSize.set(s,s);
    if(d.shadow.map){ d.shadow.map.dispose(); d.shadow.map = null; }
  }
  function applyQuality(l){
    Perf.level = Math.max(0, Math.min(2, l));
    Game.setPerf(Perf.level);
    if(Scene.scene && Scene.scene.fog){
      const fogNear = Perf.level === 2 ? 30 : Perf.level === 1 ? 40 : 52;
      const fogFar = Perf.level === 2 ? 185 : Perf.level === 1 ? 160 : 130;
      Scene.scene.fog.near = fogNear;
      Scene.scene.fog.far = fogFar;
    }
    if(Perf.level === 2){
      Scene.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
      Scene.dir.castShadow = true; setShadowSize(1024);
    }else if(Perf.level === 1){
      Scene.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
      Scene.dir.castShadow = true; setShadowSize(512);
    }else{
      Scene.renderer.setPixelRatio(1);
      Scene.dir.castShadow = false;
    }
  }
  applyQuality(Perf.level);

  Audio.setMuted(SaveManager.isMuted());
  const mb = $('btnMute');
  mb.textContent = SaveManager.isMuted() ? '🔇' : '🔊';
  mb.setAttribute('aria-pressed', String(SaveManager.isMuted()));

  /* Name prompt */
  function confirmName(){
    const name = SaveManager.normalizeName($('nameIn').value);
    const pass = $('namePass').value.trim();
    if(!name || !pass){
      UI.toast('⚠ Enter both your driver name and password.');
      return;
    }
    const result = SaveManager.login(name, pass);
    if(!result.ok){
      UI.toast('⚠ Unable to create account.');
      return;
    }
    SaveManager.self().name = name;
    SaveManager.persist();
    UI.hideOv($('nameOv'));
    UI.refreshNameUI();
    UI.showOv($('menu'));
    UI.toast(result.sameAccount ? 'Welcome back, ' + name + '!' : 'New account ready, ' + name + '!');
  }
  $('btnNameOk').onclick = confirmName;
  $('nameIn').addEventListener('keydown', e => {
    if(e.key === 'Enter'){ e.preventDefault(); confirmName(); } });
  $('namePass').addEventListener('keydown', e => {
    if(e.key === 'Enter'){ e.preventDefault(); confirmName(); } });
  $('btnName').onclick = () => {
    $('nameIn').value = SaveManager.self().name || '';
    $('namePass').value = '';
    UI.hideOv($('menu')); UI.showOv($('nameOv'));
  };

  function startGame(){
    Audio.sfx.click();
    try{ if(screen.orientation && screen.orientation.lock)
      screen.orientation.lock('landscape').catch(()=>{}); }catch(e){}
    ['menu','over','pauseOv','garage','nameOv'].forEach(id => UI.hideOv($(id)));
    if(document.activeElement && document.activeElement.blur) document.activeElement.blur();
    Game.resetRun();
    Game.startCount();
    UI.startCountdown();
  }
  function toMenu(){
    Audio.sfx.click();
    Game.resetRun(); Game.setMode('menu'); Game.S.speed = 24;
    Traffic.populateMenu();
    UI.toMenu();
  }
  function togglePause(){
    if(Game.S.mode === 'play'){
      Game.setPaused(true); UI.showOv($('pauseOv'));
      Audio.sfx.click(); UI.announce('Game paused');
    }else if(Game.S.mode === 'pause'){
      Game.setPaused(false); UI.hideOv($('pauseOv'));
      Audio.sfx.click(); UI.announce('Resumed');
    }
  }
  function toggleMute(){
    const m = !Audio.isMuted();
    Audio.setMuted(m); SaveManager.setMuted(m); SaveManager.persist();
    mb.textContent = m ? '🔇' : '🔊';
    mb.setAttribute('aria-pressed', String(m));
    UI.announce(m ? 'Muted' : 'Unmuted');
  }

  Input.init({
    onPause: togglePause, onMute: toggleMute, onStart: startGame,
    onCloseGarage: UI.closeGarage,
    onHorn: () => Game.horn(),
    onEnter: () => {
      if(Game.S.mode === 'menu' && $('garage').classList.contains('hide')
         && $('nameOv').classList.contains('hide')) startGame();
      else if(Game.S.mode === 'over') startGame();
    },
    onPointerDown: () => { Audio.init(); Audio.resume(); }
  });

  $('btnStart').onclick = startGame;
  $('btnAgain').onclick = startGame;
  $('btnRestart').onclick = () => { UI.hideOv($('pauseOv')); startGame(); };
  $('btnResume').onclick = togglePause;
  $('btnHome').onclick = toMenu;
  $('btnHome2').onclick = toMenu;
  $('btnPause').onclick = togglePause;
  $('btnMute').onclick = toggleMute;
  const hornBtn=$('t-horn'); if(hornBtn) hornBtn.addEventListener('pointerdown', e=>{e.preventDefault(); Game.horn();});
  $('btnGarage').onclick = UI.openGarage;
  $('btnGarBack').onclick = UI.closeGarage;
  UI.gEl.codeOut.addEventListener('focus', () => UI.gEl.codeOut.select());
  $('btnRefreshCode').onclick = () => { UI.gEl.codeOut.value = SaveManager.encode(); UI.toast('🔄 Refreshed'); };
  $('btnImport').onclick = () => {
    const o = SaveManager.decode(UI.gEl.codeIn.value);
    if(!o){ UI.toast('❌ Invalid save code'); return; }
    SaveManager.merge(o);
    SaveManager.setMuted(!!o.mute);
    Audio.setMuted(SaveManager.isMuted());
    mb.textContent = SaveManager.isMuted() ? '🔇' : '🔊';
    mb.setAttribute('aria-pressed', String(SaveManager.isMuted()));
    Game.rebuildPlayer();
    SaveManager.persist();
    UI.refreshGarage(); UI.refreshNameUI();
    UI.el.best.textContent = SaveManager.self().best.toLocaleString();
    UI.el.menuBest.textContent = SaveManager.self().best.toLocaleString();
    Audio.sfx.buy();
    UI.toast('📥 Imported! Welcome, ' + SaveManager.self().name + '!');
    UI.gEl.codeIn.value = '';
  };
  $('btnAddFriend').onclick = () => {
    const o = SaveManager.decode(UI.gEl.codeIn.value);
    if(!o){ UI.toast('❌ Invalid save code'); return; }
    if(!o.name){ UI.toast('❌ No driver name in save'); return; }
    if(!SaveManager.addFriend(o)){ UI.toast('⚠ Could not add friend'); return; }
    SaveManager.persist(); UI.refreshGarage();
    UI.gEl.codeIn.value = '';
    Audio.sfx.buy();
    UI.toast('👥 Added ' + o.name + ' as friend!');
  };
  $('btnCopyCode').onclick = e => UI.copySave(e.currentTarget);
  $('btnCopyOver').onclick = e => UI.copySave(e.currentTarget);
  document.addEventListener('visibilitychange', () => {
    if(document.hidden && Game.S.mode === 'play') togglePause();
  });

  /* Game events — wrapped so a UI hiccup can never kill the loop */
  function onGameEvent(type, data){
    try{
      const S = Game.S;
      if(type === 'biome') UI.banner(data);
      else if(type === 'km') { UI.toast('🚩 ' + data + ' KM REACHED'); Audio.sfx.checkpoint(); }
      else if(type === 'checkpoint') UI.floater(new THREE.Vector3(S.px,1.8,-2), (data.clean?'✨ CLEAN ':'')+'CHECKPOINT +' + data.bonus, 'gold');
      else if(type === 'speedBonus') UI.floater(new THREE.Vector3(S.px,2.2,-2), 'SPEED BANK +' + data.v, 'cyan');
      else if(type === 'milestone') UI.floater(new THREE.Vector3(S.px,1.7,-2), '🔥 COMBO ' + data.n + ' +' + data.v, 'gold');
      else if(type === 'oncoming') UI.toast('⚠ ONCOMING LANE OPEN — high risk, high reward!');
      else if(type === 'coin') UI.floater(data.pos, '+' + data.v, 'gold');
      else if(type === 'nitro') UI.floater(data.pos, 'Nitro +' + data.gain, 'cyan');
      else if(type === 'nitroFull') UI.toast('⚡ NITRO FULL!');
      else if(type === 'shieldPick')
        UI.floater(data.pos, data.gain ? 'Shield +1' : 'Shield full +300', 'cyan');
      else if(type === 'shield') UI.floater(data.pos, 'Shield block!', 'cyan');
      else if(type === 'fly') UI.floater(data.pos, 'FLY OVER! +' + data.v, 'cyan');
      else if(type === 'miss')
        UI.floater(data.pos, (data.oncoming ? 'Oncoming! ' : 'Close pass ') + '+' + data.v, 'white');
      else if(type === 'cone') UI.floater(data.pos, '-50', 'red');
      else if(type === 'ramp') UI.floater(new THREE.Vector3(S.px, 2, -2), 'TAKE OFF!', 'gold');
      else if(type === 'gameOver'){
        let r;
        try{ r = Game.finalizeRun(); }
        catch(e){ r = {score: Math.floor(S.score), rec: false, gold: 0, achGot: [], chalGot: [],
          beaten: null, dist: S.dist, coins: S.coins, combo: S.maxMult,
          misses: S.misses, speedBonusGates:S.speedBonusGates, cleanDist:S.cleanDist, biome: '-', vehicle: '-'}; }
        Game.setMode('over');
        UI.showGameOver(r);
      }
    }catch(e){ /* never kill the loop */ }
  }

  /* Main loop — protected */
  const clock = new THREE.Clock();
  let demoInit = false, errShown = false;
  function safeUpdate(dt, raw){
    try{
      Game.update(dt, raw, Input.keys(), Input.touch(), onGameEvent);
    }catch(err){
      if(!errShown){
        errShown = true;
        const d = $('dbg');
        if(d){ d.textContent = '⚠ Recovered from: ' + (err.message || err); d.classList.add('show'); }
      }
      // Force a clean game-over instead of freezing
      if(Game.S.mode !== 'over'){
        try{
          const r = Game.finalizeRun();
          Game.setMode('over');
          UI.showGameOver(r);
        }catch(e2){
          Game.setMode('over');
          UI.showOv($('over'));
        }
      }
    }
  }

  function loop(){
    requestAnimationFrame(loop);
    if(document.hidden){
      if(Game.S.mode === 'play' || Game.S.mode === 'count'){
        Game.setPaused(true);
      }
      return;
    }
    const raw = Math.min(clock.getDelta(), .05);

    /* FPS sampling */
    Perf.t += raw; Perf.f++;
    if(Perf.t >= 1.5){
      const fps = Perf.f / Perf.t; Perf.t = 0; Perf.f = 0;
      if(fps < 42){ Perf.bad++;
        if(Perf.bad >= 2 && Perf.level > 0){ applyQuality(Perf.level - 1); Perf.bad = 0; } }
      else if(fps > 58 && Perf.level < 2){ Perf.bad = 0; applyQuality(Perf.level + 1); }
      else Perf.bad = 0;
    }

    if(!demoInit){
      demoInit = true;
      Game.resetRun(); Game.setMode('menu'); Game.S.speed = 24;
      Traffic.populateMenu();
    }
    if(Game.S.mode === 'count'){
      const S = Game.S;
      S.cdT -= raw;
      const n = Math.ceil(S.cdT - .4);
      if(S.cdT <= 0){
        Game.startPlay();
        UI.el.count.textContent = 'GO!!';
        UI.el.count.classList.add('go');
        UI.el.count.classList.remove('zoom');
        void UI.el.count.offsetWidth;
        UI.el.count.classList.add('zoom');
        Audio.sfx.beep(true);
        setTimeout(() => { UI.el.count.style.display = 'none';
          UI.el.count.classList.remove('go'); }, 700);
      }else if(n !== S.cdNum && n > 0){
        S.cdNum = n;
        UI.el.count.textContent = n;
        UI.el.count.classList.remove('zoom');
        void UI.el.count.offsetWidth;
        UI.el.count.classList.add('zoom');
        Audio.sfx.beep(false);
      }
      safeUpdate(0.0001, raw);
    }else if(Game.S.mode === 'pause' || Game.S.mode === 'over'){
      /* frozen */
    }else{
      safeUpdate(raw * Game.S.timescale, raw);
    }
    UI.updateHUD(Game.S, 1 + Math.min(Game.S.combo, 30) * .08);
    Scene.renderer.render(Scene.scene, Scene.camera);
  }

  UI.refreshGold(); UI.refreshNameUI();
  window.__nh44Boot = true;
  loop();

  if(!SaveManager.self().name){ UI.hideOv($('menu')); UI.showOv($('nameOv')); }
  else UI.showOv($('menu'));
})();