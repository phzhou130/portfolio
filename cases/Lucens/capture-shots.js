// Capture mid-animation screenshots for the After-frame slideshow.
// Drives each feature's demo into a representative state and screenshots
// the .ms-app container only (1440x1024 design canvas).

const { chromium } = require('playwright');
const path = require('path');

const URL = 'http://localhost:3456/cases/Lucens/Lucens%20Case%20Study.html';
const OUT = path.resolve(__dirname, 'assets');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 2000, height: 1300 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  // Stop the IntersectionObservers from ever firing → demos never start.
  // We do this BEFORE page navigation by patching the global IO constructor.
  await page.addInitScript(() => {
    const RealIO = window.IntersectionObserver;
    window.IntersectionObserver = class NoopIO {
      constructor(cb){ this._cb = cb; }
      observe(){}
      unobserve(){}
      disconnect(){}
    };
    // Keep the real one accessible for anything that might genuinely need it
    window.__RealIO__ = RealIO;
  });

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Override layout so each .ms-app renders at a large fixed width during
  // capture. This makes the screenshot resolution match the slideshow's
  // display size (~1280px wide) instead of the narrow feature column.
  await page.addStyleTag({ content: `
    html{ scroll-behavior:auto !important; }
    #msApp, #msApp2, #msApp3, #msApp4 { width:1280px !important; height:auto !important; }
  ` });
  // Allow the layout to settle after the resize.
  await page.waitForTimeout(800);

  // Helper: screenshot an element by selector after letting it paint.
  async function shoot(selector, file) {
    const el = await page.$(selector);
    if (!el) throw new Error('Element not found: ' + selector);
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    await el.screenshot({ path: path.join(OUT, file), omitBackground: false });
    console.log('Saved', file);
  }

  // ─────────────────────────────────────────────────────────────
  // Feature 1 — AI Tutor: history open + Solver Mode mid-typing
  // ─────────────────────────────────────────────────────────────
  await page.evaluate(() => {
    const app = document.getElementById('msApp');
    if (!app) return;
    app.dataset.state = 'collapsed';
    app.dataset.historyOpen = 'true';
    // Make sure Solver Mode is the active tab
    app.querySelector('.ms-chat-mode[data-mode="solver"]')?.classList.add('is-active');
    app.querySelectorAll('.ms-chat-mode').forEach(m => {
      if (m.dataset.mode !== 'solver') m.classList.remove('is-active');
    });
    // Switch chat to conversation view
    const inp = app.querySelector('.ms-chat-input');
    if (inp) { inp.dataset.view = 'conv'; inp.dataset.typed = 'true'; }
    const linesEl = app.querySelector('.ms-chat-msg-lines');
    if (linesEl) {
      linesEl.innerHTML = '';
      [
        "Got it — here's the worked solution.",
        "Multiply numerator and denominator by the conjugate (8 − 2i).",
        "Numerator: (3 − 5i)(8 − 2i) = 14 − 46i",
        "Denominator: ("
      ].forEach(t => { const p = document.createElement('p'); p.textContent = t; linesEl.appendChild(p); });
    }
    // Cursor near the send button at the bottom-right of the conv reply box
    const cursor = app.querySelector('#msFakeCursor');
    const send   = app.querySelector('.ms-chat-conv-send');
    if (cursor && send) {
      cursor.classList.add('is-visible');
      const a = app.getBoundingClientRect();
      const r = send.getBoundingClientRect();
      const x = r.left - a.left + r.width/2;
      const y = r.top  - a.top  + r.height/2 + 8;
      cursor.style.transform = `translate(${x}px, ${y}px)`;
    }
  });
  await shoot('#msApp', 'AiTutor.png');

  // ─────────────────────────────────────────────────────────────
  // Feature 2 — Bulk Solving: loaded state with workspace populated
  // ─────────────────────────────────────────────────────────────
  await page.evaluate(() => {
    const app = document.getElementById('msApp2');
    if (!app) return;
    app.dataset.bulkState = 'loaded';
    // Hide cursor for a clean frame
    const cursor = app.querySelector('#msFakeCursor2');
    if (cursor) {
      cursor.classList.remove('is-visible');
      cursor.style.transform = 'translate(-9999px,-9999px)';
    }
    // Populate the loaded AI message body if it exists
    const body = app.querySelector('.bl-msg-body');
    if (body) {
      body.innerHTML = '';
      [
        "Alright, I got you!",
        "To find the equivalent complex number for (3 − 5i) / (8 + 2i)",
        "we need to multiply the numerator and the denominator by the conjugate of the denominator:",
        "The conjugate of 8 + 2i is 8 − 2i.",
      ].forEach(t => { const p = document.createElement('p'); p.textContent = t; body.appendChild(p); });
    }
  });
  await shoot('#msApp2', 'BulkSolving.png');

  // ─────────────────────────────────────────────────────────────
  // Feature 3 — Knowledge Graph: zoomed-in Algebra state (sub-planets visible)
  // ─────────────────────────────────────────────────────────────
  await page.evaluate(() => {
    const app = document.getElementById('msApp3');
    if (!app) return;
    app.dataset.state = 'expanded';
    app.dataset.kgState = 'zoomed';
    const cursor = app.querySelector('#msFakeCursor3');
    if (cursor) cursor.classList.remove('is-visible');
  });
  await shoot('#msApp3', 'KGDefaultView.png');

  // ─────────────────────────────────────────────────────────────
  // Feature 4 — Daily Study Plan: learning view with multiple-choice question
  // ─────────────────────────────────────────────────────────────
  await page.evaluate(() => {
    const app = document.getElementById('msApp4');
    if (!app) return;
    app.dataset.dspState = 'learning';
    const cursor = app.querySelector('#msFakeCursor4');
    if (cursor) cursor.classList.remove('is-visible');
  });
  await shoot('#msApp4', 'DailyStudyModule.png');

  await browser.close();
  console.log('All shots captured.');
})();
