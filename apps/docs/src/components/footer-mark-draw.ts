/** Footer canvas cell drawing — 11 archetypes from the shipped catalog. */

export const ENTER_TAIL = 0.45;
export const LAG_JITTER = 0.18;
export const MAX_LAG = ENTER_TAIL + LAG_JITTER;

export const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
export const easeOutQuint = (x: number) => 1 - (1 - x) ** 5;
export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

export function parseColor(s: string): [number, number, number] | null {
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
export const css = ([r, g, b]: [number, number, number]) => `rgb(${r},${g},${b})`;

export type Palette = { accent: string; pos: string; neg: string; neutral: string };

export function drawCell(
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
