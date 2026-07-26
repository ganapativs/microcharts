// <Slope> — who rose and who fell between two moments (S2-paired, time on x).
// Static, hook-free, RSC-safe. Neutral ink until `positive` is
// declared — a rank change is not automatically good or bad. Both columns
// share one y-domain; a two-point line implies nothing about the path between
// (docs steer to Sparkline for the path).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { resolveAnnotations, annotationFontSize } from "../../shared/annotations-host.js";
import { scaleLinear } from "../../core/scale.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { EN_PAIRED, type PairedStrings } from "../../core/strings-paired.js";
import { spreadLabels } from "../../core/labels.js";
import { pairChange, type DumbbellDatum } from "../dumbbell/index.js";
import { truncateLabel } from "../dot-plot/geometry.js";
import { slopeFitFrame } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

export type SlopeDatum = DumbbellDatum & { label: string };

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
  format?: Format | undefined;
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
    devWarn(`<Slope> ${data.length} categories — crossings tangle past 7.`);
  }

  const fmt = makeFormatter(format, locale);
  const wantLeft = label === "value" || label === "both";
  const wantLabel = label === "label" || label === "both";
  // gutters ate the plot → drop labels AND give the reclaimed room back to
  // the lines (a squeezed slope with labels is a pile, without them a sliver)
  const { geo, labelsDropped, fontSize } = slopeFitFrame({
    width,
    height,
    data,
    domain,
    label,
    fmt,
  });
  const accName = resolveSummary(summary, () => slopeSummary(data, strings));

  const goodDir = positive === "down" ? -1 : 1;
  const showLabels = label !== "none" && !labelsDropped;
  // per-column label layout: baselines spread to a full glyph pitch inside
  // the frame (deterministic sweep, core/labels) — close endpoints nudge
  // apart instead of colliding; an impossible column drops its labels
  const layoutColumn = (ys: (number | null)[]): (number | null)[] => {
    const present: number[] = [];
    for (const y of ys) if (y !== null) present.push(y);
    const spread = spreadLabels(present, fontSize * 1.05, fontSize * 0.5, height - fontSize * 0.5);
    let k = 0;
    return ys.map((y) => (y === null || !spread ? null : spread[k++]!));
  };
  const leftYs = showLabels ? layoutColumn(geo.lines.map((l) => l.y0)) : [];
  const rightYs = showLabels ? layoutColumn(geo.lines.map((l) => l.y1)) : [];

  const ann = children
    ? resolveAnnotations(children, {
        x: (i) => (Math.round(i) <= 0 ? geo.colX0 : geo.colX1),
        y: scaleLinear(geo.domain, [height - 1.5, 1.5]),
        width,
        height,
        fontSize: annotationFontSize(height),
      })
    : { under: null, over: null, rest: null };

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
      // Segments float between two columns with nothing beneath them, so this
      // seats like its Dumbbell sibling rather than like a trace. The endpoints
      // inset by one dot radius at both ends, leaving the frame's midpoint and
      // the plot's identical.
      seat={{ mode: "center", top: 0, bottom: height }}
      className={className ? `mc-slope ${className}` : "mc-slope"}
      style={rootStyle}
    >
      {ann.under}
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
                data-mc-ink="data"
                style={{
                  strokeWidth: isHl ? "calc(var(--mc-sw) * 1.5)" : "var(--mc-sw)",
                }}
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
                data-mc-ink="data"
                style={{ strokeWidth: "var(--mc-sw)" }}
                strokeDasharray="1.5 1.5"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
            {line.y0 !== null ? (
              <circle
                cx={line.x0}
                cy={line.y0}
                r={1.5}
                data-mc-ink="point"
                style={{ fill: stroke }}
              />
            ) : null}
            {line.y1 !== null ? (
              <circle
                cx={line.x1}
                cy={line.y1}
                r={1.5}
                data-mc-ink="point"
                style={{ fill: stroke }}
              />
            ) : null}
            {showLabels && wantLeft && leftYs[line.index] !== null ? (
              <text
                x={geo.leftLabelX}
                y={leftYs[line.index]!}
                fontSize={fontSize}
                dominantBaseline="central"
                textAnchor="end"
                data-mc-ink="label"
              >
                {fmt(d.from)}
              </text>
            ) : null}
            {showLabels && rightYs[line.index] !== null ? (
              <text
                x={geo.rightLabelX}
                y={rightYs[line.index]!}
                fontSize={fontSize}
                dominantBaseline="central"
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
      {ann.over}
      {ann.rest}
    </Chart>
  );
}
