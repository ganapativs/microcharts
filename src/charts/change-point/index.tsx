// <ChangePoint> — when did the behaviour change level? Regime
// shading (neutral identity, not valence) + per-regime mean hairlines + the
// series line + break markers (hairline + top triangle). The detector is a
// documented HEURISTIC (geometry.ts), and explicit `breaks` is the recommended
// production path. A spike means nothing without the regime it broke. Static,
// hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { resolveAnnotations, annotationFontSize } from "../../shared/annotations-host.js";
import { scaleLinear, extent } from "../../core/scale.js";
import { round2 } from "../../core/types.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { EN_CHANGE_POINT, type ChangePointStrings } from "../../core/strings-change-point.js";
import { CHANGE_POINT_PAD, changePointGeometry, type ChangePointGeometry } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

// signed=false for the summary, where the direction word already carries the sign
const pct = (frac: number, signed = true): string =>
  `${signed && frac > 0 ? "+" : signed && frac < 0 ? "−" : ""}${Math.round(Math.abs(frac) * 100)}%`;

/** Factual change-point summary. Shared with the interactive entry. */
export function changePointSummary(
  geo: ChangePointGeometry,
  fmt: (v: number) => string,
  strings: ChangePointStrings,
): string {
  if (geo.breaks.length === 0) return strings.changePointNone(geo.n);
  // headline = the largest-magnitude break
  let lead = geo.breaks[0]!;
  for (const b of geo.breaks) if (Math.abs(b.delta) > Math.abs(lead.delta)) lead = b;
  const isLast = lead.index === geo.breaks[geo.breaks.length - 1]!.index;
  return strings.changePoint(
    lead.delta >= 0 ? "up" : "down",
    pct(lead.delta, false),
    lead.index,
    fmt(lead.before),
    fmt(lead.after),
    isLast ? "stable" : "again",
  );
}

export interface ChangePointProps {
  /** A single series. */
  data: readonly number[];
  /** `"auto"` runs the heuristic; an index array overrides detection entirely. */
  breaks?: "auto" | readonly number[] | undefined;
  /** Max detected breaks (1–3). More regimes stop being glanceable. */
  maxItems?: number | undefined;
  /** Per-regime mean hairlines (default true). */
  means?: boolean | undefined;
  /** `"delta"` prints the signed % across the most recent break in a gutter. */
  label?: "delta" | "none" | undefined;
  domain?: readonly [number, number] | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  strings?: ChangePointStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function ChangePoint(props: ChangePointProps): ReactNode {
  const {
    data,
    breaks = "auto",
    maxItems = 2,
    means = true,
    label = "none",
    domain,
    format,
    locale,
    width = 80,
    height = 16,
    color,
    strings = EN_CHANGE_POINT,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const FONT = Math.min(10, Math.max(6, Math.round(height * 0.55)));
  const fmt = makeFormatter(format, locale);
  const cls = className ? `mc-change-point ${className}` : "mc-change-point";

  const probe = changePointGeometry({ width, height, data, breaks, maxItems, domain });
  const showLabel = label === "delta" && probe != null && probe.breaks.length > 0;
  const labelText = showLabel ? pct(probe!.breaks[probe!.breaks.length - 1]!.delta) : "";
  // 0.72·em/char (not 0.62) — the delta label always carries the wide `%` glyph
  const gutter = showLabel ? Math.ceil(labelText.length * FONT * 0.72) + 4 : 0;

  const geo = probe;
  if (geo === null) {
    return (
      <Chart
        width={width}
        height={height}
        title={title}
        summary={resolveSummary(summary, () => strings.noData)}
        id={id}
        // Same frame the populated chart seats on, so an empty slot in a column
        // of these sits on the baseline at exactly the same height.
        seat={{ mode: "floor", bottom: height - CHANGE_POINT_PAD }}
        className={cls}
        style={style}
      >
        {children}
      </Chart>
    );
  }

  const accName = resolveSummary(summary, () => changePointSummary(geo, fmt, strings));
  const accent = color ?? "var(--mc-accent)";
  const rootStyle = { ...style, "--mc-label-size": `${FONT}px` } as CSSProperties;
  const totalWidth = width + gutter;
  const lastBreak = geo.breaks[geo.breaks.length - 1];

  // annotations host: Marker x = data index (mirror of the geometry's sx),
  // Threshold/TargetZone y = data values on the shared value scale (props.domain
  // ?? data extent, mapped to [height − pad, pad] with the geometry's pad = 2).
  const ann = resolveAnnotations(children, {
    x: (i) => 2 + (i / Math.max(1, geo.n - 1)) * (width - 4),
    y: scaleLinear(domain ?? extent(data) ?? [0, 1], [height - 2, 2]),
    width,
    height,
    fontSize: annotationFontSize(height),
  });

  return (
    <Chart
      width={totalWidth}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // A trace over a value range stands on its own floor (Sparkline's
      // precedent). The plot box, not the viewBox: regime tints and break
      // hairlines deliberately bleed to the full height, and seating on those
      // would hang the line two units above the baseline.
      seat={{ mode: "floor", bottom: height - CHANGE_POINT_PAD }}
      className={cls}
      style={rootStyle}
    >
      {ann.under}
      {/* regime shading — only the ODD regimes are tinted (identity, not valence);
          adjacent regimes therefore always contrast (bare vs tinted) at ONE
          opacity that reads on light and dark. Tiles gap-free break→break. */}
      {geo.segments.map((sg, i) =>
        i % 2 === 1 ? (
          <rect
            key={sg.x0}
            x={round2(geo.breaks[i - 1]!.x)}
            y={0}
            width={round2(
              Math.max(
                0,
                (i === geo.segments.length - 1 ? width : geo.breaks[i]!.x) - geo.breaks[i - 1]!.x,
              ),
            )}
            height={height}
            data-mc-ink="region"
            style={{ fill: "var(--mc-neutral)", fillOpacity: 0.1 }}
          />
        ) : null,
      )}
      {/* per-regime mean hairlines */}
      {means
        ? geo.segments.map((sg) =>
            Number.isFinite(sg.mean) ? (
              <line
                key={`m${sg.x0}`}
                x1={sg.x0}
                y1={sg.meanY}
                x2={sg.x1}
                y2={sg.meanY}
                data-mc-ink="ghost"
                stroke="var(--mc-neutral)"
                strokeOpacity={0.6}
                strokeDasharray="2 1.5"
                data-mc-w="hair"
                vectorEffect="non-scaling-stroke"
              />
            ) : null,
          )
        : null}
      {/* the series line */}
      {geo.line.d ? (
        <path
          d={geo.line.d}
          data-mc-ink="data"
          fill="none"
          style={{ stroke: accent, strokeWidth: "var(--mc-stroke-width)" }}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {/* break markers — vertical hairline + small top triangle */}
      {geo.breaks.map((b) => (
        <g key={`b${b.index}`}>
          <line
            x1={b.x}
            y1={0}
            x2={b.x}
            y2={height}
            data-mc-ink="flag"
            strokeOpacity={0.75}
            data-mc-w="tick"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={`M${round2(b.x - 1.6)} 0 L${round2(b.x + 1.6)} 0 L${b.x} 2.2 Z`}
            data-mc-ink="flag"
            style={{ fill: accent }}
          />
        </g>
      ))}
      {showLabel && lastBreak ? (
        <text
          x={round2(width + 3)}
          y={round2(height / 2)}
          textAnchor="start"
          dominantBaseline="central"
          data-mc-ink="label"
          fontSize={FONT}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {labelText}
        </text>
      ) : null}
      {ann.over}
      {ann.rest}
    </Chart>
  );
}
