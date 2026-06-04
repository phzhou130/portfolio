// PokerAnimation — drop -> stack -> fan reveal of royal flush in spades.
// Phases (timings in ms):
//   0..1400    DROP    : 20 cards fall from top, staggered, settling into a tight stack
//   1400..1900 SETTLE  : tiny final adjustment / pause
//   1900..3000 REVEAL  : 5 royal flush cards slide from alternating sides, flip, into a fan
//   3000..end  HOLD    : final fan held

const RANKS_FAN = ['10', 'J', 'Q', 'K', 'A']; // royal flush left-to-right

// Mobile swipe-deal timing (ms): flip the card, let it linger face-up, then
// slide it off-screen. The linger is intentionally longer than the slide so the
// reveal reads before the card leaves.
const DEAL_FLIP = 420;
const DEAL_HOLD = 800;
const DEAL_SLIDE = 420;

function randSeed(i) {
  const x = Math.sin(i * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function PokerAnimation({ variant = 'document', count = 20, soundOn = false, onProgress }) {
  const containerRef = React.useRef(null);
  const [t, setT] = React.useState(0);
  const [size, setSize] = React.useState({ w: 1280, h: 800 });
  const startRef = React.useRef(null);
  const rafRef = React.useRef(null);
  const triggeredRef = React.useRef(new Set());

  // Scroll-driven flips: which fan cards have been flipped to face (right→left).
  // flippedAt[i] = timestamp (ms since anim start) when card i started flipping, or null.
  const [flippedAt, setFlippedAt] = React.useState([null, null, null, null, null]);
  const flippedAtRef = React.useRef(flippedAt);
  flippedAtRef.current = flippedAt;
  // Once all 5 cards have been flipped to face, lock further interaction and
  // remember the timestamp so we can animate the "collect into stack" pose.
  const [collectedAt, setCollectedAt] = React.useState(null);
  const collectedAtRef = React.useRef(collectedAt);
  collectedAtRef.current = collectedAt;
  // Burst phase — Solitaire-style win cascade: cards bounce out from the
  // stack, fall under gravity, ricochet off the bottom edge while drifting
  // horizontally with Perlin-ish noise, then everything fades to white.
  const [burstAt, setBurstAt] = React.useState(null);
  const burstAtRef = React.useRef(burstAt);
  burstAtRef.current = burstAt;
  const scrollLockRef = React.useRef(0);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      const r = containerRef.current.getBoundingClientRect();
      if (r.width && r.height) setSize({ w: r.width, h: r.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // At/under the page's main mobile breakpoint the fan is too wide, so we swap
  // it for a centered stack that the visitor swipes left to deal off-screen.
  const isMobile = size.w <= 768;

  React.useEffect(() => {
    const TOTAL = 4500;
    const tick = (ts) => {
      if (startRef.current == null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      setT(elapsed);
      // keep ticking forever once any card has been scroll-flipped, so the flip animation can play
      const stillFlipping = flippedAtRef.current.some((v) => v != null && (elapsed - v) < 700);
      // keep ticking through the collect animation as well
      const collecting = collectedAtRef.current != null && (elapsed - collectedAtRef.current) < 1400;
      // and the burst phase
      const bursting = burstAtRef.current != null && (elapsed - burstAtRef.current) < 4500;
      if (elapsed < TOTAL || stillFlipping || flippedAtRef.current.some((v) => v != null) || collecting || bursting) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const P = { drop: 1400, settle: 1900, reveal: 3000 };
  const REVEAL_END = 3340; // when the initial 5-card fan flip-in finishes

  // Scroll-snap driven flips. After the reveal completes, we mount a hidden
  // tall scroll container with 6 snap sections (initial + 5 cards). The
  // browser's native scroll-snap guarantees ONE card per scroll gesture
  // — wheel/trackpad/touch all behave correctly because snap stops at each
  // section regardless of momentum.
  const scrollHostRef = React.useRef(null);

  React.useEffect(() => {
    if (t < REVEAL_END + 200) return;
    if (collectedAt != null) return; // locked — no more flips after collect
    const host = scrollHostRef.current;
    if (!host) return;

    const onScroll = () => {
      // Mobile snaps horizontally (swipe left), desktop vertically (scroll down).
      const extent = isMobile ? host.clientWidth : host.clientHeight;
      const pos = isMobile ? host.scrollLeft : host.scrollTop;
      // Which section are we on (0..5)? Snap ensures we're at integer multiples.
      const idx = Math.round(pos / extent);
      // section 0 = no flips, section 1 = flip card 4 (rightmost), section 2 = flip card 3, etc.
      const flipsToShow = Math.max(0, Math.min(5, idx));
      setFlippedAt((prev) => {
        const next = prev.slice();
        let changed = false;
        for (let n = 0; n < 5; n++) {
          // n=0 => index 4, n=1 => index 3, ...
          const cardIdx = 4 - n;
          if (n < flipsToShow && next[cardIdx] == null) {
            next[cardIdx] = performance.now() - (startRef.current || 0);
            changed = true;
          } else if (n >= flipsToShow && next[cardIdx] != null) {
            // allow scrolling back up to un-flip
            next[cardIdx] = null;
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    };
    host.addEventListener('scroll', onScroll, { passive: true });
    return () => host.removeEventListener('scroll', onScroll);
  }, [t, collectedAt, isMobile]);

  // Notify parent when flip count changes
  const flipCount = flippedAt.filter((v) => v != null).length;
  React.useEffect(() => {
    if (onProgress) onProgress({
      flipped: flipCount,
      total: 5,
      revealing: t >= REVEAL_END,
      collected: collectedAt != null,
    });
  }, [flipCount, t >= REVEAL_END, collectedAt != null]);

  // Detect when all 5 cards have completed their face-flip → lock + collect
  React.useEffect(() => {
    if (collectedAt != null) return;
    if (flippedAt.every((v) => v != null)) {
      // Wait until the finale should begin: desktop only needs the last flip to
      // settle; mobile must let that card fully flip, linger, and slide away.
      const last = Math.max(...flippedAt);
      const targetT = last + (isMobile ? DEAL_FLIP + DEAL_HOLD + DEAL_SLIDE + 80 : 880);
      const delay = Math.max(0, targetT - t);
      const id = setTimeout(() => {
        setCollectedAt(performance.now() - (startRef.current || 0));
      }, delay);
      return () => clearTimeout(id);
    }
  }, [flippedAt, collectedAt, t, isMobile]);

  // After the collect animation finishes, kick off the burst phase ~600ms later.
  React.useEffect(() => {
    if (collectedAt == null || burstAt != null) return;
    // Desktop: wait out the collect gather (≈880ms) + a brief hold. Mobile has
    // no gather (cards are already dealt away), so erupt almost immediately.
    const delay = isMobile ? 200 : 880 + 600;
    const startBy = collectedAt + delay;
    const wait = Math.max(0, startBy - t);
    const id = setTimeout(() => {
      setBurstAt(performance.now() - (startRef.current || 0));
    }, wait);
    return () => clearTimeout(id);
  }, [collectedAt, burstAt, t, isMobile]);

  // sound triggers
  React.useEffect(() => {
    if (!soundOn || !window.PokerSound) return;
    const tr = triggeredRef.current;
    for (let i = 0; i < count; i++) {
      const tStart = i * 55;
      const landAt = tStart + 600;
      if (t > landAt && !tr.has(`land-${i}`)) {
        tr.add(`land-${i}`);
        if (i % 2 === 0) window.PokerSound.flick(0.16);
      }
    }
    if (t > P.settle && !tr.has('settle')) {
      tr.add('settle');
      window.PokerSound.slam(0.25);
    }
    for (let i = 0; i < 5; i++) {
      const tStart = P.settle + 60 + i * 130;
      if (t > tStart && !tr.has(`reveal-${i}`)) {
        tr.add(`reveal-${i}`);
        window.PokerSound.flick(0.32);
      }
    }
    if (t > P.reveal && !tr.has('final')) {
      tr.add('final');
      window.PokerSound.slam(0.5);
    }
  }, [t, soundOn, count]);

  const cw = Math.min(280, Math.max(220, size.w * 0.18));
  const ch = cw * 1.45;
  const cx = size.w / 2;
  const cy = size.h / 2;

  // DROP -> STACK -> fade slightly during reveal
  const dropCards = [];
  for (let i = 0; i < count; i++) {
    const r1 = randSeed(i);
    const r2 = randSeed(i + 100);
    const r3 = randSeed(i + 200);

    const dropDelay = i * 55;
    const dropDur = 600;
    const dropEnd = dropDelay + dropDur;
    const dropP = Math.max(0, Math.min(1, (t - dropDelay) / dropDur));
    // ease-out with a touch of bounce/overshoot via cubic
    const dropEase = 1 - Math.pow(1 - dropP, 3);

    const startX = cx + (r1 - 0.5) * size.w * 0.35;
    const startY = -ch - 50;
    // tight stack with very small jitter
    const stackX = cx + (r1 - 0.5) * 6;
    const stackY = cy + (r2 - 0.5) * 6;
    const stackRot = (r3 - 0.5) * 8;
    const startRot = (r3 - 0.5) * 25;

    let x = startX + (stackX - startX) * dropEase;
    let y = startY + (stackY - startY) * dropEase;
    let rot = startRot + (stackRot - startRot) * dropEase;

    // small landing jiggle (1 quick wobble after landing)
    if (t >= dropEnd && t < dropEnd + 150) {
      const j = (t - dropEnd) / 150;
      const wobble = Math.sin(j * Math.PI) * 2 * (1 - j);
      y += wobble;
    }

    let opacity = 1;
    let scale = 1;
    if (t >= P.settle) {
      const fadeP = Math.max(0, Math.min(1, (t - P.settle - 100) / 500));
      opacity = 1 - fadeP * 0.5;
      scale = 1 - fadeP * 0.04;
    }

    dropCards.push({ i, x, y, rot, opacity, scale });
  }

  // FAN cards (royal flush). Desktop fans them out and flips on scroll; mobile
  // stacks them at center and deals each off the left edge on swipe.
  const fanCards = [];
  if (t >= P.settle - 100) {
    const fanGap = cw * 0.62;
    for (let i = 0; i < 5; i++) {
      // Resting pose: tight center stack on mobile, spread fan on desktop.
      const targetX = isMobile ? cx + (randSeed(i + 300) - 0.5) * 8 : cx + (i - 2) * fanGap;
      const targetY = isMobile ? cy + (randSeed(i + 400) - 0.5) * 8 : cy + Math.abs(i - 2) * 6;
      const targetRot = isMobile ? (randSeed(i + 450) - 0.5) * 5 : (i - 2) * 6;

      const slideDelay = (P.settle - 100) + i * 130;
      const slideDur = 520;
      const flipDelay = slideDelay + 420;
      const flipDur = 340;

      const sp = Math.max(0, Math.min(1, (t - slideDelay) / slideDur));
      const se = 1 - Math.pow(1 - sp, 3);

      const fromLeft = i % 2 === 0;
      const startX = fromLeft ? -cw - 100 : size.w + cw + 100;
      const startY = cy + (randSeed(i + 500) - 0.5) * 80;
      const startRot = (fromLeft ? -1 : 1) * 22;

      const x = startX + (targetX - startX) * se;
      const y = startY + (targetY - startY) * se;
      const rot = startRot + (targetRot - startRot) * se;

      // Desktop does a 180° flourish as it fans in (stays back-side up). Mobile
      // cards arrive flat so the stack reads cleanly; only the swipe flips them.
      const fp = Math.max(0, Math.min(1, (t - flipDelay) / flipDur));
      const fe = fp < 0.5 ? 2 * fp * fp : 1 - Math.pow(-2 * fp + 2, 2) / 2;
      const initialFlipDeg = isMobile ? 0 : fe * 180;
      // scroll/swipe-driven flip per card — crossing 90° reveals the face.
      const flippedTime = flippedAt[i];
      let secondaryFlipDeg = 0;
      if (flippedTime != null) {
        const sFp = Math.max(0, Math.min(1, (t - flippedTime) / 420));
        const sFe = sFp < 0.5 ? 2 * sFp * sFp : 1 - Math.pow(-2 * sFp + 2, 2) / 2;
        secondaryFlipDeg = sFe * 180;
      }
      // total visual flip rotation — both contribute to scaleX horizontal flip
      const totalDeg = initialFlipDeg + secondaryFlipDeg;
      // showFace is true once the secondary flip passes 90deg
      const showFace = secondaryFlipDeg > 90;
      const flipScaleX = Math.abs(Math.cos((totalDeg * Math.PI) / 180));

      const visible = t >= slideDelay;

      let finalX = x, finalY = y, finalRot = rot;
      let dealtAway = false;

      if (isMobile) {
        // DEAL AWAY — the card flips, lingers face-up (DEAL_HOLD), then slides
        // off the left edge, revealing the next back beneath it.
        if (flippedTime != null) {
          const dealStart = flippedTime + DEAL_FLIP + DEAL_HOLD;
          const dealP = Math.max(0, Math.min(1, (t - dealStart) / DEAL_SLIDE));
          const dealE = dealP < 0.5 ? 2 * dealP * dealP : 1 - Math.pow(-2 * dealP + 2, 2) / 2;
          finalX = x + ((-cw - 120) - x) * dealE;
          finalRot = rot + (-15) * dealE;
          if (dealP >= 1) dealtAway = true;
        }
      } else if (collectedAt != null) {
        // COLLECT pose (desktop) — once all 5 face up, gather into a center stack.
        const cP = Math.max(0, Math.min(1, (t - collectedAt - i * 70) / 600));
        const cE = cP < 0.5 ? 2 * cP * cP : 1 - Math.pow(-2 * cP + 2, 2) / 2;
        // tight stack with tiny jitter so it reads as a real pile
        const stX = cx + (randSeed(i + 700) - 0.5) * 4;
        const stY = cy + (randSeed(i + 800) - 0.5) * 4;
        const stRot = (randSeed(i + 900) - 0.5) * 6;
        finalX = x + (stX - x) * cE;
        finalY = y + (stY - y) * cE;
        finalRot = rot + (stRot - rot) * cE;
      }

      fanCards.push({
        i, x: finalX, y: finalY, rot: finalRot,
        opacity: visible ? (dealtAway ? 0 : 1) : 0,
        face: showFace, flipScaleX,
        rank: RANKS_FAN[i],
        zIndex: 100 + i,
      });
    }
  }

  // BURST: Solitaire-style cascade — many cards fly out of the stack,
  // fall under gravity, bounce off the bottom with damping, drift
  // horizontally via noise. Cards spawn in waves so the screen fills fast.
  const burstCards = [];
  let fadeOpacity = 0;
  if (burstAt != null) {
    const bt = (t - burstAt) / 1000; // seconds since burst start
    const SPAWN_TOTAL = 80;
    const SPAWN_DURATION = 1.4; // seconds to spawn all cards
    const FADE_START = 2.4;
    const FADE_DURATION = 1.2;

    // Spawn from center of screen (where stack sits)
    const sx = cx;
    const sy = cy;

    // Realistic gravity (px/s^2) — relative to stage size so the look scales
    const gravity = size.h * 1.6;

    for (let n = 0; n < SPAWN_TOTAL; n++) {
      const spawnT = (n / SPAWN_TOTAL) * SPAWN_DURATION;
      if (bt < spawnT) continue;
      const age = bt - spawnT;

      // Initial velocity — biased outward and upward, like a fountain
      const seed = randSeed(n + 5000);
      const seed2 = randSeed(n + 6000);
      const seed3 = randSeed(n + 7000);
      const seed4 = randSeed(n + 8000);

      const angle = Math.PI * (0.05 + seed * 0.9); // mostly upward (0..π gives full half)
      // angle 0 = right, π/2 = up, π = left → bias toward upper hemisphere
      const speed = size.h * (1.1 + seed2 * 0.9); // px/s
      const v0x = Math.cos(angle) * speed * (seed3 < 0.5 ? -1 : 1);
      const v0y = -Math.abs(Math.sin(angle) * speed); // negative = up

      // Integrate with floor bounces. Resolve analytically per-bounce.
      let x0 = sx;
      let y0 = sy;
      let vx = v0x;
      let vy = v0y;
      let tLeft = age;
      const floor = size.h - 30; // bottom edge with a small inset
      let bounces = 0;

      while (tLeft > 0 && bounces < 6) {
        // time until y reaches floor: y0 + vy*t + 0.5*g*t^2 = floor
        const a = 0.5 * gravity;
        const b = vy;
        const c = y0 - floor;
        const disc = b * b - 4 * a * c;
        let tFloor = Infinity;
        if (disc >= 0 && a > 0) {
          const t1 = (-b + Math.sqrt(disc)) / (2 * a);
          const t2 = (-b - Math.sqrt(disc)) / (2 * a);
          // pick smallest positive
          if (t1 > 1e-4 && t2 > 1e-4) tFloor = Math.min(t1, t2);
          else if (t1 > 1e-4) tFloor = t1;
          else if (t2 > 1e-4) tFloor = t2;
        }
        if (tLeft < tFloor) {
          // no bounce within remaining time
          x0 = x0 + vx * tLeft;
          y0 = y0 + vy * tLeft + 0.5 * gravity * tLeft * tLeft;
          vy = vy + gravity * tLeft;
          tLeft = 0;
        } else {
          // bounce
          x0 = x0 + vx * tFloor;
          y0 = floor;
          vy = vy + gravity * tFloor;
          // damping
          vy = -vy * 0.55;
          vx *= 0.86;
          tLeft -= tFloor;
          bounces++;
          if (Math.abs(vy) < 40) vy = 0; // settle
        }
      }

      // Add Perlin-ish horizontal drift on top of the trajectory
      const driftAmp = 18 + seed4 * 24;
      const driftFreq = 0.8 + seed2 * 1.2;
      const drift = Math.sin(bt * driftFreq + n * 1.7) * driftAmp * Math.min(1, age / 0.5);
      x0 += drift;

      // Cull if off-screen far below (settled)
      if (y0 > size.h + ch) continue;

      // Rotation — spin proportional to horizontal velocity
      const spin = (v0x / 200) * 360;
      const rot = spin * age + (seed * 360);

      // Show face for the 5 royal cards spawned first; the rest are backs
      const rankIdx = n % 5;
      const showFace = n < 25; // first wave shows faces, then backs cycle in
      const rank = RANKS_FAN[rankIdx];

      burstCards.push({
        n, x: x0, y: y0, rot,
        rank, face: showFace,
        zIndex: 1000 + n,
      });
    }

    // Fade overlay — last 1.2s of the burst fades the whole thing to white
    if (bt > FADE_START) {
      fadeOpacity = Math.max(0, Math.min(1, (bt - FADE_START) / FADE_DURATION));
    }
  }

  return (
    <div ref={containerRef} style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
    }}>
      {dropCards.map((c) => (
        <div key={`d-${c.i}`} style={{
          position: 'absolute',
          left: c.x - cw / 2,
          top: c.y - ch / 2,
          transform: `rotate(${c.rot}deg) scale(${c.scale})`,
          opacity: burstAt != null ? 0 : c.opacity,
          zIndex: 10 + c.i,
          willChange: 'transform',
        }}>
          <PokerCard rank="A" variant={variant} face={false} w={cw} h={ch} />
        </div>
      ))}
      {fanCards.map((c) => (
        <div key={`f-${c.i}`} style={{
          position: 'absolute',
          left: c.x - cw / 2,
          top: c.y - ch / 2,
          transform: `rotate(${c.rot}deg) scaleX(${c.flipScaleX})`,
          opacity: burstAt != null ? 0 : c.opacity,
          zIndex: c.zIndex,
          willChange: 'transform',
        }}>
          <PokerCard rank={c.rank} variant={variant} face={c.face} w={cw} h={ch} />
        </div>
      ))}

      {/* BURST cards — Solitaire-style win cascade */}
      {burstCards.map((c) => (
        <div key={`b-${c.n}`} style={{
          position: 'absolute',
          left: c.x - cw / 2,
          top: c.y - ch / 2,
          transform: `rotate(${c.rot}deg)`,
          zIndex: c.zIndex,
          willChange: 'transform',
          pointerEvents: 'none',
        }}>
          <PokerCard rank={c.rank} variant={variant} face={c.face} w={cw} h={ch} cheap={true} />
        </div>
      ))}

      {/* Fade-to-white overlay at the end of the burst */}
      {fadeOpacity > 0 && (
        <div style={{
          position: 'absolute', inset: 0,
          background: '#ffffff',
          opacity: fadeOpacity,
          zIndex: 5000,
          pointerEvents: 'none',
        }} />
      )}

      {/* Scroll-snap host — invisible overlay that captures scroll. Six snap
          sections; each scroll gesture lands on the next one, flipping one card.
          Removed once collectedAt is set, locking the final stacked state. */}
      {t >= REVEAL_END + 200 && collectedAt == null && (
        <div
          ref={scrollHostRef}
          style={{
            position: 'absolute',
            inset: 0,
            display: isMobile ? 'flex' : 'block',
            overflowX: isMobile ? 'scroll' : 'hidden',
            overflowY: isMobile ? 'hidden' : 'scroll',
            scrollSnapType: isMobile ? 'x mandatory' : 'y mandatory',
            WebkitOverflowScrolling: 'touch',
            zIndex: 500,
            // hide native scrollbar
            scrollbarWidth: 'none',
          }}
        >
          {[0,1,2,3,4,5].map((s) => (
            <div key={s} style={{
              width: '100%',
              height: '100%',
              flex: isMobile ? '0 0 100%' : undefined,
              scrollSnapAlign: 'start',
              scrollSnapStop: 'always',
              pointerEvents: 'none',
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

window.PokerAnimation = PokerAnimation;
