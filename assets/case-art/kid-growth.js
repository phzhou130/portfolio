// The KID Growth Architecture — case card art
// Cinematic SVG path stroke-draw animation that traces the KID logo + tagline, then loops.
// Targets: #kidStage (container), #kidSvg (SVG with .kid-mark and .kid-text path groups)

(function () {
  const stage = document.getElementById('kidStage');
  const svg   = document.getElementById('kidSvg');
  if (!stage || !svg) return;

  const markPaths = Array.from(svg.querySelectorAll('.kid-mark path'));
  const textPaths = Array.from(svg.querySelectorAll('.kid-text path'));
  const all = [...markPaths, ...textPaths];

  // Pre-measure lengths and park paths at offset = length (fully hidden).
  const lengths = all.map(p => {
    const len = p.getTotalLength();
    p.style.strokeDasharray  = len;
    p.style.strokeDashoffset = len;
    return len;
  });

  const HOLD_MS = 1600;  // dwell on the completed logo before replaying
  let timers = [];
  let inView = false;
  let docVisible = !document.hidden;

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function reset() {
    all.forEach((p, i) => {
      p.style.transition = 'none';
      p.style.strokeDashoffset = lengths[i];
    });
    void svg.getBoundingClientRect();
  }

  function play() {
    clearTimers();
    reset();

    let cursor = 60;
    const schedule = [];

    markPaths.forEach((p, i) => {
      const len = p.getTotalLength();
      // Slower, more deliberate stroke for the main logo marks
      const dur = Math.max(800, Math.min(2200, len * 3.5));
      schedule.push({ path: p, startAt: cursor, dur });
      cursor += dur * 0.55;
    });

    cursor += 150; // brief pause before the tagline kicks in

    textPaths.forEach((p, i) => {
      const len = p.getTotalLength();
      const dur = Math.max(240, Math.min(600, len * 4));
      schedule.push({ path: p, startAt: cursor, dur });
      cursor += 110;  // quick cascade between letters
    });

    const lastEnd = schedule.reduce((m, s) => Math.max(m, s.startAt + s.dur), 0);

    schedule.forEach(({ path, startAt, dur }) => {
      timers.push(setTimeout(() => {
        path.style.transition = `stroke-dashoffset ${dur}ms cubic-bezier(0.65, 0, 0.35, 1)`;
        path.style.strokeDashoffset = 0;
      }, startAt));
    });

    timers.push(setTimeout(() => {
      if (inView && docVisible) play();
    }, lastEnd + HOLD_MS));
  }

  function start() {
    if (!inView || !docVisible) return;
    play();
  }
  function stop() {
    clearTimers();
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => {
      es.forEach(e => {
        inView = e.isIntersecting;
        if (inView) start(); else stop();
      });
    }, { threshold: 0.05 }).observe(stage);
  } else {
    inView = true;
    start();
  }
  document.addEventListener('visibilitychange', () => {
    docVisible = !document.hidden;
    if (docVisible) start(); else stop();
  });

  window.__kid = { play, stop, state: () => ({ inView, docVisible, paths: all.length }) };
})();
