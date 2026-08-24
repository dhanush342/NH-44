/* ══════════ Save System with Friends & Leaderboard ══════════ */
import {UPGRADES} from './config.js';

export const SaveManager = (() => {
  let muted = false;
  const DEFAULT = () => ({
    v:3, gold:0, best:0,
    upg:[0,0,0,0,0,0],
    vehicles:1, vehSel:0,
    ach:0, chal:0,
    st:{runs:0,dist:0,coins:0,miss:0,fly:0,combo:0,speed:0,city:0,nitroT:0,bikeRuns:0},
    mute:0, name:'',
    account:{name:'',passHash:''},
    hist:[],      // local run history
    friends:[],   // imported friend profiles
    lb:[]         // merged leaderboard (self + friends)
  });

  let SAVE = DEFAULT();
  const store = (() => {
    const m = {};
    let ok = false;
    try { localStorage.setItem('__t','1'); localStorage.removeItem('__t'); ok = true; } catch(e) {}
    return {
      get(k){ return ok ? localStorage.getItem(k) : m[k]; },
      set(k,v){ if(ok) try { localStorage.setItem(k,v); } catch(e) {} else m[k] = v; }
    };
  })();

  function normalizeName(value) {
    return String(value || '').replace(/[<>]/g,'').trim().slice(0,14) || 'DRIVER';
  }

  function hashPassword(value) {
    const s = String(value ?? '').trim();
    if(!s) return '';
    let h = 2166136261;
    for(let i = 0; i < s.length; i++){
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  }

  function accountKey(name, passHash) {
    return `${normalizeName(name).toLowerCase()}:${String(passHash || '').trim()}`;
  }

  function merge(o) {
    try {
      if(!o || typeof o !== 'object') return;
      SAVE.gold = Math.min(o.gold|0, 1073741823);
      SAVE.best = Math.max(0, o.best|0);
      SAVE.upg = UPGRADES.map((u,i) => Math.min(Math.max((o.upg?.[i])|0, 0), u.max));
      SAVE.vehicles = ((o.vehicles||o.cars||0) & 16383) || 1;
      SAVE.vehSel = Math.min(Math.max(o.vehSel ?? o.carSel ?? 0, 0), 13);
      if(!(SAVE.vehicles & (1 << SAVE.vehSel))) SAVE.vehSel = 0;
      SAVE.ach = (o.ach|0) & 16383;
      SAVE.chal = (o.chal|0) & 4095;
      if(o.st) for(const k in SAVE.st) SAVE.st[k] = Math.max(0, o.st[k]|0);
      SAVE.name = normalizeName(o.name || SAVE.name);
      const acc = o.account || {};
      SAVE.account = {
        name: normalizeName(acc.name || SAVE.name),
        passHash: String(acc.passHash || '').trim() || String(o.passHash || '').trim()
      };
      SAVE.hist = (Array.isArray(o.hist) ? o.hist : []).map(h=>({
        sc:Math.max(0,(h?.sc)|0), dm:+((h?.dm)||0)||0, c:Math.max(0,(h?.c)|0),
        t:(h?.t)|0, veh:(h?.veh)|0
      })).filter(h=>h.sc>0||h.dm>0).slice(0,12);
      SAVE.friends = (Array.isArray(o.friends)?o.friends:[]).map(f=>({
        name:String(f.name||'').slice(0,14), best:Math.max(0,(f.best||0)|0),
        t:(f.t||0)|0, veh:(f.veh)|0, dist:+(f.dist||0),
        account: f.account ? { name: normalizeName(f.account.name || f.name), passHash: String(f.account.passHash || '').trim() } : null
      })).filter(f=>f.name).slice(0,20);
      SAVE.lb = (Array.isArray(o.lb)?o.lb:[]).map(l=>({
        name:String(l.name||'').slice(0,14), sc:Math.max(0,(l.sc||0)|0),
        t:(l.t||0)|0, friend:!!l.friend
      })).filter(l=>l.name && l.sc>0).slice(0,50);
      if(o.mute) muted = true;
    } catch(e) {}
  }

  try {
    const j = store.get('nh44_save') || store.get('sr_save');
    if(j) merge(JSON.parse(j));
    if(j && !store.get('nh44_save')) store.set('nh44_save', j);
  } catch(e) {}
  SAVE.mute = muted ? 1 : 0;

  const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const FLEN_V2 = [4,30,30,3,3,3,3,3,3,10,4,14,14,18,20,16,14,10,10,1,1,1];
  const FLEN_V3 = [4,30,30,3,3,3,3,3,3,14,4,14,14,18,20,16,14,10,10,1,1,1,10];
  // v3 expands the vehicle ownership bitfield from 10 to 14 bits (14 vehicles).
  const FLEN = FLEN_V3;

  function fields() {
    return [3, SAVE.gold, SAVE.best,
      SAVE.upg[0],SAVE.upg[1],SAVE.upg[2],SAVE.upg[3],SAVE.upg[4],SAVE.upg[5],
      SAVE.vehicles, SAVE.vehSel, SAVE.ach, SAVE.chal,
      SAVE.st.runs, Math.floor(SAVE.st.dist/100), SAVE.st.coins,
      SAVE.st.miss, SAVE.st.fly, SAVE.st.combo, SAVE.st.speed,
      SAVE.st.city?1:0, muted?1:0, SAVE.st.bikeRuns];
  }

  function encode() {
    const f = fields();
    let cs = 0;
    f.forEach((x,i) => cs = (cs*31 + (x|0) + i*7) & 1023);
    let n = 0n;
    f.forEach((x,i) => {
      const len = FLEN[i];
      x = Math.max(0, Math.min(x|0, 2**len - 1));
      for(let b = len-1; b >= 0; b--) n = (n << 1n) | BigInt((x >>> b) & 1);
    });
    for(let b = 9; b >= 0; b--) n = (n << 1n) | BigInt((cs >> b) & 1);
    let s = '';
    while(n > 0n) { s = B32[Number(n & 31n)] + s; n >>= 5n; }
    let out = s.padStart(48,'0').replace(/(.{4})/g,'$1-').replace(/-$/,'');
    const meta = {
      name: SAVE.name,
      account: { name: SAVE.account?.name || SAVE.name, passHash: SAVE.account?.passHash || '' },
      friends: SAVE.friends.slice(0,10),
      lb: SAVE.lb.slice(0,15)
    };
    try { out += '.' + btoa(encodeURIComponent(JSON.stringify(meta))); } catch(e) {}
    return out;
  }

  function decode(str) {
    try {
      let raw = String(str).trim(), meta = {};
      const di = raw.lastIndexOf('.');
      if(di >= 0) {
        try { meta = JSON.parse(decodeURIComponent(atob(raw.slice(di+1)))); } catch(e) {}
        raw = raw.slice(0, di);
      }
      const clean = raw.toUpperCase().replace(/I|L/g,'1').replace(/O/g,'0').replace(/[^0-9A-Z]/g,'');
      if(clean.length !== 44 && clean.length !== 48) return null;
      const schema = clean.length === 48 ? FLEN_V3 : FLEN_V2;
      let n = 0n;
      for(const ch of clean) {
        const i = B32.indexOf(ch);
        if(i < 0) return null;
        n = (n << 5n) | BigInt(i);
      }
      const csGot = Number(n & 1023n);
      n >>= 10n;
      const totalBits = schema.reduce((a,b)=>a+b,0);
      const bin = n.toString(2).padStart(totalBits,'0').slice(-totalBits);
      let pos = 0;
      const read = len => { const v = parseInt(bin.slice(pos,pos+len),2)||0; pos += len; return v; };
      const f = schema.map(read);
      let cs = 0;
      f.forEach((x,i) => cs = (cs*31 + x + i*7) & 1023);
      const version = f[0];
      if(cs !== csGot || (version !== 2 && version !== 3)) return null;
      return {
        v:version, gold:f[1], best:f[2],
        upg:f.slice(3,9), vehicles:f[9], vehSel:f[10],
        ach:f[11], chal:f[12],
        st:{runs:f[13],dist:f[14]*100,coins:f[15],miss:f[16],fly:f[17],
            combo:f[18],speed:f[19],city:f[20],nitroT:0,bikeRuns:f[22]||0},
        mute:f[21],
        name: normalizeName(meta.name || ''),
        account: { name: normalizeName(meta.account?.name || meta.name || ''), passHash: String(meta.account?.passHash || '').trim() },
        friends: meta.friends || [],
        lb: meta.lb || []
      };
    } catch(e) { return null; }
  }

  function persist() {
    SAVE.mute = muted ? 1 : 0;
    store.set('nh44_save', JSON.stringify(SAVE));
  }

  function recordRun(score, dist, coins, veh, topSpeed, combo, miss, fly) {
    SAVE.hist.unshift({
      sc: score, dm: +(dist/1000).toFixed(2), c: coins,
      t: Date.now(), veh
    });
    if(SAVE.hist.length > 12) SAVE.hist.length = 12;
    if(score > SAVE.best) SAVE.best = score;
    SAVE.st.runs++;
    SAVE.st.dist += dist;
    SAVE.st.coins += coins;
    SAVE.st.miss += miss;
    SAVE.st.fly += fly;
    SAVE.st.combo = Math.max(SAVE.st.combo, combo);
    SAVE.st.speed = Math.max(SAVE.st.speed, Math.round(topSpeed));
    SAVE.lb = SAVE.lb.filter(e => e.name !== (SAVE.name||'SELF'));
    SAVE.lb.push({
      name: SAVE.name || 'SELF', sc: SAVE.best, t: Date.now(), friend: false
    });
    SAVE.lb.sort((a,b) => b.sc - a.sc);
    if(SAVE.lb.length > 50) SAVE.lb.length = 50;
    persist();
  }

  function isSameAccount(name, passwordHash) {
    const n = normalizeName(name);
    const p = String(passwordHash || '').trim();
    const selfKey = accountKey(SAVE.account?.name || SAVE.name, SAVE.account?.passHash || '');
    const otherKey = accountKey(n, p);
    if(!selfKey || !otherKey) return false;
    if(selfKey === otherKey) return true;
    const legacyMatch = !p && n === normalizeName(SAVE.account?.name || SAVE.name);
    return !!legacyMatch;
  }

  function login(name, password) {
    const safeName = normalizeName(name);
    const passHash = hashPassword(password);
    if(!safeName || !passHash) return { ok:false, reason:'missing_fields' };
    const selfKey = accountKey(SAVE.account?.name || SAVE.name, SAVE.account?.passHash || '');
    const nextKey = accountKey(safeName, passHash);
    SAVE.name = safeName;
    SAVE.account = { name: safeName, passHash };
    const sameAccount = !!selfKey && selfKey === nextKey;
    persist();
    return { ok:true, sameAccount, newAccount: !sameAccount, name:safeName };
  }

  function addFriend(friendSave) {
    const name = normalizeName(friendSave?.name || friendSave?.account?.name || '');
    if(!name) return false;

    const passHash = String(friendSave?.account?.passHash || friendSave?.passHash || '').trim();
    const selfName = normalizeName(SAVE.account?.name || SAVE.name || '');
    const selfHash = String(SAVE.account?.passHash || '').trim();

    if(selfName && name === selfName && (!passHash || passHash === selfHash)) return false;
    if(isSameAccount(name, passHash)) return false;

    const exists = SAVE.friends.find(f => {
      const fName = normalizeName(f.name || f.account?.name || '');
      const fHash = String(f.account?.passHash || '').trim();
      return fName === name && (!passHash || !fHash || fHash === passHash);
    });

    if(exists) {
      exists.best = Math.max(exists.best || 0, friendSave.best || 0);
      exists.t = Date.now();
      exists.veh = friendSave.vehSel ?? exists.veh ?? 0;
      exists.dist = Number(friendSave.st?.dist || exists.dist || 0);
      exists.account = exists.account || { name, passHash };
      if(passHash) exists.account.passHash = passHash;
      if(name) exists.account.name = name;
    } else {
      SAVE.friends.push({
        name, best: friendSave.best || 0,
        t: Date.now(), veh: friendSave.vehSel ?? 0, dist: Number(friendSave.st?.dist || 0),
        account: { name, passHash }
      });
    }

    if(SAVE.friends.length > 20) SAVE.friends.length = 20;
    const fEntry = { name, sc: friendSave.best || 0, t: Date.now(), friend: true };
    SAVE.lb = SAVE.lb.filter(e => normalizeName(e.name) !== name);
    SAVE.lb.push(fEntry);
    SAVE.lb.sort((a,b) => b.sc - a.sc);
    if(SAVE.lb.length > 50) SAVE.lb.length = 50;
    persist();
    return true;
  }

  function selfBestBeaten(score) {
    const friends = SAVE.friends.filter(f => f.best > 0);
    if(friends.length === 0) return null;
    const beaten = friends.filter(f => score > f.best);
    if(beaten.length === 0) return null;
    return beaten.sort((a,b) => a.best - b.best)[0];
  }

  function self() { return SAVE; }
  function setMuted(v) { muted = v; SAVE.mute = v ? 1 : 0; }
  function isMuted() { return muted; }

  window.addEventListener('beforeunload', persist);

  return {
    self, merge, encode, decode, persist, recordRun, addFriend, selfBestBeaten,
    setMuted, isMuted, login, isSameAccount, accountKey, hashPassword,
    normalizeName
  };
})();