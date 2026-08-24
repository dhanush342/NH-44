/* ══════════ UI — NULL-SAFE (never crashes on missing DOM) ══════════ */
import {SaveManager} from './save.js';
import {Audio} from './audio.js';
import {Social} from './social.js';
import {Scene} from './scene.js';
import {UPGRADES, VEHICLES, ACHIEVEMENTS} from './config.js';
import {Game} from './game.js';

export const UI = (() => {
  /* Fallback dummy element: setting textContent/classList on it is harmless.
     This guarantees "Cannot set properties of null" can NEVER happen. */
  const byId = id => document.getElementById(id) || document.createElement('div');

  const el = {}, gEl = {};
  let toastT = null;

  function init(){
    ['score','comboBox','comboV','shieldBox','shieldV','dist','best','spd',
     'gArc','gNeedle','nitroFill','tNitro','toast','toastV','banner',
     'bannerV','bannerE','count','flash','nitrofx','menu','menuBest',
     'menuName','menuGold','over','goScore','goDist','goCoins','goCombo',
     'goMiss','goSpeedBanks','goClean','goBest','goBiome','goGold','goAchList','goName','goLoc',
     'goVeh','goFriendBeat','newRec','pauseOv','locV','garName','garGold','rankV']
      .forEach(id => el[id] = byId(id));
    gEl.garage = byId('garage');
    gEl.upgList = byId('tab-upg');
    gEl.carList = byId('tab-cars');
    gEl.chalList = byId('tab-chal');
    gEl.friendsList = byId('tab-friends');
    gEl.lbList = byId('tab-lb');
    gEl.achList = byId('tab-ach');
    gEl.statList = byId('tab-stats');
    gEl.codeOut = byId('codeOut');
    gEl.codeIn = byId('codeIn');

    refreshNameUI(); refreshGold();
    el.best.textContent = SaveManager.self().best.toLocaleString();
    el.menuBest.textContent = SaveManager.self().best.toLocaleString();
    if(el.rankV) el.rankV.textContent = '—';

    document.querySelectorAll('.gtab').forEach(b => {
      b.onclick = () => {
        Audio.sfx.click();
        document.querySelectorAll('.gtab').forEach(x => {
          x.classList.toggle('on', x === b);
          x.setAttribute('aria-selected', x === b ? 'true' : 'false');
        });
        ['upg','cars','chal','friends','lb','ach','stats','save'].forEach(t =>
          byId('tab-' + t).classList.toggle('hide', t !== b.dataset.tab));
        if(b.dataset.tab === 'lb') Social.renderLeaderboard(gEl.lbList);
        if(b.dataset.tab === 'friends') Social.renderFriends(gEl.friendsList);
        if(b.dataset.tab === 'chal') Social.renderChallenges(gEl.chalList);
      };
    });
  }

  const fmtG = n => n >= 10000 ? (n/1000).toFixed(0) + 'k' : String(n);
  const bits = n => { let c = 0; while(n){ c += n & 1; n >>= 1; } return c; };
  const css = n => '#' + n.toString(16).padStart(6,'0');
  const escapeHtml = s => String(s).replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function refreshNameUI(){
    const n = SaveManager.self().name || 'DRIVER';
    el.menuName.textContent = n;
    el.garName.textContent = n;
    el.goName.textContent = n;
    if(el.rankV){
      const lb = SaveManager.self().lb || [];
      const me = n;
      let rank = 1;
      const idx = lb.findIndex(e => e.name === me && !e.friend);
      if(idx >= 0) rank = idx + 1;
      else {
        const better = lb.filter(e => e.sc > (SaveManager.self().best || 0)).length;
        rank = better + 1;
      }
      el.rankV.textContent = '#' + rank;
    }
  }
  function refreshGold(){
    const g = fmtG(SaveManager.self().gold);
    el.menuGold.textContent = g;
    el.garGold.textContent = g;
  }
  function announce(msg){
    try{
      const l = document.getElementById('live');
      if(l){ l.textContent = ''; requestAnimationFrame(() => l.textContent = msg); }
    }catch(e){}
  }
  function toast(msg){
    el.toastV.textContent = msg;
    el.toast.classList.add('show');
    announce(msg);
    clearTimeout(toastT);
    toastT = setTimeout(() => el.toast.classList.remove('show'), 2400);
  }
  function banner(b){
    el.bannerV.textContent = b.name;
    el.bannerE.textContent = b.en;
    el.banner.classList.add('show');
    announce('Entering ' + b.name);
    setTimeout(() => el.banner.classList.remove('show'), 2600);
  }
  function floater(worldPos, text, cls){
    try{
      const v = worldPos.clone().project(Scene.camera);
      if(v.z > 1) return;
      const app = document.getElementById('app');
      const W = app ? app.clientWidth : innerWidth;
      const H = app ? app.clientHeight : innerHeight;
      const d = document.createElement('div');
      d.className = 'fl ' + cls;
      d.textContent = text;
      d.style.left = ((v.x*.5+.5)*W) + 'px';
      d.style.top = ((-v.y*.5+.5)*H - 20) + 'px';
      document.getElementById('floaters').appendChild(d);
      setTimeout(() => d.remove(), 950);
    }catch(e){}
  }

  function updateHUD(S, mult){
    el.score.textContent = Math.floor(S.score).toLocaleString();
    const kmh = Math.round(S.speed*3.6);
    el.spd.textContent = kmh;
    const r = Math.min(1, Math.max(0, kmh/240));
    el.gArc.setAttribute('stroke-dashoffset', 169.6*(1-r));
    el.gArc.setAttribute('stroke', S.nitroOn ? '#41e0ff' : '#ffb03a');
    el.gNeedle.setAttribute('transform', `rotate(${-90+180*r} 66 66)`);
    el.dist.textContent = (S.dist/1000).toFixed(2) + ' km';
    el.nitroFill.style.width = (S.nitro/(100+SaveManager.self().upg[1]*20)*100) + '%';
    el.tNitro.classList.toggle('ready', S.nitro > 25 && !S.nitroOn);
    el.tNitro.classList.toggle('empty', S.nitro < 8);
    el.nitrofx.classList.toggle('on', S.nitroOn);
    const loc = Game.currentLocation();
    el.locV.textContent = loc.name;
    if(S.shield > 0){
      el.shieldBox.style.display = 'block';
      el.shieldV.textContent = '🛡 SHIELD ×' + S.shield;
    } else el.shieldBox.style.display = 'none';
    if(S.combo > 1){
      el.comboBox.style.display = 'block';
      const txt = 'COMBO ×' + mult.toFixed(1);
      if(el.comboV.textContent !== txt){
        el.comboV.textContent = txt;
        el.comboBox.classList.remove('pop');
        void el.comboBox.offsetWidth;
        el.comboBox.classList.add('pop');
      }
    } else el.comboBox.style.display = 'none';
  }

  function showOv(ov){
    ov.classList.remove('hide');
    requestAnimationFrame(() => {
      const f = ov.querySelector('[data-autofocus]') || ov.querySelector('button:not([disabled])');
      if(f) f.focus();
    });
  }
  function hideOv(ov){ ov.classList.add('hide'); }

  const pips = (lv,max) => '<em>' + '■'.repeat(lv) + '</em><i>' + '□'.repeat(max-lv) + '</i>';
  const bw = v => Math.round(Math.min(1, Math.max(.06, (v-.8)/.45)) * 100);
  const sbar = (n,v) => `<div class="sbar"><em>${n}</em><u style="--w:${bw(v)}%" aria-hidden="true"></u></div>`;

  function renderUpg(){
    const save = SaveManager.self();
    gEl.upgList.innerHTML = '';
    UPGRADES.forEach((u,i) => {
      const lv = save.upg[i], maxed = lv >= u.max, cost = maxed ? 0 : u.cost[lv];
      const row = document.createElement('div'); row.className = 'uprow';
      row.innerHTML = `<div class="upicon" aria-hidden="true">${u.icon}</div>
        <div class="upinfo"><b>${u.name}<em>Lv.${lv}</em></b>
        <span>${u.desc}</span><div class="pips">${pips(lv,u.max)}</div></div>`;
      const btn = document.createElement('button'); btn.type = 'button';
      if(maxed){ btn.className='abtn ghost small'; btn.disabled=true; btn.textContent='MAXED'; }
      else{
        btn.className = 'abtn small' + (save.gold >= cost ? ' cyan' : ' dis');
        btn.textContent = 'UPGRADE 💰' + fmtG(cost);
        btn.onclick = () => {
          if(save.gold < cost) return;
          save.gold -= cost; save.upg[i]++;
          Audio.sfx.buy();
          toast(u.icon + ' ' + u.name + ' → Lv.' + save.upg[i]);
          SaveManager.persist(); renderUpg(); refreshGold();
        };
      }
      row.appendChild(btn); gEl.upgList.appendChild(row);
    });
  }

  function renderCars(){
    const save = SaveManager.self();
    gEl.carList.innerHTML = '';
    const grid = document.createElement('div'); grid.className = 'cargrid';
    VEHICLES.forEach(c => {
      const owned = !!(save.vehicles & (1 << c.id)), sel = save.vehSel === c.id;
      const card = document.createElement('div');
      card.className = 'carcard' + (sel ? ' sel' : '') + (c.type === 'bike' ? ' bike' : '');
      card.innerHTML = `<div class="carpic" aria-hidden="true" style="--pc:${css(c.color)};--sc:${css(c.stripe)}"><i></i><i></i></div>
        <span class="vtag ${c.type}">${c.type === 'bike' ? '🏍 BIKE' : '🚗 CAR'}</span>
        <b>${c.name}</b><div class="en">${c.en}${c.armor ? ' · 🛡×'+c.armor : ''}</div>
        ${sbar('SPEED',c.speed)}${sbar('GRIP',c.handl)}${sbar('NITRO',c.nitro)}<p>${c.desc}</p>`;
      const btn = document.createElement('button'); btn.type = 'button';
      if(sel){ btn.className='abtn small'; btn.disabled=true; btn.textContent='✓ ACTIVE'; }
      else if(owned){
        btn.className='abtn cyan small'; btn.textContent='SELECT';
        btn.onclick = () => {
          save.vehSel = c.id; Game.rebuildPlayer(); SaveManager.persist();
          renderCars(); Audio.sfx.click();
          toast((c.type === 'bike' ? '🏍' : '🚗') + ' Switched to: ' + c.name);
        };
      }else{
        btn.className='abtn small' + (save.gold >= c.price ? '' : ' dis');
        btn.textContent='BUY 💰' + fmtG(c.price);
        btn.onclick = () => {
          if(save.gold < c.price) return;
          save.gold -= c.price; save.vehicles |= 1 << c.id; save.vehSel = c.id;
          Game.rebuildPlayer(); SaveManager.persist();
          renderCars(); refreshGold(); Audio.sfx.buy();
          toast('🎉 Purchased: ' + c.name + '!');
        };
      }
      card.appendChild(btn); grid.appendChild(card);
    });
    gEl.carList.appendChild(grid);
  }

  function renderAch(){
    const save = SaveManager.self();
    gEl.achList.innerHTML = '';
    const hd = document.createElement('div');
    hd.style.cssText = 'font-size:12px;color:var(--dim);margin-bottom:10px';
    hd.innerHTML = `Achievements <b style="color:var(--gold);font-family:var(--fd)">${bits(save.ach)}/${ACHIEVEMENTS.length}</b> · auto-granted`;
    gEl.achList.appendChild(hd);
    ACHIEVEMENTS.forEach(a => {
      const done = !!(save.ach & (1 << a.id)), val = a.get(save);
      const fv = v => a.div ? ((v/a.div >= 100 ? (v/a.div|0) : (v/a.div).toFixed(1)) + (a.unit ? ' '+a.unit : '')) : String(v|0);
      const row = document.createElement('div');
      row.className = 'achrow' + (done ? ' done' : '');
      row.innerHTML = `<div class="achico" aria-hidden="true">🏆</div>
        <div class="achinfo"><b>${a.name}</b><span>${a.desc}</span>
        <div class="aprog" style="--w:${Math.min(1,val/a.goal)*100}%"></div></div>
        <div style="text-align:right">
        ${done ? '<div class="achst">✓ DONE</div>' : `<div class="achrw">+${a.rw}💰</div>`}
        <div class="achnum">${fv(Math.min(val,a.goal))}/${fv(a.goal)}</div></div>`;
      gEl.achList.appendChild(row);
    });
  }

  function renderStats(){
    const save = SaveManager.self(), st = save.st;
    const rows = [
      ['Best score', save.best.toLocaleString()],
      ['Total distance', (st.dist/1000).toFixed(1) + ' km'],
      ['Total coins', st.coins.toLocaleString()],
      ['Runs completed', st.runs],
      ['Close passes', st.miss.toLocaleString()],
      ['Flyovers', st.fly],
      ['Best combo', '×' + st.combo],
      ['Top speed', st.speed + ' km/h'],
      ['Vehicles owned', bits(save.vehicles) + ' / ' + VEHICLES.length],
      ['Achievements', bits(save.ach) + ' / ' + ACHIEVEMENTS.length],
      ['Bike runs', st.bikeRuns || 0],
      ['Nitro used (s)', Math.floor(st.nitroT || 0)]
    ];
    let html = '<div class="statgrid">' + rows.map(r => `<div>${r[0]}<b>${r[1]}</b></div>`).join('') + '</div>';
    html += '<div class="lbl" style="margin-top:16px">📜 RECENT RUNS</div>';
    if(!save.hist.length)
      html += '<div class="savetip">No runs yet — start your first NH-44 journey!</div>';
    else html += save.hist.map((h,i) => {
      const t = Date.now() - (h.t || 0);
      const ago = t < 60000 ? 'just now' : t < 3600000 ? Math.floor(t/60000)+'m ago'
        : t < 86400000 ? Math.floor(t/3600000)+'h ago' : Math.floor(t/86400000)+'d ago';
      const veh = VEHICLES[h.veh] || VEHICLES[0];
      return `<div class="histrow">
        <div><b>#${i+1}</b> · ${ago}<br><span class="veh">${veh.type==='bike'?'🏍':''} ${veh.name}</span></div>
        <div style="text-align:right"><b>${h.sc.toLocaleString()} pts</b><br>
        <span class="veh">${h.dm} km · 💰${h.c}</span></div></div>`;
    }).join('');
    gEl.statList.innerHTML = html;
  }

  function refreshGarage(){
    refreshGold(); renderUpg(); renderCars(); renderAch(); renderStats();
    Social.renderChallenges(gEl.chalList);
    Social.renderFriends(gEl.friendsList);
    Social.renderLeaderboard(gEl.lbList);
    gEl.codeOut.value = SaveManager.encode();
  }
  function openGarage(){ Audio.sfx.click(); refreshGarage(); hideOv(el.menu); showOv(gEl.garage); }
  function closeGarage(){
    Audio.sfx.click(); hideOv(gEl.garage); showOv(el.menu);
    const b = document.getElementById('btnGarage'); if(b) b.focus();
    refreshGold();
  }

  function showGameOver(r){
    el.goScore.textContent = r.score.toLocaleString();
    el.goGold.textContent = '+' + r.gold;
    el.goDist.textContent = (r.dist/1000).toFixed(2) + ' km';
    el.goCoins.textContent = r.coins;
    el.goCombo.textContent = '×' + r.combo.toFixed(1);
    el.goMiss.textContent = r.misses;
    if(el.goSpeedBanks) el.goSpeedBanks.textContent = r.speedBonusGates || 0;
    if(el.goClean) el.goClean.textContent = ((r.cleanDist || 0)/1000).toFixed(2) + ' km';
    el.goBest.textContent = SaveManager.self().best.toLocaleString();
    el.goBiome.textContent = r.biome;
    el.goVeh.textContent = r.vehicle;
    el.newRec.style.display = r.rec ? 'block' : 'none';
    el.goAchList.innerHTML = [
      ...r.achGot.map(a => `🏆 Achievement: “${a.name}” +${a.rw}💰`),
      ...r.chalGot.map(c => `🎯 Challenge: “${c.name}” +${c.rw}💰`)
    ].join('<br>');
    el.goFriendBeat.textContent = r.beaten
      ? `🎉 You beat ${r.beaten.name}'s best (${r.beaten.best.toLocaleString()} pts)!` : '';
    refreshNameUI();
    showOv(el.over);
    announce(`Wrecked. Score ${r.score}${r.rec ? ' — new record' : ''}. Earned ${r.gold} gold.`);
  }

  function toMenu(){
    hideOv(el.over); hideOv(el.pauseOv); hideOv(gEl.garage);
    showOv(el.menu);
    el.menuBest.textContent = SaveManager.self().best.toLocaleString();
    refreshGold();
    el.count.style.display = 'none';
  }
  function startCountdown(){
    el.count.textContent = '3';
    el.count.style.display = 'flex';
    el.count.classList.remove('go');
  }
  function copySave(btn){
    const code = SaveManager.encode();
    const done = () => {
      if(btn){ const t = btn.textContent; btn.textContent = '✓ COPIED';
        setTimeout(() => btn.textContent = t, 1400); }
      toast('📋 Save code copied — share with friends!');
    };
    const fb = () => { gEl.codeOut.value = code;
      toast('❌ Copy failed — use Garage → Save to copy manually'); };
    if(navigator.clipboard && navigator.clipboard.writeText)
      navigator.clipboard.writeText(code).then(done, fb);
    else{
      const ta = document.createElement('textarea');
      ta.value = code; ta.style.cssText = 'position:absolute;left:-9999px;top:0';
      document.body.appendChild(ta); ta.select();
      let ok = false; try{ ok = document.execCommand('copy'); }catch(e){}
      ta.remove(); ok ? done() : fb();
    }
  }

  return {
    init, toast, announce, banner, floater, updateHUD, showOv, hideOv,
    refreshNameUI, refreshGold, openGarage, closeGarage, refreshGarage,
    showGameOver, toMenu, startCountdown, copySave,
    get gEl(){ return gEl; }, get el(){ return el; }
  };
})();