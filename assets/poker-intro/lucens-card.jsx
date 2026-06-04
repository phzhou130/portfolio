// LucensCard — math glyphs floating in fake 3D, mounted as the front face
// of an individual poker card. Ported from lucens-mathsolver.js so each
// instance can run inside its own React lifecycle (mount/unmount on flip).

const LUCENS_CHARS = Array.from(
  '+−×÷=±≠≈∑∏∫∮∂∇∞√∛∈∉⊂⊆∪∩∧∨∀∃∅⊥∝ℝℕℤℚℂ' +
  'αβγδεζηθικλμνξπρστυφχψωΔΣΠΩΦΨΘΛ' +
  '∠△∴∵⇒⇔→←↔' +
  '0123456789'
);
const LUCENS_FONT = '"STIX Two Math","Cambria Math","Latin Modern Math","Times New Roman","Noto Serif",serif';

function LucensCard({ w, h }) {
  const stageRef = React.useRef(null);
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const ctx = canvas.getContext('2d');

    const NUM = 90;
    const FOCAL = 1000;
    let DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    let W = 0, Hh = 0;
    let rects = [];
    let frame = 0;
    let raf = 0, running = false;
    let mouseX = -9999, mouseY = -9999;
    const HOVER_R2 = 28 * 28;

    const rand = (a, b) => a + Math.random() * (b - a);

    function initRects() {
      rects = new Array(NUM);
      for (let i = 0; i < NUM; i++) {
        rects[i] = {
          x:    rand(-W * 0.9, W * 1.2),
          y:    rand(-Hh * 1.0, Hh * 1.0),
          z:    rand(-1800, 100),
          rot0: rand(0, Math.PI * 2),
          vRot: rand(-0.02, 0.02),
          sz:   rand(10, 26),
          char: LUCENS_CHARS[(Math.random() * LUCENS_CHARS.length) | 0],
        };
      }
    }

    function fit() {
      // Use offsetWidth/offsetHeight (layout box, ignores transforms) instead of
      // getBoundingClientRect which would return scaled dimensions during the
      // flip animation. Fall back to the prop-supplied w/h when offset is 0.
      W = stage.offsetWidth || w || 1;
      Hh = stage.offsetHeight || h || 1;
      canvas.width  = Math.round(W * DPR);
      canvas.height = Math.round(Hh * DPR);
      canvas.style.width  = W + 'px';
      canvas.style.height = Hh + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, W, Hh);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      initRects();
      frame = 0;
    }

    function step() {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, W, Hh);

      const sway = Math.sin(frame * 0.01) * 0.2;
      const sinS = Math.sin(sway), cosS = Math.cos(sway);
      const cx = W / 2, cy = Hh / 2;

      for (let i = 0; i < NUM; i++) {
        const r = rects[i];
        const xR = r.x * cosS + r.z * sinS;
        const zR = -r.x * sinS + r.z * cosS;
        const denom = FOCAL - zR;
        if (denom < 50) continue;
        const scale = FOCAL / denom;
        const sx = cx + xR * scale;
        const sy = cy + r.y * scale;
        if (sx < -60 || sx > W + 60 || sy < -60 || sy > Hh + 60) continue;
        const normZ = (zR + 1800) / 1900;
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
        ctx.font = `${size}px ${LUCENS_FONT}`;
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
    start();

    // ResizeObserver — refit when the card's actual size changes (flip animation
    // sets scaleX which can change the rendered width during animation, and the
    // initial measurement may happen mid-flip when the rect is near-zero).
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
    const onLeave = () => { mouseX = -9999; mouseY = -9999; };
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
    <div
      ref={stageRef}
      style={{
        position: 'absolute', inset: 0,
        background: '#ffffff',
        overflow: 'hidden',
        pointerEvents: 'auto',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  );
}

window.LucensCard = LucensCard;
