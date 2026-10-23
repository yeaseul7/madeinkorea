export const LEVELS = Object.freeze([
  { max:1, exposure:1200, interval:1400 },
  { max:2, exposure:1000, interval:520 },
  { max:3, exposure:850, interval:270 },
  { max:3, exposure:700, interval:210 },
  { max:4, exposure:600, interval:140 },
  { max:5, exposure:500, interval:90 },
].map(Object.freeze));

export function createCatchGame(random = Math.random) {
  let phase = 'idle', score = 0, remaining = 30000, combo = 0, level = 1;
  let deadline = 0, next = 0, last = -1, serial = 0, pausedAt = 0;
  let targets = [];
  let availableAfter = Array(9).fill(0);
  const multiplier = () => combo >= 10 ? 2 : combo >= 5 ? 1.5 : 1;
  const state = () => ({ phase, score, remaining, level, combo, multiplier:multiplier(),
    targets:phase === 'playing' ? targets.map(target => ({ ...target })) : [] });
  const pick = list => list[Math.min(list.length - 1, Math.floor(random() * list.length))];
  function tick(now) {
    if (phase !== 'playing') return state();
    remaining = Math.max(0, deadline - now);
    if (!remaining) {
      if (targets.some(target => target.kind === 'jinjin')) combo = 0;
      targets = []; phase = 'ended'; return state();
    }
    const nextLevel = Math.min(6, Math.floor((30000 - remaining) / 5000) + 1);
    if (nextLevel !== level) { level = nextLevel; next = Math.min(next, now); }
    targets = targets.filter(target => {
      if (now < target.until) return true;
      if (target.kind === 'jinjin') combo = 0;
      availableAfter[target.index] = now + 160;
      return false;
    });
    const config = LEVELS[level - 1];
    if (now >= next && targets.length < config.max) {
      // Keep each appearance independent; never replace an occupied jar or replay a backlog.
      const choices = Array.from({ length:9 }, (_, index) => index)
        .filter(index => index !== last && now >= availableAfter[index] && !targets.some(target => target.index === index));
      if (!choices.length) return state();
      const index = pick(choices);
      const kind = pick(['jinjin', 'jinjin', 'jinjin', 'gold', 'white', 'black']);
      const fake = level >= 5 && random() < .2;
      const exposure = fake ? config.exposure * .6 : config.exposure;
      targets.push({ id:++serial, index, kind, fake, appeared:now, until:Math.min(deadline, now + exposure) });
      last = index;
      next = now + config.interval * (level >= 3 ? .9 + random() * .2 : 1);
    }
    return state();
  }
  return {
    state, tick,
    start(now) {
      phase = 'playing'; score = 0; combo = 0; level = 1; remaining = 30000;
      deadline = now + remaining; targets = []; availableAfter = Array(9).fill(0); last = -1; next = now + 400; serial = 0;
      return state();
    },
    hit(index, now) {
      tick(now);
      const target = targets.find(target => target.index === index);
      if (phase !== 'playing' || !target) return false;
      if (target.kind === 'jinjin') { score += 100 * multiplier(); combo++; }
      else { score -= 50; combo = 0; }
      targets = targets.filter(item => item.id !== target.id);
      availableAfter[index] = now + 160;
      if (level === 1) next = Math.min(next, now + 220);
      return true;
    },
    pause(now) {
      tick(now);
      if (phase === 'playing') { phase = 'paused'; pausedAt = now; }
      return state();
    },
    resume(now) {
      if (phase === 'paused') {
        const shift = now - pausedAt;
        targets = targets.map(target => ({ ...target, appeared:target.appeared + shift, until:target.until + shift }));
        availableAfter = availableAfter.map(time => time + shift);
        next += shift; deadline = now + remaining; phase = 'playing';
      }
      return state();
    },
  };
}
