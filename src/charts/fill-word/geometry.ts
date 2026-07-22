// FillWord geometry — pure, React-free. The label IS the bar:
// a muted word with an accent copy clipped to the value fraction of its own
// glyph extent (percentage inset → 50% visually bisects the word, never a
// hidden wider track). Glyph extent is estimated deterministically (0.62
// em/char) and pinned with textLength so containment is provable without
// measuring text server-side. All coords 2-dp.
import { clamp } from "../../core/scale.js";
import { round2 } from "../../core/types.js";

export type FillMode = "fill" | "drain";

export interface FillWordGeometry {
  /** Deterministic estimated glyph extent (textLength attr). */
  textLength: number;
  x: number;
  y: number;
  width: number;
  height: number;
  /** clip-path inset value for the accent copy (empty word → null). */
  clip: string | null;
  /** Whole-percent for the summary/label. */
  pct: number;
  /** x for the optional percent numeral (label="value"), else null. */
  numeralX: number | null;
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
  const v = clamp(Number.isFinite(opts.value) ? opts.value : 0, 0, 1);
  const chars = word.length;
  const textLength = round2(chars * 0.62 * fontSize);
  const height = Math.ceil(fontSize * 1.4);
  const x = pad;
  const y = round2(height / 2);
  // Numeral hugs the word's real extent. Mixed-case ≈ 0.56 em/ch; ALL CAPS runs
  // ~0.64–0.72 (see core/labels.ts) — under-estimating puts "41%" inside SNOWPACK.
  const caps = [...word].filter((c) => c >= "A" && c <= "Z").length;
  const extentFactor = chars > 0 && caps / chars >= 0.7 ? 0.72 : 0.56;
  const wordExtent = round2(chars * extentFactor * fontSize);
  const numeralExtent = round2(4 * 0.62 * fontSize); // "100%"
  const numeralX = label && chars > 0 ? round2(x + wordExtent + fontSize * 0.3) : null;
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
