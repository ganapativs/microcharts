// <Slope> — who rose and who fell between two moments (plan/22 #13, S2-paired,
// time on x). Static, hook-free, RSC-safe. Neutral ink until `positive` is
// declared — a rank change is not automatically good or bad. Both columns
// share one y-domain; a two-point line implies nothing about the path between
// (docs steer to Sparkline for the path).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter } from "../../core/format.js";
import { EN_PAIRED, type PairedStrings } from "../../core/strings-paired.js";
import { pairChange, type DumbbellDatum } from "../dumbbell/index.js";
import { truncateLabel } from "../dot-plot/geometry.js";
import { slopeGeometry } from "./geometry.js";

export type SlopeDatum = DumbbellDatum & { label: string };

/** Factual slope summary — counts + the largest change. Shared with client. */
export function slopeSummary(data: readonly SlopeDatum[], strings: PairedStrings): string {
  const finite = data.filter((d) => Number.isFinite(d.from) && Number.isFinite(d.to));
  if (finite.length === 0) return strings.noData;
  const up = finite.filter((d) => d.to > d.from).length;
  const down = finite.filter((d) => d.to < d.from).length;
  let top = finite[0]!;
  for (const d of finite) {
    if (Math.abs(d.to - d.from) > Math.abs(top.to - top.from)) top = d;
  }
  const c = pairChange(top.from, top.to);
  if (!c) return strings.flatPair(String(top.from));
  return strings.slopes(finite.length, up, down, top.label, c.dir, c.pct);
}

export interface SlopeProps {
  data: readonly SlopeDatum[];
  /** Index or label to accent — the one-vs-field editorial read. */
  highlight?: number | string | undefined;
  /** Direction valence; unset = neutral ink. */
  positive?: "up" | "down" | undefined;
  /** `"none"` (default) | `"value"` | `"label"` | `"both"`. */
  label?: "none" | "value" | "label" | "both" | undefined;
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
  locale?: string | string[] | undefined;
  strings?: PairedStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function Slope(props: SlopeProps): ReactNode {
  const {
    data,
    highlight,
    positive,
    label = "none",
    domain,
    width = 40,
    height = 40,
    color,
    format,
    locale,
    strings = EN_PAIRED,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  if (data.length > 7) {
    devWarn(`<Slope> ${data.length} categories — past 7 the crossings tangle (documented cap).`);
  }

  const fontSize = 6;
  const fmt = makeFormatter(format, locale);
  const wantLeft = label === "value" || label === "both";
  const wantLabel = label === "label" || label === "both";
  const estLeftCh = wantLeft
    ? data.reduce((m, d) => Math.max(m, Number.isFinite(d.from) ? fmt(d.from).length : 0), 0)
    : 0;
  const estRightCh =
    label === "none"
      ? 0
      : data.reduce(
          (m, d) =>
            Math.max(
              m,
              (wantLeft && Number.isFinite(d.to) ? fmt(d.to).length : 0) +
                (wantLabel ? Math.min(6, d.label.length) + 1 : 0),
            ),
          0,
        );

  const pairs = data.map((d) => ({ from: d.from, to: d.to }));
  let geo = slopeGeometry({
    width,
    height,
    pairs,
    domain,
    gutterLeftCh: estLeftCh,
    gutterRightCh: estRightCh,
    fontSize,
  });
  // gutters ate the plot → drop labels AND give the reclaimed room back to
  // the lines (a squeezed slope with labels is a pile, without them a sliver)
  const labelsDropped = !geo.labelsFit;
  if (labelsDropped) {
    geo = slopeGeometry({
      width,
      height,
      pairs,
      domain,
      gutterLeftCh: 0,
      gutterRightCh: 0,
      fontSize,
    });
  }
  const accName = summary === false ? false : (summary ?? slopeSummary(data, strings));

  const goodDir = positive === "down" ? -1 : 1;
  const showLabels = label !== "none" && !labelsDropped;
  // baseline sits ~0.35em under the dot; keep the glyph box inside the frame
  const labelY = (y: number): number =>
    Math.min(Math.max(y + fontSize * 0.35, fontSize * 0.8), height - fontSize * 0.25);
  // greedy per-column label dedup: an endpoint within 0.9 × fontSize of an
  // already-labeled endpoint drops its label (pure arithmetic — plan/18)
  const labeled0: number[] = [];
  const labeled1: number[] = [];
  const canLabel = (seen: number[], y: number | null): boolean => {
    if (y === null) return false;
    if (seen.some((prev) => Math.abs(prev - y) < fontSize * 0.9)) return false;
    seen.push(y);
    return true;
  };

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-slope ${className}` : "mc-slope"}
      style={style}
    >
      {geo.lines.map((line) => {
        const d = data[line.index]!;
        const isHl = highlight !== undefined && (highlight === d.label || highlight === line.index);
        const stroke = isHl
          ? "var(--mc-accent)"
          : color
            ? color
            : positive !== undefined && line.dir !== 0
              ? line.dir === goodDir
                ? "var(--mc-positive)"
                : "var(--mc-negative)"
              : "var(--mc-neutral)";
        const incomplete = line.y0 === null || line.y1 === null;
        return (
          <g key={line.index}>
            {line.y0 !== null && line.y1 !== null ? (
              <line
                x1={line.x0}
                y1={line.y0}
                x2={line.x1}
                y2={line.y1}
                stroke={stroke}
                strokeWidth={isHl ? 1.5 : 1}
                vectorEffect="non-scaling-stroke"
              />
            ) : incomplete && (line.y0 !== null || line.y1 !== null) ? (
              /* dashed stub toward the missing end — announced "incomplete" */
              <line
                x1={line.y0 !== null ? line.x0 : line.x1 - 6}
                y1={(line.y0 ?? line.y1)!}
                x2={line.y0 !== null ? line.x0 + 6 : line.x1}
                y2={(line.y0 ?? line.y1)!}
                stroke={stroke}
                strokeWidth={1}
                strokeDasharray="1.5 1.5"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
            {line.y0 !== null ? (
              <circle cx={line.x0} cy={line.y0} r={1.5} style={{ fill: stroke }} />
            ) : null}
            {line.y1 !== null ? (
              <circle cx={line.x1} cy={line.y1} r={1.5} style={{ fill: stroke }} />
            ) : null}
            {showLabels && wantLeft && line.nudge0 === 0 && canLabel(labeled0, line.y0) ? (
              <text x={geo.leftLabelX} y={labelY(line.y0!)} fontSize={fontSize} textAnchor="end">
                {fmt(d.from)}
              </text>
            ) : null}
            {showLabels && line.nudge1 === 0 && canLabel(labeled1, line.y1) ? (
              <text
                x={geo.rightLabelX}
                y={labelY(line.y1!)}
                fontSize={fontSize}
                textAnchor="start"
                data-mc-ink={wantLabel && !wantLeft ? "label" : undefined}
              >
                {wantLeft ? fmt(d.to) : ""}
                {wantLeft && wantLabel ? " " : ""}
                {wantLabel ? truncateLabel(d.label) : ""}
              </text>
            ) : null}
          </g>
        );
      })}
      {children}
    </Chart>
  );
}
