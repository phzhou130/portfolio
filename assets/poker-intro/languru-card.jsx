// LanguruCard — Verlet-physics blobs of multilingual letters falling and piling up.
// React-mountable port of languru.js, scoped to a single card front face.

const LANGURU_LANGS = [
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
  'กขคงจฉชซญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสห',
];
const LANGURU_FONT = '"Inter","Helvetica Neue","Hiragino Sans","Noto Sans CJK SC","Noto Sans","Arial Unicode MS",sans-serif';
const LANGURU_PALETTE = ['#0a0a0a', '#1a1a1a', '#333333', '#4a4a4a', '#616161', '#4a7c59', '#0a0a0a', '#333333'];
const LANGURU_HOVER = ['#FEDE65', '#9D94FF', '#587BF3'];
const LANGURU_GRIDS = [[4,4], [2,7], [3,4], [5,3], [2,6], [6,2], [1,10]];

function LanguruCard({ w, h }) {
  const stageRef = React.useRef(null);
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const ctx = canvas.getContext('2d');

    const GRAVITY = 0.1;
    const FLOOR_STOP_TIME = 10;
    const WALL_BOUNCE_DAMPING = 0.8;
    const MAX_BODIES = 8; // smaller card, fewer blobs
    const SPAWN_INTERVAL = 26;

    let DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    let W = 0, Hh = 0, floorY = 0;
    let POINT_RADIUS = 8;
    let STICK_SPACING = POINT_RADIUS * 2;
    let CELL_SIZE = POINT_RADIUS * 2;
    let MIN_DIST = POINT_RADIUS * 2;
    let MIN_DIST_SQ = MIN_DIST * MIN_DIST;
    let FONT_SIZE = 13;
    let bodies = [];
    let frame = 0;
    let raf = 0, running = false;
    let mouseX = -1e4, mouseY = -1e4;
    let hoverR = 30, hoverRSq = hoverR * hoverR;

    class Point {
      constructor(x, y) { this.x = x; this.y = y; this.prevX = x; this.prevY = y; this.floorTimer = 0; }
      update() {
        const vX = this.x - this.prevX;
        const vY = this.y - this.prevY;
        this.prevX = this.x; this.prevY = this.y;
        this.x += vX;
        this.y += vY + GRAVITY;
        if (this.y > floorY) {
          this.floorTimer++;
          if (this.floorTimer <= FLOOR_STOP_TIME) { this.y = floorY; this.prevY = this.y; }
        }
        if (this.x < POINT_RADIUS) { this.x = POINT_RADIUS; this.prevX = this.x + vX * WALL_BOUNCE_DAMPING; }
        else if (this.x > W - POINT_RADIUS) { this.x = W - POINT_RADIUS; this.prevX = this.x + vX * WALL_BOUNCE_DAMPING; }
      }
    }
    class Stick {
      constructor(p1, p2) {
        this.p1 = p1; this.p2 = p2;
        const dx = p1.x - p2.x, dy = p1.y - p2.y;
        this.length = Math.sqrt(dx * dx + dy * dy);
      }
      update() {
        const dx = this.p1.x - this.p2.x, dy = this.p1.y - this.p2.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d === 0) return;
        const diff = (d - this.length) / d;
        const ox = dx * diff * 0.5, oy = dy * diff * 0.5;
        this.p1.x -= ox; this.p1.y -= oy;
        this.p2.x += ox; this.p2.y += oy;
      }
    }
    class Body {
      constructor(x, y) {
        this.points = []; this.sticks = []; this.chars = []; this.hover = [];
        const [rows, cols] = LANGURU_GRIDS[(Math.random() * LANGURU_GRIDS.length) | 0];
        this.rows = rows; this.cols = cols;
        this.color = LANGURU_PALETTE[(Math.random() * LANGURU_PALETTE.length) | 0];
        const lang = LANGURU_LANGS[(Math.random() * LANGURU_LANGS.length) | 0];
        const idx = (i, j) => i * cols + j;
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            const px = x + (i - (rows - 1) / 2) * STICK_SPACING;
            const py = y + (j - (cols - 1) / 2) * STICK_SPACING;
            this.points.push(new Point(px, py));
            this.chars.push(lang[(Math.random() * lang.length) | 0]);
            this.hover.push(LANGURU_HOVER[(Math.random() * LANGURU_HOVER.length) | 0]);
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
      update() { for (const p of this.points) p.update(); for (const s of this.sticks) s.update(); }
      draw() {
        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (const s of this.sticks) { ctx.moveTo(s.p1.x, s.p1.y); ctx.lineTo(s.p2.x, s.p2.y); }
        ctx.stroke();
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

    function fit() {
      W = stage.offsetWidth || w || 1;
      Hh = stage.offsetHeight || h || 1;
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(Hh * DPR);
      canvas.style.width = W + 'px';
      canvas.style.height = Hh + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, Hh);
      POINT_RADIUS  = Math.max(6, Math.round(Hh / 32));
      STICK_SPACING = POINT_RADIUS * 2;
      CELL_SIZE     = POINT_RADIUS * 2;
      MIN_DIST      = POINT_RADIUS * 2;
      MIN_DIST_SQ   = MIN_DIST * MIN_DIST;
      FONT_SIZE     = Math.round(POINT_RADIUS * 1.6);
      hoverR        = POINT_RADIUS * 3.2;
      hoverRSq      = hoverR * hoverR;
      floorY = Hh;
      bodies = [];
      frame = 0;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `${FONT_SIZE}px ${LANGURU_FONT}`;
    }

    function step() {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, Hh);
      if (frame % SPAWN_INTERVAL === 0 && bodies.length < MAX_BODIES) {
        bodies.push(new Body(Math.random() * W, -Hh * 0.25));
      }
      for (const b of bodies) b.update();
      resolveAllCollisions();
      ctx.font = `${FONT_SIZE}px ${LANGURU_FONT}`;
      for (const b of bodies) b.draw();
      if (bodies.length >= MAX_BODIES) {
        const oldest = bodies[0];
        if (oldest && oldest.points.every(p => p.floorTimer > 60)) bodies.shift();
      }
      frame++;
    }
    function loop() { if (!running) return; step(); raf = requestAnimationFrame(loop); }
    function start() { if (!running) { running = true; loop(); } }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

    fit();
    start();

    const ro = new ResizeObserver(() => fit());
    ro.observe(stage);

    let rt = 0;
    const onResize = () => { clearTimeout(rt); rt = setTimeout(fit, 120); };
    window.addEventListener('resize', onResize);

    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      mouseX = e.clientX - r.left;
      mouseY = e.clientY - r.top;
    };
    const onLeave = () => { mouseX = mouseY = -1e4; };
    stage.addEventListener('mousemove', onMove);
    stage.addEventListener('mouseleave', onLeave);

    const onVis = () => { if (document.hidden) stop(); else start(); };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      stop();
      ro.disconnect();
      window.removeEventListener('resize', onResize);
      stage.removeEventListener('mousemove', onMove);
      stage.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <div ref={stageRef} style={{ position: 'absolute', inset: 0, background: '#ffffff', overflow: 'hidden', pointerEvents: 'auto' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}

window.LanguruCard = LanguruCard;
