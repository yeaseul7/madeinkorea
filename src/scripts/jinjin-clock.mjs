// Keep game time independent of the browser's animation-frame delivery.
export function createGameClock(step, { now = () => performance.now(), schedule = callback => setInterval(callback, 33), cancel = handle => clearInterval(handle) } = {}) {
  let handle = null;
  function stop() { if (handle !== null) cancel(handle); handle = null; }
  function start() {
    stop();
    handle = schedule(() => { if (step(now()) === false) stop(); });
  }
  return { start, stop };
}
