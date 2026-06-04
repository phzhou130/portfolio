// Lucens AI / MathSolver — case card art
// Floating math glyphs in fake 3D perspective. Hover blurs nearby symbols and tints them violet.
// Targets: #lucensStage (container), #lucensCanvas (canvas)

(function () {
  const stage  = document.getElementById('lucensStage');
  const canvas = document.getElementById('lucensCanvas');
  if (!stage || !canvas) return;
  const ctx = canvas.getContext('2d');

  // Math glyph pool — operators, Greek, calculus, set theory, numerals
  const CHARS = Array.from(
    '+−×÷=±≠≈∑∏∫∮∂∇∞√∛∈∉⊂⊆∪∩∧∨∀∃∅⊥∝ℝℕℤℚℂ' +
    'αβγδεζηθικλμνξπρστυφχψωΔΣΠΩΦΨΘΛ' +
    '∠△∴∵⇒⇔→←↔' +
    '0123456789'
  );
  const MATH_FONT = '"STIX Two Math","Cambria Math","Latin Modern Math","Times New Roman","Noto Serif",serif';

  const NUM   = 120;
  const FOCAL = 1000;   // fake-perspective focal length

  let DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  let W = 0, H = 0;
  let rects = [];
  let frame = 0;
  let raf = 0, running = false;
  let mouseX = -9999, mouseY = -9999;
  const HOVER_R2 = 32 * 32;

  const rand = (a, b) => a + Math.random() * (b - a);

  function initRects() {
    rects = new Array(NUM);
    for (let i = 0; i < NUM; i++) {
      rects[i] = {
        x:    rand(-W * 0.9, W * 1.2),
        y:    rand(-H * 1.0, H * 1.0),
        z:    rand(-1800, 100),
        rot0: rand(0, Math.PI * 2),
        vRot: rand(-0.02, 0.02),
        sz:   rand(18, 44),
        char: CHARS[(Math.random() * CHARS.length) | 0]
      };
    }
  }

  function fit() {
    const r = stage.getBoundingClientRect();
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    canvas.width  = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    initRects();
    frame = 0;
  }

  function step() {
    // Full-frame white clear
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);

    // Always-floating: no clustering loop. Gentle continuous sway.
    const sway = Math.sin(frame * 0.01) * 0.2;
    const sinS = Math.sin(sway), cosS = Math.cos(sway);

    ctx.globalCompositeOperation = 'source-over';

    const cx = W / 2, cy = H / 2;

    for (let i = 0; i < NUM; i++) {
      const r = rects[i];

      // Y-axis rotation in world space
      const xR = r.x * cosS + r.z * sinS;
      const zR = -r.x * sinS + r.z * cosS;

      // Perspective projection
      const denom = FOCAL - zR;
      if (denom < 50) continue;              // behind or too close — skip
      const scale = FOCAL / denom;

      const sx = cx + xR * scale;
      const sy = cy + r.y * scale;
      if (sx < -60 || sx > W + 60 || sy < -60 || sy > H + 60) continue;

      const normZ = (zR + 1800) / 1900;      // ~0 (far) .. ~1 (near)
      const alpha = Math.max(0, Math.min(255, 10 + normZ * 245)) / 255;
      const rot   = r.rot0 + frame * r.vRot;
      const size  = r.sz * scale;
      if (size < 3) continue;

      const dx = sx - mouseX, dy = sy - mouseY;
      const hovered = (dx * dx + dy * dy) < HOVER_R2;

      ctx.save();
      ctx.translate(sx, sy);
      if (rot) ctx.rotate(rot);
      ctx.globalAlpha = alpha;
      if (hovered) {
        ctx.filter = 'blur(3px)';
        ctx.fillStyle = '#a855f7';
      } else {
        ctx.fillStyle = '#000';
      }
      ctx.font = `${size}px ${MATH_FONT}`;
      ctx.fillText(r.char, 0, 0);
      ctx.restore();
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    frame++;
  }

  function loop() { if (!running) return; step(); raf = requestAnimationFrame(loop); }
  function start() { if (!running) { running = true; loop(); } }
  function stop()  { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

  fit();
  let rt = 0;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(fit, 120);
  });

  stage.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouseX = e.clientX - r.left;
    mouseY = e.clientY - r.top;
  });
  stage.addEventListener('mouseleave', () => { mouseX = -9999; mouseY = -9999; });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => e.isIntersecting ? start() : stop());
    }, { threshold: 0.05 });
    io.observe(stage);
  } else {
    start();
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else start();
  });

  window.__lucens = { start, stop, step, fit, state: () => ({ frame, rects: rects.length }) };
})();
