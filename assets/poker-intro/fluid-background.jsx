// FluidBackground — animated ASCII dot field with flowing noise.
// Renders to a <canvas> for performance; characters are drawn pixel-by-pixel
// in a fixed monospace grid. Uses simplex-style smooth noise to drive density.
// White/light dots on the dark/cream background; here used as cream-on-dark
// or dark-on-cream depending on `invert`.

const FLUID_CHARS = ' ·.:;+*o#@'; // sparse → dense

// Simple value-noise implementation (3D: x, y, t).
function makeNoise() {
  const PERM_SIZE = 256;
  const perm = new Uint8Array(PERM_SIZE * 2);
  const rand = (() => { let s = 1337; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; })();
  const p = new Uint8Array(PERM_SIZE);
  for (let i = 0; i < PERM_SIZE; i++) p[i] = i;
  // shuffle
  for (let i = PERM_SIZE - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
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

function FluidBackground({ color = 'rgba(20,18,12,0.45)', cell = 12, speed = 0.00018 }) {
  const canvasRef = React.useRef(null);
  const rafRef = React.useRef(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let dpr = Math.min(2, window.devicePixelRatio || 1);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const fontSize = cell;
    const draw = (t) => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.font = `${fontSize * dpr}px "JetBrains Mono", ui-monospace, monospace`;
      ctx.textBaseline = 'top';
      ctx.fillStyle = color;
      const cw = cell * dpr;
      const cols = Math.ceil(W / cw);
      const rows = Math.ceil(H / cw);
      const tt = t * speed;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // domain-warped noise: feed noise into noise so the field swirls like fluid
          const nx = c * 0.05;
          const ny = r * 0.05;
          const wx = noise3d(nx + 100, ny, tt) * 1.6;
          const wy = noise3d(nx, ny + 100, tt) * 1.6;
          const v = noise3d(nx + wx, ny + wy, tt * 0.7);
          // map -1..1 -> 0..1 with bias toward sparse (so most cells are dots)
          let d = (v + 1) * 0.5;
          d = Math.pow(d, 1.6);
          const idx = Math.min(FLUID_CHARS.length - 1, Math.max(0, Math.floor(d * FLUID_CHARS.length)));
          const ch = FLUID_CHARS[idx];
          if (ch === ' ') continue;
          ctx.fillText(ch, c * cw, r * cw);
        }
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [color, cell, speed]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  );
}

window.FluidBackground = FluidBackground;
