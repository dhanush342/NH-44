/* ══════════ Input Manager (Keyboard + Touch) ══════════ */
export const Input = (() => {
  const keys = {};
  const touch = {L: 0, R: 0, N: 0, B: 0};
  let onPause = null, onMute = null, onStart = null, onCloseGar = null, onEnter = null, onHorn = null;

  function init(handlers) {
    const h = handlers || {};
    onPause = h.onPause;
    onMute = h.onMute;
    onStart = h.onStart;
    onCloseGar = h.onCloseGarage;
    onEnter = h.onEnter;
    onHorn = h.onHorn;

    window.addEventListener('blur', () => {
      Object.keys(keys).forEach(k => { keys[k] = 0; });
      Object.keys(touch).forEach(k => { touch[k] = 0; });
      document.querySelectorAll('.tbtn').forEach(el => el.classList.remove('on'));
    });

    window.addEventListener('keydown', e => {
      const t = e.target;
      const typing = t && (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT' || t.isContentEditable);
      if(!typing) keys[e.code] = 1;
      if(!typing && (e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'ArrowLeft' || e.code === 'ArrowRight'))
        e.preventDefault();
      if(!typing && e.code === 'Space') {
        const a = document.activeElement;
        if(!(a && a.tagName === 'BUTTON')) e.preventDefault();
      }
      if(typing) return;
      if(e.code === 'KeyP' || e.code === 'Escape') {
        const nameOv = document.getElementById('nameOv');
        if(nameOv && !nameOv.classList.contains('hide')) return;
        const garage = document.getElementById('garage');
        if(garage && !garage.classList.contains('hide')) {
          onCloseGar && onCloseGar();
          return;
        }
        onPause && onPause();
        return;
      }
      if(e.code === 'KeyM') { onMute && onMute(); return; }
      if(e.code === 'KeyH') { onHorn && onHorn(); return; }
      if(e.code === 'Enter') {
        const a = document.activeElement;
        if(a && a.tagName === 'BUTTON') return;
        onEnter && onEnter();
      }
    });
    window.addEventListener('keyup', e => { keys[e.code] = 0; });

    bindT('t-left', 'L');
    bindT('t-right', 'R');
    bindT('t-nitro', 'N');
    bindT('t-brake', 'B');

    document.addEventListener('touchmove', e => {
      if(e.target.closest && e.target.closest('.scrollable')) return;
      e.preventDefault();
    }, {passive: false});

    if(h.onPointerDown) document.addEventListener('pointerdown', h.onPointerDown);

    const skip = document.getElementById('skipBtn');
    if(skip) skip.addEventListener('click', () => {
      const start = document.getElementById('btnStart');
      if(start) start.focus();
    });

    // Focus trap
    document.addEventListener('keydown', e => {
      if(e.key !== 'Tab') return;
      const overlays = ['menu','garage','over','pauseOv','nameOv'].map(id => document.getElementById(id));
      const ov = overlays.find(o => o && !o.classList.contains('hide'));
      if(!ov) return;
      const f = [...ov.querySelectorAll('button,textarea,input,select,a[href],[tabindex]:not([tabindex="-1"])')]
        .filter(x => !x.disabled && x.offsetWidth > 0);
      if(!f.length) return;
      const first = f[0], last = f[f.length-1], a = document.activeElement;
      if(e.shiftKey && (a === first || !ov.contains(a))) { last.focus(); e.preventDefault(); }
      else if(!e.shiftKey && (a === last || !ov.contains(a))) { first.focus(); e.preventDefault(); }
    });
  }

  function bindT(id, k) {
    const el = document.getElementById(id);
    if(!el) return;
    const on = e => {
      if(e.type === 'pointerdown') e.preventDefault();
      touch[k] = 1;
      el.classList.add('on');
      try { if(e.pointerId !== undefined) el.setPointerCapture(e.pointerId); } catch(_) {}
    };
    const off = () => {
      touch[k] = 0;
      el.classList.remove('on');
    };
    el.addEventListener('pointerdown', on);
    ['pointerup','pointercancel','lostpointercapture'].forEach(ev => el.addEventListener(ev, off));
    el.addEventListener('keydown', e => {
      if(e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        e.stopPropagation();
        touch[k] = 1;
        el.classList.add('on');
      }
    });
    el.addEventListener('keyup', e => {
      if(e.code === 'Enter' || e.code === 'Space') {
        touch[k] = 0;
        el.classList.remove('on');
      }
    });
    el.addEventListener('blur', () => { touch[k] = 0; el.classList.remove('on'); });
  }

  return {
    init,
    keys: () => keys,
    touch: () => touch
  };
})();