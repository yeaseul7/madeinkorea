export function setupAdoptionCarousel() {
  const results = document.querySelector<HTMLElement>('.adoption-results');
  const track = results?.querySelector<HTMLElement>('.adoption-cards');
  const controls = results?.querySelector<HTMLElement>('.adoption-carousel-controls');
  if (!results || !track || !controls || results.hidden) return;
  const previous = controls.querySelector<HTMLButtonElement>('.carousel-previous')!;
  const next = controls.querySelector<HTMLButtonElement>('.carousel-next')!;
  const toggle = controls.querySelector<HTMLButtonElement>('.carousel-autoplay')!;
  const label = toggle.querySelector<HTMLElement>('.autoplay-label')!;
  const icon = toggle.querySelector<HTMLElement>('.autoplay-icon')!;
  const progress = controls.querySelector<HTMLProgressElement>('progress')!;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let playing = !reducedMotion.matches;
  let visible = false;
  let hovering = false;
  let direction = 1;
  let timer = 0;
  let animation = 0;

  const maxScroll = () => Math.max(0, track.scrollWidth - track.clientWidth);
  const expired = () => results.hidden || Date.now() >= Number(results.dataset.expires);
  function render() {
    const max = maxScroll();
    controls.hidden = max < 2;
    previous.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= max - 2;
    progress.value = max ? (track.scrollLeft / max) * 100 : 0;
    toggle.setAttribute('aria-pressed', String(playing));
    label.textContent = (playing ? toggle.dataset.pause : toggle.dataset.play) || '';
    icon.textContent = playing ? 'Ⅱ' : '▷';
  }
  function clearTimer() { window.clearTimeout(timer); }
  function cancelMove() {
    cancelAnimationFrame(animation);
    animation = 0;
    track.classList.remove('is-moving');
  }
  function schedule() {
    clearTimer();
    if (!playing || !visible || hovering || document.hidden || expired() || maxScroll() < 2 || track.contains(document.activeElement) || track.querySelector('details[open]')) return;
    timer = window.setTimeout(() => {
      if (track.scrollLeft >= maxScroll() - 2) direction = -1;
      else if (track.scrollLeft <= 2) direction = 1;
      move(direction);
    }, 4500);
  }
  function move(step: number) {
    clearTimer();
    cancelMove();
    const max = maxScroll();
    const start = track.scrollLeft;
    const origin = track.getBoundingClientRect().left;
    const positions = Array.from(track.children).map(card => Math.min(max, Math.max(0, card.getBoundingClientRect().left - origin + start)));
    const destination = step > 0
      ? positions.find(position => position > start + 2) ?? max
      : positions.reverse().find(position => position < start - 2) ?? 0;
    if (reducedMotion.matches || Math.abs(destination - start) < 2) {
      track.scrollLeft = destination;
      render();
      schedule();
      return;
    }
    const startedAt = performance.now();
    track.classList.add('is-moving');
    function tick(now: number) {
      const elapsed = Math.min(1, (now - startedAt) / 800);
      const eased = elapsed < .5 ? 4 * elapsed ** 3 : 1 - (-2 * elapsed + 2) ** 3 / 2;
      track.scrollLeft = start + (destination - start) * eased;
      if (elapsed < 1) animation = requestAnimationFrame(tick);
      else {
        animation = 0;
        track.classList.remove('is-moving');
        render();
        schedule();
      }
    }
    animation = requestAnimationFrame(tick);
  }
  function pause() {
    playing = false;
    clearTimer();
    cancelMove();
    render();
  }
  previous.addEventListener('click', () => { pause(); move(-1); });
  next.addEventListener('click', () => { pause(); move(1); });
  toggle.addEventListener('click', () => {
    if (playing) pause();
    else { playing = true; render(); schedule(); }
  });
  track.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse') return;
    hovering = true;
    clearTimer();
    cancelMove();
  });
  track.addEventListener('pointerleave', () => { hovering = false; schedule(); });
  track.addEventListener('pointerdown', pause, { passive: true });
  track.addEventListener('wheel', pause, { passive: true });
  track.addEventListener('focusin', pause);
  track.addEventListener('keydown', event => {
    if (event.target !== track || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    pause();
    move(event.key === 'ArrowRight' ? 1 : -1);
  });
  track.addEventListener('scroll', render, { passive: true });
  track.addEventListener('toggle', schedule, true);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { clearTimer(); cancelMove(); }
    else schedule();
  });
  reducedMotion.addEventListener('change', pause);
  let trackWidth = track.clientWidth;
  new ResizeObserver(() => {
    // Lazy images and expanded notes can change height without changing a slide's destination.
    // Only interrupt movement when the horizontal layout actually changes.
    if (Math.abs(track.clientWidth - trackWidth) > 1) {
      trackWidth = track.clientWidth;
      cancelMove();
      render();
      schedule();
    } else render();
  }).observe(track);
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (!visible) { clearTimer(); cancelMove(); }
    else schedule();
  }, { threshold: .1 }).observe(track);
  new MutationObserver(() => {
    if (expired()) { clearTimer(); cancelMove(); }
  }).observe(results, { attributes: true, attributeFilter: ['hidden'] });
  render();
}
