// Two variables ARE the story: building HEIGHT (the
// primary, high-precision channel, zero-anchored) + lit-window FRACTION (a
// secondary, low-precision "mostly lit / half lit / dark"). Windows: fixed 2
// columns, filled bottom-up, quantized to the window count. No roofline/antenna/
// width variation ever — earn every mark. All coords 2-dp.
import { isFiniteValue, round2 } from "../../core/types.js";

interface SkylineBuilding {
  x: number;
  y: number;
  w: number;
  h: number;
  windowsPath: string;
  windowCount: number;
  litCount: number;
  value: number;
  lit: number | null;
  index: number;
}

export interface CitySkylineGeometry {
  buildings: SkylineBuilding[];
  ground: { x1: number; x2: number; y: number };
  width: number;
  height: number;
}

const WIN_COLS = 2;

export function citySkylineGeometry(opts: {
  data: readonly { value: number; lit?: number | undefined }[];
  bw: number;
  /** Total viewBox height. */
  height: number;
  /** y of the ground baseline (buildings grow up from here). */
  groundY: number;
  /** Max building height (from the ground up to the top band). */
  maxH: number;
  gap: number;
  domain?: readonly [number, number] | undefined;
  pad: number;
}): CitySkylineGeometry {
  const { data, bw, height, gap, pad, groundY, maxH } = opts;
  const values = data.map((d) => (Number.isFinite(d.value) && d.value > 0 ? d.value : 0));
  const max = opts.domain ? opts.domain[1] : Math.max(1, ...values);

  const winUnit = Math.max(2, round2(bw * 0.42)); // window + gutter cell size
  const winGut = winUnit * 0.28;
  const winW = round2((bw - winGut * (WIN_COLS + 1)) / WIN_COLS);

  const buildings: SkylineBuilding[] = data.map((d, i) => {
    const value = values[i]!;
    const x = round2(pad + i * (bw + gap));
    const h = round2(max <= 0 ? 0 : Math.min(1, value / max) * maxH);
    const y = round2(groundY - h);
    const rows = Math.max(0, Math.floor(h / winUnit));
    const windowCount = rows * WIN_COLS;
    // A non-finite lit fraction is "unknown", not "dark": clamping NaN would
    // carry NaN into litCount and out to the interactive readout's lit percent.
    const litRaw = d.lit;
    const lit = isFiniteValue(litRaw) ? Math.min(1, Math.max(0, litRaw)) : null;
    const litCount = lit === null ? 0 : Math.round(lit * windowCount);

    // lit windows, filled bottom-up, as one merged subpath string
    let windowsPath = "";
    if (lit !== null) {
      for (let k = 0; k < litCount; k++) {
        const col = k % WIN_COLS;
        const row = Math.floor(k / WIN_COLS); // 0 = bottom
        const wx = round2(x + winGut + col * (winW + winGut));
        const wy = round2(groundY - (row + 1) * winUnit + winGut / 2);
        const wh = round2(winUnit - winGut);
        windowsPath += `M${wx} ${wy}h${winW}v${wh}h${-winW}Z`;
      }
    }

    return { x, y, w: round2(bw), h, windowsPath, windowCount, litCount, value, lit, index: i };
  });

  const width = Math.max(1, Math.ceil(data.length * (bw + gap) - gap + 2 * pad));
  return { buildings, ground: { x1: pad, x2: round2(width - pad), y: groundY }, width, height };
}
