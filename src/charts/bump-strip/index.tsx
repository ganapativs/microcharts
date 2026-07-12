// <BumpStrip> — how did this entity's RANK move.
// #5 → #2: position among competitors, not magnitude. Rank 1 sits at the TOP
// (inverted y — stated here and self-keyed by the "#" end labels). Step line:
// a rank cannot be 2.4. `positive` is ignored — lower is always better in rank
// space (documented). Static, hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { EN_FLOW, type FlowStrings } from "../../core/strings-flow.js";
import { isFiniteValue, type Value } from "../../core/types.js";
import { bumpGeometry } from "./geometry.js";

/** Factual rank-run summary. Shared with the interactive entry. */
export function bumpSummary(ranks: readonly Value[], strings: FlowStrings): string {
  const clean = ranks.filter((r): r is number => isFiniteValue(r) && r >= 1).map(Math.round);
  if (clean.length === 0) return strings.noData;
  return strings.rankRun(clean[0]!, clean.at(-1)!, Math.min(...clean), ranks.length);
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
  if (maxRank !== undefined && data.some((r) => isFiniteValue(r) && r > maxRank)) {
    devWarn(`<BumpStrip> rank beyond maxRank=${maxRank} clamped to the bottom band.`);
  }

  const fontSize = Math.max(5, Math.min(Math.round(height * 0.4), 7));
  // clamped label center — the glyph box (central baseline) never leaves the frame
  const labelY = (y: number): number =>
    Math.min(Math.max(y, fontSize * 0.5), height - fontSize * 0.5);
  const maxLabelChars =
    label === "none"
      ? 0
      : 1 +
        String(Math.max(1, ...data.filter((r): r is number => isFiniteValue(r)).map(Math.round)))
          .length;
  const geo = bumpGeometry({
    width,
    height,
    ranks: data,
    maxRank,
    gutterLeftCh: label === "ends" ? maxLabelChars : 0,
    gutterRightCh: label !== "none" ? maxLabelChars : 0,
    fontSize,
  });
  const accName = summary === false ? false : (summary ?? bumpSummary(data, strings));

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-bump ${className}` : "mc-bump"}
      style={style}
    >
      {geo.d ? (
        <path
          d={geo.d}
          data-mc-ink="data"
          vectorEffect="non-scaling-stroke"
          style={color ? { stroke: color } : undefined}
        />
      ) : null}
      {dots === "changes"
        ? geo.changes.map((c, i) => (
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
