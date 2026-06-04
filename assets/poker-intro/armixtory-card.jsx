// ArMixtoryCard — halftone dot rendering of the real chinatown-inn photo.
// Uses the same image-sampled halftone as the AR Mixtory case card so the
// poker Q card matches the case-card visual exactly.
// Reads the inlined base64 image from window.CHINATOWN_IMAGE_B64 if present
// (loaded by assets/chinatown-inn.b64.js earlier in the page), otherwise
// falls back to the .png on disk.

function ArMixtoryCard({ w, h }) {
  const stageRef = React.useRef(null);
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    const stage = stageRef.current;
    const cv = canvasRef.current;
    if (!stage || !cv) return;
    const ctx = cv.getContext('2d');

    const TWEAKS = { density: 90, reach: 60, lift: 40, contrast: 100 };
    const ACCENT = '#000000';
    const HOT = '#ff3b30';

    let DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    let W = 0, H = 0, cols = 0, rows = 0, cell = 0;
    let dots = [];
    let img = null;
    let sampleCanvas = null;
    const mouse = { x: -1e4, y: -1e4, hot: false };
    let raf = 0;
    let cancelled = false;

    function loadImage() {
      return new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = (typeof window.CHINATOWN_IMAGE_B64 === 'string' && window.CHINATOWN_IMAGE_B64)
          ? window.CHINATOWN_IMAGE_B64
          : 'assets/chinatown-inn.png';
      });
    }

    function fit() {
      W = stage.offsetWidth || w || 1;
      H = stage.offsetHeight || h || 1;
      cv.width = Math.round(W * DPR);
      cv.height = Math.round(H * DPR);
      cv.style.width = W + 'px';
      cv.style.height = H + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      cols = Math.max(30, Math.round(TWEAKS.density));
      cell = W / cols;
      rows = Math.max(2, Math.floor(H / cell));
      sampleAndBuildDots();
    }

    function sampleAndBuildDots() {
      if (!img || cols < 2 || rows < 2) return;
      const srcW = img.naturalWidth, srcH = img.naturalHeight;
      const targetAR = cols / rows;
      const srcAR = srcW / srcH;
      let cropW, cropH, cropX, cropY;
      if (targetAR > srcAR) {
        cropW = srcW; cropH = srcW / targetAR;
        cropX = 0; cropY = (srcH - cropH) * 0.15;
      } else {
        cropH = srcH; cropW = srcH * targetAR;
        cropX = (srcW - cropW) / 2; cropY = 0;
      }
      if (!sampleCanvas) sampleCanvas = document.createElement('canvas');
      sampleCanvas.width = cols;
      sampleCanvas.height = rows;
      const sctx = sampleCanvas.getContext('2d', { willReadFrequently: true });
      sctx.imageSmoothingEnabled = true;
      sctx.imageSmoothingQuality = 'high';
      sctx.clearRect(0, 0, cols, rows);
      sctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cols, rows);
      const data = sctx.getImageData(0, 0, cols, rows).data;

      const k = 3 + (TWEAKS.contrast - 40) / 160 * 9;
      dots = new Array(cols * rows);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const idx = y * cols + x;
          const i4 = idx * 4;
          const lum = (0.299 * data[i4] + 0.587 * data[i4 + 1] + 0.114 * data[i4 + 2]) / 255;
          const dark = 1 - lum;
          const mapped = 1 / (1 + Math.exp(-k * (dark - 0.5)));
          const cx = (x + 0.5) * cell;
          const cy = (y + 0.5) * cell;
          const rMax = cell * 0.54;
          dots[idx] = { cx, cy, r0: mapped * rMax };
        }
      }
    }

    function draw() {
      if (cancelled) return;
      if (!W || !H) { raf = requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, W, H);
      const reach = TWEAKS.reach;
      const liftMag = TWEAKS.lift / 100;
      const mx = mouse.x, my = mouse.y;
      const mouseActive = mouse.hot && mx > -1000;

      ctx.fillStyle = ACCENT;
      for (let kk = 0; kk < dots.length; kk++) {
        const d = dots[kk];
        if (mouseActive) {
          const adx = Math.abs(d.cx - mx), ady = Math.abs(d.cy - my);
          if (adx < reach && ady < reach) continue;
        }
        let r = d.r0;
        if (r < 0.3) continue;
        r = Math.min(r, cell * 0.95);
        ctx.beginPath();
        ctx.arc(d.cx, d.cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (mouseActive) {
        ctx.fillStyle = HOT;
        for (let kk = 0; kk < dots.length; kk++) {
          const d = dots[kk];
          const adx = Math.abs(d.cx - mx), ady = Math.abs(d.cy - my);
          if (adx >= reach || ady >= reach) continue;
          const cheb = Math.max(adx, ady);
          const t = 1 - cheb / reach;
          const tt = t * t * (3 - 2 * t);
          const scale = 1 + tt * 1.0 * liftMag;
          let r = d.r0 * scale;
          const floor = tt * cell * 0.18 * liftMag;
          r = Math.max(r, floor);
          if (r < 0.3) continue;
          r = Math.min(r, cell * 0.95);
          ctx.beginPath();
          ctx.arc(d.cx, d.cy, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(draw);
    }

    // Boot — load the photo, then size + draw. If the image fails, leave the
    // canvas blank rather than falling back to a procedural pattern (so it's
    // obvious the asset is missing instead of showing an unrelated visual).
    loadImage().then((loaded) => {
      if (cancelled) return;
      img = loaded;
      fit();
      raf = requestAnimationFrame(draw);
    }).catch((err) => {
      console.warn('ArMixtoryCard: failed to load chinatown-inn image', err);
    });

    const ro = new ResizeObserver(() => { if (img) fit(); });
    ro.observe(stage);

    const onMove = (e) => {
      const r = stage.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.hot = true;
    };
    const onLeave = () => { mouse.hot = false; mouse.x = -1e4; mouse.y = -1e4; };
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerleave', onLeave);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div ref={stageRef} style={{ position: 'absolute', inset: 0, background: '#ffffff', overflow: 'hidden', pointerEvents: 'auto' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}

window.ArMixtoryCard = ArMixtoryCard;
