// <Delta> — change vs prior (plan/05 §2, S4). The most common SaaS KPI element:
// a direction glyph + signed value. Static, hook-free, RSC-safe. Rendered as
// accessible inline HTML (not a tiny SVG viewBox) so the number flows and wraps
// like text; the glyph is an inline SVG. Direction is ALWAYS double-encoded —
// triangle shape (up/down/flat) AND color — never color alone (plan/08 1.4.1).
import type { CSSProperties, ReactNode } from "react";

const GLYPH = {
  up: "M5 9 L9 3 L1 3 Z", // ▲
  down: "M1 3 L9 3 L5 9 Z", // ▼
  flat: "M1 4.25 H9 V5.75 H1 Z", // ▬
} as const;

/** Resolved Delta model — shared by the static entry and the interactive one. */
export interface DeltaModel {
  /** Signed value for display (`+12.4%`, `−3%`, or `—` for non-finite). */
  display: string;
  /** `pos` | `neg` | `flat` (drives the valence color). */
  valence: "pos" | "neg" | "flat";
  glyphKey: "up" | "down" | "flat";
  /** Factual summary sentence — direction + magnitude, never valence (plan/08). */
  summary: string;
}

/** Pure resolution of a Delta's display/valence/summary from its props. */
export function deltaModel(props: DeltaProps): DeltaModel {
  const { value, from, positive = "up", format, locale } = props;
  const delta = from === undefined ? value : value - from;
  const finite = Number.isFinite(delta);
  const shown = from === undefined ? value : from !== 0 ? delta / Math.abs(from) : delta;
  const sign: -1 | 0 | 1 = !finite ? 0 : delta > 0 ? 1 : delta < 0 ? -1 : 0;

  const fmt =
    typeof format === "function"
      ? format
      : (n: number) =>
          new Intl.NumberFormat(
            locale,
            format ?? { style: "percent", maximumFractionDigits: 1 },
          ).format(n);

  // Non-finite input (NaN/±Infinity) renders the flat/em-dash form rather than
  // "NaN%" — documented degenerate behavior (plan/09 edge matrix).
  const magnitude = finite ? fmt(Math.abs(shown)) : "—";
  const display = finite ? `${sign > 0 ? "+" : sign < 0 ? "−" : ""}${magnitude}` : "—";
  const goodDir = positive === "up" ? 1 : -1;

  return {
    display,
    valence: sign === 0 ? "flat" : sign === goodDir ? "pos" : "neg",
    glyphKey: sign > 0 ? "up" : sign < 0 ? "down" : "flat",
    summary: sign === 0 ? "No change." : `${sign > 0 ? "Up" : "Down"} ${magnitude}.`,
  };
}

export interface DeltaProps {
  /** The change to show. With `from`, the current value (delta is derived). */
  value: number;
  /** Prior value; when given, Delta shows the percent change from it. */
  from?: number | undefined;
  /** Which direction is "good" — flips only the color, never the glyph (plan/04 §6). */
  positive?: "up" | "down" | undefined;
  /** Number formatting; defaults to a locale-aware percent. */
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
  locale?: string | string[] | undefined;
  /** Accessible name override; `false` = decorative (redundant with nearby text). */
  summary?: string | false | undefined;
  title?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

export function Delta(props: DeltaProps): ReactNode {
  const { summary, title, className, style } = props;
  const { display, valence, glyphKey, summary: auto } = deltaModel(props);

  const decorative = summary === false;
  const accName = decorative ? undefined : typeof summary === "string" ? summary : auto;
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  return (
    <span
      className={className ? `mc-delta ${className}` : "mc-delta"}
      data-mc-valence={valence}
      style={style}
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": label })}
    >
      <svg
        className="mc-delta-glyph"
        viewBox="0 0 10 10"
        width="1em"
        height="1em"
        aria-hidden="true"
      >
        <path d={GLYPH[glyphKey]} />
      </svg>
      <span className="mc-delta-num" aria-hidden="true">
        {display}
      </span>
    </span>
  );
}
