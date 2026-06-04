// Languru — case card art
// Verlet-physics blobs of multilingual letters falling and piling up. Hover tints letters with accent colors.
// Targets: #languruStage (container), #languruCanvas (canvas)

(function () {
  const stage  = document.getElementById('languruStage');
  const canvas = document.getElementById('languruCanvas');
  if (!stage || !canvas) return;
  const ctx = canvas.getContext('2d');

  // Each body is filled from one script — visual identity per blob
  const LANGS = [
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    'abcdefghijklmnopqrstuvwxyz',
    'あいうえおかきくけこさしすせそたちつてとなにぬねの',
    'アイウエオカキクケコサシスセソタチツテトナニヌネノ',
    '語言学習文字書読話聞見愛夢心風月花人日字詩',
    '안녕하세요한국어글말배우다사랑공부',
    'ابتثجحخدذرزسشصضطظعغفقكلمنهوي',
    'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ',
    'αβγδεζηθικλμνξοπρστυφχψω',
    'אבגדהוזחטיכלמנסעפצקרשת',
    'अआइईउऊएऐओऔकखगघचछजझटठडढणतथदधनपफबभमयर',
    'กขคงจฉชซญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสห'
  ];
  const GLYPH_FONT = '"Inter","Helvetica Neue","Hiragino Sans","Noto Sans CJK SC","Noto Sans","Arial Unicode MS",sans-serif';

  // Languru-aligned palette — deep ink tones + forest-green accent
  const PALETTE = ['#0a0a0a', '#1a1a1a', '#333333', '#4a4a4a', '#616161', '#4a7c59', '#0a0a0a', '#333333'];

  // Hover tints — revealed when cursor is near a letter
  const HOVER_COLORS = ['#FEDE65', '#9D94FF', '#587BF3'];

  // Grid shapes (rows × cols) inherited from original
  const GRID_SIZES = [[4,4], [2,7], [3,4], [5,3], [2,6], [6,2], [1,10]];

  // --- Physics config (derived values recomputed on fit) --
  const GRAVITY = 0.1;
  const FLOOR_STOP_TIME = 10;
  const WALL_BOUNCE_DAMPING = 0.8;
  const MAX_BODIES = 12;
  const SPAWN_INTERVAL = 22;

  let DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  let W = 0, H = 0, floorY = 0;
  let POINT_RADIUS = 10;
  let STICK_SPACING = POINT_RADIUS * 2;
  let CELL_SIZE = POINT_RADIUS * 2;
  let MIN_DIST = POINT_RADIUS * 2;
  let MIN_DIST_SQ = MIN_DIST * MIN_DIST;
  let FONT_SIZE = 15;

  let bodies = [];
  let frame = 0;
  let raf = 0, running = false;
  let mouseX = -1e4, mouseY = -1e4;
  let hoverR  = 40;
  let hoverRSq = hoverR * hoverR;

  // --- Point -----------------------------------------------
  class Point {
    constructor(x, y) {
      this.x = x; this.y = y;
      this.prevX = x; this.prevY = y;
      this.floorTimer = 0;
    }
    update() {
      const vX = this.x - this.prevX;
      const vY = this.y - this.prevY;
      this.prevX = this.x;
      this.prevY = this.y;
      this.x += vX;
      this.y += vY + GRAVITY;

      if (this.y > floorY) {
        this.floorTimer++;
        if (this.floorTimer <= FLOOR_STOP_TIME) {
          this.y = floorY;
          this.prevY = this.y;
        }
      }
      if (this.x < POINT_RADIUS) {
        this.x = POINT_RADIUS;
        this.prevX = this.x + vX * WALL_BOUNCE_DAMPING;
      } else if (this.x > W - POINT_RADIUS) {
        this.x = W - POINT_RADIUS;
        this.prevX = this.x + vX * WALL_BOUNCE_DAMPING;
      }
    }
  }

  // --- Stick -----------------------------------------------
  class Stick {
    constructor(p1, p2) {
      this.p1 = p1; this.p2 = p2;
      const dx = p1.x - p2.x, dy = p1.y - p2.y;
      this.length = Math.sqrt(dx * dx + dy * dy);
    }
    update() {
      const dx = this.p1.x - this.p2.x;
      const dy = this.p1.y - this.p2.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d === 0) return;
      const diff = (d - this.length) / d;
      const ox = dx * diff * 0.5;
      const oy = dy * diff * 0.5;
      this.p1.x -= ox; this.p1.y -= oy;
      this.p2.x += ox; this.p2.y += oy;
    }
  }

  // --- Body ------------------------------------------------
  class Body {
    constructor(x, y) {
      this.points = [];
      this.sticks = [];
      this.chars  = [];
      this.hover  = [];
      const [rows, cols] = GRID_SIZES[(Math.random() * GRID_SIZES.length) | 0];
      this.rows = rows; this.cols = cols;
      this.color = PALETTE[(Math.random() * PALETTE.length) | 0];

      const lang = LANGS[(Math.random() * LANGS.length) | 0];
      const idx = (i, j) => i * cols + j;

      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const px = x + (i - (rows - 1) / 2) * STICK_SPACING;
          const py = y + (j - (cols - 1) / 2) * STICK_SPACING;
          this.points.push(new Point(px, py));
          this.chars.push(lang[(Math.random() * lang.length) | 0]);
          this.hover.push(HOVER_COLORS[(Math.random() * HOVER_COLORS.length) | 0]);
        }
      }
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const p = idx(i, j);
          if (j < cols - 1) this.sticks.push(new Stick(this.points[p], this.points[idx(i, j + 1)]));
          if (i < rows - 1) this.sticks.push(new Stick(this.points[p], this.points[idx(i + 1, j)]));
          if (i < rows - 1 && j < cols - 1) this.sticks.push(new Stick(this.points[p], this.points[idx(i + 1, j + 1)]));
          if (i > 0 && j < cols - 1) this.sticks.push(new Stick(this.points[p], this.points[idx(i - 1, j + 1)]));
        }
      }
    }
    update() {
      for (const p of this.points) p.update();
      for (const s of this.sticks) s.update();
    }
    draw() {
      // Sticks — faint connective tissue
      ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const s of this.sticks) {
        ctx.moveTo(s.p1.x, s.p1.y);
        ctx.lineTo(s.p2.x, s.p2.y);
      }
      ctx.stroke();

      // Letters — hover tint when cursor is near
      let currentFill = null;
      for (let i = 0; i < this.points.length; i++) {
        const p = this.points[i];
        const dx = p.x - mouseX, dy = p.y - mouseY;
        const fill = (dx * dx + dy * dy < hoverRSq) ? this.hover[i] : this.color;
        if (fill !== currentFill) { ctx.fillStyle = fill; currentFill = fill; }
        ctx.fillText(this.chars[i], p.x, p.y);
      }
    }
  }

  // --- Spatial-hash collision -----------------------------
  function resolvePair(a, b) {
    const dx = a.x - b.x, dy = a.y - b.y;
    const dSq = dx * dx + dy * dy;
    if (dSq === 0 || dSq >= MIN_DIST_SQ) return;
    const d = Math.sqrt(dSq);
    const push = (MIN_DIST - d) * 0.5;
    const nx = dx / d, ny = dy / d;
    a.x += nx * push; a.y += ny * push;
    b.x -= nx * push; b.y -= ny * push;
  }
  function resolveAllCollisions() {
    const hash = new Map();
    const all = [];
    let id = 0;
    for (const body of bodies) {
      for (const p of body.points) {
        p._id = id++;
        all.push(p);
        const cx = Math.floor(p.x / CELL_SIZE);
        const cy = Math.floor(p.y / CELL_SIZE);
        const key = (cx << 16) | (cy & 0xffff);
        let cell = hash.get(key);
        if (!cell) hash.set(key, (cell = []));
        cell.push(p);
      }
    }
    const offs = [-1, 0, 1];
    for (const p of all) {
      const cx = Math.floor(p.x / CELL_SIZE);
      const cy = Math.floor(p.y / CELL_SIZE);
      for (const ox of offs) {
        for (const oy of offs) {
          const key = ((cx + ox) << 16) | ((cy + oy) & 0xffff);
          const cell = hash.get(key);
          if (!cell) continue;
          for (const q of cell) {
            if (q._id <= p._id) continue;
            resolvePair(p, q);
          }
        }
      }
    }
    for (const p of all) delete p._id;
  }

  // --- Sizing ----------------------------------------------
  function fit() {
    const rect = stage.getBoundingClientRect();
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width  = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // Scale physics constants with canvas height
    POINT_RADIUS   = Math.max(7, Math.round(H / 28));
    STICK_SPACING  = POINT_RADIUS * 2;
    CELL_SIZE      = POINT_RADIUS * 2;
    MIN_DIST       = POINT_RADIUS * 2;
    MIN_DIST_SQ    = MIN_DIST * MIN_DIST;
    FONT_SIZE      = Math.round(POINT_RADIUS * 1.6);
    hoverR         = POINT_RADIUS * 3.2;
    hoverRSq       = hoverR * hoverR;

    floorY = H;       // invisible floor at the bottom edge
    bodies = [];
    frame = 0;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${FONT_SIZE}px ${GLYPH_FONT}`;
  }

  // --- Main loop ------------------------------------------
  function step() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    if (frame % SPAWN_INTERVAL === 0 && bodies.length < MAX_BODIES) {
      bodies.push(new Body(Math.random() * W, -H * 0.25));
    }

    for (const b of bodies) b.update();
    resolveAllCollisions();

    ctx.font = `${FONT_SIZE}px ${GLYPH_FONT}`;
    for (const b of bodies) b.draw();

    // Gentle FIFO eviction when pile caps out — oldest drops away
    if (bodies.length >= MAX_BODIES) {
      const oldest = bodies[0];
      if (oldest && oldest.points.every(p => p.floorTimer > 60)) bodies.shift();
    }

    frame++;
  }
  function loop() {
    if (!running) return;
    step();
    raf = requestAnimationFrame(loop);
  }
  function start() { if (!running) { running = true; loop(); } }
  function stop()  { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

  fit();
  let resizeT = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(fit, 120);
  });

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

  // --- Hover tinting --------------------------------------
  stage.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouseX = e.clientX - r.left;
    mouseY = e.clientY - r.top;
  });
  stage.addEventListener('mouseleave', () => {
    mouseX = mouseY = -1e4;
  });
  stage.addEventListener('touchmove', (e) => {
    if (!e.touches.length) return;
    const r = canvas.getBoundingClientRect();
    mouseX = e.touches[0].clientX - r.left;
    mouseY = e.touches[0].clientY - r.top;
  }, { passive: true });
  stage.addEventListener('touchend', () => {
    mouseX = mouseY = -1e4;
  });
})();
