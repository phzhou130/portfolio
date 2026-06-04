// TencentGameLoopCard — pixel-art sprite grid with idle bob + CRT scanlines.
// Click to shuffle.

const TENCENT_PAL = {
  '.': null,
  K: '#12121e', W: '#ffffff', S: '#c6c6d0', s: '#5c5c68',
  C: '#b4e0f5', b: '#204870', Y: '#f5c842', y: '#c58f1c',
  X: '#a56a2e', x: '#603d1b', R: '#e84a3a', r: '#a82620',
  O: '#ff8a22', G: '#6ae65a', L: '#c8fff0',
};

const TENCENT_SPR = {
  sword: ['...........K','..........KC','.........KCb','........KCbK','.......KCbK.','......KCbK..','.....KCbK...','....KCbK....','..KKYYKK....','.KYYYYYYK...','..KXxxXK....','...KKKK.....'],
  potion: ['............','....KKKK....','....KxxK....','...KKKKKK...','...KS..SK...','..K.W....K..','..KRRRRRRK..','..KRrrrrRK..','..KRRRRRRK..','..KKrrrrKK..','...KKKKKK...','............'],
  chest: ['............','............','.KKKKKKKKKK.','.KXxxxxxxXK.','.KXYYYYYYXK.','.KKKKKKKKKK.','.KxxKYYKxxK.','.KxxKYYKxxK.','.KxxxxxxxxK.','.KXYYYYYYXK.','.KKKKKKKKKK.','............'],
  gamepad: ['............','............','............','..KKKKKKKK..','.KSSSSSSSSK.','KSsKsSSSGsRK','KSKKKSSSsRsK','KSsKsSSSGsRK','.KSSSSSSSSK.','..KKKKKKKK..','............','............'],
  coin: ['............','...KKKKKK...','..KYYYYYYK..','.KYyyyyyyYK.','.KYyKKKKyYK.','.KYyKyyyyyK.','.KYyKyyyyyK.','.KYyKKKKyYK.','.KYyyyyyyYK.','..KYYYYYYK..','...KKKKKK...','............'],
  heart: ['............','..KKK..KKK..','.KRRRKKRRRK.','.KRWRRRRRRK.','.KRRRRRRRRK.','.KRRRRRRRRK.','..KRRRRRRK..','...KRRRRK...','....KRRK....','.....KK.....','............','............'],
  bomb: ['.........OO.','........OY..','.......Kx...','......K.....','.....KK.....','...KKKKKKK..','.KKssssssKK.','KssWssssssK.','KssssssssssK','KssssssssssK','.KssssssssK.','..KKKKKKKK..'],
  computer: ['............','.KKKKKKKKKK.','KSSSSSSSSSSK','KsGGGGGGGGsK','KsGLGGGGGGsK','KsGGGGGGGGsK','KsGGGGGGGGsK','KSSSSSSSSSSK','.KKKKKKKKKK.','KSKKKKKKKKSK','KKKKKKKKKKKK','............'],
};

const TENCENT_NAMES = ['sword','potion','chest','gamepad','coin','heart','bomb','computer'];
const TENCENT_SPRITE_PX = 12;

function TencentGameLoopCard({ w, h }) {
  const stageRef = React.useRef(null);
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const ctx = canvas.getContext('2d');

    const COLS = 4, ROWS = 3;
    let DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    let cellSize = 100, gridOffX = 0, gridOffY = 0, blockPx = 4;
    let cells = [];
    let raf = 0, running = false, frame = 0;

    function layout() {
      const offset = Math.floor(Math.random() * TENCENT_NAMES.length);
      cells = [];
      for (let i = 0; i < COLS * ROWS; i++) {
        cells.push({
          name: TENCENT_NAMES[(i + offset) % TENCENT_NAMES.length],
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    function drawSprite(name, cx, cy, yOff) {
      const rows = TENCENT_SPR[name];
      const spriteSize = TENCENT_SPRITE_PX * blockPx;
      const x0 = Math.round(cx - spriteSize / 2);
      const y0 = Math.round(cy - spriteSize / 2 + yOff);
      for (let r = 0; r < TENCENT_SPRITE_PX; r++) {
        const row = rows[r];
        for (let c = 0; c < TENCENT_SPRITE_PX; c++) {
          const color = TENCENT_PAL[row[c]];
          if (!color) continue;
          ctx.fillStyle = color;
          ctx.fillRect(x0 + c * blockPx, y0 + r * blockPx, blockPx, blockPx);
        }
      }
    }

    function fit() {
      const W = stage.offsetWidth || w || 1;
      const H = stage.offsetHeight || h || 1;
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      cellSize = Math.floor(Math.min(canvas.width / COLS, canvas.height / ROWS));
      gridOffX = Math.floor((canvas.width - cellSize * COLS) / 2);
      // Push the sprite grid down so it doesn't sit over the corner spade
      const topInset = Math.round(canvas.height * 0.18);
      gridOffY = Math.floor(topInset + (canvas.height - topInset - cellSize * ROWS) / 2);
      blockPx = Math.max(1, Math.floor((cellSize * 0.55) / TENCENT_SPRITE_PX));
      layout();
    }

    function drawScanlines() {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      const step = Math.max(2, Math.round(DPR * 2));
      for (let y = 0; y < canvas.height; y += step * 2) {
        ctx.fillRect(0, y, canvas.width, step);
      }
    }

    function step() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const t = frame / 60;
      for (let i = 0; i < cells.length; i++) {
        const r = Math.floor(i / COLS);
        const c = i % COLS;
        const cx = gridOffX + c * cellSize + cellSize / 2;
        const cy = gridOffY + r * cellSize + cellSize / 2;
        const bob = Math.sin(t * 2 + cells[i].phase) * (blockPx * 0.9);
        drawSprite(cells[i].name, cx, cy, bob);
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

    const onClick = (e) => { layout(); e.preventDefault(); e.stopPropagation(); };
    stage.addEventListener('click', onClick);

    const onVis = () => { if (document.hidden) stop(); else start(); };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      stop();
      ro.disconnect();
      stage.removeEventListener('click', onClick);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <div ref={stageRef} style={{ position: 'absolute', inset: 0, background: 'transparent', overflow: 'hidden', pointerEvents: 'auto' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}

window.TencentGameLoopCard = TencentGameLoopCard;
