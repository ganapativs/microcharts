// <RubricStrip> — how a thing scored per criterion, with each criterion's weight
// visible, without a fake composite number. Bar length = score, bar thickness = weight share. There
// is NO total bar and none may be added — that is the whole point.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { chartSide, isFiniteValue } from "../../core/types.js";
import { EN_RUBRIC, type RubricStrings } from "../../core/strings-rubric.js";
import {
  DEFAULT_WIDTH,
  ROW_GAP,
  UNIT_DOMAIN,
  defaultHeight,
  labelAnchorX,
  resolveDomain,
  rubricLabels,
  rubricRowBands,
  rubricStripGeometry,
  type RubricInput,
} from "./geometry.js";
import { truncateLabel } from "../dot-plot/geometry.js";
import { resolveSummary } from "../../core/summary.js";

export interface RubricStripDatum {
  label: string;
  score: number;
  weight?: number | undefined;
}

export interface RubricStripProps {
  data: readonly RubricStripDatum[];
  /** Pass target tick across all rows — one honest line, never a total. */
  target?: number | undefined;
  /** Criterion names in the left gutter; off for cell embedding. */
  labels?: boolean | undefined;
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: RubricStrings | undefined;
  /** Minimum in-chart label size, in viewBox units. Geometry sizes labels from
   *  the mark and floors them at 7; this raises that floor and moves the
   *  reserved gutter with it. A label the box cannot seat at the raised floor
   *  drops rather than shrinking back under it. */
  labelSize?: number | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

/** Shared summary — extremes only, NEVER a weighted total. Rows whose score is
 *  missing (null/NaN/±Infinity) are not scored, so they can't be an extreme; when
 *  none is scored the strip has nothing to say and degrades to `noData`. The
 *  count still names every row — the strip draws a track for each. */
export function rubricStripSummary(
  data: readonly RubricStripDatum[],
  strings: RubricStrings,
  fmt: (n: number) => string,
): string {
  let hi: RubricStripDatum | null = null;
  let lo: RubricStripDatum | null = null;
  for (const d of data) {
    if (!isFiniteValue(d.score)) continue;
    if (hi === null || d.score > hi.score) hi = d;
    if (lo === null || d.score < lo.score) lo = d;
  }
  if (hi === null || lo === null) return strings.noData;
  return strings.rubric(data.length, hi.label, fmt(hi.score), lo.label, fmt(lo.score));
}

function toInputs(data: readonly RubricStripDatum[]): RubricInput[] {
  return data.map((d) => ({ label: d.label, score: d.score, weight: d.weight ?? 1 }));
}

export function RubricStrip(props: RubricStripProps): ReactNode {
  const {
    data,
    target,
    labels = true,
    domain = UNIT_DOMAIN,
    width: widthProp = DEFAULT_WIDTH,
    height: heightProp,
    format,
    locale,
    strings = EN_RUBRIC,
    labelSize,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const auto = defaultHeight(data.length);
  // The box drives the type size, the gutter, the seat and every mark, none of
  // which `Chart`'s own clamp reaches: a NaN `width` emitted NaN bar widths, and
  // a negative one put every row left of a perfectly valid viewBox (see
  // `chartSide`).
  const width = chartSide(widthProp, DEFAULT_WIDTH);
  const height = chartSide(heightProp ?? auto, auto);
  const fmt = makeFormatter(format, locale);
  // A `target` from an empty input (`Number("")` → NaN) compared false against
  // every score, so a chart with no usable target painted every criterion as a
  // MISS and parked the tick on the domain floor. No number, no target.
  const targetV = isFiniteValue(target) ? target : undefined;
  const dom = resolveDomain(domain);

  if (data.some((d) => d.weight != null && d.weight <= 0))
    devWarn("<RubricStrip> non-positive weight — treated as equal split.");
  if (data.some((d) => d.score < dom[0] || d.score > dom[1]))
    devWarn("<RubricStrip> score outside domain — clamped.");

  const bands = rubricRowBands({
    weights: data.map((d) => d.weight ?? 1),
    height,
    gap: ROW_GAP,
  });
  const lab = rubricLabels({
    names: data.map((d) => d.label),
    bands,
    width,
    height,
    show: labels,
    labelSize,
  });
  const geo = rubricStripGeometry({
    data: toInputs(data),
    domain: dom,
    width,
    height,
    gutter: lab.gutter,
    gap: ROW_GAP,
  });
  const accName = resolveSummary(summary, () => rubricStripSummary(data, strings, fmt));

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // Score runs sideways: the box is a stack of criterion rows that always
      // fills it, with weight setting row thickness. Nothing stands on the
      // bottom edge, so the block centres on the cap band.
      seat={{ mode: "center", top: 0, bottom: height }}
      className={className ? `mc-rubric ${className}` : "mc-rubric"}
      style={{ ...style, "--mc-label-px": `${lab.fontSize}px` } as CSSProperties}
    >
      {/* flat siblings, ink roles: rows × (track + bar [+ label]) is this
          chart's SSR hot path (bench floor 25 charts/ms) — no per-row <g>.
          Keys are the row INDEX: two criteria may share a name, and a duplicate
          key reconciles the second row onto the first. */}
      {geo.rows.flatMap((row) => {
        const pass = targetV != null ? row.score >= targetV : null;
        const ink = pass == null ? "accent" : pass ? "positive" : "negative";
        const nodes = [
          <rect
            key={`track-${row.index}`}
            x={lab.gutter}
            y={row.y}
            width={row.trackWidth}
            height={row.height}
            rx={Math.min(1, row.height / 2)}
            fillOpacity={0.12}
            data-mc-ink="neutral"
          />,
          <rect
            key={`bar-${row.index}`}
            x={lab.gutter}
            y={row.y}
            width={row.barWidth}
            height={row.height}
            rx={Math.min(1, row.height / 2)}
            data-mc-ink={ink}
          />,
        ];
        if (lab.chars > 0)
          nodes.push(
            <text
              key={`label-${row.index}`}
              x={labelAnchorX(lab.gutter)}
              y={lab.y[row.index]!}
              dominantBaseline="central"
              textAnchor="end"
              fontSize={lab.fontSize}
              data-mc-ink="label"
            >
              {truncateLabel(row.label, lab.chars)}
            </text>,
          );
        return nodes;
      })}
      {targetV != null ? (
        <line
          x1={geo.targetX(targetV)}
          x2={geo.targetX(targetV)}
          y1={0.5}
          y2={height - 0.5}
          data-mc-ink="data"
          data-mc-w="tick"
          strokeDasharray="1.5 1.5"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {children}
    </Chart>
  );
}
