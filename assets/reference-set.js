/* DJOPS reference set: one made-up night and one made-up Tech House track that every visual on the landing page reads.
   MAP   the track's map (sections, camera cuts, moments, clips, recap, raw files), all in bars and seconds
   scenes four camera angles and the 360 file's whole frame as SVG symbols, built by pure string functions (Node at build time, the page at run time)
   energy(n) the track's loudness as n bar heights, for the waves
   engine one clock + one sound for every view: play(from, until, who), pause(), seek(s), time(), on(fn), owner
   The sound is assets/drums.js (the genre guide's Tech House pattern plus a few synth voices); nothing plays before a press.
   Illustration only: no real footage, no recording. Pure strings and numbers here, no DOM, so Node can load it. */
(function (root, factory) {
  var m = factory(typeof window !== "undefined" ? window : null);
  if (typeof module === "object" && module.exports) module.exports = m; else root.DJOPSRef = m;
})(typeof self !== "undefined" ? self : this, function (win) {
  "use strict";

  /* ---------- 1. the map ---------- */
  var BPM = 126, STEP = 60 / BPM / 4, BAR = STEP * 16, BARS = 64, TOTAL = BAR * BARS;
  function clock(s) { s = Math.floor(s + 1e-6); return Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60); }
  /* the set's sections, named as the app names a situation (camera-map/cameraMapLanes.ts SITUATION_COLORS); a repeated name is numbered in time order, as the app's enumerateLabels does.
     The break before the first drop is a Breakdown, the second break holds the vocal, and the outro is the stripped-back groove after the peak. */
  var SECTIONS = [["Low-energy intro", 0, 8], ["Steady groove 1", 8, 16], ["Build-up", 16, 24], ["Breakdown", 24, 28], ["Drop / impact 1", 28, 40], ["Vocal / hook", 40, 46], ["Drop / impact 2", 46, 56], ["Steady groove 2", 56, 64]];
  /* the app's nine situation colours, verbatim (camera-map/cameraMapLanes.ts SITUATION_COLORS); the structure strip paints a section in the colour of its situation, with the number dropped */
  var SITUATIONS = { "Drop / impact": "#ff4d4d", "Pre-drop punch": "#ff7a2e", "Peak energy": "#ff9f1c", "Build-up": "#ffcf33", "Steady groove": "#3fb98f", "Breakdown": "#4d9bff", "Low-energy intro": "#6c7bdb", "Vocal / hook": "#ff5cc8", "Harmonic / solo": "#b47cff" };
  /* the camera colours: the app's laneColors.camColor for this set's four angles, one per angle. Temperature says what the camera shows (dj 12-45 deg, crowd 68-100, landscape 175-215), brightness which one it is
     (slot = position among the cameras in its band, in lane order close, wide, drone, side: the two dj angles are slots 0 and 1, the Crowd Camera and the Drone Camera the landscape slots 0 and 1). The 360 DJ Camera's two angles are tagged dj,
     the Crowd Camera and the Drone Camera landscape; none lies within 15 deg of the brand hue 87.
     Generated with the app's own formula (bandColor: sat .70, lightness .86/.50/.74/.44, hue lo + (hi - lo) * slot / 3):
       node -e 'const h=(H,S,L)=>{const c=(1-Math.abs(2*L-1))*S,x=c*(1-Math.abs(H/60%2-1)),m=L-c/2,g=Math.floor(H/60)%6,[r,G,b]=[[c,x,0],[x,c,0],[0,c,x],[0,x,c],[x,0,c],[c,0,x]][g];return "#"+[r,G,b].map(v=>Math.round((v+m)*255).toString(16).padStart(2,"0")).join("")};
         const L=[.86,.5,.74,.44],B={dj:[12,45],crowd:[68,100],landscape:[175,215]},f=(t,i)=>h(B[t][0]+(B[t][1]-B[t][0])*i/3,.7,L[i]);console.log(f("dj",0),f("dj",1),f("landscape",0),f("landscape",1))'   ->  #f4ccc2 #d96b26 #c2f4f0 #26c0d9 */
  var LANE_COLORS = { close: "#f4ccc2", side: "#d96b26", wide: "#c2f4f0", drone: "#26c0d9" };
  var CUTS = [[0, "side"], [4, "wide"], [8, "close"], [10, "drone"], [12, "side"], [14, "close"], [16, "wide"], [18, "close"], [20, "drone"], [22, "close"], [24, "side"], [28, "wide"],
    [32, "drone"], [34, "close"], [36, "wide"], [38, "side"], [40, "close"], [46, "drone"], [50, "wide"], [52, "close"], [54, "side"], [56, "wide"], [60, "side"]];
  function sectionAt(bar) { var s = SECTIONS[0]; SECTIONS.forEach(function (x) { if (bar >= x[1]) s = x; }); return s; }
  function camAt(bar) { var c = CUTS[0][1]; CUTS.forEach(function (x) { if (bar >= x[0]) c = x[1]; }); return c; }
  var SHOTS = CUTS.map(function (c, i) { var e = i + 1 < CUTS.length ? CUTS[i + 1][0] : BARS; return { cam: c[1], bar: c[0], bars: e - c[0], from: c[0] * BAR, to: e * BAR }; });
  /* three moments, the kinds the app finds (the drop, the second drop, a crowd reaction); the landing shows a clip as 5 s before and 10 s after the drop (15 s), whole seconds (the app's own default is 10 s each side; this page is the only place that differs).
     The app's default is 2 clips on a new set, so the first two moments are ticked and the crowd reaction is left for the recap. */
  var MOMENTS = [["M1", 28, "The drop"], ["M2", 46, "The second drop"], ["M3", 57, "Crowd reaction"]].map(function (m) {
    return { id: m[0], bar: m[1], t: m[1] * BAR, name: m[2], at: clock(Math.round(m[1] * BAR)) };
  });
  var CLIPS = MOMENTS.slice(0, 2).map(function (m, i) { var c = Math.round(m.t); return { id: "C" + (i + 1), moment: m.id, from: c - 5, to: c + 10 }; });
  /* the recap: up to 5 moments, 2 s before and 2 s after each = 20 s, on bars no clip uses (the build, the break, the vocal break, the middle of drop 2, the crowd reaction) */
  var RECAP = [16, 24, 40, 52, 57].map(function (b, i) { return { id: "R" + (i + 1), bar: b, t: b * BAR, from: b * BAR - 2, to: b * BAR + 2 }; });
  /* the four angles, named for the cameras a DJ night has (his words, 18 Nov: Crowd Camera, Drone Camera, 360 DJ Camera) and tagged by what each shows (dj / crowd / landscape): the 360 DJ Camera gives a close view in front of the decks and a side view (its lanes are "360 DJ \u00B7 Close" and "360 DJ \u00B7 Side": a lane header holds two short lines),
     the Crowd Camera and the Drone Camera are landscapes */
  var ANGLES = { wide: { label: "Crowd Camera", tag: "landscape" }, close: { label: "360 DJ \u00B7 Close", tag: "dj" }, side: { label: "360 DJ \u00B7 Side", tag: "dj" }, drone: { label: "Drone Camera", tag: "landscape" } };
  /* the raw files, by kind: three video files and the recording. One 360 file gives two angles and lines up once; view = the one picture its card draws (the 360 file's is the whole 2:1 frame). offset = seconds from the recording's start */
  var FILES = [["CAM_crowd.mov", "Crowd Camera", ["wide"], "wide", -108], ["360_dj.mp4", "360 DJ Camera", ["close", "side"], "360", 3], ["CAM_drone.mp4", "Drone Camera", ["drone"], "drone", 27], ["set_audio.wav", "Recorded audio", [], "", 0]]
    .map(function (f) { return { name: f[0], kind: f[1], cams: f[2], view: f[3], offset: f[4] }; });
  /* the windows each slot plays, written ONCE (Batch 3 fix 1; Grow's slots, the hero and the post read them): a clip's one window, then the recap's five cuts. into(t, seg): the seconds of `seg` heard by time t (a window that ran out
     counts whole); with no t, the whole length */
  var SEGS = CLIPS.map(function (c) { return [[c.from, c.to]]; }).concat([RECAP.map(function (r) { return [r.from, r.to]; })]);
  function into(t, seg) {
    var el = 0;
    for (var j = 0; j < seg.length; j++) { if (t == null || t > seg[j][1] + .05) { el += seg[j][1] - seg[j][0]; continue; } el += Math.max(0, t - seg[j][0]); break; }
    return el;
  }
  var MAP = { bpm: BPM, step: STEP, bar: BAR, bars: BARS, total: TOTAL, sections: SECTIONS, situations: SITUATIONS, laneColors: LANE_COLORS, cuts: CUTS, shots: SHOTS, moments: MOMENTS, clips: CLIPS, recap: RECAP, files: FILES, angles: ANGLES,
    segs: SEGS, into: into,
    sectionAt: sectionAt, camAt: camAt, camAtSec: function (t) { return camAt(Math.min(BARS - 1, Math.max(0, Math.floor(t / BAR)))); }, clock: clock };

  /* how loud bar b is, 0..1 */
  function level(b) {
    var k = (b - sectionAt(b)[1]) / (sectionAt(b)[2] - sectionAt(b)[1]), i = SECTIONS.indexOf(sectionAt(b));   /* 0 intro, 1 groove, 2 build, 3 break, 4 drop, 5 vocal break, 6 drop 2, 7 outro */
    return i === 0 ? .16 + .12 * k : i === 1 ? .5 + .08 * k : i === 2 ? .56 + .4 * k : i === 3 ? .26 : i === 5 ? .34 + .26 * k : i === 7 ? .56 - .36 * k : 1;
  }
  function energy(n) {
    var out = [];
    for (var i = 0; i < n; i++) {
      var b = (i + .5) * BARS / n, v = level(b) * (.9 + .1 * Math.sin(b * 2.3)) + .04 * Math.sin(b * 7.1);
      out.push(Math.max(10, Math.min(100, Math.round(v * 100))));
    }
    return out;
  }

  /* the energy line (BRAND-SPEC 5b-1): the loudness bars smoothed (a 5-bar average) and drawn as ONE line through their middles, in a box 10 units wide per bar and 100 high, scaled to fill its wave (preserveAspectRatio none).
     Each step is a cubic with flat ends, so a drop is an S, never an overshoot; the path is relative and whole numbers, about 15 characters a bar. energySvg is the markup a wave holds; Node (the build) and the page (the hero) both call it. */
  function energySmooth(h) {   /* the line's own heights, whole numbers 0-100: a moment's dot sits at this height, so it lies ON the line */
    var y = [];
    for (var i = 0; i < h.length; i++) { var a = 0, c = 0; for (var k = -2; k <= 2; k++) if (h[i + k] != null) { a += h[i + k]; c++; } y.push(Math.round(a / c)); }
    return y;
  }
  function energyLine(h) {
    var s = energySmooth(h), d = "";
    for (var j = 0; j < s.length; j++) d += j === 0 ? "M5 " + (100 - s[0]) : (s[j] === s[j - 1] ? "h10" : "c5 0 5 " + (s[j - 1] - s[j]) + " 10 " + (s[j - 1] - s[j]));
    return d;
  }
  /* the playhead marker (BRAND-SPEC 5b-2): its place, and the time chip it carries (data-time); the chip flips to the left of the line near the right edge. One implementation for every wave on the page. */
  function playhead(el, frac, text) {
    el.style.left = (frac * 100).toFixed(3) + "%";
    if (text != null) { el.setAttribute("data-time", text); if (frac > .86) el.setAttribute("data-flip", ""); else el.removeAttribute("data-flip"); }
  }
  function energySvg(h) { return '<svg class="energy" viewBox="0 0 ' + h.length * 10 + ' 100" preserveAspectRatio="none" aria-hidden="true"><path d="' + energyLine(h) + '"/></svg>'; }
  /* the same line drawn once and used by several waves that share its bars: energyDefs(id, h) is the one path (in a hidden svg, like the scenes' symbols), energyUse(id, n) a wave's svg that points at it */
  function energyDefs(id, h) { return '<svg class="ref-defs" width="0" height="0" aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden"><defs><path id="' + id + '" vector-effect="non-scaling-stroke" d="' + energyLine(h) + '"/></defs></svg>'; }
  function energyUse(id, n) { return '<svg class="energy" viewBox="0 0 ' + n * 10 + ' 100" preserveAspectRatio="none" aria-hidden="true"><use href="#' + id + '"/></svg>'; }

  /* ---------- 2. the scenes ---------- */
  function rng(seed) { var s = seed; return function () { s = s * 16807 % 2147483647; return s / 2147483647; }; }
  function f1(v) { return Math.round(v * 10) / 10; }
  function R(x, y, w, h, f, e) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + f + '"' + (e || "") + '/>'; }
  function Ci(x, y, r, f, e) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + f + '"' + (e || "") + '/>'; }
  function El(x, y, rx, ry, f, e) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + f + '"' + (e || "") + '/>'; }
  function Pa(d, f, e) { return '<path d="' + d + '" fill="' + f + '"' + (e || "") + '/>'; }
  function Po(pts, f, e) { return '<polygon points="' + pts + '" fill="' + f + '"' + (e || "") + '/>'; }
  function G(c, t, inner, e) { return '<g' + (c ? ' class="' + c + '"' : "") + (t ? ' transform="' + t + '"' : "") + (e || "") + '>' + inner + '</g>'; }
  function St(c, w, o) { return ' stroke="' + c + '" stroke-width="' + w + '"' + (o ? ' opacity="' + o + '"' : ""); }
  var LIME = "#9EFF00", SKIN = "url(#ref-skin)", SHADE = "#4C8A00", DK = "#171717", GR = "#2A2A2A", WASH = '<rect class="sc-wash" width="320" height="180" fill="#9EFF00"/>';
  var BEAM = "url(#ref-beam)", GLOW = "url(#ref-glow)", SKY = '<rect width="320" height="180" fill="url(#ref-sky)"/>';
  var Z = function (x, y, a, b, c) { return "translate(" + x + " " + y + ")" + (a ? " rotate(" + a + ")" : "") + (b ? " scale(" + b + (c ? " " + c : "") + ")" : ""); };

  /* the DJ alien's head: Alien A (box x -34..34, y 0..98; the hood collar runs to y 114). o: x, y, s, hp (headphones, default on), col (collar, default on). The mouth is a flat line. */
  var HOOD = "#1D251D", MOUTH = "#2E5200", BRO = "#3F7A00", LN = St("#3C463A", 1.2);
  function eyeL() {
    return Pa("M-31 46.5C-22 43.5-11 48-5 58C-15 67-27 63-31 46.5Z", "#101010") + Ci(-17, 56, 9, GLOW, ' opacity=".55"') + El(-17, 56, 5.6, 3, LIME, ' transform="rotate(30 -17 56)"') + Ci(-22.5, 51.5, 1.1, "#F2F2F2") +
      Pa("M-34 41C-23 37-10 43-2.5 55L-6 57.5C-11 49-23 43.5-32 46.5Z", BRO);
  }
  function cup(x, y, h) { return '<rect x="' + x + '" y="' + y + '" width="14" height="' + h + '" rx="5" fill="#2C2C2C" stroke="#4A4A4A" stroke-width="1.2"/>'; }
  function alienHead(o) {
    return G("", Z(o.x, o.y, 0, o.s || 1), (o.col === false ? "" : Pa("M-32 86C-16 101 16 101 32 86L44 114H-44Z", HOOD, LN) + Pa("M-26 98C-12 108 12 108 26 98", "none", LN)) +
      Pa("M0 0C23 0 35 19 34 41C33 63 22 84 0 98C-22 84-33 63-34 41C-35 19-23 0 0 0Z", SKIN) + Pa("M-34 41C-33 63-22 84 0 98C-11 82-24 66-26 44Z", SHADE, ' opacity=".55"') + Pa("M25 10C33 22 35 44 31 66", "none", St("#E4FFA6", 2, ".7")) +
      G("", "", G("eye", "", eyeL())) + G("", "scale(-1 1)", G("eye", "", eyeL())) + Pa("M-6.5 86H6.5", "none", St(MOUTH, 2.2)) +
      (o.hp === false ? "" : Pa("M-41 58C-47-14 47-14 41 58", "none", St("#4A4A4A", 5.5)) + cup(-48, 40, 28) + cup(34, 40, 28) + Pa("M38 49v10M41 47v14", "none", St("#A6A6A6", 2)) + Pa("M44 49v10", "none", St(LIME, 2))));
  }
  /* an alien cat (centre 0,0); the crowd's cats are the same shape. o: x, y, s, fill */
  function catHead(o) { return G("", Z(o.x, o.y, 0, o.s || 1), '<use href="#ref-ch"/>', ' fill="' + (o.fill || "#243818") + '"'); }
  /* a crowd row: n heads at depth 0 (front) .. 2 (back), `mix` of them cats, `arms` = hands that --hands raises.
     Each member is ONE <use> of a whole alien or cat (#ref-al / #ref-ct: body + head, in PARTS) placed by its transform; a raised arm is one <use> of #ref-arm in the row's
     colour (color= on the <use>, read by the part's currentColor), inside the .sc-arm group --hands scales. Drawn in full, the 119 members were 16 KB of the page (U6 trim). */
  var DEPTH = [{ y: 170, s: .86, c: "#2E4A18", h: -4 }, { y: 142, s: .55, c: "#1F3312", h: -2.6 }, { y: 120, s: .36, c: "#14230C", h: -1.6 }];
  function crowdRow(n, depth, mix, arms, seed, dy, x0, x1) {
    var d = DEPTH[depth], r = rng(seed || 7 + depth * 13), out = "", a = x0 || 0, w = (x1 || 320) - a;
    for (var k = 0; k < n; k++) {
      var x = f1(a + (k + .5 + (r() - .5) * .5) * w / n), y = f1(d.y + (dy || 0) + (r() - .5) * 8 + (k % 2) * 3), cat = r() < mix, s = f1(d.s * (.9 + r() * .2)), who = '<use href="#ref-' + (cat ? "ct" : "al") + '"', t = Z(x, y, 0, s);
      out += arms && r() < .8 ? G("", t, G("sc-arm", "", '<use href="#ref-arm" color="' + d.c + '"/>') + who + '/>') : who + ' transform="' + t + '"/>';
    }
    return G("sc-row", "", out, ' style="--i:' + depth + ";--h:" + d.h + 'px" fill="' + d.c + '"');
  }
  /* a speaker stack, 44 x 92 from its top-left corner: drawn once as #ref-spk (PARTS); a scene places it with spk(x, y) */
  function speakerStack() {
    var cab = function (y, h, c) {
      var m = y + h / 2;
      return R(0, y, 44, h, "#131313", ' rx="2"' + St("#303030", 1)) + R(2, y + h - 3, 40, 1, LIME, ' opacity=".5"') +
        (c ? G("sc-pump", "", Ci(22, m, c, "#0A0A0A", St("#4A4A4A", 1.6)) + Ci(22, m, f1(c * .45), "#1E1E1E", ' stroke="#5C5C5C"')) : Ci(14, m, 4, "#0A0A0A", ' stroke="#444"') + Ci(30, m, 4, "#0A0A0A", ' stroke="#444"'));
    };
    return cab(0, 22, 0) + cab(22, 32, 11) + cab(54, 38, 13);
  }
  function spk(x, y) { return '<use href="#ref-spk" transform="' + Z(x, y) + '"/>'; }
  /* a saucer at x,y (scale s) with a lime beam down to ground y. The body (dome, hull, four lights) is drawn once as #ref-sau (PARTS); the beam is this saucer's own */
  function saucerBody() {
    var lights = [-14, -5, 5, 14].map(function (v, k) { return Ci(v, 2.6, 1.1, k % 2 ? "#E0B341" : LIME, ' class="sc-lt" style="--i:' + k + '"'); }).join("");
    return Pa("M-11 0C-11-13 11-13 11 0Z", LIME, ' fill-opacity=".3"' + St(LIME, .8, ".7")) + El(0, 2, 23, 6, "url(#ref-metal)", St("#6A6A6A", .7)) + lights;
  }
  function saucer(x, y, s, ground, i) {
    return G("sc-hov", "", Po(f1(x - 9 * s) + "," + f1(y + 4 * s) + " " + f1(x + 9 * s) + "," + f1(y + 4 * s) + " " + f1(x + 34 * s) + "," + ground + " " + f1(x - 34 * s) + "," + ground, BEAM, ' opacity=".42"') +
      '<use href="#ref-sau" transform="' + Z(x, y, 0, s) + '"/>', ' style="--i:' + i + '"');
  }
  /* a hand (three fingers up; the palm centre is x,y) and an arm: sleeve from the shoulder a through the elbow b to the wrist c, the hand on the wrist (rot, scale). cls: the motion class. */
  function hand(x, y, rot, s) {
    return G("hand", Z(x, y, rot, s), El(0, 0, 12, 9, SKIN, ' class="hp"') + [-9, -2, 5].map(function (v, k) { return '<rect x="' + v + '" y="' + (-24 + k % 2 * 3) + '" width="5.5" height="19" rx="2.7" fill="' + SKIN + '"/>'; }).join("") + El(0, 5, 11, 4, SHADE, ' opacity=".4"'));
  }
  function arm(a, b, c, cls, hr, hs, w) {
    w = w || 10;
    var d = "M" + a.join(" ") + "L" + b.join(" ") + "L" + c.join(" "), k = ' fill="none" stroke-linejoin="round" stroke-linecap="round"';
    return G("arm" + (cls ? " " + cls : ""), "", '<path d="' + d + '"' + k + ' stroke="#3C463A" stroke-width="' + (w + 2) + '"/><path d="' + d + '"' + k + ' stroke="#222B22" stroke-width="' + w + '"/>' + hand(c[0], c[1], hr, hs));
  }
  /* the hoodie's shoulders (neck base at x,y) */
  function torso(x, y, s) {
    return G("", Z(x, y, 0, s), Pa("M-50 6C-30-2-16-4 0-4C16-4 30-2 50 6C58 14 64 30 66 54V66H-66V54C-64 30-58 14-50 6Z", HOOD, LN) + Pa("M-8 18v22M8 18v22", "none", St("#3A3A3A", 1.4)));
  }
  /* cats behind the booth: the crowd's own catHead, small, dim, drawn first so the booth hides part of them */
  function cats(list) { return list.map(function (c) { return G("sc-cat", "", catHead({ x: c[0], y: c[1], s: c[2], fill: "#2A4A14" }), ' opacity=".42"'); }).join(""); }
  function bokeh(list) { return list.map(function (b, i) { return Ci(b[0], b[1], b[2], GLOW, ' class="sc-bok" style="--i:' + i + '" opacity="' + (b[3] || .5) + '"'); }).join(""); }
  /* lamp beams: [x, lean] from y0 down to y1 */
  function beams(list, y0, y1, w, op) {
    return list.map(function (b, k) { return G("sc-sway", "", Po((b[0] - 2) + "," + y0 + " " + (b[0] + 2) + "," + y0 + " " + (b[0] + b[1] * 3.4 + w) + "," + y1 + " " + (b[0] + b[1] * 3.4 - w) + "," + y1, BEAM, ' opacity="' + op + '"'), ' style="--i:' + k + '"') + Ci(b[0], y0 + .4, 2.1, LIME); }).join("");
  }
  function knob(x, y, r, a, lime) {
    return Ci(x, y, r, "#1A1A1A", St("#7A7A7A", .7)) + Pa("M" + x + " " + y + "V" + f1(y - r + .6), "none", St(lime ? LIME : "#F2F2F2", 1) + ' transform="rotate(' + a + " " + x + " " + y + ')"');
  }
  function fader(x, y, k) { return R(x - 1, y, 2, 22, "#030303", ' rx="1"') + R(x - 4, y + 6 + k * 3, 8, 4.4, "#CFCFCF", ' class="sc-cap" style="--i:' + k + '" rx="1"' + St("#555", .5)); }

  /* a CDJ (94 x 56 from its top-left): screen, jog wheel (class jog; a squashed circle), cue and play, pitch slider. Scale s. */
  function cdj(x, y, s) {
    return G("cdj", Z(x, y, 0, s), R(0, 0, 94, 56, "#1B1B1B", ' rx="4"' + St("#3A3A3A", 1)) + R(6, 4, 82, 11, "#07130A", ' rx="1.5"' + St("#2E5200", .6)) + Pa("M9 12L18 8L26 11L36 7L46 12L58 6L70 11L84 8", "none", St(LIME, .9, ".8")) +
      G("", "translate(47 36) scale(1 .76)", Ci(0, 0, 23, "#050505") + Ci(0, 0, 21, "#0F0F0F", ' class="jog"' + St("#555", 1.4)) + Ci(0, 0, 17, "none", St(LIME, .9, ".5") + ' stroke-dasharray="3 4"') + Ci(0, 0, 9, "#191919", ' stroke="#333"') + G("sc-spin", "", Ci(0, -15, 2, LIME))) +
      Ci(10, 48, 3, "#E0B341", ' class="sc-cue"') + R(16.5, 45, 6, 6, LIME, ' rx="1"') + R(84, 22, 4, 26, "#050505", ' rx="1"') + R(83, 30, 6, 4, "#CFCFCF", ' rx=".8"'));
  }
  /* the 4-channel mixer (86 x 66): knobs, channel faders, a level meter, the crossfader */
  function mixer(x, y, s) {
    var o = R(0, 0, 86, 66, "#121212", ' rx="4"' + St("#3A3A3A", 1)), i, cx;
    for (i = 0; i < 4; i++) { cx = 9 + i * 18; o += R(cx - 7, 3, 14, 52, "#0A0A0A", ' rx="2" opacity=".8"') + knob(cx, 10, 2.8, -50 + i * 38, i === 2) + knob(cx, 18, 2.4, 20 - i * 25) + knob(cx, 26, 2.4, 60 - i * 30, i === 1) + fader(cx, 32, i % 3); }
    for (i = 0; i < 5; i++) o += R(75, f1(48 - i * 7.5), 8, 4.4, i > 3 ? "#E0B341" : LIME, ' class="sc-vu" style="--j:' + i + '" rx=".8"');
    return G("mixer", Z(x, y, 0, s), o + R(8, 58, 56, 3, "#030303", ' rx="1.5"') + R(30, 55.5, 10, 8, "#CFCFCF", ' class="sc-xf" rx="1.5"' + St("#555", .6)));
  }

  function wide() {
    var r = rng(21), s = SKY, ridge = "L30 80L58 92L92 68L130 90L170 74L206 92L246 66L286 88L320 76";
    for (var i = 0; i < 34; i++) s += Ci(f1(r() * 320), f1(r() * 84), f1(.4 + r() * .7), "#F2F2F2", (i % 5 ? "" : ' class="sc-tw" style="--i:' + i % 7 + '"') + ' opacity="' + f1(.35 + r() * .5) + '"');
    s += Ci(262, 32, 10, "#16210F") + El(262, 32, 19, 3.6, "none", St("#66BE00", .8, ".6") + ' transform="rotate(-18 262 32)"');
    s += Pa("M0 98" + ridge + "V126H0Z", "#101A0B") + Pa("M0 98" + ridge, "none", St(LIME, .5, ".2")) + El(160, 104, 170, 30, GLOW, ' opacity=".42"') + Pa("M0 112L40 98L84 108L130 94L176 106L224 92L276 106L320 96V140H0Z", "#0A1007") + R(0, 108, 320, 72, "url(#ref-ground)");
    s += R(108, 99, 104, 8, "#191919", St("#2E2E2E", .6)) + Pa("M108 105H212", "none", St(LIME, .8, ".7")) + R(102, 50, 116, 3.4, "#2E2E2E") + R(104, 50, 2.4, 52, "#242424") + R(213.6, 50, 2.4, 52, "#242424");
    s += beams([[132, -11], [160, 0], [188, 11]], 55, 150, 26, ".34");
    s += R(142, 91, 36, 8, "#242424", ' rx="1"' + St("#3A3A3A", .5)) + El(160, 92, 20, 4, GLOW) + G("sc-bob", "", alienHead({ x: 160, y: 73, s: .19 }) + Pa("M153 91C154 86 166 86 167 91Z", "#1B1B1B"));
    s += spk(14, 56) + spk(262, 56) + saucer(58, 26, .9, 124, 0) + saucer(222, 18, 1.1, 132, 1) + saucer(282, 46, .6, 116, 2);
    return s + crowdRow(27, 2, .3, false, 11) + crowdRow(19, 1, .35, false, 23) + crowdRow(11, 0, .3, true, 31) + WASH;
  }

  /* the Drone Camera: an aerial landscape (his words, 18 Nov: "a sky view landscape, alien ships and the crowd from the top"). The sky and the ships above, the stage far off at the top of the ground, the crowd below seen from
     above: heads, not bodies (#ref-th an alien, #ref-tc a cat, #ref-ta a raised hand, all in PARTS). The ground group drifts slowly (.sc-fly, off under reduced motion) and overscans the frame by 14 on each side, so the drift shows no edge. */
  function drone() {
    var r = rng(5), s = SKY, g, ROWS = [[84, .5, 24, "#14230C"], [99, .66, 20, "#182A0E"], [118, .86, 15, "#1F3312"], [142, 1.1, 11, "#2A4416"], [170, 1.45, 8, "#2E4A18"]];
    for (var i = 0; i < 24; i++) s += Ci(f1(r() * 320), f1(r() * 46), f1(.4 + r() * .7), "#F2F2F2", (i % 5 ? "" : ' class="sc-tw" style="--i:' + i % 7 + '"') + ' opacity="' + f1(.35 + r() * .5) + '"');
    s += El(160, 52, 200, 24, GLOW, ' opacity=".5"') + Pa("M-14 56L30 47L78 55L128 44L186 54L240 45L292 54L334 48V64H-14Z", "#0C1308");
    g = R(-14, 52, 348, 140, "url(#ref-ground)") + El(160, 56, 70, 12, GLOW, ' opacity=".5"') + El(160, 54, 13, 6, HOOD) + El(160, 51.5, 5, 6, SKIN) + Pa("M154.5 52C154 44 166 44 165.5 52", "none", St("#4A4A4A", 1.6)) +
      R(116, 56, 88, 13, "#1B1B1B", ' rx="2"' + St("#3A3A3A", .8)) + Pa("M118 69H202", "none", St(LIME, 1, ".7")) + Ci(134, 62, 4.2, "#0F0F0F", St("#555", .8)) + Ci(186, 62, 4.2, "#0F0F0F", St("#555", .8)) + R(151, 58, 18, 8, "#121212", ' rx="1.5"');
    ROWS.forEach(function (d, k) {
      var out = "";
      for (var m = 0; m < d[2]; m++) {
        var x = f1(-14 + (m + .5 + (r() - .5) * .5) * 348 / d[2]), y = f1(d[0] + (r() - .5) * 8 + (m % 2) * 3), cat = r() < .3, who = '<use href="#ref-' + (cat ? "tc" : "th") + '"', t = Z(x, y, 0, f1(d[1] * (.9 + r() * .2)));
        out += k && r() < .4 ? G("", t, G("sc-arm", "", '<use href="#ref-ta" color="' + d[3] + '"/>') + who + '/>') : who + ' transform="' + t + '"/>';
      }
      g += G("sc-row", "", out, ' style="--i:' + k + ';--h:-1.6px" fill="' + d[3] + '"');
    });
    return s + G("sc-fly", "", g) + saucer(62, 22, .8, 120, 0) + saucer(168, 34, .55, 108, 1) + saucer(262, 14, 1, 134, 2) + WASH;
  }
  /* the 360 DJ Camera's whole frame, 2:1: ONE scene (his words, 19 Nov: "not two views, one view"). The DJ stands behind the controller in the middle, the speaker and the crowd on both sides, the sky above, a bridge and its arches overhead, and
     the booth's table curving away to the right. The close and side lanes are CROPS of this one symbol (CROP: a viewBox on the same <use>, never a second drawing); the file card shows the whole frame. */
  var CROP = { close: "92 48 176 99", side: "160 48 180 101" };
  function equirect() {
    var r = rng(9), s = R(0, 0, 360, 180, "url(#ref-sky)"), i, W = '<rect class="sc-wash" width="360" height="180" fill="#9EFF00"/>', RIDGE = "M0 108L36 96L80 104L128 92L180 102L228 90L280 102L326 94L360 100", TOP = "M0 138C100 132 200 128 360 90", K = "translate(180 150) scale(.88) translate(-180 -150)";
    for (i = 0; i < 30; i++) s += Ci(f1(r() * 360), f1(r() * 60), f1(.4 + r() * .6), "#F2F2F2", (i % 5 ? "" : ' class="sc-tw" style="--i:' + i % 7 + '"') + ' opacity="' + f1(.3 + r() * .5) + '"');
    s += El(180, 104, 200, 30, GLOW, ' opacity=".5"') + Pa(RIDGE + "V132H0Z", "#101A0B") + Pa(RIDGE, "none", St(LIME, .5, ".2")) + R(0, 106, 360, 74, "url(#ref-ground)");
    s += crowdRow(4, 2, .3, false, 41, -22, 4, 78) + crowdRow(8, 2, .3, true, 43, -34, 232, 360) + saucer(258, 38, .6, 112, 2);
    s += Pa("M0 0H84C40 18 20 58 14 120L0 130Z", "#1B1F17", St("#3A4234", 1.2)) + Pa("M360 0H276C320 18 340 58 346 120L360 130Z", "#1B1F17", St("#3A4234", 1.2)) + Pa("M84 0C40 18 20 58 14 120M276 0C320 18 340 58 346 120", "none", St(LIME, .8, ".45"));
    s += Po("112,0 248,0 194,64 166,64", "#13170F", St("#2E3A2A", .8)) + Pa("M146 0L172 64M214 0L188 64M180 0V64M130 16H230M146 34H214M158 50H202", "none", St("#2E3A2A", 1.1)) + Pa("M112 0L166 64M248 0L194 64", "none", St(LIME, 1, ".4"));
    s += crowdRow(2, 1, .3, true, 47, -52, 10, 54) + crowdRow(3, 1, .35, true, 53, -74, 270, 350) + spk(70, 60) + cats([[44, 88, .5], [318, 62, .4], [296, 70, .5]]);
    s += G("", K, G("dj", "", torso(180, 85, .9) + G("sc-bob", "", G("", "rotate(6 180 90)", alienHead({ x: 180, y: 40, s: .5 })))));
    s += Pa(TOP + "V180H0Z", "url(#ref-desk)") + Pa(TOP, "none", St("#5A5A5A", 1)) + Pa("M0 144C100 138 200 134 360 96", "none", St(LIME, 2.4, ".25")) + Pa("M262 112L300 180M324 100L360 150", "none", St("#3A3A3A", 1)) + R(0, 172, 360, 8, "#0A0A0A");
    return s + G("", K, cdj(108, 112, .5) + mixer(156, 108, .55) + cdj(204, 112, .5) + arm([134, 100], [122, 113], [133, 118], "sc-arm-l", 180, .5, 8) + arm([226, 100], [241, 98], [206, 73], "sc-arm-d", -32, .5, 8)) + W;
  }

  function lg(id, x2, y2, stops) { return '<linearGradient id="ref-' + id + '" x1="0" y1="0" x2="' + x2 + '" y2="' + y2 + '">' + stops.map(function (t) { return '<stop offset="' + t[0] + '" stop-color="' + t[1] + '"' + (t[2] != null ? ' stop-opacity="' + t[2] + '"' : "") + '/>'; }).join("") + '</linearGradient>'; }
  var SKIND = lg("skin", 1, 1, [[0, "#A6F53D"], [1, "#66BE00"]]), GRAD = SKIND + '<radialGradient id="ref-glow"><stop offset="0" stop-color="' + LIME + '" stop-opacity=".6"/><stop offset="1" stop-color="' + LIME + '" stop-opacity="0"/></radialGradient>' +
    lg("beam", 0, 1, [[0, "#C8FF5A", .7], [1, LIME, 0]]) + lg("sky", 0, 1, [[0, "#06080A"], [.55, "#101810"], [1, "#27391A"]]) + lg("metal", 0, 1, [[0, "#454545"], [1, "#181818"]]) +
    lg("desk", 0, 1, [[0, "#2C2C2C"], [1, "#0E0E0E"]]) + lg("ground", 0, 1, [[0, "#0F170B"], [1, "#040504"]]) + lg("side", 1, 0, [[0, LIME, .16], [.6, LIME, 0]]);
  /* the parts drawn once and placed by <use> (U6 trim: each repeated part is one def, so the page holds it once): the crowd's body, alien head and cat head; a whole alien and a whole cat
     (body + head, what a crowd row places); the raised arm (currentColor: the row's colour, set as color= on its <use>); the speaker stack; the saucer body */
  var PARTS = '<path id="ref-bd" d="M-17 30C-19 70-22 190-22 190H22C22 190 19 70 17 30Z"/>' +
    '<g id="ref-ah"><path d="M0-14C11-14 16-6 15 5C14 15 7 23 0 25C-7 23-14 15-15 5C-16-6-11-14 0-14Z"/>' + El(-7, 5, 5.6, 1.7, LIME, ' transform="rotate(28 -7 5)"') + El(7, 5, 5.6, 1.7, LIME, ' transform="rotate(-28 7 5)"') + '</g>' +
    '<g id="ref-ch"><path d="M-18 6C-20-6-14-14 0-14C14-14 20-6 18 6C16 18 8 24 0 24C-8 24-16 18-18 6Z"/><path d="M-17-3L-15-20L-5-12ZM17-3L15-20L5-12Z"/>' + Pa("M-11 4Q-6 1.5-2 4Q-6 6.5-11 4ZM11 4Q6 1.5 2 4Q6 6.5 11 4Z", LIME) + '</g>' +
    '<g id="ref-al"><use href="#ref-bd"/><use href="#ref-ah"/></g><g id="ref-ct"><use href="#ref-bd"/><use href="#ref-ch"/></g>' +
    '<g id="ref-arm">' + Pa("M-15 30C-30 8-26-14-22-34", "none", St("currentColor", 7)) + Ci(-22, -36, 5, "currentColor") + '</g>' +
    '<g id="ref-spk">' + speakerStack() + '</g><g id="ref-sau">' + saucerBody() + '</g>' +
    '<g id="ref-th"><ellipse rx="9" ry="11.5"/>' + Pa("M-9.4-2C-9.4-14 9.4-14 9.4-2", "none", St("#4A4A4A", 2.2)) + El(-9.4, 0, 2.2, 4, "#2C2C2C") + El(9.4, 0, 2.2, 4, "#2C2C2C") + Pa("M-5-7Q0-10 5-7", "none", St("#E4FFA6", 1, ".5")) + '</g>' +
    '<g id="ref-tc"><ellipse rx="9.5" ry="10"/>' + Po("-9.5,-3 -7,-15 -1,-9", "inherit") + Po("9.5,-3 7,-15 1,-9", "inherit") + '</g>' +
    '<g id="ref-ta">' + Pa("M0-6V-15", "none", St("currentColor", 3.4)) + Ci(0, -17, 3.6, SKIN) + '</g>';
  var SYM = { wide: wide, drone: drone };
  function defs() {
    var out = '<svg class="ref-defs" width="0" height="0" aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden"><defs>' + GRAD + PARTS;
    Object.keys(SYM).forEach(function (k) { out += '<symbol id="sc-' + k + '" viewBox="0 0 320 180" stroke-linecap="round">' + SYM[k]() + '</symbol>'; });
    return out + '<symbol id="sc-360" viewBox="0 0 360 180">' + equirect() + '</symbol></defs></svg>';
  }
  function use(cam, cls) {
    var eq = cam === "360", crop = CROP[cam], at = (eq ? " ref-eq" : "") + (cls ? " " + cls : "");
    return '<svg class="ref-cam' + at + '" viewBox="' + (crop || (eq ? "0 0 360 180" : "0 0 320 180")) + '" aria-hidden="true" data-cam="' + cam + '"><use href="#sc-' + (crop ? "360" : cam) + '"' + (crop ? ' width="360" height="180"' : "") + '/></svg>';
  }
    /* the mascot (the final CTA, the Flyer's CTA, the tooltip's clone, the Flow reference): Alien A behind a two-jog deck, hands on the deck beside the wheels. It uses #ref-skin, so the page holds scenes.defs(). */
  function mascot() {
    var jg = function (x) { return Ci(x, 216, 13, "#282828", St("#7A7A7A", 2)) + Ci(x, 216, 7, "none", St(LIME, 1, ".5")); };
    return '<svg class="alien" viewBox="0 0 200 240" role="img" aria-label="The DJOPS alien behind the decks">' + G("bob", "", alienHead({ x: 100, y: 12, s: 1.7 })) + R(4, 196, 192, 40, "#1C1C1C", ' rx="8"' + St("#4A4A4A", 2)) + jg(48) + jg(152) +
      R(86, 204, 28, 24, "#282828", ' rx="3"' + St("#7A7A7A", 1.5)) + Pa("M93 209v14M100 209v14M107 209v14", "none", St("#4A4A4A", 2)) + Ci(100, 213, 2, LIME) + hand(70, 209, 0, .75) + hand(130, 209, 0, .75) + '</svg>';
  }
  /* just the skin gradient, for a page that draws the mascot but not the scenes (the Flyer): a page holds defs() OR skin(), never both */
  function skin() { return '<svg class="ref-defs" width="0" height="0" aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden"><defs>' + SKIND + '</defs></svg>'; }
  /* point a host at another camera (Grow's clip frames cut between cameras): the crop (or the whole scene) and its <use>; cx: where the 9:16 window sits on the host, 0..1 (the DJ is at the middle of the close crop and at the left of the side crop; U7a: side sits at .3, not .2, so a 9:16 window on the side crop overlaps the close window by about 40 %, not 72 %: the DJ at its left edge, the decks and the crowd running away to the right) */
  function aim(host, cam) {
    var u = host.querySelector("use"), crop = CROP[cam];
    host.setAttribute("viewBox", crop || "0 0 320 180"); host.setAttribute("data-cam", cam); u.setAttribute("href", "#sc-" + (crop ? "360" : cam));
    if (crop) { u.setAttribute("width", 360); u.setAttribute("height", 180); } else { u.removeAttribute("width"); u.removeAttribute("height"); }
  }
  function cx(cam, p) { return cam === "close" ? (p && p.arm ? .6 : .5) : cam === "side" ? .3 : .5; }
  /* paint one 9:16 clip frame (U5: Grow's three slots and the hero's clip share it): c = { f: the frame, h: its host, cam, arm, hands, wash } remembers what it last drew, so a cut swaps the scene and the pose moves only when it changed */
  function paint(c, cam, p) {
    var cut = c.cam !== cam;
    if (cut) { c.f.classList.add("cut"); aim(c.h, cam); c.cam = cam; }
    c.f.style.setProperty("--cx", cx(cam, p));
    if (p.arm !== c.arm || p.hands !== c.hands || p.wash !== c.wash) { c.arm = p.arm; c.hands = p.hands; c.wash = p.wash; c.h.style.setProperty("--arm", p.arm + "deg"); c.h.style.setProperty("--hands", p.hands); c.h.style.setProperty("--wash", p.wash); }
    if (cut) { void c.f.offsetWidth; c.f.classList.remove("cut"); }
  }
  /* one 9:16 clip frame as markup (B3F3: Grow's slots, the hero's clip and a week chip's hover preview all take it from here): the scene for the camera, the window at cx, the DJ's pose; `inner` is what sits on top of it (tag, hook, progress) */
  function frame(cam, p, inner) {
    return '<span class="frame t gr-frame" style="--cx:' + cx(cam, p) + '">' + use(cam, "gr-cam").replace(/ data-cam="(\w+)">/, function (m, c) { return ' data-cam="' + c + '" style="--arm:' + p.arm + "deg;--hands:" + p.hands + ';--wash:0">'; }) + (inner || "") + "</span>";
  }
  var scenes = { aim: aim, cx: cx, paint: paint, frame: frame, defs: defs, skin: skin, use: use, mascot: mascot, shot: function (c) { return CROP[c] || c === "360" ? equirect() : SYM[c](); }, crops: CROP, alienHead: alienHead, catHead: catHead, crowdRow: crowdRow, speakerStack: speakerStack, saucer: saucer, cams: ["close", "wide", "drone", "side"] };

  /* ---------- 3. one clock, one sound ---------- */
  /* what the DJ and the crowd are doing at a bar: the arm goes up at bar 42, the crowd's hands in the drops and through the crowd reaction (bars 56-59), a lime wash on the first beat of each drop */
  function poseAt(bar, beat) {
    var drop = bar >= 28 && bar < 40 || bar >= 46 && bar < 60;
    return { arm: bar >= 42 && bar < 46 ? -70 : 0, hands: drop ? 1 : 0, wash: (bar === 28 || bar === 46) && beat === 0 ? 1 : 0 };
  }
  function makeEngine(w) {
    var LOOK = .12, VOCAL = { 0: ["E4", "D4"], 4: ["G4", "E4"], 8: ["A4", "G4"], 12: ["G4", "E4"] };
    var RISER = ["E4", "F4", "G4", "A4", "A#4", "C5", "D5", "E5"], BRK = [["G4", "A#4"], ["C5", "A#4"], ["G4", "F4"], ["D4", "D4"]], ALL5 = { kick: 1, clap: 1, openhat: 1, hat: 1, bass: 1 };
    var ctx = null, P = null, playing = false, timer = null, raf = 0, token = 0, next = 0, g = 0, base = null, resume = 0, endStep = TOTAL / STEP, who = null, subs = [], ended = false;
    var api = { stop: function () { pause(); } };
    function lanesFor(bar) {
      return bar < 8 ? { hat: 1, openhat: 1 } : bar < 24 ? ALL5 : bar < 28 ? { hat: 1 } : bar < 40 ? ALL5 : bar < 46 ? { hat: 1, openhat: 1 } : bar < 56 ? ALL5 : bar < 60 ? { kick: 1, hat: 1, bass: 1 } : { hat: 1, bass: 1 };
    }
    /* one 16th step: the pattern's lanes for this section, then the extra voices */
    function voices(bar, ls, t) {
      var Dr = w.DJOPSDrums, hit = Dr.hit, allow = lanesFor(bar), pad = 0;
      if (bar === 27 && ls >= 12) return;                                   /* the beat before the drop is silent */
      Dr.playStep(P, g % 32, t, STEP, function (l) { return allow[l.kind] && !(bar === 23 && (l.kind === "kick" && ls >= 8 || l.kind === "clap")); });
      if (bar >= 4 && bar < 8 || bar >= 24 && bar < 28 || bar >= 40 && bar < 46) pad = 1;
      if (pad && ls % 8 === 0) hit("pad", t, 2, 0, STEP * (bar === 27 ? 4 : 8), (bar >> 1) % 2 ? "D#" : "Gm7");
      if (bar >= 16 && bar < 24) {
        if (ls % 8 === 0) hit("stab", t, 1, 0, STEP * 3, "Gm");
        if (ls === 0) hit("lead", t, 1.6, 0, STEP * 12, RISER[bar - 16], "triangle");
        if (bar === 23) hit("clap", t, .35 + ls * .04);
      }
      if (bar >= 24 && bar < 28 && (ls === 0 || ls === 8)) hit("lead", t, 2, 0, STEP * (bar === 27 ? 3 : 6), BRK[bar - 24][ls / 8], "triangle");
      if (bar === 28 || bar === 46) { if (ls === 0) hit("crash", t, 1, 0, 0); }
      if (bar === 57 && ls === 0) hit("crash", t, .35, 0, 0);                 /* the crowd reaction: a cheer, the crash voice at low gain */
      if (bar >= 28 && bar < 40 || bar >= 46 && bar < 56) {
        if (ls === 2 || ls === 10) hit("sub", t, 1, 0, STEP * 3, "G1");
        if (ls === 6 || ls === 14) hit("stab", t, 1, 0, STEP * 2, "Gm");
      }
      if (bar >= 40 && bar < 46) {
        if (bar < 45 && (ls === 4 || ls === 12)) hit("clap", t, 1);
        if (bar === 45 && (ls % 2 === 0 && ls < 12 || ls > 11)) hit("clap", t, .4 + ls * .04);
        if (VOCAL[ls]) hit("lead", t, 2, 0, STEP * 3.2, VOCAL[ls][bar % 2], "triangle");
      }
    }
    function pos() {
      if (!playing || !base || !ctx) return resume;
      return Math.min(endStep, Math.max(0, base.g + (ctx.currentTime - base.t) / STEP));
    }
    function info() {
      var p = pos(), bar = Math.min(BARS - 1, Math.floor(p / 16)), beat = Math.floor(p % 16 / 4);
      return { t: p * STEP, bar: bar, beat: beat, cam: camAt(bar), pose: poseAt(bar, beat), playing: playing, owner: who, ended: ended, until: endStep * STEP };
    }
    function emit() { var i = info(); subs.forEach(function (fn) { fn(i); }); }
    function frame() { emit(); raf = playing ? requestAnimationFrame(frame) : 0; }
    function tick() {
      var now = ctx.currentTime;
      while (next < now + LOOK && g < endStep) {
        var ls = g % 16, bar = Math.floor(g / 16);
        voices(bar, ls, next + (g % 2 ? (P.swing || 0) * STEP : 0));
        next += STEP; g++;
      }
      if (now >= base.t + (endStep - base.g) * STEP) { var e = endStep; pause(); resume = e >= TOTAL / STEP - .01 ? 0 : e; ended = true; emit(); }
    }
    function halt() { clearInterval(timer); timer = null; }
    function pause() {
      if (playing) resume = pos();
      ++token; playing = false; halt(); ended = false;
      if (w.DJOPSDrums && w.DJOPSDrums.release) w.DJOPSDrums.release(api);
      cancelAnimationFrame(raf); raf = 0; emit();
    }
    /* play from `from` seconds (default: where it paused) to `until` seconds (default: the end); `tag` names the view that asked */
    function play(from, until, tag) {
      var Dr = w.DJOPSDrums;
      if (!Dr || !Dr.load || !Dr.unlock) return Promise.reject(new Error("no sound"));
      var my = ++token; halt(); who = tag || null; ended = false;
      Dr.claim(api);
      var unlocked = Dr.unlock();                                           /* inside the press, before anything is awaited */
      var from0 = from == null ? resume : Math.max(0, Math.min(TOTAL, from)) / STEP;
      if (from == null && from0 >= TOTAL / STEP - .01) from0 = 0;
      endStep = until == null ? TOTAL / STEP : Math.min(TOTAL, until) / STEP;
      return Promise.all([unlocked, Dr.load()]).then(function (r) {
        if (my !== token) return;
        ctx = r[0]; P = r[1].patterns.tech;
        var t0 = ctx.currentTime + .06;
        g = Math.ceil(from0); resume = from0; base = { t: t0, g: from0 }; next = t0 + (g - from0) * STEP;
        playing = true; timer = setInterval(tick, 25); tick();
        cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
      }, function (e) { if (my === token) { who = null; Dr.release(api); emit(); } throw e; });   /* held or failed: the engine is at rest, and the caller (a card) asks soundBlocked for the line */
    }
    function seek(sec) {
      sec = Math.max(0, Math.min(TOTAL, sec));
      if (playing) return play(sec, endStep * STEP, who);
      resume = sec / STEP; ended = false; emit();
      return Promise.resolve();
    }
    /* the ONE recap chain (Batch 3 fix 1; Grow's slots, the hero and the post call it from their listeners): given a notification `i`, true while the chain of windows `seg` that `tag` plays carries on, either because a window just
       ran out (its ended notification follows) or because the next window was started here, the sound straight on (a failure goes to `no`); false when the chain is over, was paused, or is not tag's */
    function chain(i, seg, tag, no) {
      if (i.owner !== tag || i.playing) return false;
      var n = -1; seg.forEach(function (s, j) { if (Math.abs(i.t - s[1]) < .03) n = j; });
      if (n < 0) return false;
      if (i.ended && n < seg.length - 1) play(seg[n + 1][0], seg[n + 1][1], tag).catch(no);
      return !i.ended || n < seg.length - 1;
    }
    return {
      play: play, pause: pause, seek: seek, time: function () { return pos() * STEP; }, info: info, chain: chain,
      on: function (fn) { subs.push(fn); fn(info()); return function () { subs = subs.filter(function (x) { return x !== fn; }); }; },
      get owner() { return who; }, get playing() { return playing; }
    };
  }

  return { MAP: MAP, scenes: scenes, energy: energy, energySmooth: energySmooth, energyLine: energyLine, energySvg: energySvg, energyDefs: energyDefs, energyUse: energyUse, playhead: playhead, poseAt: poseAt, engine: win ? makeEngine(win) : null };
});
