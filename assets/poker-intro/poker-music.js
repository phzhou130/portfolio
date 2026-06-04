// Background score for the portfolio — fully synthesized via Web Audio.
// Two movements driven by one look-ahead step sequencer:
//   intro : energetic card-dealing groove (kick/clap/hats, syncopated bass,
//           arpeggios + stabs) ~112 BPM.
//   home  : lo-fi chill groove (swung soft beat, jazzy Rhodes chords, mellow
//           bass) ~80 BPM — the bed that keeps playing on the homepage.
// On dismiss the engine crossfades intro -> home (it does NOT stop), so the
// shift in feel signals "you've arrived." Loaded on every page so returning
// visitors (who skip the intro) still get the home groove via the toggle.
//
// Browser autoplay policy blocks sound until a user gesture, so playback only
// becomes audible after the first interaction.

(function () {
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) {
    window.PokerIntroMusic = {
      arm: function () {}, toggle: function () { return false; },
      enterHome: function () {}, prepHome: function () {},
      bindButton: function () {}, sparkle: function () {}, isOn: function () { return false; }
    };
    return;
  }

  // ---- tunable mix / tempo ----
  var INTRO_VOL = 0.42, HOME_VOL = 0.34;
  var INTRO_BPM = 112, HOME_BPM = 80;
  var SWING = 0.2; // home off-8th delay as a fraction of a 16th note

  var ctx = null, master = null, comp = null, conv = null, wet = null, noiseBuf = null;
  var enabled = true, playing = false, mode = 'intro';
  var bpm = INTRO_BPM, masterTarget = INTRO_VOL;
  var nextNoteTime = 0, stepAbs = 0, schedTimer = null;
  var voices = [], listeners = [], gestureBound = false, lastSparkle = 0;

  // i – VI – iv – V in A minor (one chord per bar)
  var INTRO_PROG = [
    { bassN: 110.00, chord: [220.00, 261.63, 329.63], arp: [220.00, 261.63, 329.63, 440.00] },
    { bassN: 87.31,  chord: [174.61, 220.00, 261.63], arp: [174.61, 220.00, 261.63, 349.23] },
    { bassN: 73.42,  chord: [146.83, 174.61, 220.00], arp: [146.83, 174.61, 220.00, 293.66] },
    { bassN: 82.41,  chord: [164.81, 207.65, 246.94], arp: [164.81, 207.65, 246.94, 329.63] }
  ];
  // Cmaj7 – Am7 – Dm7 – G7 — warm jazzy lo-fi loop
  var HOME_PROG = [
    { bassN: 65.41, chord: [261.63, 329.63, 392.00, 493.88] },
    { bassN: 110.00, chord: [220.00, 261.63, 329.63, 392.00] },
    { bassN: 73.42, chord: [293.66, 349.23, 440.00, 523.25] },
    { bassN: 98.00, chord: [196.00, 246.94, 293.66, 349.23] }
  ];
  var PENTA = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];

  function secs16() { return 60.0 / bpm / 4; }

  function reverbIR(seconds, decay) {
    var rate = ctx.sampleRate, len = Math.floor(rate * seconds);
    var buf = ctx.createBuffer(2, len, rate);
    for (var ch = 0; ch < 2; ch++) {
      var d = buf.getChannelData(ch);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  function makeNoise() {
    var len = Math.floor(ctx.sampleRate * 1);
    var b = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = b.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  function init() {
    if (ctx) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.0001;
    comp = ctx.createDynamicsCompressor();
    master.connect(comp);
    comp.connect(ctx.destination);
    conv = ctx.createConvolver();
    conv.buffer = reverbIR(2.6, 2.4);
    wet = ctx.createGain();
    wet.gain.value = 0.7;
    conv.connect(wet);
    wet.connect(master);
    noiseBuf = makeNoise();
  }

  function track(n) {
    voices.push(n);
    n.onended = function () { var k = voices.indexOf(n); if (k >= 0) voices.splice(k, 1); };
  }

  // ---- instruments ----
  function kick(t, g) {
    var o = ctx.createOscillator(), gn = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(160, t);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.09);
    gn.gain.setValueAtTime(g, t);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
    o.connect(gn); gn.connect(master);
    o.start(t); o.stop(t + 0.26); track(o);
  }

  function hat(t, g) {
    var s = ctx.createBufferSource(); s.buffer = noiseBuf;
    var f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7500;
    var gn = ctx.createGain();
    gn.gain.setValueAtTime(g, t);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    s.connect(f); f.connect(gn); gn.connect(master); gn.connect(conv);
    s.start(t); s.stop(t + 0.08); track(s);
  }

  function clap(t, g) {
    for (var k = 0; k < 3; k++) {
      var tt = t + k * 0.012;
      var s = ctx.createBufferSource(); s.buffer = noiseBuf;
      var f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.8;
      var gn = ctx.createGain();
      gn.gain.setValueAtTime(g * (k === 2 ? 1 : 0.6), tt);
      gn.gain.exponentialRampToValueAtTime(0.0001, tt + 0.12);
      s.connect(f); f.connect(gn); gn.connect(master); gn.connect(conv);
      s.start(tt); s.stop(tt + 0.15); track(s);
    }
  }

  function snare(t, g) {
    var s = ctx.createBufferSource(); s.buffer = noiseBuf;
    var f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 0.6;
    var gn = ctx.createGain();
    gn.gain.setValueAtTime(g, t);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    s.connect(f); f.connect(gn); gn.connect(master); gn.connect(conv);
    var o = ctx.createOscillator(), og = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = 180;
    og.gain.setValueAtTime(g * 0.5, t);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(og); og.connect(master);
    s.start(t); s.stop(t + 0.2); o.start(t); o.stop(t + 0.14); track(s); track(o);
  }

  function bassHit(freq, t, dur, g) {
    var o = ctx.createOscillator(), gn = ctx.createGain(), fl = ctx.createBiquadFilter();
    o.type = 'sawtooth'; o.frequency.value = freq;
    fl.type = 'lowpass'; fl.frequency.value = 520; fl.Q.value = 3;
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.linearRampToValueAtTime(g, t + 0.012);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(fl); fl.connect(gn); gn.connect(master);
    o.start(t); o.stop(t + dur + 0.05); track(o);
  }

  function pluck(freq, t, dur, g, soft) {
    var o = ctx.createOscillator(), gn = ctx.createGain(), fl = ctx.createBiquadFilter();
    o.type = soft ? 'triangle' : 'sawtooth'; o.frequency.value = freq;
    fl.type = 'lowpass'; fl.frequency.value = soft ? 2200 : 3400; fl.Q.value = 0.8;
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.linearRampToValueAtTime(g, t + 0.008);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(fl); fl.connect(gn); gn.connect(master); gn.connect(conv);
    o.start(t); o.stop(t + dur + 0.05); track(o);
  }

  function chordPad(fs, t, dur, g) {
    for (var i = 0; i < fs.length; i++) {
      var o = ctx.createOscillator(), gn = ctx.createGain(), fl = ctx.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.value = fs[i]; o.detune.value = (i - 1) * 4;
      fl.type = 'lowpass'; fl.frequency.value = 1400; fl.Q.value = 0.5;
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.linearRampToValueAtTime(g, t + 0.15);
      gn.gain.setValueAtTime(g, t + Math.max(0.2, dur - 0.2));
      gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(fl); fl.connect(gn); gn.connect(master); gn.connect(conv);
      o.start(t); o.stop(t + dur + 0.1); track(o);
    }
  }

  function keys(fs, t, dur, g) {
    for (var i = 0; i < fs.length; i++) {
      var fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 1800; fl.Q.value = 0.4;
      var gn = ctx.createGain();
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.linearRampToValueAtTime(g, t + 0.03);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      fl.connect(gn); gn.connect(master); gn.connect(conv);
      var o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = fs[i];
      var o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = fs[i]; o2.detune.value = 5;
      o1.connect(fl); o2.connect(fl);
      o1.start(t); o1.stop(t + dur + 0.1); o2.start(t); o2.stop(t + dur + 0.1);
      track(o1); track(o2);
    }
  }

  function lead(freq, t) {
    var o = ctx.createOscillator(), gn = ctx.createGain(), fl = ctx.createBiquadFilter();
    o.type = 'square'; o.frequency.value = freq;
    fl.type = 'lowpass'; fl.frequency.value = 2600; fl.Q.value = 1;
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.linearRampToValueAtTime(0.10, t + 0.01);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(fl); fl.connect(gn); gn.connect(master); gn.connect(conv);
    o.start(t); o.stop(t + 0.55); track(o);
  }

  // ---- patterns (s = 16th step 0..15 within the bar, bar = chord index 0..3) ----
  function scheduleIntro(s, bar, t) {
    var ch = INTRO_PROG[bar];
    if (s === 0 || s === 4 || s === 8 || s === 10 || s === 12) kick(t, s === 0 ? 0.7 : 0.6);
    if (s === 4 || s === 12) clap(t, 0.3);
    if (s % 2 === 0) hat(t, s % 4 === 2 ? 0.14 : 0.10);
    if (bar === 3 && (s === 13 || s === 15)) hat(t, 0.11);
    if (s === 0 || s === 3 || s === 6 || s === 8 || s === 11 || s === 14) {
      var bf = (s === 6 || s === 14) ? ch.bassN * 1.5 : ch.bassN;
      bassHit(bf, t, 0.17, 0.22);
    }
    if (s % 2 === 0) { var idx = (s / 2) % ch.arp.length; pluck(ch.arp[idx], t, 0.14, 0.11, false); }
    if (s === 0) chordPad(ch.chord, t, secs16() * 15.5, 0.045);
    if (s === 0 && bar % 2 === 0) lead(ch.arp[ch.arp.length - 1] * 2, t);
  }

  function scheduleHome(s, bar, t) {
    var ch = HOME_PROG[bar];
    var tt = t + ((s % 4 === 2) ? SWING * secs16() : 0);
    if (s === 0 || s === 6 || s === 10) kick(tt, s === 0 ? 0.44 : 0.34);
    if (s === 4 || s === 12) snare(tt, 0.16);
    if (s % 2 === 0) hat(tt, 0.06);
    if (s === 0) bassHit(ch.bassN, tt, 0.55, 0.18);
    else if (s === 10) bassHit(ch.bassN, tt, 0.3, 0.13);
    if (s === 0) keys(ch.chord, tt, secs16() * 15, 0.05);
    else if (s === 10) keys(ch.chord, tt, secs16() * 5, 0.03);
    if (bar % 2 === 1 && (s === 6 || s === 14)) {
      var n = ch.chord[(s === 6 ? 2 : 3) % ch.chord.length] * 2;
      pluck(n, tt, 1.2, 0.05, true);
    }
  }

  function scheduler() {
    if (!ctx) return;
    while (nextNoteTime < ctx.currentTime + 0.1) {
      var s = stepAbs % 16, bar = Math.floor(stepAbs / 16) % 4;
      if (mode === 'intro') scheduleIntro(s, bar, nextNoteTime);
      else scheduleHome(s, bar, nextNoteTime);
      nextNoteTime += secs16();
      stepAbs++;
    }
  }

  function start() {
    if (playing) return;
    init();
    if (ctx.state === 'suspended') ctx.resume();
    playing = true;
    stepAbs = 0;
    nextNoteTime = ctx.currentTime + 0.12;
    var now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), now);
    master.gain.linearRampToValueAtTime(masterTarget, now + 1.4);
    schedTimer = setInterval(scheduler, 25);
    scheduler();
  }

  function pause() {
    playing = false;
    if (schedTimer) { clearInterval(schedTimer); schedTimer = null; }
    if (!ctx) return;
    var now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0.0001, now + 0.6);
    setTimeout(function () {
      var c = voices.slice();
      for (var i = 0; i < c.length; i++) { try { c[i].stop(); } catch (e) {} }
      voices = [];
    }, 700);
  }

  function armGesture() {
    if (gestureBound) return;
    gestureBound = true;
    var evs = ['pointerdown', 'mousedown', 'touchstart', 'keydown', 'wheel'];
    var h = function (e) {
      if (e.target && e.target.closest && e.target.closest('[data-music-toggle]')) return;
      gestureBound = false;
      for (var i = 0; i < evs.length; i++) window.removeEventListener(evs[i], h, true);
      if (enabled && !playing) start();
      else if (ctx && ctx.state === 'suspended') ctx.resume();
    };
    for (var i = 0; i < evs.length; i++) window.addEventListener(evs[i], h, { capture: true, passive: true });
  }

  function notify() { for (var i = 0; i < listeners.length; i++) { try { listeners[i](enabled); } catch (e) {} } }

  var api = {
    // Intro overlay: register the React button sync + arm first-gesture autostart.
    arm: function (cb) {
      if (cb) { listeners.push(cb); cb(enabled); }
      armGesture();
    },
    toggle: function () {
      // Once the intro overlay is gone, the toggle controls the home movement.
      if (!document.getElementById('poker-intro') && mode !== 'home') {
        mode = 'home'; bpm = HOME_BPM; masterTarget = HOME_VOL;
      }
      enabled = !enabled;
      if (enabled) start(); else pause();
      notify();
      return enabled;
    },
    // Dismiss handoff: switch to the lo-fi movement, keep playing (crossfade).
    enterHome: function () {
      mode = 'home'; bpm = HOME_BPM; masterTarget = HOME_VOL; stepAbs = 0;
      if (playing && ctx) {
        var now = ctx.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(master.gain.value, now);
        master.gain.linearRampToValueAtTime(HOME_VOL * 0.55, now + 0.25);
        master.gain.linearRampToValueAtTime(HOME_VOL, now + 1.2);
      } else if (enabled) {
        armGesture();
      }
    },
    // Returning visitors (no intro): home movement, muted until they opt in.
    prepHome: function () {
      mode = 'home'; bpm = HOME_BPM; masterTarget = HOME_VOL;
      enabled = false;
      notify();
    },
    bindButton: function (btn) {
      if (!btn) return;
      listeners.push(function (en) { btn.classList.toggle('muted', !en); });
      btn.classList.toggle('muted', !enabled);
      btn.addEventListener('click', function () { api.toggle(); });
    },
    sparkle: function () {
      if (!enabled || !ctx || ctx.state !== 'running') return;
      var now = ctx.currentTime;
      if (now - lastSparkle < 0.11) return;
      lastSparkle = now;
      pluck(PENTA[Math.floor(Math.random() * PENTA.length)], now, 1.6, 0.05, true);
    },
    isOn: function () { return enabled; }
  };
  window.PokerIntroMusic = api;
})();
