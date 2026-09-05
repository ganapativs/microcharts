// <IconArray> — how likely is this, really? A
// stated rate made countable: filled units in a fixed N-unit grid with the
// denominator visible. Two moves kill denominator
// neglect: the ratio label and the fixed grid. No partial-unit fills ever;
// fill order is contiguous reading-order (scattered is harder to count).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeUnitFormatter, type Format } from "../../core/format.js";
import { EN_FREQ, type FreqStrings } from "../../core/strings-freq.js";
import type { Polarity } from "../../core/types.js";
import {
  iconArrayGeometry,
  iconArrayLabelPlan,
  resolveTotal,
  type IconArrayGeometry,
  type IconArrayN,
} from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

export function iconArraySummary(
  geo: IconArrayGeometry,
  pctFmt: (n: number) => string,
  strings: FreqStrings,
): string {
  return strings.iconArray(
    geo.k,
    geo.n,
    pctFmt(geo.k / geo.n),
    geo.note === "normal" ? null : geo.note,
  );
}

export interface IconArrayProps {
  /** The rate, 0–1 (rounded to the nearest whole unit of `total`). */
  value: number;
  /** Denominator / grid size (default 20). */
  total?: IconArrayN | undefined;
  /** `"ratio"` (default, "3 in 20") | `"percent"` | `"none"`. */
  label?: "ratio" | "percent" | "none" | undefined;
  /** Shared cell vocabulary. */
  shape?: "square" | "round" | "dot" | undefined;
  /** Polarity — `"down"` (fewer is better) flips the fill color to the risk tone. */
  positive?: Polarity | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  /** Number formatting for the `"percent"` label. Replaces the percent style
   *  rather than extending it, like every other `format` in the catalog — pass
   *  `{ style: "percent", maximumFractionDigits: 1 }` to keep the sign. */
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: FreqStrings | undefined;
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

export function IconArray(props: IconArrayProps): ReactNode {
  const {
    value,
    total: rawTotal,
    label = "ratio",
    shape = "square",
    positive,
    width = 140,
    height = 28,
    color,
    format,
    locale,
    strings = EN_FREQ,
    labelSize,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const total = resolveTotal(rawTotal);
  const pctFmt = makeUnitFormatter(format, locale, { style: "percent", maximumFractionDigits: 0 });
  const plan = iconArrayLabelPlan({ label, total, width, height, labelSize, pct: pctFmt });
  const { font: FONT, gutterCh, show: showLabel } = plan;
  const geo = iconArrayGeometry({ width, height, value, total, shape, gutterCh, fontSize: FONT });

  if (rawTotal !== undefined && rawTotal !== total) {
    devWarn(
      `<IconArray> total=${rawTotal} has no designed grid — using ${total}. Pick 10, 20 or 100.`,
    );
  }
  if (total === 100 && (width < 40 || height < 40)) {
    devWarn("<IconArray> total=100 needs ≥ 40×40 — unit size falls below the crispness floor.");
  }

  const accName = resolveSummary(summary, () => iconArraySummary(geo, pctFmt, strings));

  // no custom color: the fill role token IS the ink role (bound in
  // styles.css, retunes with presets); a custom color stays inline since it
  // has no token
  const fillRole = color
    ? undefined
    : positive === "down"
      ? "negative"
      : positive === "up"
        ? "positive"
        : "accent";
  // "3 in 20" is PROSE, so it comes from `strings` like every other rendered
  // word — an inline template here is English no bundle can translate.
  const labelText =
    label === "percent" ? pctFmt(geo.k / geo.n) : strings.iconArrayRatio(geo.k, geo.n);
  // pin the label size to viewBox units (see coverage-strip)
  const rootStyle = { ...style, "--mc-label-px": `${FONT}px` } as CSSProperties;

  return (
    <Chart
      width={geo.totalWidth}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // A fixed grid of units — the empty slots are drawn too, so the block's
      // size never changes with the rate and there is no floor for it to stand
      // on. Centre the grid on the cap band. Seat the grid rather than the box:
      // the cell cap leaves slack above and below on a tall chart.
      seat={{ mode: "center", top: geo.y0, bottom: geo.y1 }}
      className={className ? `mc-icon-array ${className}` : "mc-icon-array"}
      style={rootStyle}
    >
      {geo.units.map((u) =>
        u.filled ? (
          <rect
            key={u.index}
            x={u.x}
            y={u.y}
            width={geo.cell}
            height={geo.cell}
            rx={geo.rx}
            shapeRendering={geo.crisp ? "crispEdges" : undefined}
            data-mc-ink={fillRole ?? "unit"}
            style={color ? { fill: color } : undefined}
          />
        ) : (
          // empty unit — a visible faint-fill slot with a hairline, never a
          // void. Coloring lives in the "unit-off" ink-role rule (styles.css)
          // so forced-colors can remap it; the filled unit is an ink role too
          // (accent/positive/negative by `positive`) unless a custom `color`
          // is given, which has no token and stays inline.
          <rect
            key={u.index}
            x={u.x}
            y={u.y}
            width={geo.cell}
            height={geo.cell}
            rx={geo.rx}
            data-mc-ink="unit-off"
          />
        ),
      )}
      {showLabel ? (
        <text
          x={geo.labelX}
          y={geo.labelY}
          textAnchor="start"
          dominantBaseline="central"
          data-mc-ink="label"
          fontSize={FONT}
        >
          {labelText}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
