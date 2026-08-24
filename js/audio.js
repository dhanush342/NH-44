/* ══════════ Lightweight Web Audio SFX ══════════ */
export const Audio = (() => {
  let ctx = null;
  let muted = false;
  let engineOsc = null;
  let engineGain = null;
  let engineFilter = null;
  let engineOsc2 = null;
  let engineGain2 = null;

  function init() {
    if (ctx) return ctx;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      ctx = new Ctx();
    } catch (e) {
      ctx = null;
    }
    return ctx;
  }

  function resume() {
    if (!ctx) init();
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  }

  function tone(freq, duration, type = 'sine', volume = 0.045, slide = 0) {
    if (muted) return;
    const c = init();
    if (!c) return;
    resume();
    try {
      const now = c.currentTime;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(20, freq), now);
      if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), now + duration);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain).connect(c.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch (e) {}
  }


  function noise(duration=0.16, volume=0.03, filterFreq=900) {
    if (muted) return;
    const c = init(); if (!c) return; resume();
    try {
      const now=c.currentTime, len=Math.max(1,Math.floor(c.sampleRate*duration));
      const b=c.createBuffer(1,len,c.sampleRate), d=b.getChannelData(0);
      for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*(1-i/len);
      const src=c.createBufferSource(), f=c.createBiquadFilter(), g=c.createGain();
      f.type='bandpass'; f.frequency.value=filterFreq; f.Q.value=.7;
      g.gain.setValueAtTime(.0001,now); g.gain.exponentialRampToValueAtTime(volume,now+.006);
      g.gain.exponentialRampToValueAtTime(.0001,now+duration);
      src.buffer=b; src.connect(f).connect(g).connect(c.destination); src.start(now); src.stop(now+duration+.01);
    } catch(e){}
  }

  const sfx = {
    click() { tone(520, 0.055, 'square', 0.025, 100); },
    coin() { tone(880, 0.07, 'triangle', 0.04, 260); setTimeout(() => tone(1320, 0.08, 'triangle', 0.035, 180), 45); },
    nitro() { tone(150, 0.18, 'sawtooth', 0.035, 520); },
    shield() { tone(420, 0.12, 'sine', 0.035, 300); setTimeout(() => tone(760, 0.16, 'sine', 0.03, 260), 55); },
    crash() { tone(90, 0.28, 'sawtooth', 0.06, -55); noise(.28,.045,260); },
    thud() { tone(72, 0.11, 'square', 0.035, -25); },
    whoosh() { tone(240, 0.14, 'sine', 0.022, 520); },
    beep(up = true) { tone(up ? 720 : 360, 0.09, 'square', 0.028, up ? 100 : -80); },
    buy() { tone(600, 0.08, 'triangle', 0.035, 180); setTimeout(() => tone(900, 0.12, 'triangle', 0.03, 180), 65); },
    horn() { tone(330,0.22,'square',0.045,55); tone(440,0.18,'square',0.028,35); },
    levelup() { tone(660,.07,'triangle',.035,120); setTimeout(()=>tone(990,.1,'triangle',.035,180),55); setTimeout(()=>tone(1320,.13,'triangle',.03,120),110); },
    checkpoint() { tone(520,.09,'sine',.03,80); setTimeout(()=>tone(780,.12,'sine',.03,120),65); },
    skid() { noise(.12,.018,420); },
    pickup() { tone(980,.055,'triangle',.025,100); }
  };

  function stopEngine() {
    if (engineOsc) {
      try { engineOsc.stop(); } catch (e) {}
      try { engineOsc.disconnect(); } catch (e) {}
    }
    if (engineGain) { try { engineGain.disconnect(); } catch (e) {} }
    if (engineFilter) { try { engineFilter.disconnect(); } catch (e) {} }
    if (engineOsc2) { try { engineOsc2.stop(); } catch (e) {} try { engineOsc2.disconnect(); } catch(e){} }
    if (engineGain2) { try { engineGain2.disconnect(); } catch(e){} }
    engineOsc = null;
    engineGain = null;
    engineFilter = null;
    engineOsc2 = null; engineGain2 = null;
  }

  function setEngine(speed = 0, nitro = false, type = 'car') {
    if (muted || speed <= 0.01) {
      if (engineOsc) {
        const c = ctx;
        if (c) { engineGain.gain.setTargetAtTime(0.0001, c.currentTime, 0.04); if(engineGain2) engineGain2.gain.setTargetAtTime(0.0001,c.currentTime,0.04); }
      }
      return;
    }
    const c = init();
    if (!c) return;
    resume();
    try {
      if (!engineOsc) {
        engineOsc = c.createOscillator();
        engineFilter = c.createBiquadFilter();
        engineGain = c.createGain();
        engineOsc2 = c.createOscillator();
        engineGain2 = c.createGain();
        engineOsc.type = 'sawtooth';
        engineFilter.type = 'lowpass';
        engineFilter.frequency.value = 900;
        engineGain.gain.value = 0.0001;
        engineGain2.gain.value = 0.0001;
        engineOsc.connect(engineFilter).connect(engineGain).connect(c.destination);
        engineOsc2.type='triangle';
        engineOsc2.connect(engineGain2).connect(c.destination);
        engineOsc.start(); engineOsc2.start();
      }
      const now = c.currentTime;
      const hz = 65 + Math.min(1, speed) * 125 + (nitro ? 55 : 0);
      engineOsc.frequency.setTargetAtTime(type==='bike' ? hz*1.55 : hz, now, 0.035);
      engineOsc2.frequency.setTargetAtTime(type==='bike' ? hz*3.1 : hz*2, now, 0.05);
      engineFilter.frequency.setTargetAtTime(650 + Math.min(1, speed) * 850, now, 0.06);
      engineGain.gain.setTargetAtTime(Math.min(0.055, 0.012 + speed * 0.025), now, 0.06);
      engineGain2.gain.setTargetAtTime(Math.min(0.018, 0.004 + speed * (type==='bike' ? .010 : .006)), now, 0.08);
    } catch (e) {}
  }

  function setMuted(v) {
    muted = !!v;
    if (muted && engineGain && ctx) { engineGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.03); if(engineGain2) engineGain2.gain.setTargetAtTime(0.0001,ctx.currentTime,0.03); }
  }

  function isMuted() { return muted; }

  return { init, resume, setEngine, setMuted, isMuted, sfx };
})();
