// <Dumbbell> — where each row started and ended.
// Hollow → filled reads as before → after without
// a legend; with `positive` the connector takes the valence token by direction.
// For RANGES (min→max) docs require dropping `positive` — a range has no
// valence and coloring it would invent one.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter, makePercentFormatter, type Format } from "../../core/format.js";
import { round2 } from "../../core/types.js";
import { labelFitsY, rowLabelFont, ROW_LABEL_FACTOR } from "../../core/labels.js";
import { EN_PAIRED, type PairedStrings } from "../../core/strings-paired.js";
import { dumbbellGeometry, dumbbellLabelChars } from "./geometry.js";
import { truncateLabel } from "../dot-plot/geometry.js";
import { resolveSummary } from "../../core/summary.js";

export interface DumbbellDatum {
  label?: string | undefined;
  from: number;
  to: number;
}

/** Percent-change clause for a pair (shared with the interactive entry).
 *  `pctFmt` takes a FRACTION and must be a real percent formatter — the old
 *  `${Math.round(x*100)}%` was an en-US percent, so `locale` reached every other
 *  number on the chart but not this one. Unsigned: `dir` carries the sign. */
export function pairChange(
  from: number,
  to: number,
  pctFmt: (fraction: number) => string = makePercentFormatter(undefined),
): { dir: "up" | "down"; pct: string } | null {
  if (!Number.isFinite(from) || !Number.isFinite(to) || from === to) return null;
  const dir = to > from ? "up" : "down";
  const pct = from === 0 ? "" : pctFmt(Math.abs((to - from) / Math.abs(from)));
  return { dir, pct };
}

/** From/to + percent change; multi-row leads with the largest move. */
export function dumbbellSummary(
  data: readonly DumbbellDatum[],
  fmt: (n: number) => string,
  strings: PairedStrings,
  pctFmt: (fraction: number) => string = makePercentFormatter(undefined),
): string {
  const finite = data.filter((d) => Number.isFinite(d.from) && Number.isFinite(d.to));
  if (finite.length === 0) return strings.noData;
  if (finite.length === 1) {
    const d = finite[0]!;
    const c = pairChange(d.from, d.to, pctFmt);
    return c ? strings.fromTo(fmt(d.from), fmt(d.to), c.dir, c.pct) : strings.flatPair(fmt(d.from));
  }
  let top = finite[0]!;
  let topDelta = 0;
  finite.forEach((d, i) => {
    const delta = Math.abs(d.to - d.from);
    if (i === 0 || delta > topDelta) {
      top = d;
      topDelta = delta;
    }
  });
  const c = pairChange(top.from, top.to, pctFmt);
  if (!c) return strings.flatPair(fmt(top.from));
  // `label` is optional on this chart, and `rows` has a slot for the name: an
  // unnamed leader left a hole mid-sentence — "2 rows. Largest change , up 200%."
  // A row with no name is identified by its move instead, the same sentence the
  // single-row summary uses.
  if (!top.label) return strings.fromTo(fmt(top.from), fmt(top.to), c.dir, c.pct);
  return strings.rows(finite.length, top.label, c.dir, c.pct);
}

export interface DumbbellProps {
  data: readonly DumbbellDatum[];
  /** Index or label to accent. */
  highlight?: number | string | undefined;
  /** Direction valence for CHANGES; drop it for ranges (no valence). */
  positive?: "up" | "down" | undefined;
  /** `"value"` anchors from/to values outside the dots (drops when tight). */
  label?: "value" | "none" | undefined;
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

export function Dumbbell(props: DumbbellProps): ReactNode {
  const {
    data,
    highlight,
    positive,
    label = "none",
    domain,
    width = 60,
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
  const height = props.height ?? data.length * 12;

  if (data.length > 5) {
    devWarn(`<Dumbbell> ${data.length} rows — past 5 the comparison blurs (documented cap).`);
  }

  // Sized off the row PITCH, not the chart height: adding rows grows the height,
  // so `labelFont(height, …)` grew the type while the room per row shrank — it
  // pinned at the 11-unit ceiling from three rows on while DotPlot, doing the
  // same job beside it, sat at 7.
  const fontSize = rowLabelFont(
    data.length > 0 ? height / data.length : height,
    ROW_LABEL_FACTOR,
    labelSize,
  );
  const rowPitch = data.length > 0 ? height / data.length : 0;
  // Both entries share this budget (see dumbbellLabelChars) — the client
  // re-derives it to place its overlay rings, and a second spelling drifts.
  const maxLabelChars = dumbbellLabelChars({
    width,
    height,
    rows: data.length,
    fontSize,
    longest: data.reduce((m, d) => Math.max(m, d.label?.length ?? 0), 0),
  });
  const showRowLabels = maxLabelChars > 0;
  const geo = dumbbellGeometry({
    width,
    height,
    pairs: data.map((d) => ({ from: d.from, to: d.to })),
    domain,
    gutterCh: maxLabelChars > 0 ? maxLabelChars + 1 : 0,
    fontSize,
  });
  const fmt = makeFormatter(format, locale);
  // Relative change — takes `locale`, never the value `format` (its units).
  const pctFmt = makePercentFormatter(locale);
  const accName = resolveSummary(summary, () => dumbbellSummary(data, fmt, strings, pctFmt));

  const goodDir = positive === "down" ? -1 : 1;

  // Pin the label size in viewBox units. `styles.css` sets `font-size` on
  // `.mc-root text`, and a CSS declaration outranks the SVG presentation
  // attribute, so `fontSize={...}` alone is inert and the reserved gutters would
  // be sized for a font the browser never paints (see label-containment tests).
  const rootStyle = { ...style, "--mc-label-px": `${fontSize}px` } as CSSProperties;

  // Value runs on x; Threshold/TargetZone are y-valued so annotations can't map
  // honestly here — pass children through (same contract as horizontal MiniBar).
  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // Paired dots on category rows — value runs sideways, so no row rests on
      // the box bottom and the stack centres on the cap band. Rows always fill
      // the height (pitch = height / n), so the box is the plot box vertically;
      // the label gutter insets only the value axis.
      seat={{ mode: "center", top: 0, bottom: height }}
      className={className ? `mc-dumbbell ${className}` : "mc-dumbbell"}
      style={rootStyle}
    >
      {geo.rows.map((row) => {
        const d = data[row.index]!;
        const isHl = highlight !== undefined && (highlight === d.label || highlight === row.index);
        // valence ink role by direction; a plain range (no `positive`) stays muted
        const connectorInk =
          positive !== undefined && row.dir !== 0
            ? row.dir === goodDir
              ? "positive"
              : "negative"
            : "muted";
        // from === to → single dot, connector omitted (honest degenerate)
        const single = row.x0 !== null && row.x0 === row.x1;
        // connector stops at each dot's EDGE, not its center — otherwise it
        // pierces the hollow "before" ring (r 1.7) and shows through. Inset by
        // the mark radius along the row; if the dots nearly touch, drop the
        // connector (nothing legible to draw between them).
        const connector = (() => {
          if (single || row.x0 === null || row.x1 === null) return null;
          const dir = row.x1 >= row.x0 ? 1 : -1;
          const x0 = round2(row.x0 + dir * 1.7);
          const x1 = round2(row.x1 - dir * 2);
          return dir > 0 ? (x1 > x0 ? { x0, x1 } : null) : x1 < x0 ? { x0, x1 } : null;
        })();
        const est = (v: number) => fmt(v).length * fontSize * 0.62;
        const leftX = row.x0 !== null && row.x1 !== null ? Math.min(row.x0, row.x1) : null;
        const rightX = row.x0 !== null && row.x1 !== null ? Math.max(row.x0, row.x1) : null;
        // values render only when BOTH the span is wide enough and each label's
        // estimate stays inside the viewBox — pure arithmetic, never measured.
        const leftVal = leftX !== null ? (row.x0! <= row.x1! ? d.from : d.to) : 0;
        const rightVal = rightX !== null ? (row.x0! <= row.x1! ? d.to : d.from) : 0;
        // values sit ON the row, so they need the same vertical room the row
        // names do — and their own line has to clear the box top/bottom once
        // the row y is clamped against the edge.
        const showValues =
          label === "value" &&
          rowPitch >= fontSize + 0.5 &&
          labelFitsY(row.y, fontSize, height) &&
          leftX !== null &&
          rightX !== null &&
          rightX - leftX >= Math.max(est(leftVal), est(rightVal)) &&
          leftX - 4 - est(leftVal) >= 0 &&
          rightX + 4 + est(rightVal) <= width;
        return (
          <g key={row.index}>
            {/* length, not truthiness: a row named "0" is a named row, and it
                had already been charged for the gutter it then left empty. */}
            {showRowLabels && d.label !== undefined && d.label.length > 0 ? (
              <text
                x={geo.labelX}
                y={row.y}
                fontSize={fontSize}
                dominantBaseline="central"
                textAnchor="end"
                data-mc-ink="label"
              >
                {truncateLabel(d.label, maxLabelChars)}
              </text>
            ) : null}
            {!single && row.x0 !== null && row.x1 !== null && connector !== null ? (
              <line
                x1={connector.x0}
                y1={row.y}
                x2={connector.x1}
                y2={row.y}
                data-mc-ink={connectorInk}
                // A secondary mark, which is what `support` names. It spelled a
                // raw 1.25, so it reached neither `--mc-density` nor
                // `prefers-contrast: more` and stayed hairline for a reader who
                // asked every other stroke to thicken.
                data-mc-w="support"
              />
            ) : null}
            {row.x0 !== null && !single ? (
              // hollow ring: on a <circle> the accent role FILLS, so the colour
              // rides an inline style — which also outranks the `data` role's
              // own stroke, leaving that role free to do the one job wanted
              // here. Without it this endpoint sat outside the data-change
              // transition while the right-hand endpoint below (a real ink
              // role) travelled, and a dumbbell whose two ends move at
              // different times is not reading as one span.
              <circle
                cx={row.x0}
                cy={row.y}
                r={1.7}
                fill="none"
                data-mc-ink="data"
                style={{ stroke: isHl ? "var(--mc-accent)" : (color ?? "var(--mc-stroke)") }}
                data-mc-w="support"
              />
            ) : null}
            {row.x1 !== null ? (
              <circle
                cx={row.x1}
                cy={row.y}
                r={2}
                data-mc-ink={isHl ? "accent" : "point"}
                style={!isHl && color ? { fill: color } : undefined}
              />
            ) : null}
            {showValues && leftX !== null && rightX !== null ? (
              <>
                {/* Direct value labels take the label ink like every other one
                    in the catalog: quieter than the dots they annotate, and —
                    the part that bites — the only text fill High Contrast Mode
                    maps to CanvasText. Bare <text> keeps `--mc-stroke` verbatim
                    under `forced-color-adjust: none`, painting a fixed theme ink
                    against whatever background the user chose. */}
                <text
                  x={leftX - 4}
                  y={row.y}
                  fontSize={fontSize}
                  dominantBaseline="central"
                  textAnchor="end"
                  data-mc-ink="label"
                >
                  {fmt(leftVal)}
                </text>
                <text
                  x={rightX + 4}
                  y={row.y}
                  fontSize={fontSize}
                  dominantBaseline="central"
                  textAnchor="start"
                  data-mc-ink="label"
                >
                  {fmt(rightVal)}
                </text>
              </>
            ) : null}
          </g>
        );
      })}
      {children}
    </Chart>
  );
}
