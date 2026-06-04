// KidGrowthCard — loads kid-logo.svg inline and animates each <path> with a
// stroke-draw effect. The SVG is fetched once and injected as DOM so we can
// query its <path> elements and animate stroke-dashoffset.

function KidGrowthCard({ w, h }) {
  const stageRef = React.useRef(null);
  const wrapRef = React.useRef(null);
  const [svgReady, setSvgReady] = React.useState(false);

  // Load and inject the SVG
  React.useEffect(() => {
    let cancelled = false;
    fetch('assets/poker-intro/kid-logo.svg')
      .then((r) => r.text())
      .then((txt) => {
        if (cancelled) return;
        const wrap = wrapRef.current;
        if (!wrap) return;
        wrap.innerHTML = txt;
        const svg = wrap.querySelector('svg');
        if (svg) {
          svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          svg.style.position = 'absolute';
          svg.style.inset = '0';
          svg.style.width = '100%';
          svg.style.height = '100%';
          // Make every path strokeable & invisible-fill so the stroke-draw reads
          const paths = svg.querySelectorAll('path');
          paths.forEach((p) => {
            p.setAttribute('fill', 'none');
            p.setAttribute('stroke', '#0a0a0a');
            p.setAttribute('stroke-width', '1.2');
            p.setAttribute('stroke-linecap', 'round');
            p.setAttribute('stroke-linejoin', 'round');
          });
        }
        setSvgReady(true);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Once the SVG is in the DOM, run the stroke-draw animation in a loop.
  React.useEffect(() => {
    if (!svgReady) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const svg = wrap.querySelector('svg');
    if (!svg) return;
    const paths = Array.from(svg.querySelectorAll('path'));
    if (!paths.length) return;

    const lengths = paths.map((p) => {
      let len;
      try { len = p.getTotalLength(); } catch (e) { len = 100; }
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
      return len;
    });

    const HOLD_MS = 1800;
    let timers = [];
    let stopped = false;

    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    function reset() {
      paths.forEach((p, i) => {
        p.style.transition = 'none';
        p.style.strokeDashoffset = lengths[i];
      });
      void svg.getBoundingClientRect();
    }

    function play() {
      if (stopped) return;
      clearTimers();
      reset();

      // schedule each path with a duration proportional to its length, cascading
      let cursor = 60;
      const schedule = paths.map((p, i) => {
        const len = lengths[i];
        const dur = Math.max(280, Math.min(1800, len * 2.6));
        const startAt = cursor;
        cursor += Math.max(80, dur * 0.18); // tight cascade so the whole logo finishes quickly
        return { path: p, startAt, dur };
      });

      const lastEnd = schedule.reduce((m, s) => Math.max(m, s.startAt + s.dur), 0);
      schedule.forEach(({ path, startAt, dur }) => {
        timers.push(setTimeout(() => {
          path.style.transition = `stroke-dashoffset ${dur}ms cubic-bezier(0.65, 0, 0.35, 1)`;
          path.style.strokeDashoffset = 0;
        }, startAt));
      });

      timers.push(setTimeout(() => { if (!stopped) play(); }, lastEnd + HOLD_MS));
    }

    play();
    return () => { stopped = true; clearTimers(); };
  }, [svgReady]);

  return (
    <div ref={stageRef} style={{
      position: 'absolute', inset: 0,
      background: '#ffffff',
      overflow: 'hidden', pointerEvents: 'auto',
    }}>
      <div ref={wrapRef} style={{
        position: 'absolute', inset: '8%',
        width: '84%', height: '84%',
      }} />
    </div>
  );
}

window.KidGrowthCard = KidGrowthCard;
