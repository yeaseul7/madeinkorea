export function createCatchGame(random = Math.random) {
  let phase = 'idle', score = 0, remaining = 30000, active = -1, kind = 'jinjin', combo = 0, catches = 0;
  let deadline = 0, until = 0, next = 0, last = -1, pausedKind = null;
  const multiplier = () => combo >= 10 ? 2 : combo >= 5 ? 1.5 : 1;
  const state = () => ({ phase, score, remaining, active, kind, combo, multiplier: multiplier() });
  function miss() { if (active !== -1 && kind === 'jinjin') combo = 0; active = -1; }
  function tick(now) {
    if (phase !== 'playing') return state();
    remaining = Math.max(0, deadline - now);
    if (!remaining) { miss(); phase = 'ended'; return state(); }
    if (active !== -1 && now >= until) { miss(); next = now + 180; }
    if (active === -1 && now >= next) {
      const choices = Array.from({ length:9 }, (_, i) => i).filter(i => i !== last);
      active = choices[Math.min(choices.length - 1, Math.floor(random() * choices.length))];
      kind = ['jinjin', 'jinjin', 'jinjin', 'gold', 'white', 'black'][Math.min(5, Math.floor(random() * 6))];
      last = active;
      until = Math.min(deadline, now + Math.max(700, 1250 - catches * 20));
    }
    return state();
  }
  return {
    state, tick,
    start(now) { phase = 'playing'; score = 0; combo = 0; catches = 0; pausedKind = null; remaining = 30000; deadline = now + remaining; active = -1; last = -1; next = now + 400; return state(); },
    hit(index, now) {
      tick(now);
      if (phase !== 'playing' || active !== index || active === -1) return false;
      if (kind === 'jinjin') { score += 100 * multiplier(); combo++; catches++; }
      else { score -= 50; combo = 0; }
      active = -1; next = now + 220; return true;
    },
    pause(now) { tick(now); if (phase === 'playing') { phase = 'paused'; pausedKind = active === -1 ? null : kind; active = -1; } return state(); },
    resume(now) { if (phase === 'paused') { phase = 'playing'; deadline = now + remaining; if (pausedKind) { active = last; kind = pausedKind; until = now + 900; pausedKind = null; } else next = now + 400; } return state(); },
  };
}
