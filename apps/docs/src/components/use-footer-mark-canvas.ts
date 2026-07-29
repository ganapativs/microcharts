"use client";
import { useEffect, type RefObject } from "react";
import { CELL_R, CELL_SIZE, CELLS, SQUIRCLE_INSET, SQUIRCLE_PATH } from "@/lib/brand";
import {
  clamp01,
  css,
  drawCell,
  easeOutQuint,
  ENTER_TAIL,
  hash,
  LAG_JITTER,
  MAX_LAG,
  parseColor,
  type Palette,
} from "./footer-mark-draw";

/** Px from the footer's BOTTOM edge up to the word's midline, wide then narrow.
 *
 *  Only two numbers set the air around the word, and neither is `h`:
 *
 *      air BELOW = WORD_FLOOR       − inkHalf − fs·0.03
 *      air ABOVE = band − WORD_FLOOR + fs·0.03 − inkHalf
 *
 *  — where `band` is the reserved spacer in `footer-mark.tsx`. So this constant
 *  alone sets the space under the word, and the DIFFERENCE between the band and
 *  it sets the space above. That is why the two must always be edited as a pair:
 *  move one and the word slides instead of the air changing.
 *
 *  Wide is 198/354 (169/325 until the floor deepened by 29 — the band took the
 *  same +29, so the pair cancelled and every added pixel landed under the word).
 *  Narrow is 145/259, which is both airs cut ~30%: below 178 → 125, above 139 →
 *  97, measured at 390. A phone reads the footer at arm's length in a viewport
 *  it has none of to spare, and the desktop air made the word look marooned. */
const WORD_FLOOR = 198;
const WORD_FLOOR_NARROW = 145;
/** Tailwind's `sm`, which is what the band's `sm:` prefix switches on. Matched
 *  as a MEDIA QUERY, not against the host's width: a classic scrollbar makes the
 *  element ~15px narrower than the viewport, so an element-width test would pair
 *  a narrow floor with a wide band for a window of widths and drop the word. */
const WIDE = "(min-width: 640px)";
/** The vignette's ellipse centres this far BELOW the word's midline. */
const VIGNETTE_LIFT = 41;
// probe size for the glyph raster below — big enough that a 1px scan step is
// ~0.8% of the em, small enough that the whole sweep is a few ms
const SIDE_PROBE = 128;
// keyed by `weight|family`; survives remounts, so the raster runs once a face
const sideCache = new Map<string, { lsb: number; rsb: number }[]>();

export function useFooterMarkCanvas(
  hostRef: RefObject<HTMLDivElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
) {
  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let cellW = 40;
    let cellH = 18;
    let cols = 0;
    let rows = 0;
    const WORD = "microcharts";
    let mask: HTMLCanvasElement | null = null;
    let fontSpec = "";
    // the ALPHABETIC baseline the word is drawn on, not its centre line — see
    // the note in build() on why `textBaseline: "middle"` cannot be used here
    let textY = 0;
    let fontSize = 0;
    const letters: { ch: string; x: number }[] = [];
    let maskP = -1; // reveal progress the mask was last rasterized at
    // the brandmark drawn into the canvas, leading the word (same hollow
    // letterpress treatment); geometry from the canonical lib/brand spec
    let markSize = 0;
    let markX = 0;
    let markY = 0;
    const squircle = new Path2D(SQUIRCLE_PATH);
    /** Per-letter ink sidebearings as a fraction of the em, left and right.
     *
     *  Measured by rasterising each glyph once and scanning its columns, NOT
     *  from `measureText` — WebKit answers `actualBoundingBoxLeft/Right` with
     *  the advance box (left 0, right === width for every glyph), so ink-derived
     *  spacing silently collapses to zero on Safari. Sidebearings are linear in
     *  font size, so one probe at `SIDE_PROBE` scales to any `fs`. */
    const sidebearings = (fam: string, weight: number) => {
      const key = `${weight}|${fam}`;
      const hit = sideCache.get(key);
      if (hit) return hit;
      const blank = [...WORD].map(() => ({ lsb: 0, rsb: 0 }));
      const pc = document.createElement("canvas");
      pc.width = SIDE_PROBE * 4;
      pc.height = SIDE_PROBE * 2;
      const p = pc.getContext("2d", { willReadFrequently: true });
      if (!p) return blank; // no 2d context: fall back to raw advances
      const inset = SIDE_PROBE; // left margin the glyph is drawn at
      const baseY = SIDE_PROBE * 1.5;
      p.font = `${weight} ${SIDE_PROBE}px ${fam}`;
      p.textAlign = "left";
      p.textBaseline = "alphabetic";
      p.fillStyle = "#fff";
      const out = [...WORD].map((ch) => {
        const adv = p.measureText(ch).width;
        p.clearRect(0, 0, pc.width, pc.height);
        p.fillText(ch, inset, baseY);
        const d = p.getImageData(0, 0, pc.width, pc.height).data;
        let left = -1;
        let right = -1;
        for (let x = 0; x < pc.width; x++) {
          for (let y = 0; y < pc.height; y++) {
            // >8 rather than >0: antialiasing fringe counts as ink, which
            // errs toward MORE space between letters, never less
            if (d[(y * pc.width + x) * 4 + 3] > 8) {
              if (left < 0) left = x;
              right = x;
              break;
            }
          }
        }
        if (left < 0) return { lsb: 0, rsb: 0 }; // blank glyph (never, for this word)
        return { lsb: (left - inset) / SIDE_PROBE, rsb: (inset + adv - (right + 1)) / SIDE_PROBE };
      });
      sideCache.set(key, out);
      return out;
    };
    let field: HTMLCanvasElement | null = null;
    let fctx: CanvasRenderingContext2D | null = null;
    let layer: HTMLCanvasElement | null = null;
    let lctx: CanvasRenderingContext2D | null = null;
    let torch: HTMLCanvasElement | null = null;
    let tctx: CanvasRenderingContext2D | null = null;
    let shade: HTMLCanvasElement | null = null;
    let raf = 0;
    let running = false;
    let visible = false;
    let px = -1e9;
    let py = -1e9;
    const pulses: { x: number; y: number; t0: number }[] = [];
    // vignette ellipse (matches the CSS mask) — cells outside it are culled
    let vrx = 0.8;
    let vry = 1.18;
    let vcy = 0.55;
    // double-tap deals every chart new data
    let seedShift = 0;
    let lastDownT = -1;
    // The field is an infinite conveyor: rows drift upward forever, and new
    // charts enter from the bottom. Archetypes are computed lazily per
    // VIRTUAL row (world-space, not screen-space) with neighbor avoidance —
    // same chart never adjacent (left/up/diagonals) — and cached in a small
    // sliding window.
    let typeSeed = -1;
    const N_TYPES = 19;
    const EMPTY = 255; // ~1/3 of the lattice stays open — air, not wallpaper
    const DRIFT = 8; // px/s upward — a new row surfaces every ~2s
    // Ordered-dither sparsity: a Bayer threshold keeps the gaps evenly
    // spread (every 4×4 block loses the same share — no random holes),
    // and a hash jitter breaks the pattern's regularity.
    const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const rowTypes = new Map<number, Uint8Array>();
    const typesFor = (vr: number): Uint8Array => {
      const hit = rowTypes.get(vr);
      if (hit) return hit;
      const prev = rowTypes.get(vr - 1);
      const row = new Uint8Array(cols);
      for (let c = 0; c < cols; c++) {
        const seed = vr * 197 + c * 13 + 7 + seedShift;
        const threshold = (BAYER4[(((vr % 4) + 4) % 4) * 4 + (c % 4)] + 0.5) / 16;
        if (threshold + (hash(seed + 7.7) - 0.5) * 0.14 < 0.33) {
          row[c] = EMPTY;
          continue;
        }
        let t = Math.floor(hash(seed + 0.5) * N_TYPES);
        const left = c > 0 ? row[c - 1] : -1;
        const up = prev ? prev[c] : -1;
        const upL = prev && c > 0 ? prev[c - 1] : -1;
        const upR = prev && c < cols - 1 ? prev[c + 1] : -1;
        while (t === left || t === up || t === upL || t === upR) t = (t + 1) % N_TYPES;
        row[c] = t;
      }
      rowTypes.set(vr, row);
      // evict rows that scrolled far past the window
      if (rowTypes.size > rows * 3 + 8) {
        for (const k of rowTypes.keys()) {
          if (k < vr - rows * 2) rowTypes.delete(k);
          else break;
        }
      }
      return row;
    };
    const buildTypes = () => {
      rowTypes.clear();
      spring = new Float32Array(cols * (rows + 2) * 4);
      typeSeed = seedShift;
    };
    // adaptive quality: settle to half-rate when idle, degrade once if slow
    let lastP = -1;
    let flip = false;
    let ema = 16;
    let lastTm = 0;
    let prevFull = false;
    let degraded = false;
    // spring field (mouse devices): cells ride the pointer's wake and spring
    // back — per-cell [offsetX, offsetY, velX, velY], damped harmonic
    const mouseFine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let spring = new Float32Array(0);
    let mvx = 0; // smoothed pointer velocity, px/s
    let mvy = 0;
    let lastMoveT = 0;
    let springEnergy = 0;
    let lastDrawMs = 0;
    let lastRowShift = -1; // conveyor row the spring buffer is aligned to

    // Palette on theme change only — getComputedStyle in raf forces style recalc.
    let key = "";
    let light = false;
    let pal: Palette = { accent: "#2f52d4", pos: "#0E7A5F", neg: "#BD4B2D", neutral: "#616773" };
    const refreshPalette = () => {
      light = !document.documentElement.classList.contains("dark");
      const cs = getComputedStyle(document.documentElement);
      const raw =
        (light ? "l|" : "d|") +
        ["--accent", "--mc-positive", "--mc-negative", "--mc-neutral"]
          .map((v) => cs.getPropertyValue(v))
          .join("|");
      if (raw === key) return;
      key = raw;
      // slot 0 is the light/dark prefix — colors start at 1
      const [, a, p, n, m] = raw.split("|").map(parseColor);
      pal = {
        accent: a ? css(a) : pal.accent,
        pos: p ? css(p) : pal.pos,
        neg: n ? css(n) : pal.neg,
        neutral: m ? css(m) : pal.neutral,
      };
    };

    const build = () => {
      w = host.clientWidth;
      h = host.clientHeight;
      if (!w || !h) return;
      // pairs with the band's `sm:` prefix in `footer-mark.tsx` — see WORD_FLOOR
      const floor = window.matchMedia(WIDE).matches ? WORD_FLOOR : WORD_FLOOR_NARROW;
      // phones are DPR 3 — allow it there (tiny canvas), cap desktop at 2
      dpr = Math.min(window.devicePixelRatio || 1, w < 800 ? 3 : 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cellW = w < 640 ? 32 : 40;
      cellH = w < 640 ? 15 : 18;
      if (degraded) {
        // low-end device: fewer, chunkier cells at a lower density
        dpr = Math.min(dpr, 1.5);
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cellW = Math.round(cellW * 1.3);
        cellH = Math.round(cellH * 1.3);
      }
      cols = Math.ceil(w / cellW);
      rows = Math.ceil(h / cellH);
      buildTypes();

      // The vignette lives in-canvas as a cached shade layer: an elliptical
      // falloff crossed with a tall top fade, so the field condenses at the
      // word and dissolves gradually INTO the footer above — never a cut.
      // the vignette centers on the word band near the footer's bottom; the
      // tall ellipse + top fade let the field climb gently behind the links
      const wordCY = clamp01((h - (floor - VIGNETTE_LIFT)) / h);
      [vrx, vry, vcy] = w < 640 ? [1.05, 1.25, wordCY] : [0.82, 1.18, wordCY];
      host.style.maskImage = "";
      (host.style as { webkitMaskImage?: string }).webkitMaskImage = "";
      shade = document.createElement("canvas");
      shade.width = canvas.width;
      shade.height = canvas.height;
      const sc = shade.getContext("2d");
      if (sc) {
        sc.setTransform(dpr, 0, 0, dpr, 0, 0);
        const cx = w / 2;
        const cy = h * vcy;
        const rx = w * vrx;
        const sy = (h * vry) / rx;
        sc.save();
        sc.translate(cx, cy);
        sc.scale(1, sy);
        const rg = sc.createRadialGradient(0, 0, 0, 0, 0, rx);
        rg.addColorStop(0, "rgba(0,0,0,1)");
        rg.addColorStop(0.45, "rgba(0,0,0,1)");
        rg.addColorStop(0.72, "rgba(0,0,0,0.55)");
        rg.addColorStop(1, "rgba(0,0,0,0)");
        sc.fillStyle = rg;
        sc.fillRect(-cx, -cy / sy, w, h / sy);
        sc.restore();
        // deep top fade — the field is only a whisper behind the link grid
        // (roughly the footer's upper 60%) and surfaces fully just below it,
        // so the columns read on calm ground and the word gets the density.
        // NB: destination-in clears everything the source doesn't cover, so
        // the gradient must span the full height (solid below the fade).
        const f = 0.6;
        const lg = sc.createLinearGradient(0, 0, 0, h);
        lg.addColorStop(0, "rgba(0,0,0,0)");
        lg.addColorStop(0.45 * f, "rgba(0,0,0,0.1)");
        lg.addColorStop(0.75 * f, "rgba(0,0,0,0.3)");
        lg.addColorStop(0.92 * f, "rgba(0,0,0,0.65)");
        lg.addColorStop(f, "rgba(0,0,0,1)");
        lg.addColorStop(1, "rgba(0,0,0,1)");
        sc.globalCompositeOperation = "destination-in";
        sc.fillStyle = lg;
        sc.fillRect(0, 0, w, h);
        sc.globalCompositeOperation = "source-over";
      }

      field = document.createElement("canvas");
      field.width = canvas.width;
      field.height = canvas.height;
      fctx = field.getContext("2d");
      fctx?.setTransform(dpr, 0, 0, dpr, 0, 0);

      layer = document.createElement("canvas");
      layer.width = canvas.width;
      layer.height = canvas.height;
      lctx = layer.getContext("2d");

      torch = document.createElement("canvas");
      torch.width = canvas.width;
      torch.height = canvas.height;
      tctx = torch.getContext("2d");

      mask = document.createElement("canvas");
      mask.width = canvas.width;
      mask.height = canvas.height;
      const mctx = mask.getContext("2d");
      if (!mctx) return;
      mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // the word is centered in the field with equal air above and below;
      // the height cap keeps it clear of the legal bar riding the bottom
      // The face comes off the host's computed `font-family` (`.wordmark-face`):
      // a canvas needs a family it can NAME, so this reads the resolved string
      // rather than inheriting a class.
      const family = getComputedStyle(host).fontFamily || "sans-serif";
      // absolute cap — the canvas is the whole footer, so the word sizes to
      // its reserved band; one size on every page, home included
      // 88 × 1.75. Everything in the lockup is expressed as a multiple of `fs`
      // — mark box (0.72), mark/word gap (0.26), the mark's vertical centering
      // (0.52), the baseline nudge (0.03) — so the whole thing zooms as one
      // piece and the mark stays centred on the cap band at any size. The
      // `avail` fit below still holds it to 86% of the footer width, so narrow
      // viewports scale it down from here rather than overflowing.
      let fs = 154;
      const avail = w * 0.86;
      // The display face ships as statics, so the ask has to be a weight that
      // exists — 600 — or the browser synthesises one.
      const WEIGHT = 600;
      // Per-letter advances with a floor under the ink gap between neighbours.
      // The word is drawn letter by letter (each rides its own reveal), so the
      // spacing has to be built here rather than left to the shaper.
      // The sidebearings come off a RASTER probe, not `measureText`. WebKit
      // returns the ADVANCE box from `actualBoundingBoxLeft/Right` — measured
      // on Safari's engine, every glyph reports left 0 and right === width —
      // so ink-derived sidebearings are all zero there and the floor below
      // fires on every pair: Safari drew the word 30px wider than Chrome.
      // Rasterising one glyph and scanning its columns is the same answer in
      // every engine. It is done once per face at a fixed probe size and
      // scaled by `fs`, because sidebearings are linear in font size.
      const side = sidebearings(family, WEIGHT);
      const measureWord = (size: number) => {
        const minGap = size * 0.02;
        mctx.font = `${WEIGHT} ${size}px ${family}`;
        const advances: number[] = [];
        let total = 0;
        for (let i = 0; i < WORD.length; i++) {
          const adv = mctx.measureText(WORD[i]).width;
          // ink gap across the pair = this letter's right bearing + the next
          // letter's left bearing, both in em, brought back to pixels
          const ink = i < WORD.length - 1 ? (side[i].rsb + side[i + 1].lsb) * size : Infinity;
          const pad = Math.max(0, minGap - ink);
          advances.push(adv + pad);
          total += adv + pad;
        }
        return { advances, total };
      };
      // the brandmark leads the word inside the canvas: mark + gap ≈ 1em,
      // so the fit measures the full lockup, not just the letters
      let word = measureWord(fs);
      if (word.total + fs > avail) {
        fs *= avail / (word.total + fs);
        word = measureWord(fs);
      }
      const tw = word.total;
      fontSpec = `${WEIGHT} ${fs}px ${family}`;
      // Bottom-anchored: the word lives in the reserved band above the bar.
      // `WORD_FLOOR` and the band in `footer-mark.tsx` are tuned together and
      // neither means much on its own. It is NOT part of the wordmark's type
      // sizing.
      const wordMid = h - floor + fs * 0.03;
      fontSize = fs;
      mctx.font = fontSpec;
      // The word is drawn on its ALPHABETIC baseline, positioned so the ink
      // band straddles `wordMid`. It used to be drawn with
      // `textBaseline: "middle"` straight at `wordMid`, which is the second
      // thing Safari renders differently: the same string at 154px lands 10px
      // lower in WebKit than in Chromium (probed by rasterising an "x" — ink
      // band 161–245 vs 171–255). The MARK is placed arithmetically, so it
      // stayed put while the letters dropped, and the lockup came apart.
      // Ink ascent/descent, unlike "middle", agree across engines to 0.01px.
      const wm = mctx.measureText(WORD);
      const asc = wm.actualBoundingBoxAscent ?? fs * 0.76;
      const desc = wm.actualBoundingBoxDescent ?? fs * 0.01;
      textY = wordMid + (asc - desc) / 2;
      // The squircle STANDS ON THE BASELINE, like a letter — the same seat the
      // charts take inline (`seat: floor`). Its ink bottom lands on `textY`,
      // which puts its top a little above the x-height and well under the
      // ascenders of `h` and `t`.
      //
      // It used to be placed at a fixed `wordMid - 0.52 * markSize`, a constant
      // hand-tuned to land on the baseline that `textBaseline: "middle"` gave
      // in Chrome. Once the letters moved to a measured baseline the mark
      // stayed behind and floated. Seating it on `textY` is the same result,
      // stated as the rule it always was, so it survives a change of face,
      // size or engine.
      markSize = fs * 0.72;
      const gap = fs * 0.26;
      let lx = (w - (tw + markSize + gap)) / 2;
      markX = lx;
      // `markY` is the BOX top the draw pass translates to; the ink sits
      // `SQUIRCLE_INSET` inside it
      markY = textY - markSize * (1 - SQUIRCLE_INSET);
      lx += markSize + gap;
      // per-letter x origins (left-aligned) for the staggered scroll reveal
      letters.length = 0;
      for (let i = 0; i < WORD.length; i++) {
        letters.push({ ch: WORD[i], x: lx });
        lx += word.advances[i];
      }
      mctx.textAlign = "left";
      mctx.textBaseline = "alphabetic";
      mctx.fillStyle = "#fff";
      maskP = -1; // force a mask render at the current reveal progress
    };

    // staggered reveal, left to right, fully scrubbed by scroll — item 0 is
    // the brandmark, items 1..n the letters (li = local progress of item i)
    const letterState = (i: number, pw: number) => {
      const S = 0.5; // portion of progress spent on the stagger
      const li = easeOutQuint(clamp01((pw - ((i + 1) / WORD.length) * S) / (1 - S)));
      return { a: li, dy: (1 - li) * fontSize * 0.38 };
    };
    const markState = (pw: number) => {
      const S = 0.5;
      const li = easeOutQuint(clamp01(pw / (1 - S)));
      return { a: li, dy: (1 - li) * fontSize * 0.38 };
    };

    const renderMask = (pw: number) => {
      const mctx = mask?.getContext("2d");
      if (!mctx || !mask) return;
      mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      mctx.clearRect(0, 0, w, h);
      mctx.font = fontSpec;
      mctx.textAlign = "left";
      mctx.textBaseline = "alphabetic";
      mctx.fillStyle = "#fff";
      // The mark is a letter of the lockup, so it is knocked out of the field
      // exactly like one: the mask is what lets the charts read THROUGH the ink
      // (the composite at the end draws field ∩ mask at full strength), and a
      // mark left out of it reads as an opaque slab beside translucent letters.
      // It also knocks the mark out of the pointer torch for free.
      if (markSize > 0) {
        const m = markState(pw);
        if (m.a > 0.004) {
          const s = markSize / 32;
          mctx.save();
          mctx.translate(markX, markY + m.dy);
          mctx.scale(s, s);
          mctx.globalAlpha = m.a;
          // oxlint-disable-next-line unicorn/no-array-fill-with-reference-type -- canvas Path2D fill, not Array#fill
          mctx.fill(squircle);
          mctx.restore();
        }
      }
      for (let i = 0; i < letters.length; i++) {
        const { a, dy } = letterState(i, pw);
        if (a <= 0.004) continue;
        mctx.globalAlpha = a;
        mctx.fillText(letters[i].ch, letters[i].x, textY + dy);
      }
      mctx.globalAlpha = 1;
      maskP = pw;
    };

    // scroll progress, anchored to the WORD BAND (not the whole footer —
    // the canvas spans the full footer now, and the page runs out of scroll
    // before a footer-height scrub could finish): 0 = the band is a full
    // band-height below the fold, 1 = the footer bottom reaches the viewport
    // bottom, i.e. the reveal completes exactly as you land on it.
    // The host box, re-read at most once per frame. The pointer handlers need it
    // to map client coords into canvas space, and pointermove fires far more often
    // than once a frame — reading `getBoundingClientRect()` there forced a full
    // layout on every pointer event, on every page (this footer is site-wide).
    // The canvas is `absolute inset-0` of the host, so one rect serves both.
    let box: DOMRect | null = null;
    const hostBox = () => (box ??= host.getBoundingClientRect());

    const progress = () => {
      const r = (box = host.getBoundingClientRect());
      const vh = window.innerHeight || 1;
      return clamp01(1 - (r.bottom - vh) / 240);
    };

    const draw = (nowMs: number, still = false) => {
      if (!mask || !field || !fctx || !layer || !lctx) return;
      if (typeSeed !== seedShift) buildTypes(); // double-tap re-dealt the data
      const t = nowMs / 1000;
      const p = still || reduced ? 1 : progress();
      // the wordmark reveal is scrubbed by scroll; the mask re-rasterizes
      // only while the reveal is actually moving, then stays cached
      // the word reveal is scrubbed by scroll, windowed to when the band is
      // actually VISIBLE: it starts as the word enters the viewport (p≈0.55)
      // and completes exactly at the bottom — characters ride the scroll.
      const pWord = still || reduced ? 1 : clamp01((p - 0.55) / 0.45);
      if (Math.abs(pWord - maskP) > 0.0005) renderMask(pWord);

      // frame dt for the spring field; pointer wake decays when the mouse rests
      const dtF = lastDrawMs ? Math.min((nowMs - lastDrawMs) / 1000, 0.05) : 0.016;
      lastDrawMs = nowMs;
      const springOn = mouseFine && !still && !reduced;
      if (springOn) {
        const decay = Math.exp(-dtF * 4.5);
        mvx *= decay;
        mvy *= decay;
      }
      let energyAcc = 0;

      // infinite conveyor: the lattice drifts upward forever; virtual rows
      // advance as whole rows wrap, so fresh charts surface from the bottom
      fctx.clearRect(0, 0, w, h);
      const gx0 = (w - cols * cellW) / 2;
      const gy0 = (h - rows * cellH) / 2;
      const drift = t * DRIFT;
      const rowShift = Math.floor(drift / cellH);
      const frac = drift - rowShift * cellH;
      // springs live in VISUAL slots, but the conveyor re-assigns slot
      // contents as rows wrap — shift the state buffer in lockstep or every
      // displaced chart snaps to rest on each row boundary (visible reset)
      if (!still && lastRowShift >= 0 && rowShift !== lastRowShift) {
        const dRows = rowShift - lastRowShift;
        const stride = cols * 4;
        if (dRows > 0 && dRows <= rows) {
          spring.copyWithin(0, dRows * stride);
          spring.fill(0, spring.length - dRows * stride);
        } else if (dRows !== 0) {
          spring.fill(0); // huge jump (tab resume) — settle everything
        }
      }
      if (!still) lastRowShift = rowShift;
      for (let r = 0; r <= rows; r++) {
        const vr = r + rowShift;
        const rowT = typesFor(vr);
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          if (rowT[c] === EMPTY) continue;
          const seed = vr * 197 + c * 13 + 7 + seedShift;
          // pull-up: bottom rows surface first, each cell with its own lag
          const lag =
            ((rows - 1 - Math.min(r, rows - 1)) / Math.max(rows - 1, 1)) * ENTER_TAIL +
            hash(seed) * LAG_JITTER;
          const e = still || reduced ? 1 : easeOutQuint(clamp01((p - lag) / (1 - MAX_LAG)));
          if (e <= 0.01) continue;

          // hand-set, not wallpaper: every cell sits a hair off the lattice
          let x = gx0 + c * cellW + (hash(seed + 2.2) - 0.5) * 5;
          let y = gy0 + r * cellH - frac + (hash(seed + 4.4) - 0.5) * 4 + (1 - e) * cellH * 2.6;

          // skip cells the vignette mask fully hides (corners, top edge)
          const ndx = (x + cellW / 2 - w / 2) / (w * vrx);
          const ndy = (y + cellH / 2 - h * vcy) / (h * vry);
          if (ndx * ndx + ndy * ndy > 0.95) continue;

          // spring field: the pointer's wake shoves nearby cells along its
          // direction of travel; a damped spring carries them home
          if (springOn) {
            const i4 = idx * 4;
            let ox = spring[i4];
            let oy = spring[i4 + 1];
            let svx = spring[i4 + 2];
            let svy = spring[i4 + 3];
            let fx = 0;
            let fy = 0;
            if (px > -1e8) {
              const dxp = x + cellW / 2 - px;
              const dyp = y + cellH / 2 - py;
              const d2p = dxp * dxp + dyp * dyp;
              // the cursor parts the field — cells are shoved radially away
              // and spring home once it passes (works even when hovering
              // still, so the pointer always displaces, never just tints)
              const Lr = cellW * 2.8;
              if (d2p < Lr * Lr * 9) {
                const rep = Math.exp(-d2p / (2 * Lr * Lr)) * 1100;
                const d = Math.sqrt(d2p) || 1;
                fx += (dxp / d) * rep;
                fy += (dyp / d) * rep;
              }
              // plus the wake: fast sweeps drag cells along the direction
              // of travel
              if (Math.abs(mvx) + Math.abs(mvy) > 4) {
                const L = cellW * 4.5;
                if (d2p < L * L * 9) {
                  const gg = Math.exp(-d2p / (2 * L * L));
                  fx += mvx * gg * 1.2;
                  fy += mvy * gg * 1.2;
                }
              }
            }
            if (
              fx !== 0 ||
              fy !== 0 ||
              Math.abs(ox) + Math.abs(oy) + Math.abs(svx) + Math.abs(svy) > 0.03
            ) {
              svx += (-90 * ox - 13 * svx + fx) * dtF;
              svy += (-90 * oy - 13 * svy + fy) * dtF;
              ox += svx * dtF;
              oy += svy * dtF;
              const capO = cellW * 0.8;
              if (ox > capO) ox = capO;
              else if (ox < -capO) ox = -capO;
              if (oy > capO) oy = capO;
              else if (oy < -capO) oy = -capO;
              spring[i4] = ox;
              spring[i4 + 1] = oy;
              spring[i4 + 2] = svx;
              spring[i4 + 3] = svy;
              energyAcc += Math.abs(ox) + Math.abs(oy);
              x += ox;
              y += oy;
            }
          }

          // pointer lens + click pulses
          let energy = 0;
          if (!reduced) {
            const dx = x + cellW / 2 - px;
            const dy = y + cellH / 2 - py;
            const lens = cellW * 4;
            const d2 = dx * dx + dy * dy;
            if (d2 < lens * lens * 9) energy = Math.exp(-d2 / (2 * lens * lens));
            for (const pu of pulses) {
              const age = t - pu.t0;
              const pd = Math.hypot(x + cellW / 2 - pu.x, y + cellH / 2 - pu.y) - age * w * 0.45;
              energy += Math.exp(-(pd * pd) / (2 * 42 * 42)) * Math.exp(-age * 1.9);
            }
          }

          fctx.save();
          // magnetic swell: cells near the pointer grow around their center
          if (energy > 0.02) {
            const s = 1 + 0.28 * energy;
            const hw = (cellW - 6) / 2;
            const hh = (cellH - 5) / 2;
            fctx.translate(x + 3 + hw, y + 2.5 + hh);
            fctx.scale(s, s);
            fctx.translate(-hw, -hh);
          } else {
            fctx.translate(x + 3, y + 2.5);
          }
          fctx.globalAlpha = e * Math.min(1, 0.9 + energy * 0.4);
          drawCell(
            fctx,
            rowT[c],
            cellW - 6,
            cellH - 5,
            seed,
            // energy nudges phase a touch — never scale the clock itself,
            // or a moving pointer turns phase shifts into flicker
            // phase nudge kept small — big values read as shimmer when a
            // fast sweep swings energy 0→1 across a region
            reduced ? 2.6 : t + energy * 0.18,
            pal,
          );
          fctx.restore();
        }
      }

      // Field + word composite. Light gets a touch more letter ink; torch stays equal.
      const fieldA = 0.16;
      const torchA = 0.34;
      const slabA = light ? 0.14 : 0.11;
      const outlineA = light ? 0.4 : 0.36;

      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = fieldA;
      ctx.drawImage(field, 0, 0, w, h);
      ctx.globalAlpha = 1;

      // Pointer torch — only while hovering; knock the word out so letters stay dominant.
      if (!reduced && px > -1e8 && torch && tctx) {
        const tc = tctx;
        tc.setTransform(1, 0, 0, 1, 0, 0);
        tc.clearRect(0, 0, torch.width, torch.height);
        tc.drawImage(field, 0, 0);
        const rad = Math.max(130, Math.min(210, w * 0.11)) * dpr;
        const g = tc.createRadialGradient(px * dpr, py * dpr, 0, px * dpr, py * dpr, rad);
        g.addColorStop(0, `rgba(0,0,0,${torchA})`);
        g.addColorStop(0.55, `rgba(0,0,0,${torchA / 2})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        tc.globalCompositeOperation = "destination-in";
        tc.fillStyle = g;
        tc.fillRect(0, 0, torch.width, torch.height);
        tc.globalCompositeOperation = "destination-out";
        tc.drawImage(mask, 0, 0);
        tc.globalCompositeOperation = "source-over";
        ctx.drawImage(torch, 0, 0, w, h);
      }

      if (pWord > 0.01 && fontSpec) {
        // Per-letter outline/fill so each rises with the mask.
        ctx.font = fontSpec;
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.strokeStyle = pal.accent;
        ctx.fillStyle = pal.accent;
        ctx.lineWidth = 1;
        const breath = still || reduced ? 0 : Math.sin(t * 0.45) * 0.07;

        // the brandmark leads the lockup — hollow squircle + graded cells in
        // the same letterpress ink, revealing first
        if (markSize > 0) {
          const m = markState(pWord);
          if (m.a > 0.004) {
            const s = markSize / 32;
            ctx.save();
            ctx.translate(markX, markY + m.dy);
            ctx.scale(s, s);
            ctx.globalAlpha = slabA * m.a;
            // oxlint-disable-next-line unicorn/no-array-fill-with-reference-type -- canvas Path2D fill, not Array#fill
            ctx.fill(squircle);
            ctx.globalAlpha = (outlineA + breath) * m.a;
            ctx.lineWidth = 1.4 / s;
            ctx.stroke(squircle);
            for (const cell of CELLS) {
              ctx.globalAlpha = (0.35 + 0.55 * cell.o) * m.a;
              ctx.beginPath();
              if (typeof ctx.roundRect === "function")
                ctx.roundRect(cell.x, cell.y, CELL_SIZE, CELL_SIZE, CELL_R);
              else ctx.rect(cell.x, cell.y, CELL_SIZE, CELL_SIZE);
              ctx.fill();
            }
            ctx.restore();
            ctx.lineWidth = 1;
          }
        }
        for (let i = 0; i < letters.length; i++) {
          const { a, dy } = letterState(i, pWord);
          if (a <= 0.004) continue;
          ctx.globalAlpha = slabA * a;
          ctx.fillText(letters[i].ch, letters[i].x, textY + dy);
          ctx.globalAlpha = (outlineA + breath) * a;
          ctx.strokeText(letters[i].ch, letters[i].x, textY + dy);
        }
      }
      ctx.globalAlpha = 1;

      const lc = lctx;
      lc.setTransform(1, 0, 0, 1, 0, 0);
      lc.clearRect(0, 0, layer.width, layer.height);
      lc.drawImage(field, 0, 0);
      lc.globalCompositeOperation = "destination-in";
      lc.drawImage(mask, 0, 0);
      lc.globalCompositeOperation = "source-over";
      ctx.drawImage(layer, 0, 0, w, h);

      // final pass: the cached vignette shade fades everything — field,
      // torch, and word — into the footer as one surface
      if (shade) {
        ctx.globalCompositeOperation = "destination-in";
        ctx.drawImage(shade, 0, 0, w, h);
        ctx.globalCompositeOperation = "source-over";
      }

      springEnergy = energyAcc;

      for (let i = pulses.length - 1; i >= 0; i--) {
        if (t - pulses[i].t0 > 2.5) pulses.splice(i, 1);
      }
    };

    const loop = (tm: number) => {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      flip = !flip;

      const p = progress();
      const active =
        px > -1e8 || pulses.length > 0 || springEnergy > 0.5 || Math.abs(p - lastP) > 0.001;
      lastP = p;

      // idle field drift is indistinguishable at 30fps — skip alternate frames
      if (!active && flip) {
        prevFull = false;
        return;
      }

      // frame-cost EMA over consecutive full-rate frames; one-way degrade
      // for devices that can't hold the budget
      if (prevFull && lastTm) ema = ema * 0.9 + Math.min(tm - lastTm, 100) * 0.1;
      lastTm = tm;
      prevFull = true;
      if (!degraded && ema > 26) {
        degraded = true;
        build();
      }

      draw(tm);
    };
    const start = () => {
      if (running || reduced || !visible || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    // still frames reuse the last live timestamp so the conveyor position
    // matches the running loop — a mid-animation repaint never time-warps
    const drawStill = () => draw(lastDrawMs || 2600, true);

    const ro = new ResizeObserver(() => {
      box = null;
      build();
      drawStill(); // repaint immediately; a running loop overwrites next frame
    });
    ro.observe(host);

    // The running loop refreshes `box` every frame via progress(); this keeps it
    // honest while the loop is paused (offscreen, hidden tab) so the first
    // pointer event after resuming maps to the right place. Nulling is free —
    // no layout is read here.
    const onGeometryChange = () => {
      box = null;
    };
    window.addEventListener("scroll", onGeometryChange, { passive: true });
    window.addEventListener("resize", onGeometryChange, { passive: true });

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(host);

    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);

    // theme / accent switches repaint paused and reduced-motion renders
    const mo = new MutationObserver(() => {
      refreshPalette();
      drawStill();
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-accent", "data-mc-preset"],
    });

    const onMove = (e: PointerEvent) => {
      const b = hostBox();
      const nx = e.clientX - b.left;
      const ny = e.clientY - b.top;
      if (mouseFine) {
        const now = performance.now();
        const dt = (now - lastMoveT) / 1000;
        if (px > -1e8 && dt > 0 && dt < 0.1) {
          // smoothed pointer velocity, capped — the wake the cells ride
          const ivx = (nx - px) / dt;
          const ivy = (ny - py) / dt;
          const sp = Math.hypot(ivx, ivy);
          const cap = sp > 2600 ? 2600 / sp : 1;
          mvx = mvx * 0.55 + ivx * cap * 0.45;
          mvy = mvy * 0.55 + ivy * cap * 0.45;
        }
        lastMoveT = now;
      }
      px = nx;
      py = ny;
    };
    const onLeave = () => {
      px = -1e9;
      py = -1e9;
    };
    const onDown = (e: PointerEvent) => {
      const b = hostBox();
      const now = performance.now() / 1000;
      // double-tap deals the whole field new data — a new trading day
      if (now - lastDownT < 0.35) seedShift += 977;
      lastDownT = now;
      pulses.push({ x: e.clientX - b.left, y: e.clientY - b.top, t0: now });
      // touch has no hover: the torch has to be lit by the finger itself, and
      // capture keeps the move stream alive once the finger leaves the host
      if (e.pointerType !== "mouse") {
        px = e.clientX - b.left;
        py = e.clientY - b.top;
        try {
          host.setPointerCapture(e.pointerId);
        } catch {
          // stale/synthetic pointer id — the torch still tracks, just uncaptured
        }
      }
    };
    // a lifted finger is a left pointer; a cancel means the browser took the
    // gesture for a vertical scroll (touch-action: pan-y), so drop it too
    const onUp = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") onLeave();
    };
    if (!reduced) {
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerleave", onLeave);
      host.addEventListener("pointerdown", onDown);
      host.addEventListener("pointerup", onUp);
      host.addEventListener("pointercancel", onUp);
    }

    refreshPalette();
    build();
    // resample once webfonts land so the mask uses the display face
    document.fonts?.ready.then(() => {
      build();
      if (!running) drawStill();
    });
    if (reduced) drawStill();
    else start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("scroll", onGeometryChange);
      window.removeEventListener("resize", onGeometryChange);
      document.removeEventListener("visibilitychange", onVis);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("pointerup", onUp);
      host.removeEventListener("pointercancel", onUp);
    };
  }, [hostRef, canvasRef]);
}
