// <ParetoStrip> — what should we fix first? Descending bars + a
// cumulative-share line on a FIXED 0–100% scale (never rescaled to steepen the
// curve). Bars up to the threshold crossing are accent ("vital few"), the rest
// muted — the chart's one job is to say where to stop reading. 80% is a working
// REFERENCE, never a law; `Other` never participates in ranking. Static,
// hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { round2 } from "../../core/types.js";
import { labelFont, labelFitsY } from "../../core/labels.js";
import { EN_PARETO, type ParetoStrings } from "../../core/strings-pareto.js";
import { paretoGeometry, type ParetoGeometry } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

const pct = (frac: number): string => `${Math.round(frac * 100)}%`;

/** Factual pareto summary. Shared with the interactive entry. */
export function paretoSummary(
  geo: ParetoGeometry,
  opts: { unit: string; metric: string },
  strings: ParetoStrings,
): string {
  if (geo.degenerate) return strings.paretoEmpty(opts.metric);
  if (geo.crossing === null) return strings.paretoTop(geo.topLabel, pct(geo.topShare));
  return strings.pareto(geo.vitalCount, geo.n, opts.unit, pct(geo.cumAtCrossing), opts.metric);
}

export interface ParetoStripProps {
  /** Categories with magnitudes (a composition — values ≥ 0). */
  data: readonly { label: string; value: number }[];
  /** Cumulative reference line % (default 80; `false` turns it off). */
  threshold?: number | false | undefined;
  /** Categories beyond `maxItems` roll up into Other (default 8). */
  maxItems?: number | undefined;
  /** Category noun for the summary (default "causes"). */
  unit?: string | undefined;
  /** Total-metric noun for the summary (default "the total"). */
  metric?: string | undefined;
  /** `"count"` states "K of N → cum%" in a gutter. */
  label?: "count" | "none" | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  strings?: ParetoStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function ParetoStrip(props: ParetoStripProps): ReactNode {
  const {
    data,
    threshold = 80,
    maxItems = 8,
    unit = "causes",
    metric = "the total",
    label = "count",
    width = 80,
    height = 20,
    color,
    strings = EN_PARETO,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const FONT = labelFont(height);
  const cls = className ? `mc-pareto-strip ${className}` : "mc-pareto-strip";

  const probe = paretoGeometry({ width, height, data, threshold, maxItems });
  // Degradation: `labelFont` floors at 7 viewBox units, so under a 7-unit-tall
  // box a line of text cannot be seated inside the plot at all. The readout
  // DROPS rather than spilling past the viewBox, and because the gutter is
  // derived from it the reserved space goes with it — the plot keeps its own
  // width and simply stops paying for text it no longer draws. Pure arithmetic:
  // the static path may never measure text.
  const showLabel =
    label === "count" &&
    probe != null &&
    probe.crossing != null &&
    labelFitsY(height / 2, FONT, height);
  const labelText = showLabel
    ? `${probe!.vitalCount} of ${probe!.n} → ${pct(probe!.cumAtCrossing)}`
    : "";
  const gutterCh = showLabel ? labelText.length : 0;

  const geo = paretoGeometry({
    width,
    height,
    data,
    threshold,
    maxItems,
    gutterCh,
    fontSize: FONT,
  });

  if (geo === null) {
    return (
      <Chart
        width={width}
        height={height}
        title={title}
        summary={resolveSummary(summary, () => strings.noData)}
        id={id}
        className={cls}
        style={style}
      >
        {children}
      </Chart>
    );
  }

  const accName = resolveSummary(summary, () => paretoSummary(geo, { unit, metric }, strings));
  const accent = color ?? "var(--mc-accent)";
  const rootStyle = { ...style, "--mc-label-size": `${FONT}px` } as CSSProperties;

  return (
    <Chart
      width={geo.totalWidth}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // The ranked bars are the primary read and geometry already seats them
      // flush at `height` (unstroked fills need no bottom reserve — only the
      // cumulative line keeps the inset frame), so the bar floor is the box
      // bottom and the strip stands on the baseline.
      seat={{ mode: "floor", bottom: height }}
      className={cls}
      style={rootStyle}
    >
      {/* bars — vital few accent, the rest muted (where to stop reading); a
          custom `color` prop still needs an inline override, so the ink role
          only drives the default accent/neutral pair */}
      {geo.painted.map((i) => {
        const b = geo.bars[i]!;
        return (
          <rect
            key={b.label}
            x={b.x}
            y={b.y}
            width={b.width}
            height={b.height}
            data-mc-ink={color ? "bar" : b.vital ? "accent" : "neutral"}
            fillOpacity={b.vital ? 1 : 0.5}
            shapeRendering="crispEdges"
            style={color ? { fill: b.vital ? accent : "var(--mc-neutral)" } : undefined}
          />
        );
      })}
      {/* cumulative-share line — fixed 0–100% over the full height */}
      {geo.line.d ? (
        <path
          d={geo.line.d}
          data-mc-ink="muted"
          data-mc-w="support"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {/* threshold reference + crossing mark */}
      {geo.thresholdY !== null ? (
        <line
          x1={0}
          y1={geo.thresholdY}
          x2={width}
          y2={geo.thresholdY}
          data-mc-ink="muted"
          data-mc-w="hair"
          strokeOpacity={0.55}
          strokeDasharray="2 2"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {geo.crossing !== null && geo.thresholdY !== null ? (
        <circle
          cx={geo.crossing.x}
          cy={geo.thresholdY}
          r={1.6}
          data-mc-ink={color ? undefined : "accent"}
          style={color ? { fill: accent } : undefined}
        />
      ) : null}
      {showLabel ? (
        <text
          x={geo.labelX}
          y={round2(height / 2)}
          textAnchor="start"
          dominantBaseline="central"
          data-mc-ink="label"
          fontSize={FONT}
        >
          {labelText}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
