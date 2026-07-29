// <Delta> — change vs prior: direction glyph + signed value.
// Inline HTML (not a tiny SVG) so the number flows like text; glyph is inline SVG.
// Direction is always double-encoded — triangle shape AND color — never color alone.
import { makeFormatter, type Format } from "../../core/format.js";
import { EN_SCALAR, type ScalarStrings } from "../../core/strings-scalar.js";
import type { CSSProperties, ReactNode } from "react";

// Glyphs centred in 10×10 viewBox so optical centre aligns with digits (y↓).
const GLYPH = {
  up: "M5 2.4 L8.6 7.6 L1.4 7.6 Z",
  down: "M1.4 2.4 L8.6 2.4 L5 7.6 Z",
  flat: "M1.4 4.2 H8.6 V5.8 H1.4 Z",
} as const;

/** Resolved Delta model — shared by the static entry and the interactive one. */
export interface DeltaModel {
  /** Signed value for display (`+12.4%`, `−3%`, or `—` for non-finite). */
  display: string;
  /** The signed number actually encoded (fraction when `from` is given); `null` if non-finite. */
  shown: number | null;
  /** `pos` | `neg` | `flat` (drives the valence color). */
  valence: "pos" | "neg" | "flat";
  glyphKey: "up" | "down" | "flat";
  /** Direction + magnitude, never valence. */
  summary: string;
}

/** Pure resolution of a Delta's display/valence/summary from its props. */
export function deltaModel(props: DeltaProps): DeltaModel {
  const { value, from, positive = "up", format, locale, strings = EN_SCALAR } = props;
  const delta = from === undefined ? value : value - from;
  const shown = from === undefined ? value : from !== 0 ? delta / Math.abs(from) : delta;
  // Finiteness is judged on the number actually SHOWN, not on the raw delta: a
  // finite delta over a tiny base overflows the ratio (`value={1} from={1e-320}`,
  // `value={1e308} from={0.5}`) and it was the ratio that got painted and
  // announced — "+∞%" / "Up ∞%.". Same em-dash path as a NaN input.
  const finite = Number.isFinite(shown);
  // Direction still comes from the delta, so a magnitude that rounds to 0%
  // (or underflows) keeps the arrow it earned.
  const sign: -1 | 0 | 1 = !finite ? 0 : delta > 0 ? 1 : delta < 0 ? -1 : 0;

  const fmt = makeFormatter(format, locale, { style: "percent", maximumFractionDigits: 1 });

  // Non-finite input (NaN/±Infinity) renders the flat/em-dash form rather than
  // "NaN%" — documented degenerate behavior.
  const magnitude = finite ? fmt(Math.abs(shown)) : "—";
  const display = finite ? `${sign > 0 ? "+" : sign < 0 ? "−" : ""}${magnitude}` : "—";
  // Only the literal "down" flips valence. Testing for "up" instead handed every
  // other value (an untyped `positive` off a JSON config) the INVERSE of the
  // documented default — same fallback as TrendArrow.
  const goodDir = positive === "down" ? -1 : 1;

  return {
    display,
    shown: finite ? shown : null,
    valence: sign === 0 ? "flat" : sign === goodDir ? "pos" : "neg",
    glyphKey: sign > 0 ? "up" : sign < 0 ? "down" : "flat",
    summary:
      sign === 0 ? strings.flatChange : strings.scalarDir(sign > 0 ? "up" : "down", magnitude),
  };
}

export interface DeltaProps {
  /** The change to show. With `from`, the current value (delta is derived). */
  value: number;
  /** Prior value; when given, Delta shows the percent change from it. */
  from?: number | undefined;
  /** Which direction is "good" — flips only the color, never the glyph. */
  positive?: "up" | "down" | undefined;
  /** Number formatting; defaults to a locale-aware percent. */
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: ScalarStrings | undefined;
  /** Accessible name override; `false` = decorative (redundant with nearby text). */
  summary?: string | false | undefined;
  title?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

export function Delta(props: DeltaProps): ReactNode {
  const { summary, title, className, style } = props;
  const { display, valence, glyphKey, summary: auto } = deltaModel(props);

  // `summary={false}` is the decorative opt-out only when it leaves nothing to
  // announce; an explicit `title` is still a name (shared/a11y.ts).
  const decorative = summary === false && !title;
  // `false` suppresses the generated sentence either way — a titled Delta is
  // named by its title alone, never by the sentence the caller opted out of.
  const accName = summary === false ? undefined : (summary ?? auto);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  return (
    <span
      className={className ? `mc-delta ${className}` : "mc-delta"}
      data-mc-valence={valence}
      style={style}
      {...(decorative ? undefined : { role: "img" as const, "aria-label": label })}
    >
      <svg
        className="mc-delta-glyph"
        viewBox="0 0 10 10"
        width="0.82em"
        height="0.82em"
        aria-hidden="true"
      >
        <path d={GLYPH[glyphKey]} />
      </svg>
      <span className="mc-delta-num" aria-hidden={decorative ? undefined : true}>
        {display}
      </span>
    </span>
  );
}
