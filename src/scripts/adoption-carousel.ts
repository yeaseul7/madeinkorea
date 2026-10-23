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
  const cards = Array.from(track.children) as HTMLElement[];
  const interval = 4000;
  let looping = false;
  let settleTimer = 0;
  let timer = 0;
  let animation = 0;

  const maxScroll = () => Math.max(0, track.scrollWidth - track.clientWidth);
  const expired = () => results.hidden || Date.now() >= Number(results.dataset.expires);
  const pitch = () => cards[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || '0');
  const leadingCard = () => track.children[Math.min(cards.length - 1, Math.max(0, Math.round(track.scrollLeft / pitch())))];

  // Keep one real card before the viewport. Moving nodes instead of cloning them
  // keeps all visible links usable and avoids duplicate listings for screen readers.
  function normalizeLoop() {
    if (!looping) return;
    const width = pitch();
    const shifts = Math.floor((track.scrollLeft + 2) / width) - 1;
    if (!shifts) return;
    const offset = track.scrollLeft - shifts * width;
    if (shifts > 0) {
      for (let i = 0; i < shifts; i++) track.append(track.firstElementChild!);
    } else {
      for (let i = 0; i > shifts; i--) track.prepend(track.lastElementChild!);
    }
    // scrollLeft is rounded on some browsers; tolerate subpixel card widths.
    track.scrollLeft = Math.abs(offset - width) < 2 ? width : offset;
  }
  function configureLoop() {
    const current = leadingCard() || cards[0];
    looping = maxScroll() >= pitch() * 2 - 2;
    track.classList.toggle('is-looping', looping);
    track.replaceChildren(...cards);
    if (looping) {
      const index = cards.indexOf(current as HTMLElement);
      for (let i = 0; i < index; i++) track.append(track.firstElementChild!);
      track.prepend(track.lastElementChild!);
      track.scrollLeft = pitch();
    } else track.scrollLeft = Math.min(maxScroll(), cards.indexOf(current as HTMLElement) * pitch());
  }
  function render() {
    const max = maxScroll();
    controls.hidden = max < 2;
    previous.disabled = max < 2;
    next.disabled = max < 2;
    progress.value = looping
      ? ((cards.indexOf(leadingCard() as HTMLElement) + 1) / cards.length) * 100
      : max ? (track.scrollLeft / max) * 100 : 0;
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
    if (!playing || !visible || hovering || document.hidden || expired() || maxScroll() < 2 || track.contains(document.activeElement)) return;
    timer = window.setTimeout(() => move(1), interval);
  }
  function move(step: number) {
    clearTimer();
    cancelMove();
    window.clearTimeout(settleTimer);
    normalizeLoop();
    const max = maxScroll();
    const start = track.scrollLeft;
    const origin = track.getBoundingClientRect().left;
    const positions = Array.from(track.children).map(card => Math.min(max, Math.max(0, card.getBoundingClientRect().left - origin + start)));
    let destination = step > 0
      ? positions.find(position => position > start + 2) ?? max
      : positions.reverse().find(position => position < start - 2) ?? 0;
    if (!looping) {
      if (step > 0 && start >= max - 2) destination = 0;
      if (step < 0 && start <= 2) destination = max;
    }
    if (reducedMotion.matches || Math.abs(destination - start) < 2) {
      track.scrollLeft = destination;
      normalizeLoop();
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
        normalizeLoop();
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
  });
  track.addEventListener('pointerleave', () => { hovering = false; schedule(); });
  track.addEventListener('pointerdown', pause, { passive: true });
  track.addEventListener('wheel', event => {
    // Scrolling down the page must not switch off autoplay.
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.shiftKey) pause();
  }, { passive: true });
  track.addEventListener('focusin', pause);
  track.addEventListener('keydown', event => {
    if (event.target !== track || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    pause();
    move(event.key === 'ArrowRight' ? 1 : -1);
  });
  track.addEventListener('scroll', () => {
    render();
    window.clearTimeout(settleTimer);
    if (!animation) settleTimer = window.setTimeout(() => { normalizeLoop(); render(); }, 160);
  }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { clearTimer(); cancelMove(); }
    else schedule();
  });
  reducedMotion.addEventListener('change', pause);
  let trackWidth = track.clientWidth;
  new ResizeObserver(() => {
    // Lazy images can change height without changing a slide's destination.
    // Only interrupt movement when the horizontal layout actually changes.
    if (Math.abs(track.clientWidth - trackWidth) > 1) {
      trackWidth = track.clientWidth;
      cancelMove();
      configureLoop();
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
  configureLoop();
  render();
}
