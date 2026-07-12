"use client";
import { useEffect, useRef } from "react";
import { CELL_R, CELL_SIZE, CELLS, SQUIRCLE_PATH } from "@/lib/brand";

/**
 * The footer brand moment: "the catalog surfaces."
 *
 * A field of tiny LIVING microcharts — sparklines, win/loss bars, deltas,
 * activity cells, progress rings, bullets, slopes, seismograms, dot plots,
 * streaks — drawn procedurally in the library's real semantic palette
 * (accent, positive, negative, neutral). Scrolling the footer into view
 * scrubs the field up out of the bottom edge (reversible — you pull it up).
 * The giant wordmark is cut pixel-crisp from the SAME field, so the letters
 * are made of bright charts while the faint field breathes behind them.
 * The pointer is a lens that reveals the faint catalog; a click sends a
 * data pulse rippling through the field.
 *
 * Performance: the text mask rasterizes once per resize/font-load; each
 * frame renders the mosaic once to an offscreen canvas and composites it
 * twice (faint full-bleed + bright masked). All randomness is a hash of the
 * cell index — deterministic, allocation-free frames. Cells fully hidden by
 * the vignette are culled; an idle field renders at half rate; a frame-cost
 * EMA degrades density/DPR one step on devices that can't hold the budget.
 * Colors read live from CSS tokens so themes and the accent picker retune
 * it. Matte — no glow. Reduced motion renders one fully-risen still frame.
 * Double-tap deals every chart new data.
 */

const ENTER_TAIL = 0.45; // portion of progress used by the row stagger
const LAG_JITTER = 0.18; // extra per-cell lag, so rows don't arrive as slabs
const MAX_LAG = ENTER_TAIL + LAG_JITTER; // normalizer — every cell settles at p=1

const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const easeOutQuint = (x: number) => 1 - (1 - x) ** 5;
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

function parseColor(s: string): [number, number, number] | null {
  const v = s.trim();
  if (v.startsWith("#")) {
    const h = v.slice(1);
    if (h.length === 3)
      return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)];
    if (h.length >= 6)
      return [
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16),
      ];
    return null;
  }
  const m = v.match(/rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}
const css = ([r, g, b]: [number, number, number]) => `rgb(${r},${g},${b})`;

type Palette = { accent: string; pos: string; neg: string; neutral: string };

/* ── one tiny chart per cell — 11 archetypes from the shipped catalog ────── */
function drawCell(
  ctx: CanvasRenderingContext2D,
  type: number,
  cw: number,
  ch: number,
  seed: number,
  t: number,
  pal: Palette,
) {
  const R = (i: number) => hash(seed * 13.7 + i);
  const wob = (i: number, a: number) => Math.sin(t * (0.6 + R(90) * 0.5) + i * 1.3 + seed) * a;
  const mainC = [pal.accent, pal.accent, pal.pos, pal.neg, pal.neutral][Math.floor(R(1) * 5)];

  switch (type) {
    case 0: {
      // sparkline + area
      const n = 7;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const x = (i / n) * cw;
        const y = ch * (0.78 - 0.55 * R(i + 2)) + wob(i, ch * 0.05);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = mainC;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.lineTo(cw, ch);
      ctx.lineTo(0, ch);
      ctx.closePath();
      ctx.globalAlpha *= 0.22;
      ctx.fillStyle = mainC;
      ctx.fill();
      break;
    }
    case 1: {
      // win/loss sparkbar
      const n = 6;
      const bw = cw / n;
      const mid = ch * 0.52;
      for (let i = 0; i < n; i++) {
        const up = R(i + 3) > 0.45;
        const hh = ch * (0.16 + 0.24 * R(i + 20)) + wob(i, ch * 0.03);
        ctx.fillStyle = up ? pal.pos : pal.neg;
        ctx.fillRect(i * bw + bw * 0.18, up ? mid - hh : mid, bw * 0.64, hh);
      }
      break;
    }
    case 2: {
      // mini bars
      const n = 5;
      const bw = cw / n;
      const base = ctx.globalAlpha;
      ctx.fillStyle = mainC;
      for (let i = 0; i < n; i++) {
        const hh = ch * (0.2 + 0.68 * R(i + 5)) + wob(i, ch * 0.04);
        ctx.globalAlpha = base * (i === n - 1 ? 1 : 0.72);
        ctx.fillRect(i * bw + bw * 0.2, ch - hh, bw * 0.6, hh);
      }
      ctx.globalAlpha = base;
      break;
    }
    case 3: {
      // dot plot, one emphasized
      const n = 5;
      const hot = Math.floor(R(7) * n);
      for (let i = 0; i < n; i++) {
        const x = (i + 0.5) * (cw / n);
        const y = ch * (0.3 + 0.4 * R(i + 9)) + wob(i, ch * 0.05);
        ctx.beginPath();
        ctx.arc(x, y, i === hot ? 2.1 : 1.3, 0, Math.PI * 2);
        ctx.fillStyle = i === hot ? mainC : pal.neutral;
        ctx.fill();
      }
      break;
    }
    case 4: {
      // delta: triangle + baseline tick
      const up = R(4) > 0.5;
      const cxx = cw * 0.35;
      const cy = ch * 0.5 + wob(1, ch * 0.04);
      const s = ch * 0.22;
      ctx.beginPath();
      if (up) {
        ctx.moveTo(cxx, cy - s);
        ctx.lineTo(cxx - s, cy + s * 0.8);
        ctx.lineTo(cxx + s, cy + s * 0.8);
      } else {
        ctx.moveTo(cxx, cy + s);
        ctx.lineTo(cxx - s, cy - s * 0.8);
        ctx.lineTo(cxx + s, cy - s * 0.8);
      }
      ctx.closePath();
      ctx.fillStyle = up ? pal.pos : pal.neg;
      ctx.fill();
      ctx.fillStyle = pal.neutral;
      ctx.fillRect(cw * 0.58, cy - 1, cw * 0.3, 2);
      break;
    }
    case 5: {
      // activity grid 4×2
      const gw = cw / 4;
      const gh = ch / 2;
      const base = ctx.globalAlpha;
      ctx.fillStyle = mainC;
      for (let gy = 0; gy < 2; gy++)
        for (let gx = 0; gx < 4; gx++) {
          const v = R(gx + gy * 4 + 11);
          ctx.globalAlpha = base * (0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * 0.7 + v * 6.3 + seed)));
          ctx.fillRect(gx * gw + 1, gy * gh + 1, gw - 2, gh - 2);
        }
      ctx.globalAlpha = base;
      break;
    }
    case 6: {
      // progress ring
      const r = Math.min(cw, ch) * 0.34;
      const cxx = cw / 2;
      const cy = ch / 2;
      ctx.beginPath();
      ctx.arc(cxx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = pal.neutral;
      ctx.lineWidth = 1.6;
      ctx.globalAlpha *= 0.35;
      ctx.stroke();
      ctx.globalAlpha /= 0.35;
      ctx.beginPath();
      const sweep = (0.25 + 0.6 * R(6) + 0.06 * Math.sin(t * 0.8 + seed)) * Math.PI * 2;
      ctx.arc(cxx, cy, r, -Math.PI / 2, -Math.PI / 2 + sweep);
      ctx.strokeStyle = mainC;
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
    }
    case 7: {
      // bullet: track / bar / target
      const cy = ch * 0.5;
      ctx.fillStyle = pal.neutral;
      ctx.globalAlpha *= 0.3;
      ctx.fillRect(cw * 0.06, cy - ch * 0.16, cw * 0.88, ch * 0.32);
      ctx.globalAlpha /= 0.3;
      const val = cw * (0.35 + 0.45 * R(8)) + wob(2, cw * 0.02);
      ctx.fillStyle = mainC;
      ctx.fillRect(cw * 0.06, cy - ch * 0.07, val, ch * 0.14);
      const tx = cw * (0.55 + 0.3 * R(14));
      ctx.fillStyle = pal.neg;
      ctx.fillRect(tx, cy - ch * 0.2, 1.6, ch * 0.4);
      break;
    }
    case 8: {
      // slope: two points, rising or falling
      const y1 = ch * (0.25 + 0.5 * R(2));
      const y2 = ch * (0.25 + 0.5 * R(3)) + wob(3, ch * 0.05);
      const up = y2 < y1;
      ctx.beginPath();
      ctx.moveTo(cw * 0.16, y1);
      ctx.lineTo(cw * 0.84, y2);
      ctx.strokeStyle = up ? pal.pos : pal.neg;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      for (const [x, y] of [
        [cw * 0.16, y1],
        [cw * 0.84, y2],
      ]) {
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = up ? pal.pos : pal.neg;
        ctx.fill();
      }
      break;
    }
    case 9: {
      // seismogram
      const n = 9;
      ctx.strokeStyle = mainC;
      ctx.lineWidth = 1.1;
      for (let i = 0; i < n; i++) {
        const x = (i + 0.5) * (cw / n);
        const hh = ch * (0.08 + 0.4 * R(i + 30)) * (0.75 + 0.25 * Math.sin(t * 1.1 + i + seed));
        ctx.beginPath();
        ctx.moveTo(x, ch * 0.5 - hh);
        ctx.lineTo(x, ch * 0.5 + hh);
        ctx.stroke();
      }
      break;
    }
    case 10: {
      // streak dots: filled run + hollow misses
      const n = 7;
      for (let i = 0; i < n; i++) {
        const x = (i + 0.5) * (cw / n);
        const on = R(i + 40) > 0.35;
        ctx.beginPath();
        ctx.arc(x, ch * 0.5 + wob(i, ch * 0.04), 1.7, 0, Math.PI * 2);
        if (on) {
          ctx.fillStyle = mainC;
          ctx.fill();
        } else {
          ctx.strokeStyle = pal.neutral;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
      break;
    }
    case 11: {
      // waterfall: floating steps up/down to a total
      const n = 5;
      const bw = cw / n;
      let lvl = ch * 0.72;
      for (let i = 0; i < n; i++) {
        const d = (R(i + 6) - 0.42) * ch * 0.5;
        const next = Math.max(ch * 0.1, Math.min(ch * 0.9, lvl - d));
        ctx.fillStyle = next < lvl ? pal.pos : pal.neg;
        ctx.fillRect(i * bw + bw * 0.15, Math.min(lvl, next), bw * 0.7, Math.abs(lvl - next) + 0.6);
        lvl = next;
      }
      break;
    }
    case 12: {
      // dumbbell: then → now
      const y = ch * 0.5 + wob(1, ch * 0.05);
      const x1 = cw * 0.18;
      const x2 = cw * (0.55 + 0.3 * R(3));
      ctx.strokeStyle = pal.neutral;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x1, y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = pal.neutral;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x2, y, 2, 0, Math.PI * 2);
      ctx.fillStyle = mainC;
      ctx.fill();
      break;
    }
    case 13: {
      // segmented bar: parts of a whole
      const y = ch * 0.5;
      const parts = [0.2 + 0.3 * R(2), 0.15 + 0.25 * R(3)];
      const segs = [parts[0], parts[1], 1 - parts[0] - parts[1]];
      const colors = [mainC, pal.pos, pal.neutral];
      const x0 = cw * 0.06;
      let x = x0;
      const base = ctx.globalAlpha;
      for (let i = 0; i < 3; i++) {
        const sw = cw * 0.88 * segs[i];
        ctx.globalAlpha = base * (i === 2 ? 0.45 : 0.95);
        ctx.fillStyle = colors[i];
        ctx.fillRect(x, y - ch * 0.15, Math.max(sw - 1, 1), ch * 0.3);
        x += sw;
      }
      ctx.globalAlpha = base;
      break;
    }
    case 14: {
      // funnel: stages narrowing
      const rowsN = 4;
      const rh = ch / rowsN;
      const base = ctx.globalAlpha;
      ctx.fillStyle = mainC;
      for (let i = 0; i < rowsN; i++) {
        const fw = cw * (0.9 - i * (0.16 + 0.04 * R(i + 8)));
        ctx.globalAlpha = base * (1 - i * 0.16);
        ctx.fillRect((cw - fw) / 2, i * rh + 0.8, fw, rh - 1.6);
      }
      ctx.globalAlpha = base;
      break;
    }
    case 15: {
      // micro-donut: thick arc + faint remainder
      const r = Math.min(cw, ch) * 0.32;
      const cxx = cw / 2;
      const cy = ch / 2;
      const lw = Math.max(2.4, r * 0.55);
      const base = ctx.globalAlpha;
      ctx.beginPath();
      ctx.arc(cxx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = pal.neutral;
      ctx.lineWidth = lw;
      ctx.globalAlpha = base * 0.28;
      ctx.stroke();
      ctx.globalAlpha = base;
      ctx.beginPath();
      const sweep = (0.55 + 0.3 * R(5)) * Math.PI * 2;
      ctx.arc(cxx, cy, r, -Math.PI / 2, -Math.PI / 2 + sweep);
      ctx.strokeStyle = mainC;
      ctx.stroke();
      break;
    }
    case 16: {
      // dual sparkline: series vs baseline series
      const n = 6;
      const base = ctx.globalAlpha;
      for (let s = 0; s < 2; s++) {
        ctx.beginPath();
        for (let i = 0; i <= n; i++) {
          const x = (i / n) * cw;
          const y = ch * (0.75 - 0.5 * R(i + 2 + s * 20)) + wob(i + s * 3, ch * 0.04);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = s === 0 ? pal.neutral : mainC;
        ctx.globalAlpha = base * (s === 0 ? 0.55 : 1);
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      ctx.globalAlpha = base;
      break;
    }
    case 17: {
      // quantile dots over a band
      const y = ch * 0.5;
      const base = ctx.globalAlpha;
      ctx.fillStyle = pal.neutral;
      ctx.globalAlpha = base * 0.25;
      ctx.fillRect(cw * 0.1, y - ch * 0.12, cw * 0.8, ch * 0.24);
      ctx.globalAlpha = base;
      for (let i = 0; i < 5; i++) {
        const x = cw * (0.5 + (R(i + 12) - 0.5) * 0.7);
        ctx.beginPath();
        ctx.arc(x, y + wob(i, ch * 0.03), i === 2 ? 1.9 : 1.3, 0, Math.PI * 2);
        ctx.fillStyle = i === 2 ? mainC : pal.neutral;
        ctx.fill();
      }
      break;
    }
    default: {
      // bump: two series trading places
      const y1a = ch * (0.2 + 0.25 * R(2));
      const y1b = ch * (0.55 + 0.3 * R(3));
      for (const [ya, yb, col] of [
        [y1a, y1b, pal.pos],
        [y1b, y1a, pal.neg],
      ] as const) {
        ctx.beginPath();
        ctx.moveTo(cw * 0.12, ya);
        ctx.bezierCurveTo(cw * 0.45, ya, cw * 0.55, yb, cw * 0.88, yb);
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.3;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cw * 0.88, yb, 1.7, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
      }
    }
  }
}

export function FooterMark() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    // ── live palette — refreshed on theme/accent MUTATIONS, never per frame
    // (getComputedStyle in the raf loop forces style recalc = hover hitches)
    let key = "";
    let light = false;
    let pal: Palette = { accent: "#2f52d4", pos: "#009E73", neg: "#D55E00", neutral: "#616773" };
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

    // ── canvases + the wordmark mask, DPR-crisp, built once per resize ────
    const build = () => {
      w = host.clientWidth;
      h = host.clientHeight;
      if (!w || !h) return;
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
      const wordCY = clamp01((h - 128) / h);
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
      const family = getComputedStyle(host).fontFamily || "sans-serif";
      // absolute cap — the canvas is the whole footer, so the word sizes to
      // its reserved band; one size on every page, home included
      let fs = 88;
      mctx.font = `620 ${fs}px ${family}`;
      const avail = w * 0.86;
      // the brandmark leads the word inside the canvas: mark + gap ≈ 1em,
      // so the fit measures the full lockup, not just the letters
      let tw = mctx.measureText("microcharts").width;
      if (tw + fs > avail) fs *= avail / (tw + fs);
      fontSpec = `620 ${fs}px ${family}`;
      // bottom-anchored: the word lives in the reserved band above the bar,
      // with air below matching the air above (grid → word ≈ word → bar)
      textY = h - 128 + fs * 0.03;
      fontSize = fs;
      mctx.font = fontSpec;
      tw = mctx.measureText(WORD).width;
      // squircle sized to the caps, vertically centered on the baseline band
      markSize = fs * 0.72;
      const gap = fs * 0.26;
      let lx = (w - (tw + markSize + gap)) / 2;
      markX = lx;
      markY = textY - markSize * 0.52;
      lx += markSize + gap;
      // per-letter x origins (left-aligned) for the staggered scroll reveal
      letters.length = 0;
      for (const ch2 of WORD) {
        letters.push({ ch: ch2, x: lx });
        lx += mctx.measureText(ch2).width;
      }
      mctx.textAlign = "left";
      mctx.textBaseline = "middle";
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
      mctx.textBaseline = "middle";
      mctx.fillStyle = "#fff";
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
    const progress = () => {
      const r = host.getBoundingClientRect();
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

      // ── render the living mosaic once ───────────────────────────────────
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

      // ── composite: faint full-bleed field, then the word — a ghost slab
      // and hairline outline carry the letterform; the bright mosaic cut
      // from the field is its ink ────────────────────────────────────────
      // shared tuning; light gets only a whisper more letter ink — the field
      // and torch stay identical so the mood matches dark
      const fieldA = 0.16;
      const torchA = 0.34;
      const slabA = light ? 0.14 : 0.11;
      const outlineA = light ? 0.4 : 0.36;

      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = fieldA;
      ctx.drawImage(field, 0, 0, w, h);
      ctx.globalAlpha = 1;

      // torch: the pointer is a soft light that lifts the hidden catalog out
      // of the faint field at full color — only composited while hovering
      if (!reduced && px > -1e8 && torch && tctx) {
        const tc = tctx;
        tc.setTransform(1, 0, 0, 1, 0, 0);
        tc.clearRect(0, 0, torch.width, torch.height);
        tc.drawImage(field, 0, 0);
        // a quiet reading lamp, not a floodlight — and the word is knocked
        // out of it so the letters always stay the dominant read
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
        // ghost slab + breathing outline, drawn per letter so each rises
        // and fades on its own beat with the mask
        ctx.font = fontSpec;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
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

    // ── wiring ────────────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      build();
      drawStill(); // repaint immediately; a running loop overwrites next frame
    });
    ro.observe(host);

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
      const b = canvas.getBoundingClientRect();
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
      const b = canvas.getBoundingClientRect();
      const now = performance.now() / 1000;
      // double-tap deals the whole field new data — a new trading day
      if (now - lastDownT < 0.35) seedShift += 977;
      lastDownT = now;
      pulses.push({ x: e.clientX - b.left, y: e.clientY - b.top, t0: now });
    };
    if (!reduced) {
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerleave", onLeave);
      host.addEventListener("pointerdown", onDown);
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
      document.removeEventListener("visibilitychange", onVis);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return (
    <>
      {/* the field is the footer's background — it fills the whole footer
          (nearest positioned ancestor) while the links float above it */}
      <div
        ref={hostRef}
        className="display absolute inset-0 select-none"
        role="img"
        aria-label="microcharts"
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
      </div>
      {/* in-flow spacer reserving the word band below the link grid — the
          lockup can never collide with footer content */}
      <div aria-hidden className="h-[200px]" />
    </>
  );
}
