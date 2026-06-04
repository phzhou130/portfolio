// PokerCard — ASCII-art rendered playing card.
// All rank letters, suit pips, and the central silhouette are composed of
// monospace characters. Light gray ink on cream paper. Bold minimalist.

const ASCII_CHARS = '01ABCDEFXY#$%&*+=-:.';
const DENSE_CHARS = '8B#WMR%&$0OQDGHN';
const LIGHT_CHARS = '.:,;\'`~^"';

function pickChar(density, seedI) {
  if (density <= 0) return ' ';
  if (density < 0.18) return LIGHT_CHARS[seedI % LIGHT_CHARS.length];
  if (density < 0.55) return ASCII_CHARS[seedI % ASCII_CHARS.length];
  return DENSE_CHARS[seedI % DENSE_CHARS.length];
}

// Spade silhouette — returns true if (u,v) in [0..1]^2 is inside the spade.
function spadeMask(u, v) {
  const cx = 0.5;
  const lobeR = 0.24;
  const lcx = cx - 0.17, lcy = 0.36;
  const rcx = cx + 0.17, rcy = 0.36;
  if (Math.hypot(u - lcx, v - lcy) < lobeR) return true;
  if (Math.hypot(u - rcx, v - rcy) < lobeR) return true;
  // bottom triangle
  const apexY = 0.80;
  const baseY = 0.34;
  if (v >= baseY && v <= apexY) {
    const k = (apexY - v) / (apexY - baseY);
    if (Math.abs(u - cx) < 0.34 * k) return true;
  }
  // base/stem
  if (v >= 0.78 && v <= 0.93) {
    const k = (v - 0.78) / 0.15;
    if (Math.abs(u - cx) < 0.06 + k * 0.12) return true;
  }
  return false;
}

// Bold 5x7 bitmap font for rank glyphs.
const GLYPHS = {
  'A': [
    '.███.',
    '██.██',
    '█...█',
    '█████',
    '█████',
    '█...█',
    '█...█',
  ],
  'K': [
    '█..██',
    '█.██.',
    '██...',
    '███..',
    '██...',
    '█.██.',
    '█..██',
  ],
  'Q': [
    '.███.',
    '██.██',
    '█...█',
    '█...█',
    '█.█.█',
    '██.██',
    '.████',
  ],
  'J': [
    '..███',
    '...██',
    '...██',
    '...██',
    '...██',
    '██.██',
    '.███.',
  ],
  '1': [
    '.██..',
    '███..',
    '.██..',
    '.██..',
    '.██..',
    '.██..',
    '████.',
  ],
  '0': [
    '.███.',
    '██.██',
    '█...█',
    '█...█',
    '█...█',
    '██.██',
    '.███.',
  ],
};

function glyphMask(ch, u, v) {
  const g = GLYPHS[ch];
  if (!g) return false;
  const rows = g.length;
  const cols = g[0].length;
  const r = Math.floor(v * rows);
  const c = Math.floor(u * cols);
  if (r < 0 || r >= rows || c < 0 || c >= cols) return false;
  return g[r][c] === '█';
}

// Check if a rank glyph mark is at (u,v) within a sub-box [u0,u1]x[v0,v1].
function rankAt(rank, u, v, u0, u1, v0, v1) {
  if (u < u0 || u > u1 || v < v0 || v > v1) return false;
  const gu = (u - u0) / (u1 - u0);
  const gv = (v - v0) / (v1 - v0);
  if (rank === '10') {
    if (gu < 0.45) return glyphMask('1', gu / 0.45, gv);
    if (gu > 0.55) return glyphMask('0', (gu - 0.55) / 0.45, gv);
    return false;
  }
  return glyphMask(rank, gu, gv);
}

function buildCardAscii(rank, cols, rows) {
  const lines = [];
  const isAce = rank === 'A';

  // Center spade
  const C_SPADE = [0.18, 0.82, 0.18, 0.84];
  // Center rank cut-out (overlay) — wider and taller for legibility
  const C_RANK = [0.32, 0.68, 0.36, 0.64];

  for (let r = 0; r < rows; r++) {
    let line = '';
    for (let c = 0; c < cols; c++) {
      const u = c / (cols - 1);
      const v = r / (rows - 1);

      let mark = false;
      let density = 0;
      let cutOut = false; // if true, force this cell to NOT be marked (creates negative space)

      // Center spade silhouette
      if (u >= C_SPADE[0] && u <= C_SPADE[1] && v >= C_SPADE[2] && v <= C_SPADE[3]) {
        const su = (u - C_SPADE[0]) / (C_SPADE[1] - C_SPADE[0]);
        const sv = (v - C_SPADE[2]) / (C_SPADE[3] - C_SPADE[2]);
        if (spadeMask(su, sv)) {
          mark = true;
          const dx = su - 0.5, dy = sv - 0.5;
          density = Math.max(density, 0.55 - Math.hypot(dx, dy) * 0.35);
        }
      }

      // Center rank cut-out: punch out the rank from inside the spade
      if (!isAce && rankAt(rank, u, v, ...C_RANK)) {
        cutOut = true;
      }

      // Add a halo of empty space around the cut-out rank for contrast
      if (!isAce) {
        const haloPad = 0.02;
        if (rankAt(rank, u, v, C_RANK[0]-haloPad, C_RANK[1]+haloPad, C_RANK[2]-haloPad, C_RANK[3]+haloPad)
            && !rankAt(rank, u, v, ...C_RANK)) {
          // It's in the halo zone but not the glyph itself — clear if marked by spade
          if (mark) cutOut = true;
        }
      }

      // Border dots
      if ((r === 0 || r === rows - 1 || c === 0 || c === cols - 1)) {
        if ((c + r) % 2 === 0) { mark = true; density = Math.max(density, 0.25); }
      }

      if (cutOut) {
        // Negative space — leave a small dot/sparkle so it's clearly carved out
        line += ' ';
      } else if (mark) {
        const noise = Math.sin(c * 7.13 + r * 3.91) * 0.5 + 0.5;
        const d = Math.min(1, density + 0.30 + noise * 0.20);
        line += pickChar(d, c + r * 3);
      } else {
        const bgNoise = Math.sin(c * 2.1 + r * 5.7) * Math.sin(c * 0.7 - r * 0.3);
        line += bgNoise > 0.96 ? '.' : ' ';
      }
    }
    lines.push(line);
  }
  return lines.join('\n');
}

const _asciiCache = new Map();
function getAscii(rank, cols, rows) {
  const k = `${rank}|${cols}|${rows}`;
  if (!_asciiCache.has(k)) _asciiCache.set(k, buildCardAscii(rank, cols, rows));
  return _asciiCache.get(k);
}

// Shared video pool — ONE off-screen <video> drives all card backs via
// canvas drawImage on each animation frame. Browsers will not start 25+
// concurrent <video>s reliably, so we render the single playing source
// to as many <canvas>es as we need.
const _sharedVideoState = {
  video: null,
  canvases: new Set(),
  rafId: null,
};

function ensureSharedVideo() {
  if (_sharedVideoState.video) return _sharedVideoState.video;
  const v = document.createElement('video');
  v.src = 'assets/poker-intro/cardBack.mp4?v=2';
  v.muted = true;
  v.loop = true;
  v.playsInline = true;
  v.autoplay = true;
  v.setAttribute('muted', '');
  v.setAttribute('playsinline', '');
  v.style.position = 'fixed';
  v.style.left = '-9999px';
  v.style.width = '2px';
  v.style.height = '2px';
  v.style.opacity = '0';
  v.style.pointerEvents = 'none';
  document.body.appendChild(v);
  const tryPlay = () => v.play().catch(() => {});
  tryPlay();
  // Autoplay-policy fallback — if the browser blocks muted autoplay, retry the
  // moment the user moves/touches the page. Also retry every <video> in the
  // document so rank-card videos pick up too.
  const unlockAll = () => {
    tryPlay();
    document.querySelectorAll('video').forEach((vv) => { vv.play().catch(() => {}); });
    document.removeEventListener('pointerdown', unlockAll);
    document.removeEventListener('pointermove', unlockAll);
    document.removeEventListener('keydown', unlockAll);
    document.removeEventListener('touchstart', unlockAll);
  };
  document.addEventListener('pointerdown', unlockAll, { once: true });
  document.addEventListener('pointermove', unlockAll, { once: true });
  document.addEventListener('keydown', unlockAll, { once: true });
  document.addEventListener('touchstart', unlockAll, { once: true, passive: true });
  _sharedVideoState.video = v;

  const tick = () => {
    const vid = _sharedVideoState.video;
    if (vid && vid.readyState >= 2 && vid.videoWidth) {
      _sharedVideoState.canvases.forEach((cv) => {
        const ctx = cv.getContext('2d');
        if (!ctx) return;
        if (cv.width !== cv.clientWidth * 2) cv.width = cv.clientWidth * 2;
        if (cv.height !== cv.clientHeight * 2) cv.height = cv.clientHeight * 2;
        // cover-style draw
        const cw = cv.width, ch = cv.height;
        const vw = vid.videoWidth, vh = vid.videoHeight;
        const scale = Math.max(cw / vw, ch / vh);
        const dw = vw * scale, dh = vh * scale;
        const dx = (cw - dw) / 2, dy = (ch - dh) / 2;
        ctx.drawImage(vid, dx, dy, dw, dh);
      });
    }
    _sharedVideoState.rafId = requestAnimationFrame(tick);
  };
  _sharedVideoState.rafId = requestAnimationFrame(tick);
  return v;
}

function SharedBackVideo() {
  const ref = React.useRef(null);
  React.useEffect(() => {
    ensureSharedVideo();
    const cv = ref.current;
    if (!cv) return;
    _sharedVideoState.canvases.add(cv);
    return () => { _sharedVideoState.canvases.delete(cv); };
  }, []);
  return (
    <canvas
      ref={ref}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        display: 'block',
        pointerEvents: 'none',
        filter: 'contrast(1.35) saturate(1.15) brightness(0.92)',
      }}
    />
  );
}

function PokerCard({ rank = 'A', face = true, w = 180, h = 260, style = {}, cheap = false }) {
  // Higher-resolution grid for legible glyphs
  const cols = Math.max(36, Math.round(w / 4.2));
  const rows = Math.max(54, Math.round(h / 4.2));

  const fontSize = (w / cols) * 1.18;

  // Special case for K: keep the Languru animation mounted even when showing
  // the back, so when the user finally flips the card the letters are already
  // mid-stream. The back video is layered on top to cover it.
  if (rank === 'K' && !cheap) {
    const RANK_VIDEOS_K = 'assets/poker-intro/K_poker.mp4?v=3';
    return (
      <div style={{
        width: w, height: h,
        background: '#ffffff',
        borderRadius: w * 0.05,
        boxSizing: 'border-box',
        overflow: 'hidden',
        userSelect: 'none',
        position: 'relative',
        ...style,
      }}>
        {/* Always-running Languru bottom layer */}
        <LanguruCard w={w} h={h} />
        {/* Transparent K video on top of the languru animation (front face) */}
        <video
          src={RANK_VIDEOS_K}
          autoPlay loop muted playsInline
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            display: 'block',
            pointerEvents: 'none',
            mixBlendMode: 'multiply',
          }}
        />
        {/* Back video on top — covers everything when showing back */}
        {!face && (
          <div style={{ position: 'absolute', inset: 0 }}>
            <SharedBackVideo />
          </div>
        )}
      </div>
    );
  }

  if (!face || cheap) {
    return (
      <div style={{
        width: w, height: h,
        background: '#ffffff',
        borderRadius: w * 0.05,
        boxSizing: 'border-box',
        overflow: 'hidden',
        userSelect: 'none',
        position: 'relative',
        ...style,
      }}>
        <SharedBackVideo />
      </div>
    );
  }

  const ascii = getAscii(rank, cols, rows);

  // Corner-index text overlays — large bold monospace for legibility
  const cornerSize = w * 0.18;
  const cornerSuitSize = w * 0.12;
  const cornerStyle = {
    position: 'absolute',
    fontFamily: '"JetBrains Mono", ui-monospace, monospace',
    fontWeight: 800,
    color: '#1a1612',
    lineHeight: 0.9,
    letterSpacing: '-0.05em',
    pointerEvents: 'none',
  };

  const RANK_VIDEOS = {
    '10': 'assets/poker-intro/10_Poker.mp4?v=4',
    'J': 'assets/poker-intro/J_poker.mp4?v=3',
    'Q': 'assets/poker-intro/Q_Poker.mp4?v=3',
    'K': 'assets/poker-intro/K_poker.mp4?v=3',
    'A': 'assets/poker-intro/A_poker.mp4?v=3',
  };
  const videoSrc = RANK_VIDEOS[rank];

  return (
    <div style={{
      width: w, height: h,
      background: '#ffffff',
      color: '#2a261c',
      borderRadius: w * 0.05,
      boxSizing: 'border-box',
      overflow: 'hidden',
      userSelect: 'none',
      position: 'relative',
      ...style,
    }}>
      {rank === 'A' ? (
        <React.Fragment>
          {/* Bottom layer: math glyph animation */}
          <LucensCard w={w} h={h} />
          {/* Top layer: transparent Ace video */}
          {videoSrc && (
            <video
              src={videoSrc}
              autoPlay
              loop
              muted
              playsInline
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover',
                display: 'block',
                pointerEvents: 'none',
                mixBlendMode: 'multiply',
              }}
            />
          )}
        </React.Fragment>
      ) : rank === 'K' ? (
        <React.Fragment>
          {/* Bottom layer: Languru falling-letters animation */}
          <LanguruCard w={w} h={h} />
          {/* Top layer: transparent King video */}
          {videoSrc && (
            <video
              src={videoSrc}
              autoPlay
              loop
              muted
              playsInline
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover',
                display: 'block',
                pointerEvents: 'none',
                mixBlendMode: 'multiply',
              }}
            />
          )}
        </React.Fragment>
      ) : rank === 'Q' ? (
        <React.Fragment>
          <ArMixtoryCard w={w} h={h} />
          {videoSrc && (
            <video
              src={videoSrc}
              autoPlay loop muted playsInline
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover',
                display: 'block',
                pointerEvents: 'none',
                mixBlendMode: 'multiply',
              }}
            />
          )}
        </React.Fragment>
      ) : rank === 'J' ? (
        <React.Fragment>
          <KidGrowthCard w={w} h={h} />
          {videoSrc && (
            <video
              src={videoSrc}
              autoPlay loop muted playsInline
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover',
                display: 'block',
                pointerEvents: 'none',
                mixBlendMode: 'multiply',
              }}
            />
          )}
        </React.Fragment>
      ) : rank === '10' ? (
        <React.Fragment>
          <TencentGameLoopCard w={w} h={h} />
          {videoSrc && (
            <video
              src={videoSrc}
              autoPlay loop muted playsInline
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover',
                display: 'block',
                pointerEvents: 'none',
                mixBlendMode: 'multiply',
              }}
            />
          )}
        </React.Fragment>
      ) : videoSrc ? (
        <video
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            display: 'block',
            pointerEvents: 'none',
          }}
        />
      ) : (
        <pre style={{
          margin: 0, padding: 0,
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize, lineHeight: 1, letterSpacing: 0,
          whiteSpace: 'pre', color: 'inherit',
          width: '100%', height: '100%',
          textAlign: 'left',
        }}>{ascii}</pre>
      )}
    </div>
  );
}

window.PokerCard = PokerCard;
