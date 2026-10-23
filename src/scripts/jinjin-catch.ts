import { createCatchGame } from './jinjin-catch-engine.mjs';

export function setupJinjinCatch() {
  const root = document.querySelector<HTMLElement>('#jinjin-catch');
  if (!root) return;
  const text = JSON.parse(root.dataset.copy!);
  const game = createCatchGame();
  const pots = Array.from(root.querySelectorAll<HTMLButtonElement>('.catch-pot'));
  const score = root.querySelector<HTMLElement>('[data-catch-score]')!;
  const time = root.querySelector<HTMLElement>('[data-catch-time]')!;
  const overlay = root.querySelector<HTMLElement>('.catch-overlay')!;
  const title = root.querySelector<HTMLElement>('[data-overlay-title]')!;
  const body = root.querySelector<HTMLElement>('[data-overlay-body]')!;
  const start = root.querySelector<HTMLButtonElement>('[data-catch-start]')!;
  const pause = root.querySelector<HTMLButtonElement>('[data-catch-pause]')!;
  const announcement = root.querySelector<HTMLElement>('[data-catch-announcement]')!;
  let frame = 0;
  let phase = 'idle';
  const feedback = new Map<number, number>();

  function render() {
    const state = game.state();
    root!.dataset.phase = state.phase;
    score.textContent = String(state.score);
    root!.dataset.level = String(state.level);
    root!.querySelector<HTMLElement>('[data-catch-level]')!.textContent = `LEVEL ${state.level}`;
    root!.querySelector<HTMLElement>('[data-catch-combo]')!.textContent = `${state.combo} · ×${state.multiplier}`;
    time.textContent = String(Math.ceil(state.remaining / 1000));
    time.closest('.time-counter')?.classList.toggle('is-low', state.remaining <= 5000);
    pots.forEach((pot, index) => {
      const target = state.targets.find(target => target.index === index);
      pot.classList.toggle('is-up', Boolean(target));
      pot.classList.toggle('is-fake', Boolean(target?.fake));
      if (target) pot.dataset.kind = target.kind;
      pot.disabled = state.phase !== 'playing';
    });
    overlay.hidden = state.phase === 'playing';
    pause.disabled = state.phase !== 'playing';
    if (state.phase !== phase) {
      if (state.phase === 'paused') {
        title.textContent = text.paused; body.textContent = text.pausedBody; start.textContent = text.resume;
      } else if (state.phase === 'ended') {
        title.textContent = text.ended; body.textContent = text.result.replace('{score}', String(state.score)); start.textContent = text.again;
      }
      if (state.phase === 'paused' || state.phase === 'ended') {
        announcement.textContent = `${title.textContent}. ${body.textContent}`;
        if (!document.hidden) start.focus({ preventScroll:true });
      }
      phase = state.phase;
    }
  }
  function tick(now: number) {
    game.tick(now);
    render();
    frame = game.state().phase === 'playing' ? requestAnimationFrame(tick) : 0;
  }
  function hit(index: number) {
    const before = game.state().score;
    if (!game.hit(index, performance.now())) { render(); return; }
    const delta = game.state().score - before;
    pots[index].querySelector<HTMLElement>('.catch-pop')!.textContent = `${delta > 0 ? '+' : ''}${delta}`;
    const pot = pots[index];
    window.clearTimeout(feedback.get(index));
    pot.classList.add('is-hit');
    feedback.set(index, window.setTimeout(() => { pot.classList.remove('is-hit'); feedback.delete(index); }, 500));
    render();
  }
  function pauseGame() {
    game.pause(performance.now());
    cancelAnimationFrame(frame); frame = 0;
    render();
  }
  start.disabled = false;
  start.addEventListener('click', () => {
    if (document.hidden) return;
    cancelAnimationFrame(frame);
    feedback.forEach(timer => window.clearTimeout(timer)); feedback.clear();
    pots.forEach(pot => pot.classList.remove('is-hit'));
    if (game.state().phase === 'paused') game.resume(performance.now());
    else game.start(performance.now());
    announcement.textContent = '';
    render();
    pause.focus({ preventScroll:true });
    frame = requestAnimationFrame(tick);
  });
  pots.forEach((pot, index) => pot.addEventListener('click', () => hit(index)));
  pause.addEventListener('click', pauseGame);
  root.addEventListener('keydown', event => {
    if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || game.state().phase !== 'playing') return;
    if (/^[1-9]$/.test(event.key)) { event.preventDefault(); hit(Number(event.key) - 1); }
    if (event.key === 'Escape') { event.preventDefault(); pauseGame(); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });
  window.addEventListener('pagehide', pauseGame);
  render();
}
