// Tencent GameLoop — case card art
// 4×3 grid of hand-painted 12×12 pixel-art gaming sprites with idle bob and CRT scanline overlay. Click to shuffle.
// Targets: #tencentStage (container), #tencentCanvas (canvas)

(function () {
  const stage  = document.getElementById('tencentStage');
  const canvas = document.getElementById('tencentCanvas');
  if (!stage || !canvas) return;
  const ctx = canvas.getContext('2d');

  const COLS = 4;
  const ROWS = 3;

  const PAL = {
    '.': null,
    K: '#12121e',   // outline
    W: '#ffffff',   // highlight
    S: '#c6c6d0',   // silver/light grey
    s: '#5c5c68',   // dark grey
    C: '#b4e0f5',   // blade light
    b: '#204870',   // blade shadow
    Y: '#f5c842',   // gold
    y: '#c58f1c',   // gold dark
    X: '#a56a2e',   // wood light
    x: '#603d1b',   // wood dark
    R: '#e84a3a',   // red
    r: '#a82620',   // red dark
    O: '#ff8a22',   // orange (flame)
    G: '#6ae65a',   // CRT green
    L: '#c8fff0',   // screen highlight
  };

  // 12×12 pixel sprites.
  const SPR = {
    sword: [
      '...........K',
      '..........KC',
      '.........KCb',
      '........KCbK',
      '.......KCbK.',
      '......KCbK..',
      '.....KCbK...',
      '....KCbK....',
      '..KKYYKK....',
      '.KYYYYYYK...',
      '..KXxxXK....',
      '...KKKK.....',
    ],
    potion: [
      '............',
      '....KKKK....',
      '....KxxK....',
      '...KKKKKK...',
      '...KS..SK...',
      '..K.W....K..',
      '..KRRRRRRK..',
      '..KRrrrrRK..',
      '..KRRRRRRK..',
      '..KKrrrrKK..',
      '...KKKKKK...',
      '............',
    ],
    chest: [
      '............',
      '............',
      '.KKKKKKKKKK.',
      '.KXxxxxxxXK.',
      '.KXYYYYYYXK.',
      '.KKKKKKKKKK.',
      '.KxxKYYKxxK.',
      '.KxxKYYKxxK.',
      '.KxxxxxxxxK.',
      '.KXYYYYYYXK.',
      '.KKKKKKKKKK.',
      '............',
    ],
    gamepad: [
      '............',
      '............',
      '............',
      '..KKKKKKKK..',
      '.KSSSSSSSSK.',
      'KSsKsSSSGsRK',
      'KSKKKSSSsRsK',
      'KSsKsSSSGsRK',
      '.KSSSSSSSSK.',
      '..KKKKKKKK..',
      '............',
      '............',
    ],
    coin: [
      '............',
      '...KKKKKK...',
      '..KYYYYYYK..',
      '.KYyyyyyyYK.',
      '.KYyKKKKyYK.',
      '.KYyKyyyyyK.',
      '.KYyKyyyyyK.',
      '.KYyKKKKyYK.',
      '.KYyyyyyyYK.',
      '..KYYYYYYK..',
      '...KKKKKK...',
      '............',
    ],
    heart: [
      '............',
      '..KKK..KKK..',
      '.KRRRKKRRRK.',
      '.KRWRRRRRRK.',
      '.KRRRRRRRRK.',
      '.KRRRRRRRRK.',
      '..KRRRRRRK..',
      '...KRRRRK...',
      '....KRRK....',
      '.....KK.....',
      '............',
      '............',
    ],
    bomb: [
      '.........OO.',
      '........OY..',
      '.......Kx...',
      '......K.....',
      '.....KK.....',
      '...KKKKKKK..',
      '.KKssssssKK.',
      'KssWssssssK.',
      'KssssssssssK',
      'KssssssssssK',
      '.KssssssssK.',
      '..KKKKKKKK..',
    ],
    computer: [
      '............',
      '.KKKKKKKKKK.',
      'KSSSSSSSSSSK',
      'KsGGGGGGGGsK',
      'KsGLGGGGGGsK',
      'KsGGGGGGGGsK',
      'KsGGGGGGGGsK',
      'KSSSSSSSSSSK',
      '.KKKKKKKKKK.',
      'KSKKKKKKKKSK',
      'KKKKKKKKKKKK',
      '............',
    ],
  };

  const NAMES = ['sword','potion','chest','gamepad','coin','heart','bomb','computer'];
  const SPRITE_PX = 12;

  let DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  let cellSize = 100, gridOffX = 0, gridOffY = 0, blockPx = 4;
  let cells = [];
  let raf = 0, running = false, frame = 0;

  function layout() {
    // 12 slots, each anchored to one of the 8 sprites. Offset rotates per shuffle.
    const offset = Math.floor(Math.random() * NAMES.length);
    cells = [];
    for (let i = 0; i < COLS * ROWS; i++) {
      cells.push({
        name: NAMES[(i + offset) % NAMES.length],
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  function drawSprite(name, cx, cy, yOff) {
    const rows = SPR[name];
    const spriteSize = SPRITE_PX * blockPx;
    const x0 = Math.round(cx - spriteSize / 2);
    const y0 = Math.round(cy - spriteSize / 2 + yOff);
    for (let r = 0; r < SPRITE_PX; r++) {
      const row = rows[r];
      for (let c = 0; c < SPRITE_PX; c++) {
        const color = PAL[row[c]];
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(x0 + c * blockPx, y0 + r * blockPx, blockPx, blockPx);
      }
    }
  }

  function fit() {
    const r = stage.getBoundingClientRect();
    const W = Math.max(1, r.width);
    const H = Math.max(1, r.height);
    canvas.width  = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    cellSize = Math.floor(Math.min(canvas.width / COLS, canvas.height / ROWS));
    gridOffX = Math.floor((canvas.width  - cellSize * COLS) / 2);
    gridOffY = Math.floor((canvas.height - cellSize * ROWS) / 2);
    // Pick the largest block size that fits 12 px-blocks inside the cell with padding
    blockPx = Math.max(1, Math.floor((cellSize * 0.55) / SPRITE_PX));
    layout();
  }

  function drawScanlines() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    const step = Math.max(2, Math.round(DPR * 2));
    for (let y = 0; y < canvas.height; y += step * 2) {
      ctx.fillRect(0, y, canvas.width, step);
    }
  }

  function step() {
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const t = frame / 60;
    for (let i = 0; i < cells.length; i++) {
      const r = Math.floor(i / COLS);
      const c = i % COLS;
      const cx = gridOffX + c * cellSize + cellSize / 2;
      const cy = gridOffY + r * cellSize + cellSize / 2;
      const bob = Math.sin(t * 2 + cells[i].phase) * (blockPx * 0.9);
      drawSprite(cells[i].name, cx, cy, bob);
    }
    drawScanlines();
    frame++;
  }

  function loop()  { if (!running) return; step(); raf = requestAnimationFrame(loop); }
  function start() { if (!running) { running = true; loop(); } }
  function stop()  { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

  fit();
  let rt = 0;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(fit, 120); });

  stage.addEventListener('click', (e) => {
    layout();
    e.preventDefault();
    e.stopPropagation();
  });

  const inViewport = () => {
    const r = stage.getBoundingClientRect();
    return r.bottom > 0 && r.top < (window.innerHeight || document.documentElement.clientHeight);
  };
  if (inViewport()) start();
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => {
      es.forEach(e => e.isIntersecting ? start() : stop());
    }, { threshold: 0.05 }).observe(stage);
  } else {
    start();
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else if (inViewport()) start();
  });
  window.__tencent = { start, stop, step, shuffle: layout, state: () => ({ frame, cells: cells.length, running, blockPx }) };
})();
