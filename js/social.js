/* ══════════ Leaderboard, Friends, Challenges ══════════ */
import {SaveManager} from './save.js';
import {CHALLENGES, ACHIEVEMENTS} from './config.js';

function formatTimeAgo(timestamp) {
  const t = Date.now() - (timestamp || 0);
  return t < 60000 ? 'just now' :
         t < 3600000 ? Math.floor(t / 60000) + 'm ago' :
         t < 86400000 ? Math.floor(t / 3600000) + 'h ago' :
         Math.floor(t / 86400000) + 'd ago';
}

export const Social = {
  renderLeaderboard(el) {
    const save = SaveManager.self();
    const lb = save.lb || [];
    if(!lb.length) {
      el.innerHTML = '<div class="savetip">No scores yet — start racing!<br>Your runs and friends will appear here.</div>';
      return;
    }
    const me = save.name || 'SELF';
    const html = lb.map((e, i) => {
      const isMe = e.name === me && !e.friend;
      const ago = formatTimeAgo(e.t);
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
      const badge = e.friend ? '<span class="badge">FRIEND</span>' : (isMe ? '<span class="badge">YOU</span>' : '');
      return `<div class="lbrow ${isMe?'me':''}">
        <div class="rank">${medal}#${i+1}</div>
        <div class="name">${escapeHtml(e.name)}${badge}</div>
        <div style="text-align:right">
          <div class="score">${e.sc.toLocaleString()}</div>
          <div class="meta">${ago}</div>
        </div>
      </div>`;
    }).join('');
    el.innerHTML = html;
  },

  renderFriends(el) {
    const save = SaveManager.self();
    const friends = save.friends || [];
    if(!friends.length) {
      el.innerHTML = '<div class="savetip">No friends yet!<br>Go to <b>SAVE</b> tab, paste a friend\'s save code, and click <b>ADD AS FRIEND ONLY</b> to add them without overwriting your progress.<br>Then race to beat their best score!</div>';
      return;
    }
    const html = friends.map(f => {
      const ago = formatTimeAgo(f.t);
      const beat = save.best > f.best ? '✓ You lead' : (save.best < f.best ? '↑ Beat them!' : 'Tied');
      return `<div class="friendrow">
        <div class="friendico">👤</div>
        <div class="friendinfo">
          <b>${escapeHtml(f.name)}</b>
          <span>Added ${ago}</span>
        </div>
        <div style="text-align:right">
          <div class="friendbest">${f.best.toLocaleString()} pts</div>
          <div style="font-size:10px;color:${save.best>=f.best?'var(--green)':'var(--amber)'}">${beat}</div>
        </div>
      </div>`;
    }).join('');
    el.innerHTML = '<div class="savetip" style="margin-bottom:12px">Your friends from imported save codes. <b>Beat any friend\'s best score</b> to complete the "Friend Race" challenge!</div>' + html;
  },

  renderChallenges(el) {
    const save = SaveManager.self();
    const html = CHALLENGES.map(c => {
      const done = !!(save.chal & (1 << c.id));
      let val = 0;
      // Current run values (approximated via SAVE.st for persistent metrics)
      if(c.type === 'score') val = save.best;
      else if(c.type === 'speed') val = save.st.speed;
      else if(c.type === 'combo') val = save.st.combo;
      else if(c.type === 'dist') val = save.st.dist;
      else if(c.type === 'coins') val = save.st.coins;
      else if(c.type === 'nitro') val = save.st.nitroT;
      else if(c.type === 'fly') val = save.st.fly;
      else if(c.type === 'friend') val = save.friends.length > 0 ? 1 : 0;
      else if(c.type === 'bikeScore') val = 0; // requires a run
      const pct = Math.min(1, val / c.goal) * 100;
      return `<div class="chalrow ${done?'done':''}">
        <div class="chalico">${c.icon}</div>
        <div class="chalinfo">
          <b>${c.name}</b>
          <span>${c.desc}</span>
          <div class="chalprog" style="--w:${pct}%"></div>
        </div>
        <div style="text-align:right">
          ${done ? '<div class="chalst">✓ DONE</div>' : `<div class="chalrw">+${c.rw}💰</div>`}
          <div class="achnum">${Math.min(val,c.goal)}/${c.goal}</div>
        </div>
      </div>`;
    }).join('');
    el.innerHTML = '<div class="savetip" style="margin-bottom:12px">Complete challenges to earn bonus gold. Some unlock when you play with friends!</div>' + html;
  }
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}