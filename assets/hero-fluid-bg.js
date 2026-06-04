// Hero Fluid ASCII Background — vanilla port of the FluidBackground React
// component used in the poker intro. Renders a full-cover canvas behind the
// hero section with domain-warped value noise driving an ASCII density grid,
// keeping the same visual language across the intro and the main portfolio.
// Targets: #hero-fluid-bg (canvas), #hero-section (parent — used for sizing
// + IntersectionObserver pause/resume).

(function () {
  const canvas = document.getElementById('hero-fluid-bg');
  const hero = document.getElementById('hero-section');
  if (!canvas || !hero) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    canvas.style.display = 'none';
    return;
  }

  // Match the poker intro's parameters so the two backgrounds read as one
  // continuous art style.
  const COLOR  = 'rgba(10,10,10,0.85)';
  const CELL   = 11;
  const SPEED  = 0.00022;
  const FLUID_CHARS = ' ·.:;+*o#@'; // sparse → dense

  // Each frame, skip cells that fall inside (or near) any text element so the
  // stats numbers stay readable. PADDING_PX adds breathing room around each rect.
  const TEXT_SELECTORS = '.stats-row, .hero-status';
  const PADDING_PX = 14;

  const ctx = canvas.getContext('2d');
  let dpr = Math.min(2, window.devicePixelRatio || 1);
  let raf = 0;
  let running = false;
  let inView = true;
  let docVisible = !document.hidden;

  // Value noise (3D: x, y, t) — same construction as fluid-background.jsx.
  function makeNoise() {
    const PERM_SIZE = 256;
    const perm = new Uint8Array(PERM_SIZE * 2);
    const rand = (() => { let s = 1337; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; })();
    const p = new Uint8Array(PERM_SIZE);
    for (let i = 0; i < PERM_SIZE; i++) p[i] = i;
    for (let i = PERM_SIZE - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const t = p[i]; p[i] = p[j]; p[j] = t;
    }
    for (let i = 0; i < PERM_SIZE * 2; i++) perm[i] = p[i % PERM_SIZE];

    function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    function lerp(a, b, t) { return a + t * (b - a); }
    function grad(hash, x, y, z) {
      const h = hash & 15;
      const u = h < 8 ? x : y;
      const v = h < 4 ? y : (h === 12 || h === 14 ? x : z);
      return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
    }
    return function noise(x, y, z) {
      const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
      x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
      const u = fade(x), v = fade(y), w = fade(z);
      const A = perm[X] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z;
      const B = perm[X + 1] + Y, BA = perm[B] + Z, BB = perm[B + 1] + Z;
      return lerp(
        lerp(
          lerp(grad(perm[AA], x, y, z), grad(perm[BA], x - 1, y, z), u),
          lerp(grad(perm[AB], x, y - 1, z), grad(perm[BB], x - 1, y - 1, z), u),
          v),
        lerp(
          lerp(grad(perm[AA + 1], x, y, z - 1), grad(perm[BA + 1], x - 1, y, z - 1), u),
          lerp(grad(perm[AB + 1], x, y - 1, z - 1), grad(perm[BB + 1], x - 1, y - 1, z - 1), u),
          v),
        w);
    };
  }
  const noise3d = makeNoise();

  // Per-cell brush intensity grid: each cell stores how recently the cursor
  // brushed it (0 = invisible, 1 = freshly painted). Decays every frame so the
  // ASCII reveals along the mouse track and fades behind it.
  const BRUSH_RADIUS_CELLS = 8;
  const DECAY = 0.93;
  const RENDER_THRESHOLD = 0.04;
  let intensity = null;
  let gridCols = 0, gridRows = 0;
  let mouseX = -9999, mouseY = -9999;
  let mouseInside = false;

  function ensureGrid(cols, rows) {
    if (cols !== gridCols || rows !== gridRows) {
      intensity = new Float32Array(cols * rows);
      gridCols = cols;
      gridRows = rows;
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    canvas.width  = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    // Force grid re-alloc on next draw
    gridCols = 0; gridRows = 0;
  }

  hero.addEventListener('mouseenter', function () { mouseInside = true; });
  hero.addEventListener('mouseleave', function () { mouseInside = false; });
  hero.addEventListener('mousemove', function (e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) * dpr;
    mouseY = (e.clientY - rect.top) * dpr;
  });

  // Collect text-element rects in canvas-pixel space (DPR-scaled) so the draw
  // loop can do a fast point-in-rect test per cell. Refresh every frame —
  // rects move with reveal animations / hovers, and the queries are cheap.
  function collectTextRects() {
    const heroRect = hero.getBoundingClientRect();
    const els = hero.querySelectorAll(TEXT_SELECTORS);
    const out = [];
    const padPx = PADDING_PX * dpr;
    for (let i = 0; i < els.length; i++) {
      const r = els[i].getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      out.push({
        x0: (r.left - heroRect.left) * dpr - padPx,
        y0: (r.top  - heroRect.top)  * dpr - padPx,
        x1: (r.right - heroRect.left) * dpr + padPx,
        y1: (r.bottom - heroRect.top) * dpr + padPx,
      });
    }
    return out;
  }

  function inAnyRect(x, y, rects) {
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      if (x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1) return true;
    }
    return false;
  }

  function draw(t) {
    if (!running) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.font = (CELL * dpr) + 'px "JetBrains Mono", ui-monospace, monospace';
    ctx.textBaseline = 'top';
    const cw = CELL * dpr;
    const cols = Math.ceil(W / cw);
    const rows = Math.ceil(H / cw);
    ensureGrid(cols, rows);
    const tt = t * SPEED;
    const textRects = collectTextRects();

    const mcx = mouseX / cw;
    const mcy = mouseY / cw;
    const br2 = BRUSH_RADIUS_CELLS * BRUSH_RADIUS_CELLS;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        intensity[i] *= DECAY;
        if (mouseInside) {
          const dx = (c + 0.5) - mcx;
          const dy = (r + 0.5) - mcy;
          const d2 = dx * dx + dy * dy;
          if (d2 < br2) {
            const boost = 1 - Math.sqrt(d2) / BRUSH_RADIUS_CELLS;
            if (boost > intensity[i]) intensity[i] = boost;
          }
        }
        const ii = intensity[i];
        if (ii < RENDER_THRESHOLD) continue;

        const px = c * cw + cw * 0.5;
        const py = r * cw + cw * 0.5;
        if (inAnyRect(px, py, textRects)) continue;

        const nx = c * 0.05;
        const ny = r * 0.05;
        const wx = noise3d(nx + 100, ny, tt) * 1.6;
        const wy = noise3d(nx, ny + 100, tt) * 1.6;
        const v = noise3d(nx + wx, ny + wy, tt * 0.7);
        let d = (v + 1) * 0.5;
        d = Math.pow(d, 1.6) * ii;
        const idx = Math.min(FLUID_CHARS.length - 1, Math.max(0, Math.floor(d * FLUID_CHARS.length)));
        const ch = FLUID_CHARS[idx];
        if (ch === ' ') continue;
        ctx.globalAlpha = ii;
        ctx.fillStyle = COLOR;
        ctx.fillText(ch, c * cw, r * cw);
      }
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(draw);
  }

  function start() {
    if (running || !inView || !docVisible) return;
    running = true;
    raf = requestAnimationFrame(draw);
  }
  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  resize();
  start();

  // Re-fit on resize (debounced).
  let rt = 0;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { dpr = Math.min(2, window.devicePixelRatio || 1); resize(); }, 120);
  });

  // Pause when hero scrolls out of view (saves CPU on long pages).
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { inView = e.isIntersecting; if (inView) start(); else stop(); });
    }, { threshold: 0 });
    io.observe(hero);
  }

  // Pause when tab is hidden.
  document.addEventListener('visibilitychange', function () {
    docVisible = !document.hidden;
    if (docVisible) start(); else stop();
  });
})();
