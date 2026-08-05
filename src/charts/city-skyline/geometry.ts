// Two variables ARE the story: building HEIGHT (the
// primary, high-precision channel, zero-anchored) + lit-window FRACTION (a
// secondary, low-precision "mostly lit / half lit / dark"). Windows: fixed 2
// columns, filled bottom-up, quantized to the window count. No roofline/antenna/
// width variation ever — earn every mark. All coords 2-dp.
import { maxOf } from "../../core/scale.js";
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

export const PAD = 2;

/**
 * The vertical band: where the ground line sits and how tall a full building may
 * be. Geometry owns this because both entries need the same numbers — the static
 * one to seat the chart on the text baseline, the interactive one to place its
 * overlays — and they used to compute it twice, the client entry with `2` where
 * the component used `PAD`. A label reserves its own room: `label="value"` above
 * the roofline, `labels` below the ground.
 */
export function skylineBands(
  height: number,
  fontSize: number,
  label: string | undefined,
  labels: boolean | undefined,
): { groundY: number; maxH: number } {
  // Labels sit BELOW the ground line with a fixed ~4px of air — hugging the
  // baseline made them read as part of the skyline. A constant gap (not
  // em-scaled) keeps the buildings tall even when the label font is large.
  const groundY = height - (labels ? fontSize + 4 : PAD);
  return { groundY, maxH: groundY - (label === "value" ? fontSize + 2 : PAD) };
}

export interface CitySkylineGeometry {
  buildings: SkylineBuilding[];
  ground: { x1: number; x2: number; y: number };
  /** The resolved zero-anchored height domain `[0, max]` — the frame the
   * annotation host draws on, so it can never diverge from the buildings. */
  domain: readonly [number, number];
  width: number;
  height: number;
}

const WIN_COLS = 2;
/** Windows are a low-precision channel — a building legible at word size holds
 * about five rows. The cap exists because `maxH` comes from the caller's
 * `height`: an infinite one made `rows` infinite and the fill loop below grew a
 * path string until the tab died, and a merely huge one emitted thousands of
 * window rects nobody can see. */
const MAX_WIN_ROWS = 200;

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
  // A domain with a non-finite bound is not a scale: `value / NaN` carried NaN
  // into every y and height while the summary still announced the real tallest,
  // so the chart went blank and read as populated. Fall back to the data max.
  const max =
    opts.domain && opts.domain.every((d) => Number.isFinite(d)) ? opts.domain[1] : maxOf(values, 1);

  const winUnit = Math.max(2, round2(bw * 0.42)); // window + gutter cell size
  const winGut = winUnit * 0.28;
  const winW = round2((bw - winGut * (WIN_COLS + 1)) / WIN_COLS);

  const buildings: SkylineBuilding[] = data.map((d, i) => {
    const value = values[i]!;
    const x = round2(pad + i * (bw + gap));
    const h = round2(max <= 0 ? 0 : Math.min(1, value / max) * maxH);
    const y = round2(groundY - h);
    const rows = h > 0 && winUnit > 0 ? Math.min(MAX_WIN_ROWS, Math.floor(h / winUnit)) : 0;
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
  return {
    buildings,
    ground: { x1: pad, x2: round2(width - pad), y: groundY },
    domain: [0, max],
    width,
    height,
  };
}
