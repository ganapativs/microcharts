// <RubricStrip> — how a thing scored per criterion, with each criterion's weight
// visible, without a fake composite number (plan/25 §6, plan/17 F13). Static,
// hook-free, RSC-safe. Bar length = score, bar thickness = weight share. There
// is NO total bar and none may be added — that is the whole point.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter } from "../../core/format.js";
import { EN_RUBRIC, type RubricStrings } from "../../core/strings-rubric.js";
import { rubricStripGeometry, type RubricInput } from "./geometry.js";

export interface RubricStripDatum {
  label: string;
  score: number;
  weight?: number | undefined;
}

export interface RubricStripProps {
  data: readonly RubricStripDatum[];
  /** Pass-threshold tick across all rows — one honest line, never a total. */
  target?: number | undefined;
  /** Criterion names in the left gutter; off for cell embedding. */
  labels?: boolean | undefined;
  domain?: [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
  locale?: string | string[] | undefined;
  strings?: RubricStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

/** Shared summary — extremes only, NEVER a weighted total (plan/17 F13). */
export function rubricStripSummary(
  data: readonly RubricStripDatum[],
  strings: RubricStrings,
  fmt: (n: number) => string,
): string {
  if (data.length === 0) return strings.noData;
  let hi = data[0]!;
  let lo = data[0]!;
  for (const d of data) {
    if (d.score > hi.score) hi = d;
    if (d.score < lo.score) lo = d;
  }
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
    domain = [0, 1],
    width = 80,
    height: heightProp,
    format,
    locale,
    strings = EN_RUBRIC,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const n = Math.max(1, data.length);
  const height = heightProp ?? Math.min(32, Math.max(12, n * 8));
  const fmt = makeFormatter(format, locale);
  const fontSize = Math.max(5, Math.min(7, Math.round((height / n) * 0.6)));

  if (data.some((d) => d.weight != null && d.weight <= 0))
    devWarn("<RubricStrip> non-positive weight — treated as equal split.");
  if (data.some((d) => d.score < domain[0] || d.score > domain[1]))
    devWarn("<RubricStrip> score outside domain — clamped.");

  const gutter = labels
    ? Math.min(width * 0.62, Math.max(...data.map((d) => d.label.length), 1) * fontSize * 0.64 + 4)
    : 0;

  const geo = rubricStripGeometry({ data: toInputs(data), domain, width, height, gutter, gap: 1 });
  const accName = summary === false ? false : (summary ?? rubricStripSummary(data, strings, fmt));

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-rubric ${className}` : "mc-rubric"}
      style={{ ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties}
    >
      {geo.rows.map((row) => {
        const cy = round2(row.y + row.height / 2);
        const pass = target != null ? row.score >= target : null;
        const fill =
          pass == null ? "var(--mc-accent)" : pass ? "var(--mc-positive)" : "var(--mc-negative)";
        return (
          <g key={row.label}>
            {/* track */}
            <rect
              x={gutter}
              y={row.y}
              width={row.trackWidth}
              height={row.height}
              rx={Math.min(1, row.height / 2)}
              style={{ fill: "var(--mc-neutral)", fillOpacity: 0.12 }}
            />
            {/* score bar */}
            <rect
              x={gutter}
              y={row.y}
              width={row.barWidth}
              height={row.height}
              rx={Math.min(1, row.height / 2)}
              shapeRendering="crispEdges"
              style={{ fill }}
            />
            {labels ? (
              <text
                x={round2(gutter - 2)}
                y={cy}
                dominantBaseline="central"
                textAnchor="end"
                fontSize={fontSize}
                data-mc-ink="label"
              >
                {row.label}
              </text>
            ) : null}
          </g>
        );
      })}
      {target != null ? (
        <line
          x1={geo.targetX(target)}
          x2={geo.targetX(target)}
          y1={0.5}
          y2={height - 0.5}
          stroke="var(--mc-stroke)"
          strokeWidth={0.75}
          strokeDasharray="1.5 1.5"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {children}
    </Chart>
  );
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
