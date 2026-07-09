// FillWord geometry — pure, React-free (plan/24 #3, S4). The label IS the bar:
// a muted word with an accent copy clipped to the value fraction of its own
// glyph extent (percentage inset → 50% visually bisects the word, never a
// hidden wider track). Glyph extent is estimated deterministically (plan/18
// 0.62 em/char) + pinned with textLength so containment is provable without
// measuring text server-side. All coords 2-dp.
import { round2 } from "../../core/types.js";

export type FillMode = "fill" | "drain";

export interface FillWordGeometry {
  /** Deterministic estimated glyph extent (textLength attr). */
  textLength: number;
  x: number;
  y: number;
  width: number;
  height: number;
  /** clip-path inset() value for the accent copy (empty word → null). */
  clip: string | null;
  /** Whole-percent for the summary/label. */
  pct: number;
  /** x for the optional percent numeral (label="value"), else null. */
  numeralX: number | null;
}

function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

export function fillWordGeometry(opts: {
  value: number;
  word: string;
  fontSize: number;
  pad: number;
  mode: FillMode;
  /** Reserve a gutter and place the "NNN%" numeral after the word. */
  label?: boolean;
}): FillWordGeometry {
  const { word, fontSize, pad, mode, label = false } = opts;
  const v = clamp01(Number.isFinite(opts.value) ? opts.value : 0);
  const chars = word.length;
  const textLength = round2(chars * 0.62 * fontSize);
  const height = Math.ceil(fontSize * 1.4);
  const x = pad;
  const y = round2(height / 2);
  // reserve " 100%" (5 glyphs incl. a leading space) when labelling
  const gutter = label ? round2(5 * 0.62 * fontSize) : 0;
  const numeralX = label && chars > 0 ? round2(x + textLength + 0.62 * fontSize) : null;
  const width = Math.max(1, Math.ceil(textLength + gutter + 2 * pad));

  // fill: accent grows from the left → clip the right (1−v) away.
  // drain: accent (remaining) empties from the left as v rises → clip the left v away.
  const clip =
    chars === 0
      ? null
      : mode === "drain"
        ? `inset(0 0 0 ${round2(100 * v)}%)`
        : `inset(0 ${round2(100 * (1 - v))}% 0 0)`;

  return { textLength, x, y, width, height, clip, pct: Math.round(v * 100), numeralX };
}
