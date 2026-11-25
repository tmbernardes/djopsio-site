/* DJOPS genre drum player: one file for guides.html, index-flyer.html and index-player.html.
   Put <div data-genre-player data-more-href="..." data-more-text="..."></div> where it goes and load this file with defer.
   It fetches assets/genre-patterns.json (written by tools/export_genre_player.py from the app repo's genre guide), draws a picker,
   the step grid and a Play / Stop button, and plays the pattern with a small Web Audio synth. Nothing plays until a button is pressed.

   SYNTH: the block between "--- synth, as in the guide ---" and "--- end of the synth ---" is the guide's own code, copied
   unchanged from docs/decisions/genre-guide-page/template.html in the app repo (the COLOR / NOTES / chord tables and drive() / gate(),
   then audio(), noise(), env() and hit() with all 27 sound kinds). Only the page wiring around it is this site's. When the guide's
   synth changes, `python3 tools/export_genre_player.py --check` says so (it hashes template.html) and this block is copied again. */
(function () {
  "use strict";

  /* --- synth, as in the guide --- */
const COLOR = { kick: "--kick", snare: "--snare", clap: "--snare", rim: "--snare", hat: "--hat", openhat: "--hat", shaker: "--hat",
  perc: "--perc", click: "--perc", bass: "--bass", sub: "--bass", psybass: "--bass", acid: "--lead", lead: "--lead", stab: "--pad", pad: "--pad" };
const NOTES = { C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5, "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11 };
function midi(n) { const m = /^([A-G]#?)(-?\d)$/.exec(n); return (Number(m[2]) + 1) * 12 + NOTES[m[1]]; }
function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
const QUAL = { "": [0, 4, 7], m: [0, 3, 7], m7: [0, 3, 7, 10], m9: [0, 3, 7, 10, 14], "7": [0, 4, 7, 10], maj7: [0, 4, 7, 11] };
function chord(name) { const m = /^([A-G]#?)(.*)$/.exec(name); const root = 48 + NOTES[m[1]]; return (QUAL[m[2]] || QUAL[""]).map(i => root + i); }
QUAL["5"] = [0, 7, 12];                       // power chord: root, fifth, octave (E5, D5, A5)
const CURVES = {};
function drive(k) {                           // tanh soft clip; k 1 = warm, 12 = crunch, 40 = fuzz
  if (!CURVES[k]) { const n = 2048, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i * 2 / (n - 1) - 1; c[i] = Math.tanh(k * x) / Math.tanh(k); } CURVES[k] = c; }
  return CURVES[k];
}
function gate(g, t, level, atk, dur, rel) {   // held note: attack, hold for the note's length, release
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(level, t + atk);
  g.gain.setValueAtTime(level, t + Math.max(atk, dur - rel)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + rel);
}
Object.assign(COLOR, { tambor: "--perc", slap: "--perc", caixa: "--snare", triangle: "--hat", crash: "--hat",
  guitar: "--lead", bassgtr: "--bass", scratch: "--pad", epiano: "--pad", piano: "--lead", sax: "--lead" });
/* A small synth: every sound is built in the browser, nothing is loaded. */
let ctx = null, out = null, current = null, comp = null;
function audio() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    comp = ctx.createDynamicsCompressor(); out = ctx.createGain(); out.gain.value = 0.7;
    out.connect(comp); comp.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}
/* The master FX (B3F8, the MPK dialog's "Show me": its K7 low-pass and K6 echo knobs): a low-pass over everything and an echo send, built the first time fx() is asked for, between `out` and the compressor. Nothing else calls fx(), so the genre players and the
   Library never get the nodes; fx(null) puts the filter open and the echo off and cuts any tail at once (a close, a stop). It is the same context and the same `out` every sound already goes through: no second audio path. */
let fxn = null, fxTimer = 0;
function fx(o) {
  if (!o && !fxn) return;
  audio();
  if (!fxn) {
    const lp = ctx.createBiquadFilter(), send = ctx.createGain(), dly = ctx.createDelay(1), fb = ctx.createGain(), ew = ctx.createGain();
    lp.type = "lowpass"; lp.frequency.value = 22000; lp.Q.value = 5; send.gain.value = 0; dly.delayTime.value = 0.357; fb.gain.value = 0.42;
    out.disconnect(); out.connect(lp); lp.connect(comp); lp.connect(send); send.connect(dly); dly.connect(fb); fb.connect(dly); dly.connect(ew); ew.connect(comp);
    fxn = { lp: lp, send: send, fb: fb, ew: ew };
  }
  const t = ctx.currentTime, set = (p, v) => { p.cancelScheduledValues(t); p.setTargetAtTime(v, t, 0.03); };
  if (!o) {
    fxn.lp.frequency.cancelScheduledValues(t); fxn.lp.frequency.setValueAtTime(22000, t); fxn.send.gain.cancelScheduledValues(t); fxn.send.gain.setValueAtTime(0, t);
    fxn.fb.gain.cancelScheduledValues(t); fxn.fb.gain.setValueAtTime(0, t); fxn.ew.gain.cancelScheduledValues(t); fxn.ew.gain.setValueAtTime(0, t);
    clearTimeout(fxTimer); fxTimer = setTimeout(() => { fxn.fb.gain.value = 0.42; fxn.ew.gain.value = 1; }, 700);
    return;
  }
  if (o.lp != null) set(fxn.lp.frequency, o.lp);
  if (o.echo != null) set(fxn.send.gain, o.echo);
}
/* One performance's own gain in front of `out` (B3F8): the MPK's "Show me" plays through it and cuts it dead on a stop, a close or another player, so a long note cannot ring on. */
function bus() { audio(); const b = ctx.createGain(); b.connect(out); return b; }
function busCut(b) { const t = ctx.currentTime; b.gain.cancelScheduledValues(t); b.gain.setValueAtTime(0, t); setTimeout(() => b.disconnect(), 80); }
let noiseBuf = null;
function noise() {
  if (!noiseBuf) { noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = ctx.createBufferSource(); s.buffer = noiseBuf; return s;
}
function env(g, t, peak, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dec); }
function hit(kind, t, vel, pitch, dur, note, laneWave, to) {   // `to`: a bus() made for one performance (B3F8); left out, the master `out`
  const dest = to || out, g = ctx.createGain(); g.connect(dest); vel = vel || 1;
  if (kind === "kick") { const o = ctx.createOscillator(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12); o.connect(g); env(g, t, 0.95 * vel, 0.38); o.start(t); o.stop(t + 0.4); }
  else if (["snare", "clap", "rim"].includes(kind)) { const n = noise(), f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = kind === "rim" ? 2400 : 1600; n.connect(f); f.connect(g); env(g, t, (kind === "rim" ? 0.3 : 0.5) * vel, kind === "rim" ? 0.05 : 0.18); n.start(t); n.stop(t + 0.2); }
  else if (["hat", "openhat", "shaker"].includes(kind)) { const n = noise(), f = ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = kind === "shaker" ? 5000 : 7500; n.connect(f); f.connect(g); env(g, t, (kind === "shaker" ? 0.18 : 0.25) * vel, kind === "openhat" ? 0.22 : 0.045); n.start(t); n.stop(t + 0.25); }
  else if (kind === "perc" || kind === "click") { const o = ctx.createOscillator(); o.type = kind === "click" ? "square" : "sine"; o.frequency.setValueAtTime(pitch || (kind === "click" ? 2400 : 320), t); o.frequency.exponentialRampToValueAtTime((pitch || 320) * 0.8, t + 0.1); o.connect(g); env(g, t, (kind === "click" ? 0.12 : 0.45) * vel, kind === "click" ? 0.02 : 0.16); o.start(t); o.stop(t + 0.2); }
  else if (kind === "tambor") {   // low hand drum / surdo / tom. pitch = body Hz (tamborzão 80-115, rock toms 100-150)
    const p0 = pitch || 110, o = ctx.createOscillator(); o.type = "sine";
    o.frequency.setValueAtTime(p0 * 1.6, t); o.frequency.exponentialRampToValueAtTime(p0, t + 0.04); o.frequency.exponentialRampToValueAtTime(p0 * 0.85, t + 0.3);
    o.connect(g); env(g, t, 0.8 * vel, 0.32); o.start(t); o.stop(t + 0.35);
    const n = noise(), f = ctx.createBiquadFilter(), ng = ctx.createGain(); f.type = "lowpass"; f.frequency.value = 900;
    n.connect(f); f.connect(ng); ng.connect(dest); env(ng, t, 0.25 * vel, 0.03); n.start(t); n.stop(t + 0.05);
  }
  else if (kind === "slap") {   // atabaque / conga slap, the "pá": short tone + bright crack
    const p0 = pitch || 420, o = ctx.createOscillator(); o.type = "triangle";
    o.frequency.setValueAtTime(p0 * 1.1, t); o.frequency.exponentialRampToValueAtTime(p0, t + 0.02);
    o.connect(g); env(g, t, 0.35 * vel, 0.07); o.start(t); o.stop(t + 0.1);
    const n = noise(), f = ctx.createBiquadFilter(), ng = ctx.createGain(); f.type = "bandpass"; f.frequency.value = 1800; f.Q.value = 1.2;
    n.connect(f); f.connect(ng); ng.connect(dest); env(ng, t, 0.4 * vel, 0.035); n.start(t); n.stop(t + 0.05);
  }
  else if (kind === "caixa") {   // pitched metallic snare (brega funk). pitch = Hz, so a lane can climb
    const p0 = pitch || 600;
    [1, 1.48].forEach((r, i) => { const o = ctx.createOscillator(), og = ctx.createGain(); o.type = i ? "square" : "triangle";
      o.frequency.setValueAtTime(p0 * r * 1.15, t); o.frequency.exponentialRampToValueAtTime(p0 * r, t + 0.03);
      og.gain.value = i ? 0.12 : 0.5; o.connect(og); og.connect(g); o.start(t); o.stop(t + 0.15); });
    const n = noise(), f = ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 3000; n.connect(f); f.connect(g);
    env(g, t, 0.4 * vel, 0.11); n.start(t); n.stop(t + 0.15);
  }
  else if (kind === "triangle") {   // forró triangle / metal clink: three inharmonic sines
    [4400, 6150, 8300].forEach((fr, i) => { const o = ctx.createOscillator(), og = ctx.createGain(); o.frequency.value = fr;
      og.gain.value = [1, 0.6, 0.35][i]; o.connect(og); og.connect(g); o.start(t); o.stop(t + 0.4); });
    env(g, t, 0.06 * vel, 0.35);
  }
  else if (kind === "crash") {   // long cymbal; loops the 1 s noise buffer so the tail can last 1.6 s
    const n = noise(); n.loop = true;
    const f = ctx.createBiquadFilter(), f2 = ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 4500;
    f2.type = "peaking"; f2.frequency.value = 8000; f2.gain.value = 6;
    n.connect(f); f.connect(f2); f2.connect(g); env(g, t, 0.22 * vel, 1.6); n.start(t); n.stop(t + 1.7);
  }
  else if (kind === "guitar") {   // distorted power chord: chord("E5") an octave down, detuned saw pairs -> highpass -> drive -> mid bump -> cabinet lowpass
    const hp = ctx.createBiquadFilter(), pre = ctx.createGain(), ws = ctx.createWaveShaper(), mid = ctx.createBiquadFilter(), cab = ctx.createBiquadFilter();
    hp.type = "highpass"; hp.frequency.value = 90; pre.gain.value = 4; ws.curve = drive(12); ws.oversample = "4x";
    mid.type = "peaking"; mid.frequency.value = 1200; mid.Q.value = 0.8; mid.gain.value = 4;
    cab.type = "lowpass"; cab.frequency.value = 4200; cab.Q.value = 0.9;
    hp.connect(pre); pre.connect(ws); ws.connect(mid); mid.connect(cab); cab.connect(g);
    chord(note).forEach(m => [-7, 7].forEach(d => { const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = hz(m - 12); o.detune.value = d;
      o.connect(hp); o.start(t); o.stop(t + dur + 0.1); }));
    gate(g, t, 0.13 * vel, 0.003, dur, 0.06);
  }
  else if (kind === "bassgtr") {   // electric bass: saw + sine through a plucked lowpass
    const fr = hz(midi(note)), f = ctx.createBiquadFilter(); f.type = "lowpass"; f.Q.value = 3; f.connect(g);
    f.frequency.setValueAtTime(1800, t); f.frequency.exponentialRampToValueAtTime(450, t + 0.12);
    [["sawtooth", 0.6], ["sine", 1]].forEach(([w, l]) => { const o = ctx.createOscillator(), og = ctx.createGain(); o.type = w; o.frequency.value = fr;
      og.gain.value = l; o.connect(og); og.connect(f); o.start(t); o.stop(t + dur + 0.06); });
    gate(g, t, 0.32 * vel, 0.004, dur, 0.04);
  }
  else if (kind === "scratch") {   // muted rhythm guitar ("chicken scratch"): a chord blip + string noise, 50 ms
    const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 1800; f.Q.value = 1.4; f.connect(g);
    chord(note).forEach(m => { const o = ctx.createOscillator(); o.type = "square"; o.frequency.value = hz(m + 12); o.connect(f); o.start(t); o.stop(t + 0.08); });
    const n = noise(), nf = ctx.createBiquadFilter(); nf.type = "bandpass"; nf.frequency.value = 2500; nf.Q.value = 2; n.connect(nf); nf.connect(g);
    n.start(t); n.stop(t + 0.05); env(g, t, 0.07 * vel, 0.05);
  }
  else if (kind === "epiano") {   // Rhodes-like FM: sine carrier, sine modulator at 1:1 whose depth decays
    chord(note).forEach(m => { const fr = hz(m), c = ctx.createOscillator(), mo = ctx.createOscillator(), mg = ctx.createGain();
      c.frequency.value = fr; mo.frequency.value = fr;
      mg.gain.setValueAtTime(fr * 2.5, t); mg.gain.exponentialRampToValueAtTime(fr * 0.2, t + 0.4);
      mo.connect(mg); mg.connect(c.frequency); c.connect(g);
      c.start(t); mo.start(t); c.stop(t + Math.max(0.25, dur) + 0.3); mo.stop(t + Math.max(0.25, dur) + 0.3); });
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09 * vel, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.25, dur) + 0.25);
  }
  else if (kind === "piano") {   // bright "MIDI piano" for brega keys: triangle + quiet square an octave up, filter closing
    const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.connect(g);
    f.frequency.setValueAtTime(5000, t); f.frequency.exponentialRampToValueAtTime(1400, t + 0.3);
    [[1, "triangle", 1], [2, "square", 0.15]].forEach(([r, w, l]) => { const o = ctx.createOscillator(), og = ctx.createGain(); o.type = w;
      o.frequency.value = hz(midi(note)) * r; og.gain.value = l; o.connect(og); og.connect(f); o.start(t); o.stop(t + 0.7); });
    env(g, t, 0.16 * vel, 0.6);
  }
  else if (kind === "sax") {   // saw through a nasal band, breath noise, vibrato that arrives late
    const fr = hz(midi(note)), o = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    o.type = "sawtooth"; o.frequency.value = fr; lfo.frequency.value = 5.5;
    lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(fr * 0.006, t + 0.25); lfo.connect(lg); lg.connect(o.frequency);
    const bp = ctx.createBiquadFilter(), lp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1100; bp.Q.value = 0.9;
    lp.type = "lowpass"; lp.frequency.value = 3200; o.connect(bp); bp.connect(lp); lp.connect(g);
    const n = noise(), nf = ctx.createBiquadFilter(), ng = ctx.createGain(); n.loop = true; nf.type = "bandpass"; nf.frequency.value = 1500; nf.Q.value = 0.7;
    ng.gain.value = 0.15; n.connect(nf); nf.connect(ng); ng.connect(lp);
    [o, lfo, n].forEach(x => { x.start(t); x.stop(t + dur + 0.1); });
    gate(g, t, 0.14 * vel, 0.04, dur, 0.08);
  }
  else { // pitched lanes: bass, sub, psybass, acid, lead, stab, pad
    const freqs = (kind === "pad" || kind === "stab") ? chord(note).map(hz) : [hz(midi(note))];
    const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.connect(g);
    const wave = laneWave || { sub: "sine", psybass: "sawtooth", acid: "sawtooth", lead: "square", stab: "triangle", pad: "sawtooth" }[kind];
    const level = { bass: 0.42, sub: 0.6, psybass: 0.38, acid: 0.16, lead: 0.1, stab: 0.14, pad: 0.05 }[kind];
    f.frequency.value = { bass: 700, sub: 300, psybass: 900, acid: 600, lead: 2500, stab: 1800, pad: 1200 }[kind];
    if (kind === "acid") { f.Q.value = 12; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(2400, t + dur * 0.4); f.frequency.exponentialRampToValueAtTime(500, t + dur); }
    if (kind === "psybass") { f.frequency.setValueAtTime(1400, t); f.frequency.exponentialRampToValueAtTime(250, t + dur * 0.9); }
    freqs.forEach((fr, i) => { const o = ctx.createOscillator(); o.type = wave || "sine"; o.frequency.value = fr; if (kind === "pad") o.detune.value = (i % 2 ? 7 : -7); o.connect(f); o.start(t); o.stop(t + dur + 0.05); });
    const atk = kind === "pad" ? 0.25 : 0.008;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(level * vel, t + atk);
    g.gain.setValueAtTime(level * vel, t + Math.max(atk, dur - 0.04)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.04);
  }
}
  /* --- end of the synth --- */

  /* ---- the site's wiring: picker, grid, scheduler ---- */
  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var players = [];
  var active = null;                       /* the one player that is making sound; starting another stops this one */

  /* Sound unlock. Browsers (Safari and iOS above all) keep audio shut until a press, and a context that is created or
     resumed outside that press stays silent with no error. So: the context is made and resumed INSIDE the Play click,
     a one-sample silent buffer is played in the same press (the classic unlock), iOS is told this is playback, and nothing
     is scheduled until the context really is "running". U19: the wait has ONE limit. A context that is not running
     HELD_MS after the press (a frame's sandbox or sound policy keeps it shut) rejects with Error("blocked"), and every player
     goes back to rest and asks soundBlocked for the line, so no card sits "Running" in silence. */
  var HELD_MS = 1500, held = null;
  function inFrame() { try { return window.top !== window; } catch (e) { return true; } }
  function clearHeld() {
    if (!held) return;
    var h = held; held = null;
    h.el.removeAttribute("data-held"); h.el.classList.remove("held-line");
    if (h.el.textContent === h.said) { h.el.textContent = h.text; h.el.hidden = h.hidden; }
  }
  /* The ONE held-sound line, shown in the pressed player's own status line (`where`). It never exists until sound is held, and the next press takes it away. */
  function soundBlocked(where, err) {
    clearHeld();
    if (!where) return;
    var fr = inFrame(), blocked = !err || err.message === "blocked";   /* any other failure (the sound did not load) keeps the old plain words */
    var said = !blocked ? "Sound is not available in this browser." : fr ? "This frame is holding the sound back. Open the page in its own tab to hear it." : "Your browser is holding the sound back. Press Play again, then check the volume.";
    held = { el: where, text: where.textContent, hidden: where.hidden, said: said };
    where.textContent = said; where.hidden = false; where.setAttribute("data-held", blocked ? (fr ? "frame" : "page") : "error"); where.classList.add("held-line");
  }
  function unlock(where) {
    var c = audio();
    clearHeld();
    try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}
    try { var b = c.createBuffer(1, 1, 22050), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0); } catch (e) {}
    if (!c.djopsWatched) {
      c.djopsWatched = true;
      c.addEventListener("statechange", function () {
        if (c.state === "running") clearHeld();
        else if (c.state === "interrupted" || c.state === "suspended") { if (active) c.resume(); }
      });
    }
    if (c.state === "running") return Promise.resolve(c);
    return new Promise(function (ok, no) {
      var over = false, blocked = function () { if (over) return; over = true; if (where) soundBlocked(where); no(new Error("blocked")); };
      var t = setTimeout(blocked, HELD_MS);
      c.resume().then(function () { if (over) return; over = true; clearTimeout(t); ok(c); }, function () { clearTimeout(t); blocked(); });
    });
  }

  /* One step of a pattern: every lane that has a hit on step s plays it at time t. `filter(lane)` lets a caller leave lanes out
     (the landing page's sample track drops the kick in a break). The genre players and that track share this one function. */
  function playStep(p, s, t, step, filter) {
    p.lanes.forEach(function (l) {
      if (filter && !filter(l)) return;
      if (l.notes) {
        l.notes.forEach(function (n) { if (n[0] === s) hit(l.kind, t, l.vel, 0, n[1] * step * 0.95, n[2], l.wave); });
      } else {
        var k = l.steps.indexOf(s);
        if (k > -1) hit(l.kind, t, l.vel, l.pitch ? l.pitch[k] : 0);
      }
    });
  }
  var dataPromise = null;
  function loadData(src) {
    if (!dataPromise) dataPromise = fetch(src || "assets/genre-patterns.json").then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
    return dataPromise;
  }
  function claim(api) { if (active && active !== api) active.stop(); active = api; }       /* the one thing making sound; starting another stops this */
  function release(api) { if (active === api) active = null; }

  function h(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function mount(root) {
    var src = root.getAttribute("data-src") || "assets/genre-patterns.json";
    loadData(src).then(function (data) {
      build(root, data);
    }).catch(function () {
      var f = root.querySelector("[data-gp-fallback]");
      if (f) f.textContent = "The drum player could not load. Reload the page to try again.";
    });
  }

  /* The genre picker: quick chips (data.featured) plus the grouped list of every genre. Used by the genre players and by the
     landing page's sample track, so both pick the same way. onPick(key) is called on a press; set(key) only moves the highlight.
     `host` (optional) is the element the picker is for: data-picker="select" on it leaves out the chip row, so the landing page's two pickers
     (the sample track's and the Hear every genre player's) are the one dropdown. guides.html sets no attribute and keeps its chips. */
  function makePicker(data, uid, onPick, host) {
    var P = data.patterns;
    var selectOnly = !!(host && host.getAttribute && host.getAttribute("data-picker") === "select");
    var top = h("div", "gp-top" + (selectOnly ? " gp-top-select" : ""));
    var chips = h("div", "gp-chips");
    chips.setAttribute("role", "group");
    chips.setAttribute("aria-label", "Quick picks");
    var chipEls = selectOnly ? [] : data.featured.map(function (f) {
      var b = h("button", "gp-chip", f.label);
      b.type = "button";
      b.addEventListener("click", function () { onPick(f.key); });
      chips.appendChild(b);
      return { key: f.key, el: b };
    });
    var pickWrap = h("div", "gp-pick");
    var lab = h("label", null, "All genres");
    lab.setAttribute("for", uid + "-sel");
    var sel = h("select");
    sel.id = uid + "-sel";
    data.families.forEach(function (fam) {
      var g = document.createElement("optgroup");
      g.label = fam.name;
      fam.patterns.forEach(function (k) {
        var o = document.createElement("option");
        o.value = k; o.textContent = P[k].name;
        g.appendChild(o);
      });
      sel.appendChild(g);
    });
    sel.addEventListener("change", function () { onPick(sel.value); });
    pickWrap.appendChild(lab); pickWrap.appendChild(sel);
    if (!selectOnly) top.appendChild(chips);
    top.appendChild(pickWrap);
    return {
      el: top, chipEls: chipEls, sel: sel, selectOnly: selectOnly,
      set: function (k) {
        sel.value = k;
        chipEls.forEach(function (c) { c.el.setAttribute("aria-pressed", c.key === k ? "true" : "false"); });
      }
    };
  }

  function build(root, data) {
    var P = data.patterns, key = data.first, playing = false;
    var run = null;                        /* the live scheduler: {timer, shown, token} */
    var token = 0, pressId = 0;
    var cols = [];                         /* cols[step] = the grid cells of that step */
    var mute = new Set(), solo = new Set();   /* lane numbers: Mute and Solo per lane (U13). Solo wins: with any lane soloed, only soloed lanes sound */
    var laneEls = [];                      /* laneEls[lane] = the cells and notes of that lane, dimmed while it is silent */
    var scroller = null;

    root.textContent = "";
    root.classList.add("gplayer");
    var uid = "gp" + (players.length + 1);

    /* picker row: quick chips, then the full list (one picker, shared with the landing page's sample track) */
    var picker = makePicker(data, uid, function (k) { select(k); }, root);
    var top = picker.el;

    /* the head: name, tempo, play */
    var head = h("div", "gp-head");
    var title = h("b", "gp-name");
    var meta = h("span", "gp-meta mono");
    var play = h("button", "gp-play");
    play.type = "button";
    play.setAttribute("aria-pressed", "false");
    play.innerHTML = '<svg class="i-play" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z"/></svg>' +
      '<svg class="i-stop" viewBox="0 0 16 16" aria-hidden="true" hidden><path d="M3.5 3.5h9v9h-9z"/></svg><span>Play</span>';
    head.appendChild(title); head.appendChild(meta); head.appendChild(play);

    var scroll = h("div", "gp-scroll");
    scroll.tabIndex = 0;
    scroll.setAttribute("role", "group");
    var grid = h("div", "gp-grid");
    scroll.appendChild(grid);
    scroller = scroll;
    var hint = h("p", "gp-hint");
    var status = h("p", "gp-status");
    status.setAttribute("role", "status");
    status.hidden = true;

    var foot = h("p", "gp-foot");
    var moreHref = root.getAttribute("data-more-href");
    if (moreHref) {
      var a = h("a", null, root.getAttribute("data-more-text") || "More genres and examples in the full guide");
      a.href = moreHref;
      a.appendChild(h("span", "arr", " →"));
      a.lastChild.setAttribute("aria-hidden", "true");
      foot.appendChild(a);
    }
    var note = root.getAttribute("data-note");
    if (note) foot.appendChild(h("span", "gp-note", note));

    if (picker.selectOnly) head.insertBefore(top, head.firstChild);   /* the dropdown alone shares the head's row (name, tempo, Play): the chip row's space is saved */
    else root.appendChild(top);
    root.appendChild(head); root.appendChild(scroll); root.appendChild(hint); root.appendChild(status);
    if (foot.childNodes.length) root.appendChild(foot);

    function drawGrid(p) {
      var N = p.steps_total || 16, bar = function (s) { return s && s % 16 === 0 ? " bar" : ""; };
      grid.textContent = "";
      grid.style.setProperty("--n", N);
      cols = []; laneEls = []; mute = new Set(); solo = new Set();
      for (var s = 0; s < N; s++) cols.push([]);
      function add(el, s) { grid.appendChild(el); if (s != null) cols[s].push(el); return el; }
      grid.appendChild(h("div", "gp-lab"));
      for (var s2 = 0; s2 < N; s2++) {
        var num = h("div", "gp-num" + (s2 % 4 ? "" : " beat") + bar(s2), s2 % 4 ? "·" : String(s2 / 4 + 1));
        add(num, s2);
      }
      p.lanes.forEach(function (lane, li) {
        var row = li + 2, color = "var(" + (COLOR[lane.kind] || "--perc") + ")";
        var els = laneEls[li] = [], mine = function (el) { el.setAttribute("data-l", String(li)); els.push(el); return el; };
        var l = h("div", "gp-lab");
        l.style.gridRow = String(row);
        l.appendChild(msButton("m", lane.label, li)); l.appendChild(msButton("s", lane.label, li));
        l.appendChild(h("span", null, lane.label));
        l.title = lane.label;
        grid.appendChild(l);
        if (lane.notes) {
          for (var s3 = 0; s3 < N; s3++) {
            var bg = h("div", "gp-cell" + (s3 % 4 ? "" : " beat") + bar(s3));
            bg.style.gridRow = String(row); bg.style.gridColumn = String(s3 + 2);
            add(mine(bg), s3);
          }
          lane.notes.forEach(function (n) {
            var nt = h("div", "gp-note-cell", n[1] > 1 ? n[2] : "");
            nt.style.setProperty("--c", color);
            nt.style.gridRow = String(row); nt.style.gridColumn = (n[0] + 2) + " / span " + n[1];
            nt.title = n[2];
            grid.appendChild(mine(nt));
          });
        } else {
          var on = {}, soft = (lane.vel || 1) < 0.5;
          lane.steps.forEach(function (st) { on[st] = true; });
          for (var s4 = 0; s4 < N; s4++) {
            var c = h("div", "gp-cell" + (s4 % 4 ? "" : " beat") + bar(s4) + (on[s4] ? (soft ? " soft" : " on") : ""));
            c.style.setProperty("--c", color);
            c.style.gridRow = String(row); c.style.gridColumn = String(s4 + 2);
            add(mine(c), s4);
          }
        }
      });
      scroll.setAttribute("aria-label", p.name + ": two bars, " + N + " steps. Scroll sideways to see all of it.");
      scroll.scrollLeft = 0;
    }

    /* Mute and Solo (U13; behaviour and labels as in the guide's template.html). Live: schedule() asks audible() on every step. */
    function audible(li) { return solo.size ? solo.has(li) : !mute.has(li); }
    function dim() {
      laneEls.forEach(function (els, li) { var q = !audible(li); els.forEach(function (e) { e.classList.toggle("silent", q); }); });
    }
    function msButton(kind, label, li) {
      var word = kind === "m" ? "Mute" : "Solo", b = h("button", "ms " + kind, kind === "m" ? "M" : "S");
      b.type = "button";
      b.setAttribute("aria-pressed", "false");
      b.title = word + " " + label;
      b.setAttribute("aria-label", word + " " + label);
      b.addEventListener("click", function () {
        var set = kind === "m" ? mute : solo;
        if (set.has(li)) set.delete(li); else set.add(li);
        b.setAttribute("aria-pressed", String(set.has(li)));
        dim();
      });
      return b;
    }

    function show(k) {
      var p = P[k];
      title.textContent = p.name;
      meta.textContent = p.bpm + " BPM" + (p.swing ? " · swing" : "") + " · 2 bars";
      hint.textContent = p.hint;
      picker.set(k);
      drawGrid(p);
    }

    function setPlayUI(on) {
      play.setAttribute("aria-pressed", on ? "true" : "false");
      play.querySelector("span").textContent = on ? "Stop" : "Play";
      play.querySelector(".i-play").toggleAttribute("hidden", on);   /* an SVG has no .hidden property: the attribute hides it (B3F3) */
      play.querySelector(".i-stop").toggleAttribute("hidden", !on);
    }

    function clearNow() {
      if (!run) return;
      run.shown.forEach(function (x) { x.classList.remove("now"); });
      run.shown = [];
    }

    function follow(el) {
      /* keep the playing step in view on a narrow screen, where the grid scrolls sideways */
      if (scroller.scrollWidth <= scroller.clientWidth + 1) return;
      var r = el.getBoundingClientRect(), c = scroller.getBoundingClientRect(), lw = grid.firstChild.getBoundingClientRect().width;
      if (r.left < c.left + lw || r.right > c.right) scroller.scrollLeft += r.left - (c.left + lw + 8);
    }

    function schedule() {
      /* the guide's own loop: 16th-note steps, lookahead 120 ms, swing on every odd step, two bars of N steps, then round again */
      stopSched();
      var p = P[key], N = p.steps_total || 16, step = 60 / p.bpm / 4;
      var next = ctx.currentTime + 0.06, s = 0, my = ++token;
      var r = { timer: null, shown: [], token: my };
      var laneOn = function (l) { return audible(p.lanes.indexOf(l)); };
      run = r;
      var tick = function () {
        while (next < ctx.currentTime + 0.12) {
          var t = next + (s % 2 ? (p.swing || 0) * step : 0);
          playStep(p, s, t, step, laneOn);
          (function (show, delay) {
            setTimeout(function () {
              if (run !== r) return;
              clearNow();
              var cells = cols[show] || [];
              r.shown = REDUCED ? cells.filter(function (x) { return x.classList.contains("gp-num"); }) : cells.slice();
              r.shown.forEach(function (x) { x.classList.add("now"); });
              if (cells[0]) follow(cells[0]);
              api.step = show;
            }, delay);
          })(s, Math.max(0, (t - ctx.currentTime) * 1000));
          next += step; s = (s + 1) % N;
        }
      };
      r.timer = setInterval(tick, 25);
      tick();
    }

    function stopSched() {
      if (!run) return;
      clearInterval(run.timer);
      clearNow();
      run = null;
    }

    function start() {
      if (active && active !== api) active.stop();
      active = api;
      playing = true; setPlayUI(true); status.hidden = true;
      var press = ++pressId;
      /* unlock() runs inside the click; scheduling waits until the context is running */
      var ready = unlock(status);
      ready.then(function () {
        if (playing && press === pressId) { status.hidden = true; schedule(); }
      }, function () {
        if (playing && press === pressId) { playing = false; setPlayUI(false); stopSched(); if (active === api) active = null; }   /* held: back to rest, the line stays */
      });
    }
    function stop() {
      playing = false; ++pressId; status.hidden = true; setPlayUI(false); stopSched();
      if (active === api) active = null;
    }
    function select(k) {
      if (!P[k]) return;
      key = k;
      show(k);
      if (playing && ctx && ctx.state === "running") schedule();             /* switching genre keeps playing, from the new pattern's first step */
    }

    play.addEventListener("click", function () { playing ? stop() : start(); });
    var api = { root: root, select: select, start: start, stop: stop, step: -1,
                get key() { return key; }, get playing() { return playing; }, keys: Object.keys(P) };
    root.djopsDrums = api;
    players.push(api);
    show(key);
    root.dispatchEvent(new CustomEvent("djops-drums-ready", { bubbles: true }));
  }

  document.addEventListener("visibilitychange", function () { if (document.hidden && active) active.stop(); });
  window.DJOPSDrums = { players: players, mount: mount, load: loadData, unlock: unlock, soundBlocked: soundBlocked, playStep: playStep, picker: makePicker, hit: hit, fx: fx, bus: bus, busCut: busCut, claim: claim, release: release,
                        context: function () { return ctx; } };
  function init() { [].forEach.call(document.querySelectorAll("[data-genre-player]"), mount); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
