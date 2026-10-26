import { createSpawnDirector } from './jinjin-spawns.mjs';

export const EXIT_MS = 160;
export const LEVELS = Object.freeze([
  { max:1, exposure:1200, interval:1400 },
  { max:2, exposure:1000, interval:520 },
  { max:3, exposure:850, interval:270 },
  { max:3, exposure:700, interval:210 },
  { max:4, exposure:600, interval:140 },
  { max:5, exposure:500, interval:90 },
].map(Object.freeze));

export function createCatchGame(random = Math.random) {
  let phase = 'idle', score = 0, remaining = 30000, combo = 0, level = 1, maxCombo = 0;
  let deadline = 0, next = 0, last = -1, serial = 0, pausedAt = 0;
  let targets = [], retiring = [];
  const freshStats = () => ({ caught:{jinjin:0,white:0,gold:0,black:0}, missed:0, empty:0 });
  let stats = freshStats();
  let director = createSpawnDirector(random);
  let availableAfter = Array(9).fill(0);
  const multiplier = () => combo >= 10 ? 2 : combo >= 5 ? 1.5 : 1;
  const state = () => ({ phase, score, remaining, level, combo, maxCombo, multiplier:multiplier(), stats:{ ...stats, caught:{ ...stats.caught } },
    targets:phase === 'playing' ? targets.map(target => ({ ...target })) : [],
    retiring:phase === 'playing' ? retiring.map(target => ({ ...target })) : [] });
  function retire(target, now) {
    availableAfter[target.index] = now + EXIT_MS;
    retiring.push({ ...target, exitUntil:now + EXIT_MS });
  }
  function tick(now) {
    if (phase !== 'playing') return state();
    remaining = Math.max(0, deadline - now);
    if (!remaining) {
      stats.missed += targets.filter(target => target.kind === 'jinjin').length;
      targets = []; retiring = []; phase = 'ended'; return state();
    }
    const nextLevel = Math.min(6, Math.floor((30000 - remaining) / 5000) + 1);
    if (nextLevel !== level) { level = nextLevel; next = Math.min(next, now); }
    retiring = retiring.filter(target => now < target.exitUntil);
    targets = targets.filter(target => {
      if (now < target.until) return true;
      if (target.kind === 'jinjin') stats.missed++;
      retire(target, now);
      return false;
    });
    const config = LEVELS[level - 1];
    if (now >= next && targets.length < config.max) {
      // Keep each appearance independent; never replace an occupied jar or replay a backlog.
      const choices = Array.from({ length:9 }, (_, index) => index)
        .filter(index => index !== last && now >= availableAfter[index] && !targets.some(target => target.index === index));
      if (!choices.length) return state();
      const index = director.nextJar(choices);
      const kind = director.nextKind();
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
      phase = 'playing'; score = 0; combo = 0; level = 1; maxCombo = 0; remaining = 30000; stats = freshStats();
      deadline = now + remaining; targets = []; retiring = []; director = createSpawnDirector(random); availableAfter = Array(9).fill(0); last = -1; next = now; serial = 0;
      return tick(now);
    },
    hit(index, now) {
      const wasPlaying = phase === 'playing';
      const visibleId = targets.find(target => target.index === index)?.id;
      tick(now);
      const target = targets.find(target => target.id === visibleId);
      if (phase !== 'playing' || !target) { if (wasPlaying && phase === 'playing' && visibleId === undefined) stats.empty++; return false; }
      stats.caught[target.kind]++;
      if (target.kind === 'jinjin') { score += 100 * multiplier(); combo++; maxCombo = Math.max(maxCombo,combo); }
      else { score -= 50; combo = 0; }
      targets = targets.filter(item => item.id !== target.id);
      retire(target, now);
      if (level === 1) next = Math.min(next, now + 120);
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
        retiring = retiring.map(target => ({ ...target, exitUntil:target.exitUntil + shift }));
        availableAfter = availableAfter.map(time => time + shift);
        next += shift; deadline = now + remaining; phase = 'playing';
      }
      return state();
    },
  };
}
