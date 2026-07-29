// <BumpStrip> — how did this entity's RANK move.
// #5 → #2: position among competitors, not magnitude. Rank 1 sits at the TOP
// (inverted y — stated here and self-keyed by the "#" end labels). Step line:
// a rank cannot be 2.4. `positive` is ignored — lower is always better in rank
// space (documented).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { labelFont } from "../../core/labels.js";
import { devWarn } from "../../core/dev.js";
import { EN_FLOW, type FlowStrings } from "../../core/strings-flow.js";
import { isFiniteValue, type Value } from "../../core/types.js";
import { bumpGeometry, usableMaxRank } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";
import { maxOf, minOf } from "../../core/scale.js";

export function bumpSummary(ranks: readonly Value[], strings: FlowStrings): string {
  const clean = ranks.filter((r): r is number => isFiniteValue(r) && r >= 1).map(Math.round);
  if (clean.length === 0) return strings.noData;
  return strings.rankRun(clean[0]!, clean.at(-1)!, minOf(clean), ranks.length);
}

export interface BumpStripProps {
  /** 1-based integer ranks per period; null = unranked period (gap). */
  data: readonly Value[];
  /** Fix the band domain so small multiples share a rank scale. */
  maxRank?: number | undefined;
  /** `"changes"` marks the moments rank actually moved; `"none"`. */
  dots?: "changes" | "none" | undefined;
  /** `"ends"` (default) | `"last"` | `"none"` — "#5"/"#2" end labels. */
  label?: "ends" | "last" | "none" | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  strings?: FlowStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function BumpStrip(props: BumpStripProps): ReactNode {
  const {
    data,
    maxRank,
    dots = "changes",
    label = "ends",
    width = 60,
    height = 16,
    color,
    strings = EN_FLOW,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  if (data.some((r) => isFiniteValue(r) && (r < 1 || !Number.isInteger(r)))) {
    devWarn("<BumpStrip> ranks are 1-based ordinals — non-integers rounded, < 1 dropped.");
  }
  // Warn against the maxRank the geometry actually used, never the raw prop — an
  // unusable one is ignored, so "clamped to the bottom band" would be a lie.
  const fixedMax = usableMaxRank(maxRank);
  if (maxRank !== undefined && fixedMax === undefined) {
    devWarn("<BumpStrip> maxRank must be a finite rank ≥ 1 — ignored; scaling to the data.");
  }
  if (fixedMax !== undefined && data.some((r) => isFiniteValue(r) && r > fixedMax)) {
    devWarn(`<BumpStrip> rank beyond maxRank=${fixedMax} clamped to the bottom band.`);
  }

  const fontSize = labelFont(height, 0.4);
  // clamped label center — the glyph box (central baseline) never leaves the frame
  const labelY = (y: number): number =>
    Math.min(Math.max(y, fontSize * 0.5), height - fontSize * 0.5);
  // maxOf, not `Math.max(...arr)`: a spread over a caller's series throws past
  // ~125k arguments. (The interactive entry already loops for the same reason.)
  const maxLabelChars =
    label === "none" ? 0 : 1 + String(maxOf(data.filter(isFiniteValue).map(Math.round), 1)).length;
  const geo = bumpGeometry({
    width,
    height,
    ranks: data,
    maxRank,
    gutterLeftCh: label === "ends" ? maxLabelChars : 0,
    gutterRightCh: label !== "none" ? maxLabelChars : 0,
    fontSize,
  });
  const accName = resolveSummary(summary, () => bumpSummary(data, strings));

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
      // Rank space has no floor — the bottom band is the worst rank, not a zero,
      // and #1 is pinned to the top — so the strip centres like a lane set. The
      // bands inset symmetrically (1.5 either end), so the viewBox frame lands on
      // the same midpoint the band geometry would.
      seat={{ mode: "center", top: 0, bottom: height }}
      className={className ? `mc-bump ${className}` : "mc-bump"}
      style={rootStyle}
    >
      {geo.d ? (
        <path
          d={geo.d}
          data-mc-ink="data"
          vectorEffect="non-scaling-stroke"
          style={color ? { stroke: color } : undefined}
        />
      ) : null}
      {/* Rank-change moments, plus the periods the line cannot reach: a period
          with gaps on both sides is a bare `M` in the step path, and SVG never
          strokes a lone moveto — `[3, null, 2]` painted an empty plot while the
          name announced both ranks. Same dot either way; the reading is there,
          the line simply has nothing to connect it to. */}
      {dots === "changes"
        ? [...geo.changes, ...geo.isolated].map((c, i) => (
            <circle key={i} cx={c.x} cy={c.y} r={1.5} data-mc-ink="accent" />
          ))
        : null}
      {label !== "none" && geo.lastLabel ? (
        <text
          x={geo.lastLabel.x}
          y={labelY(geo.lastLabel.y)}
          fontSize={fontSize}
          dominantBaseline="central"
          textAnchor="start"
          data-mc-ink="accent"
        >
          {`#${geo.lastLabel.rank}`}
        </text>
      ) : null}
      {label === "ends" && geo.firstLabel ? (
        <text
          x={geo.firstLabel.x}
          y={labelY(geo.firstLabel.y)}
          fontSize={fontSize}
          dominantBaseline="central"
          textAnchor="end"
          data-mc-ink="label"
        >
          {`#${geo.firstLabel.rank}`}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
