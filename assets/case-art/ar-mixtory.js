// AR Mixtory — case card art
// Halftone-style dot rendering of a photograph (chinatown-inn). Hover lifts dots and tints them red.
// Targets: #arStage (container), #arCanvas (canvas), #arSize (label, optional), #arHint (hint, optional)
// Requires: window.CHINATOWN_IMAGE_B64 (preferred, from chinatown-inn.b64.js) OR assets/chinatown-inn.png
// Optional: #card-ar-mixtory (the card element, used for re-fit on visibility)

(function() {
  const TWEAKS = { density: 240, accent: 'black', reach: 88, lift: 40, contrast: 100 };
  const ACCENTS = { black: '#000000', sage: '#4a7c59', red: '#ff3b30' };

  const stage = document.getElementById('arStage');
  const cv    = document.getElementById('arCanvas');
  if (!stage || !cv) return;
  const ctx   = cv.getContext('2d');
  const hSize = document.getElementById('arSize');

  let DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  let W = 0, H = 0, cols = 0, rows = 0, cell = 0;
  let dots = [], img = null, sampleCanvas = null;
  const mouse = { x: -1e4, y: -1e4, hot: false };
  let raf = 0;

  function loadImage() {
    return new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      // Prefer inlined base64 (avoids file:// CORS issues with getImageData);
      // fall back to relative path if the base64 script didn't load.
      i.src = (typeof window.CHINATOWN_IMAGE_B64 === 'string' && window.CHINATOWN_IMAGE_B64)
        ? window.CHINATOWN_IMAGE_B64
        : 'assets/chinatown-inn.png';
    });
  }

  function fit() {
    const rect = stage.getBoundingClientRect();
    W = rect.width; H = rect.height;
    if (W < 2 || H < 2) return;
    cv.width  = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    cv.style.width  = W + 'px';
    cv.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    cols = Math.max(30, Math.round(TWEAKS.density));
    cell = W / cols;
    rows = Math.floor(H / cell);
    if (hSize) hSize.textContent = cols + ' × ' + rows;
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

    const lumBuf = new Float32Array(cols * rows);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4;
        lumBuf[y * cols + x] = (0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]) / 255;
      }
    }
    const k = 3 + (TWEAKS.contrast - 40) / 160 * 9;
    dots = new Array(cols * rows);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const idx = y * cols + x;
        const lum = lumBuf[idx];
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
    if (!W || !H) { raf = requestAnimationFrame(draw); return; }
    ctx.clearRect(0, 0, W, H);
    const baseColor = ACCENTS[TWEAKS.accent] || '#000';
    const hotColor = '#ff3b30';
    const reach = TWEAKS.reach;
    const liftMag = TWEAKS.lift / 100;
    const mx = mouse.x, my = mouse.y;
    const mouseActive = mouse.hot && mx > -1000;

    ctx.fillStyle = baseColor;
    for (let k = 0; k < dots.length; k++) {
      const d = dots[k];
      let r = d.r0;
      if (mouseActive) {
        const adx = Math.abs(d.cx - mx), ady = Math.abs(d.cy - my);
        if (adx < reach && ady < reach) continue;
      }
      if (r < 0.3) continue;
      r = Math.min(r, cell * 0.95);
      ctx.beginPath();
      ctx.arc(d.cx, d.cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (mouseActive) {
      ctx.fillStyle = hotColor;
      for (let k = 0; k < dots.length; k++) {
        const d = dots[k];
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

  stage.addEventListener('pointermove', (e) => {
    const rect = stage.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.hot = true;
    const hint = document.getElementById('arHint');
    if (hint) hint.style.opacity = '0';
  });
  stage.addEventListener('pointerleave', () => {
    mouse.hot = false; mouse.x = -1e4; mouse.y = -1e4;
    const hint = document.getElementById('arHint');
    if (hint) hint.style.opacity = '';
  });

  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(fit, 80); });

  // Boot
  (async function boot() {
    try {
      img = await loadImage();
    } catch (e) {
      console.error('AR Mixtory card: failed to load chinatown-inn.png', e);
      return;
    }
    const boot2 = () => {
      fit();
      raf = requestAnimationFrame(draw);
      // Re-fit a few times to catch late layout shifts (fonts, scroll reveals)
      setTimeout(fit, 120);
      setTimeout(fit, 400);
      setTimeout(fit, 1000);
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(boot2).catch(boot2);
    else boot2();

    // Re-fit when the card becomes visible (IntersectionObserver)
    const card = document.getElementById('card-ar-mixtory');
    if (card && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) fit(); });
      }, { threshold: 0.1 });
      io.observe(card);
    }
  })();
})();
