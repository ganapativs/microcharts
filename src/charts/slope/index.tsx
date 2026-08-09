// <Slope> — who rose and who fell between two moments (S2-paired, time on x).
// Neutral ink until `positive` is
// declared — a rank change is not automatically good or bad. Both columns
// share one y-domain; a two-point line implies nothing about the path between
// (docs steer to Sparkline for the path).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { resolveAnnotations, annotationFontSize } from "../../shared/annotations-host.js";
import { scaleLinear } from "../../core/scale.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter, makePercentFormatter, type Format } from "../../core/format.js";
import { EN_PAIRED, type PairedStrings } from "../../core/strings-paired.js";
import { seatLabels } from "../../core/labels.js";
import { pairChange, type DumbbellDatum } from "../dumbbell/index.js";
import { truncateLabel } from "../dot-plot/geometry.js";
import { slopeFitFrame } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

export type SlopeDatum = DumbbellDatum & { label: string };

/**
 * Direction counts, led by the biggest mover.
 *
 * `fmt`/`pctFmt` are optional so the exported signature stays compatible, but
 * both entries pass them: without `fmt` the announced value was `String(n)`,
 * so a chart formatting "12.3K" on screen announced "12345.6"; without
 * `pctFmt` the ratio was an en-US percent, and `locale` reached every other
 * number on the chart but not that one (the fix Dumbbell already carries).
 */
export function slopeSummary(
  data: readonly SlopeDatum[],
  strings: PairedStrings,
  fmt: (n: number) => string = String,
  pctFmt: (fraction: number) => string = makePercentFormatter(undefined),
): string {
  const finite = data.filter((d) => Number.isFinite(d.from) && Number.isFinite(d.to));
  if (finite.length === 0) return strings.noData;
  // One row has no field to stand out from, and the counting sentence read
  // "1 categories: 1 up, 0 down. Largest change East, up 18%." — ungrammatical
  // and three clauses to say one thing. Same sentence the interactive entry
  // announces for that row, so both readings of a one-row slope agree.
  if (finite.length === 1) {
    const d = finite[0]!;
    const one = pairChange(d.from, d.to, pctFmt);
    return one
      ? strings.slopeAt(d.label, fmt(d.from), fmt(d.to), one.dir, one.pct)
      : strings.flatPair(fmt(d.from));
  }
  const up = finite.filter((d) => d.to > d.from).length;
  const down = finite.filter((d) => d.to < d.from).length;
  let top = finite[0]!;
  for (const d of finite) {
    if (Math.abs(d.to - d.from) > Math.abs(top.to - top.from)) top = d;
  }
  const c = pairChange(top.from, top.to, pctFmt);
  if (!c) return strings.flatPair(fmt(top.from));
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
    labelSize,
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
  // gutters ate the plot → drop labels AND give the reclaimed room back to
  // the lines (a squeezed slope with labels is a pile, without them a sliver)
  const { geo, labelsDropped, fontSize, nameChars } = slopeFitFrame({
    labelSize,
    width,
    height,
    data,
    domain,
    label,
    fmt,
  });
  // Relative change — takes `locale`, never the value `format` (its units).
  const pctFmt = makePercentFormatter(locale);
  const accName = resolveSummary(summary, () => slopeSummary(data, strings, fmt, pctFmt));

  const goodDir = positive === "down" ? -1 : 1;
  const showLabels = label !== "none" && !labelsDropped;
  // Per-column label layout (deterministic, core/labels): each label seats on
  // its OWN endpoint, moves at most half a glyph pitch to clear the label above
  // it, and drops when that is not enough. The previous pass spread the whole
  // column to a full pitch instead, which at six rows in a 54-unit box moved a
  // label 19 units and left three of them nearer a foreign line than their own.
  // A name on the wrong line reads as data, so the label goes instead.
  // The band is the containment band (a centred glyph owns fontSize / 2 above
  // and below its baseline), which sits fontSize / 2 − 1.5 inside the endpoint
  // band; the outermost row absorbs that as its clamp.
  const layoutColumn = (ys: (number | null)[]): (number | null)[] =>
    seatLabels(ys, fontSize * 1.05, fontSize * 0.5, height - fontSize * 0.5);
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
  const rootStyle = { ...style, "--mc-label-px": `${fontSize}px` } as CSSProperties;

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
        // One ink ROLE per row, read by the connector and by its endpoint dots.
        // A `stroke=` attribute cannot carry this: styles.css paints every role
        // from a stylesheet rule, and a CSS declaration outranks an SVG
        // presentation attribute — so `stroke="var(--mc-positive)"` under
        // `data-mc-ink="data"` painted `--mc-stroke` regardless, and `positive`,
        // `highlight` and `color` all died on the line while the dots (inline
        // `style`) obeyed them. Roles also earn the forced-colors mapping.
        // Element-split: a line strokes its valence, a circle fills it, and the
        // no-valence case has two names (muted strokes, neutral fills).
        const ink = isHl
          ? "accent"
          : positive !== undefined && line.dir !== 0
            ? line.dir === goodDir
              ? "positive"
              : "negative"
            : null;
        // `color` is the caller's literal and outranks valence, as before. It
        // has to be inline to beat the role's own rule — the same escape hatch
        // Dumbbell's dot uses, and the same forced-colors trade.
        const paint = !isHl && color !== undefined;
        const incomplete = line.y0 === null || line.y1 === null;
        return (
          <g key={line.index}>
            {line.y0 !== null && line.y1 !== null ? (
              <line
                x1={line.x0}
                y1={line.y0}
                x2={line.x1}
                y2={line.y1}
                data-mc-ink={ink ?? "muted"}
                style={{
                  strokeWidth: isHl ? "calc(var(--mc-sw) * 1.5)" : "var(--mc-sw)",
                  ...(paint ? { stroke: color } : null),
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
                data-mc-ink={ink ?? "muted"}
                style={{ strokeWidth: "var(--mc-sw)", ...(paint ? { stroke: color } : null) }}
                strokeDasharray="1.5 1.5"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
            {line.y0 !== null ? (
              <circle
                cx={line.x0}
                cy={line.y0}
                r={1.5}
                data-mc-ink={ink ?? "neutral"}
                style={paint ? { fill: color } : undefined}
              />
            ) : null}
            {line.y1 !== null ? (
              <circle
                cx={line.x1}
                cy={line.y1}
                r={1.5}
                data-mc-ink={ink ?? "neutral"}
                style={paint ? { fill: color } : undefined}
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
            {/* `nameChars` is 0 when the name was too narrow to identify a row
                and handed its gutter back; with `label="label"` that leaves the
                right column with nothing to say, so it renders no node at all
                rather than an empty one. */}
            {showLabels && rightYs[line.index] !== null && (wantLeft || nameChars > 0) ? (
              <text
                x={geo.rightLabelX}
                y={rightYs[line.index]!}
                fontSize={fontSize}
                dominantBaseline="central"
                textAnchor="start"
                /* Always the label role — the right column carried none as soon
                   as it held a VALUE, which left it painting `--mc-stroke` (the
                   `.mc-root text` default) beside a left column in `--mc-neutral`,
                   and only a marked label maps to CanvasText in forced colors. */
                data-mc-ink="label"
              >
                {wantLeft ? fmt(d.to) : ""}
                {wantLeft && nameChars > 0 ? " " : ""}
                {/* The budget the gutter was RESERVED from, never the
                    truncator's own default — the two constants are one
                    contract, and 6 of them was the whole bug. */}
                {nameChars > 0 ? truncateLabel(d.label, nameChars) : ""}
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
