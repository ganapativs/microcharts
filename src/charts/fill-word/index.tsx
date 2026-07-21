// <FillWord> — how far along a named task is, where the label IS the bar
// A muted word with an accent copy clipped to the value
// fraction of the word's OWN inked extent (percentage inset → 50% bisects the
// word, never a hidden wider track). No <clipPath> element → no generated id
// (canon-safe). font-size is an SVG attribute; textLength pins the
// glyph extent so containment is provable server-side. Static, hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { EN_FILL_WORD, type FillWordStrings } from "../../core/strings-fill-word.js";
import { fillWordGeometry, type FillMode } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

export interface FillWordProps {
  /** The text that is the chart. */
  word: string;
  /** Fraction 0–1 (clamped). fill = complete; drain = remaining. */
  value: number;
  /** `fill` (default) grows the ink; `drain` empties it (TTL / expiry). */
  mode?: FillMode | undefined;
  /** `value` appends the percent numeral after the word. */
  label?: "none" | "value" | undefined;
  fontSize?: number | undefined;
  strings?: FillWordStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const PAD = 2;

/** Whole-percent shown for the context (fill = complete, drain = remaining). */
function shownPct(value: number, mode: FillMode): number {
  const v = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  const pct = Math.round(v * 100);
  return mode === "drain" ? 100 - pct : pct;
}

export function fillWordSummary(
  value: number,
  word: string,
  mode: FillMode = "fill",
  strings: FillWordStrings = EN_FILL_WORD,
): string {
  if (word.length === 0) return strings.noData;
  const pct = `${shownPct(value, mode)}%`;
  return mode === "drain" ? strings.fillWordRemaining(word, pct) : strings.fillWord(word, pct);
}

export function FillWord(props: FillWordProps): ReactNode {
  const {
    word,
    value,
    mode = "fill",
    label = "none",
    fontSize = 12,
    strings = EN_FILL_WORD,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const geo = fillWordGeometry({ value, word, fontSize, pad: PAD, mode, label: label === "value" });
  const accName = resolveSummary(summary, () => fillWordSummary(value, word, mode, strings));
  // The word renders at its NATURAL width — no textLength/lengthAdjust, which
  // distort the glyphs (the 0.62 estimate never matches a proportional font, so
  // pinning the extent stretches or squeezes the letters). The estimate still
  // drives the viewBox width + numeral gutter (a safe over-estimate for real task
  // labels); the accent clip is a percentage of the text's OWN box, so the fill
  // fraction stays exact regardless of the true rendered width.
  const textProps = {
    x: geo.x,
    y: geo.y,
    fontSize,
    dominantBaseline: "central" as const,
    textAnchor: "start" as const,
  };

  return (
    <Chart
      width={geo.width}
      height={geo.height}
      title={title}
      summary={accName}
      id={id}
      // The word IS the mark, so it has to sit like the words around it. Both
      // copies and the numeral share one centred baseline inside a box 1.4× the
      // font size, so the box is symmetric by construction and centring lands the
      // word's optical middle on the cap band — unseated it would ride a third of
      // a line high, which reads as a typo rather than a chart.
      seat={{ mode: "center", top: 0, bottom: geo.height }}
      className={className ? `mc-fillword ${className}` : "mc-fillword"}
      style={{ ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties}
    >
      {word.length > 0 ? (
        <>
          {/* the base word — a faded "track" (the not-yet-filled remainder), so
              the accent copy on top reads as clearly advanced/done */}
          <text {...textProps} data-mc-ink="label" style={{ fillOpacity: 0.4 }}>
            {word}
          </text>
          <text {...textProps} data-mc-ink="accent" style={{ clipPath: geo.clip ?? undefined }}>
            {word}
          </text>
        </>
      ) : null}
      {geo.numeralX !== null ? (
        <text
          x={geo.numeralX}
          y={geo.y}
          fontSize={fontSize}
          dominantBaseline="central"
          textAnchor="start"
          data-mc-ink="label"
        >
          {`${shownPct(value, mode)}%`}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
