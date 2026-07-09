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
  // The numeral hugs the word: place it at the word's REAL extent (~0.53 em/char
  // for a proportional font) plus a snug gap, not at the 0.62 containment
  // over-estimate (which left a big dead space). The containment box still uses
  // the over-estimate so the natural word never overflows.
  const wordExtent = round2(chars * 0.56 * fontSize);
  const numeralExtent = round2(4 * 0.62 * fontSize); // "100%"
  const numeralX = label && chars > 0 ? round2(x + wordExtent + fontSize * 0.5) : null;
  const width =
    label && chars > 0
      ? Math.max(1, Math.ceil((numeralX ?? 0) + numeralExtent + pad))
      : Math.max(1, Math.ceil(textLength + 2 * pad));

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
