// <LikertStrip> — does the response lean agree or disagree (S2-ordinal
// diverging). The center line is the question; everything else is
// the answer. Static, hook-free, RSC-safe. Neutral is NEVER hidden: `omit`
// removes it from the bar but the labels/summary always carry it.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter } from "../../core/format.js";
import { EN_COMPOSITION, type CompositionStrings } from "../../core/strings-composition.js";
import { isFiniteValue } from "../../core/types.js";
import { likertFont, likertGutter, likertStripGeometry } from "./geometry.js";
import { labelFitsY } from "../../core/labels.js";
import type { MiniBarDatum } from "../mini-bar/index.js";

export type LikertDatum = MiniBarDatum;

/** |net| < 5 pts reads "Balanced." */
export function likertSummary(
  shares: { negative: number; positive: number; neutral: number },
  hasNeutralLevel: boolean,
  pctFmt: (n: number) => string,
  strings: CompositionStrings,
): string {
  if (shares.neutral >= 1) return strings.allNeutral;
  const base = strings.likert(
    pctFmt(shares.positive),
    pctFmt(shares.negative),
    hasNeutralLevel ? pctFmt(shares.neutral) : null,
  );
  const net = (shares.positive - shares.negative) * 100;
  const lean = Math.abs(net) < 5 ? "balanced" : net > 0 ? "positive" : "negative";
  return `${base} ${strings.likertLean(lean)}`;
}

export interface LikertStripProps {
  /** Ordered most-negative → most-positive (2–7 levels; odd middle = neutral). */
  data: readonly LikertDatum[];
  /** Neutral placement: `"split"` (half each side) or `"omit"` (labeled only). */
  neutral?: "split" | "omit" | undefined;
  /** `"ends"` = agree/disagree %; `"net"` = one signed score; `"none"`. */
  label?: "ends" | "net" | "none" | undefined;
  width?: number | undefined;
  height?: number | undefined;
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
  locale?: string | string[] | undefined;
  strings?: CompositionStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function LikertStrip(props: LikertStripProps): ReactNode {
  const {
    data,
    neutral = "split",
    label = "ends",
    width = 60,
    height = 14,
    format,
    locale,
    strings = EN_COMPOSITION,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  if (data.length > 7) {
    devWarn(`<LikertStrip> ${data.length} levels — 7 is the legibility bar (rejected past it).`);
  }
  if (data.some((d) => isFiniteValue(d.value) && d.value < 0)) {
    devWarn("<LikertStrip> negative counts treated as 0.");
  }

  const fontSize = likertFont(height);
  const wantLabels = label !== "none" && labelFitsY(height / 2, fontSize, height);
  const pctFmt = makeFormatter(format, locale, { style: "percent", maximumFractionDigits: 0 });
  const hasNeutralLevel = data.length % 2 === 1;

  // end labels reserve deterministic ch gutters ("100%" worst case = 4 chars)
  const gutter = likertGutter(wantLabels, fontSize);
  const geo = likertStripGeometry({
    width,
    height,
    values: data.map((d) => d.value),
    neutral,
    gutterL: gutter,
    gutterR: gutter,
  });

  const accName =
    summary === false
      ? false
      : (summary ??
        (geo === null
          ? strings.noResponses
          : likertSummary(geo.shares, hasNeutralLevel, pctFmt, strings)));

  const midY = height / 2;
  // direct labels hug the BAR ends, not the frame — a small negative pole
  // must not leave its label floating at the far edge
  const barX0 = geo?.segments.length ? Math.min(...geo.segments.map((g) => g.x)) : 0;
  const barX1 = geo?.segments.length ? Math.max(...geo.segments.map((g) => g.x + g.width)) : width;
  const estL = 4 * fontSize * 0.62;
  const leftLabel =
    barX0 - 4 - estL >= 0
      ? { x: barX0 - 4, anchor: "end" as const }
      : { x: 1, anchor: "start" as const };
  const rightLabel =
    barX1 + 4 + estL <= width
      ? { x: barX1 + 4, anchor: "start" as const }
      : { x: width - 1, anchor: "end" as const };
  const barH = Math.max(3, height - 4);
  const net = geo ? (geo.shares.positive - geo.shares.negative) * 100 : 0;

  // Pin the label size in viewBox units. `styles.css` sets `font-size` on
  // `.mc-root text`, and a CSS declaration outranks the SVG presentation
  // attribute, so `fontSize={...}` alone is inert and the reserved gutters would
  // be sized for a font the browser never paints (see label-containment tests).
  const rootStyle = { ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties;

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // Seat the BAR, not the box: the center line runs the full height and the
      // end labels ride the mid-line, so the frame overstates the mark. A
      // diverging strip is symmetric about that mid-line with no floor, so it
      // centres on the cap band.
      seat={{ mode: "center", top: midY - barH / 2, bottom: midY + barH / 2 }}
      className={className ? `mc-likert ${className}` : "mc-likert"}
      style={rootStyle}
    >
      {geo ? (
        <>
          <line
            x1={geo.centerX}
            y1={0.5}
            x2={geo.centerX}
            y2={height - 0.5}
            data-mc-ink="muted"
            data-mc-w="support"
            strokeOpacity={0.6}
            vectorEffect="non-scaling-stroke"
          />
          {geo.segments.map((s) =>
            s.width > 0 ? (
              <rect
                key={s.level}
                x={s.x}
                y={midY - barH / 2}
                width={s.width}
                height={barH}
                shapeRendering="crispEdges"
                fillOpacity={s.opacity}
                data-mc-ink={s.side < 0 ? "negative" : s.side > 0 ? "positive" : "neutral"}
              />
            ) : null,
          )}
          {wantLabels && label === "ends" ? (
            <>
              <text
                x={leftLabel.x}
                y={midY}
                fontSize={fontSize}
                dominantBaseline="central"
                textAnchor={leftLabel.anchor}
                data-mc-ink="label"
              >
                {pctFmt(geo.shares.negative)}
              </text>
              <text
                x={rightLabel.x}
                y={midY}
                fontSize={fontSize}
                dominantBaseline="central"
                textAnchor={rightLabel.anchor}
                data-mc-ink="label"
              >
                {pctFmt(geo.shares.positive)}
              </text>
            </>
          ) : wantLabels && label === "net" ? (
            <text
              x={rightLabel.x}
              y={midY}
              fontSize={fontSize}
              dominantBaseline="central"
              textAnchor={rightLabel.anchor}
              data-mc-ink="label"
            >
              {`${net >= 0 ? "+" : "−"}${Math.round(Math.abs(net))}`}
            </text>
          ) : null}
        </>
      ) : null}
      {children}
    </Chart>
  );
}
