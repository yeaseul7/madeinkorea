import { createVisibilityPause } from './jinjin-visibility.mjs';
import { readRecords, saveRecords } from './jinjin-records.mjs';
import { createGameClock } from './jinjin-clock.mjs';
import { createCatchGame } from './jinjin-catch-engine.mjs';

export function setupJinjinCatch() {
  const root = document.querySelector<HTMLElement>('#jinjin-catch');
  if (!root) return;
  const text = JSON.parse(root.dataset.copy!);
  const game = createCatchGame();
  let storage: Storage | undefined;
  try { storage = window.localStorage; } catch {}
  let personalRecords = readRecords(storage);
  let storageFailed = !storage;
  const bestScore = root.querySelector<HTMLElement>('[data-best-score]')!;
  const bestCombo = root.querySelector<HTMLElement>('[data-best-combo]')!;
  const recordMessage = root.querySelector<HTMLElement>('[data-record-message]')!;
  const storageNote = root.querySelector<HTMLElement>('[data-storage-note]')!;
  const pots = Array.from(root.querySelectorAll<HTMLButtonElement>('.catch-pot'));
  const score = root.querySelector<HTMLElement>('[data-catch-score]')!;
  const timerBar = root.querySelector<HTMLElement>('[data-catch-timer]')!;
  const timerPanel = root.querySelector<HTMLElement>('.catch-timer')!;
  let previousSecond = -1;
  const overlay = root.querySelector<HTMLElement>('.catch-overlay')!;
  const title = root.querySelector<HTMLElement>('[data-overlay-title]')!;
  const body = root.querySelector<HTMLElement>('[data-overlay-body]')!;
  const start = root.querySelector<HTMLButtonElement>('[data-catch-start]')!;
  const pause = root.querySelector<HTMLButtonElement>('[data-catch-pause]')!;
  const announcement = root.querySelector<HTMLElement>('[data-catch-announcement]')!;
  const clock = createGameClock(tick);
  let phase = '';
  const feedback = new Map<number, number>();

  function render() {
    const state = game.state();
    root!.dataset.phase = state.phase;
    score.textContent = String(state.score);
    root!.dataset.level = String(state.level);
    root!.querySelector<HTMLElement>('[data-catch-level]')!.textContent = `LEVEL ${state.level}`;
    const seconds = Math.ceil(state.remaining / 1000);
    timerPanel.style.setProperty('--time-left', String(Math.max(0,Math.min(1,state.remaining/30000))));
    if (seconds !== previousSecond) {
      timerBar.setAttribute('aria-valuenow',String(seconds));
      previousSecond = seconds;
    }
    timerPanel.classList.toggle('is-low', state.remaining <= 5000);
    pots.forEach((pot, index) => {
      const target = state.targets.find(target => target.index === index);
      const leaving = state.retiring.find(target => target.index === index);
      pot.classList.toggle('is-leaving', Boolean(leaving));
      pot.classList.toggle('is-up', Boolean(target));
      pot.classList.toggle('is-fake', Boolean(target?.fake));
      if (target) pot.dataset.kind = target.kind;
      pot.disabled = state.phase !== 'playing';
    });
    overlay.hidden = state.phase === 'playing';
    pause.disabled = state.phase !== 'playing';
    if (state.phase !== phase) {
      recordMessage.hidden = true;
      if (state.phase === 'ended') {
        const result = saveRecords(storage, state.score, state.maxCombo, personalRecords);
        personalRecords = result.record;
        storageFailed = !result.saved;
        recordMessage.hidden = !result.newBest;
        recordMessage.textContent = text.newBest;
      }
      bestScore.textContent = personalRecords.played ? String(personalRecords.bestScore) : '—';
      bestCombo.textContent = personalRecords.played ? String(personalRecords.maxCombo) : '—';
      storageNote.textContent = storageFailed ? text.unsavedNote : text.savedNote;

      const guide = root!.querySelector<HTMLElement>('.catch-character-guide')!;
      guide.hidden = state.phase === 'paused';
      const detail = root!.querySelector<HTMLElement>('[data-result-detail]')!;
      detail.hidden = state.phase !== 'ended';
      guide.querySelectorAll<HTMLElement>('[data-result-kind]').forEach(label => {
        const kind = label.dataset.resultKind!;
        label.textContent = state.phase === 'ended'
          ? (kind === 'jinjin' ? text.caughtCount : text.wrongCount).replace('{n}', String(state.stats.caught[kind]))
          : kind === 'jinjin' ? '+100' : '−50';
      });
      if (state.phase === 'ended') detail.textContent = `${text.missedCount.replace('{n}',String(state.stats.missed))} · ${text.emptyCount.replace('{n}',String(state.stats.empty))}`;

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
    return game.state().phase === 'playing';
  }
  function hit(index: number) {
    const before = game.state().score;
    if (!game.hit(index, performance.now())) { render(); return; }
    const delta = game.state().score - before;
    pots[index].querySelector<HTMLElement>('.catch-points')!.textContent = `${delta > 0 ? '+' : ''}${delta}`;
    const pot = pots[index];
    const comboPop = pot.querySelector<HTMLElement>('.catch-combo-pop')!;
    const state = game.state();
    comboPop.hidden = delta <= 0;
    comboPop.textContent = delta > 0 ? `${state.combo} COMBO!${state.multiplier > 1 ? ` · ×${state.multiplier}` : ''}` : '';

    pot.dataset.feedback = delta > 0 ? 'correct' : 'wrong';
    window.clearTimeout(feedback.get(index));
    pot.classList.add('is-hit');
    feedback.set(index, window.setTimeout(() => { pot.classList.remove('is-hit'); feedback.delete(index); }, 750));
    render();
  }
  function pauseGame() {
    game.pause(performance.now());
    clock.stop();
    render();
  }
  const visibilityPause = createVisibilityPause({
    isPlaying: () => game.state().phase === 'playing',
    pause: pauseGame,
    resume: () => {
      if (game.state().phase !== 'paused') return;
      game.resume(performance.now());
      render();
      clock.start();
    },
  });
  start.disabled = false;
  start.addEventListener('click', () => {
    if (document.hidden) return;
    visibilityPause.manual();
    clock.stop();
    feedback.forEach(timer => window.clearTimeout(timer)); feedback.clear();
    pots.forEach(pot => pot.classList.remove('is-hit'));
    if (game.state().phase === 'paused') game.resume(performance.now());
    else game.start(performance.now());
    announcement.textContent = '';
    render();
    pause.focus({ preventScroll:true });
    clock.start();
  });
  pots.forEach((pot, index) => pot.addEventListener('click', () => hit(index)));
  pause.addEventListener('click', () => { visibilityPause.manual(); pauseGame(); });
  root.addEventListener('keydown', event => {
    if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || game.state().phase !== 'playing') return;
    if (/^[1-9]$/.test(event.key)) { event.preventDefault(); hit(Number(event.key) - 1); }
    if (event.key === 'Escape') { event.preventDefault(); visibilityPause.manual(); pauseGame(); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) visibilityPause.hide(); else visibilityPause.show(); });
  window.addEventListener('pagehide', () => visibilityPause.hide());
  window.addEventListener('pageshow', () => { if (!document.hidden) visibilityPause.show(); });
  render();
}
