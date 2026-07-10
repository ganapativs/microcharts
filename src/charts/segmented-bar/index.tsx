// <SegmentedBar> — what is this made of, and in what proportions (plan/22 #14,
// S3). Static, hook-free, RSC-safe. Segments always sum to the full bar; past
// `maxSegments` the tail rolls into a labeled "Other" — nothing is silently
// dropped. A flat bar beats a donut of the same data at every size we ship.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter } from "../../core/format.js";
import { EN_COMPOSITION, type CompositionStrings } from "../../core/strings-composition.js";
import { isFiniteValue } from "../../core/types.js";
import {
  largestRemainderPercents,
  rollup,
  segmentedBarGeometry,
  type RolledDatum,
} from "./geometry.js";
import type { MiniBarDatum } from "../mini-bar/index.js";

export type SegmentedBarDatum = MiniBarDatum;

/** Shared composition summary — largest-remainder percents, joined clauses. */
export function sharesSummary(rolled: readonly RolledDatum[], strings: CompositionStrings): string {
  if (rolled.length === 0) return strings.noData;
  const total = rolled.reduce((s, d) => s + d.value, 0);
  const pcts = largestRemainderPercents(rolled.map((d) => d.value / total));
  const list = rolled.map((d, i) => strings.shareClause(d.label, `${pcts[i]}%`)).join(", ");
  return strings.shares(list);
}

export interface SegmentedBarProps {
  data: readonly SegmentedBarDatum[];
  /** Rollup threshold (legibility-derived; the rollup keeps honesty). */
  maxSegments?: number | undefined;
  /** `"data"` preserves inherent sequences; `"desc"` ranks the composition. */
  order?: "data" | "desc" | undefined;
  /** `"percent"` | `"value"` centered per segment (deterministic drop-out). */
  label?: "none" | "percent" | "value" | undefined;
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

const CAT_N = 5; // --mc-cat-1 … --mc-cat-5 via data-mc-cat roles

export function SegmentedBar(props: SegmentedBarProps): ReactNode {
  const {
    data,
    maxSegments = 5,
    order = "data",
    label = "none",
    width = 60,
    height = 10,
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

  if (data.some((d) => isFiniteValue(d.value) && d.value < 0)) {
    devWarn(
      "<SegmentedBar> negative values excluded — a part-to-whole cannot contain negative parts (use Waterfall).",
    );
  }

  let rolled = rollup(data, maxSegments, strings.otherLabel);
  if (order === "desc") {
    rolled = [...rolled].sort((a, b) =>
      a.label === strings.otherLabel ? 1 : b.label === strings.otherLabel ? -1 : b.value - a.value,
    );
  }
  const fontSize = Math.max(5, Math.min(Math.round(height * 0.6), 7));
  const geo = segmentedBarGeometry({
    width,
    height,
    values: rolled.map((d) => d.value),
    fontSize,
  });
  const fmt = makeFormatter(format, locale);
  const pcts = largestRemainderPercents(geo.segments.map((s) => s.share));
  const accName = summary === false ? false : (summary ?? sharesSummary(rolled, strings));

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-segbar ${className}` : "mc-segbar"}
      style={style}
    >
      {geo.segments.map((seg, i) => {
        const d = rolled[seg.index]!;
        const isOther = d.members > 1;
        const text =
          label === "percent" ? `${pcts[i]}%` : label === "value" ? fmt(d.value) : undefined;
        return (
          <g key={seg.index}>
            <rect
              x={seg.x}
              y={1}
              width={seg.w}
              height={height - 2}
              shapeRendering="crispEdges"
              data-mc-ink={isOther ? "neutral" : undefined}
              data-mc-cat={isOther ? undefined : (i % CAT_N) + 1}
            />
            {text !== undefined && seg.labelFits(text.length) ? (
              <text
                x={round2Mid(seg.x, seg.w)}
                y={height / 2}
                dominantBaseline="central"
                fontSize={fontSize}
                textAnchor="middle"
                style={{ fill: "var(--mc-surface, Canvas)" }}
              >
                {text}
              </text>
            ) : null}
          </g>
        );
      })}
      {children}
    </Chart>
  );
}

function round2Mid(x: number, w: number): number {
  return Math.round((x + w / 2) * 100) / 100;
}
