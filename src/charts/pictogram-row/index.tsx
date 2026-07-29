// <PictogramRow> — counts a human can verify by counting.
// ●●●○○ — filled vs hollow is a SHAPE difference too, never opacity-alone.
// One row only (wrapped grids are ActivityGrid
// territory); unit size is constant — never scaled by value.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { EN_SCALAR, type ScalarStrings } from "../../core/strings-scalar.js";
import { chartSide, round2 } from "../../core/types.js";
import {
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
  pictogramGeometry,
  type PictogramUnit,
} from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

/** True numbers even on overflow ("9 of 8."). */
export function pictogramSummary(
  value: number,
  total: number,
  fmt: (n: number) => string,
  strings: ScalarStrings,
): string {
  // Whole units are what the row draws, so they are what it announces. Reading
  // `total > 0` instead let a fractional denominator through: `total={0.5}`
  // floors to no units at all, yet the name read "0.25 of 0." over an empty box.
  const units = Math.floor(total);
  if (!Number.isFinite(value) || !Number.isFinite(total) || units < 1) return strings.noData;
  return strings.countOf(fmt(value), units);
}

export interface PictogramRowProps {
  /** Filled units (may be fractional). */
  value: number;
  /** Unit count (≤ 20 documented; beyond → Progress). */
  total: number;
  /** `"dot"` (default) or `"square"` (packs tighter in table cells). */
  shape?: "dot" | "square" | undefined;
  /** `"clip"` shows the true partial unit; `"round"` snaps (seats). */
  fractional?: "clip" | "round" | undefined;
  /** Custom unit glyph (star ratings) — the ONE sanctioned customization. */
  renderPoint?: ((unit: PictogramUnit) => ReactNode) | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: ScalarStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function PictogramRow(props: PictogramRowProps): ReactNode {
  const {
    value,
    total,
    shape = "dot",
    fractional = "clip",
    renderPoint,
    width: widthProp = DEFAULT_WIDTH,
    height: heightProp = DEFAULT_HEIGHT,
    color,
    format,
    locale,
    strings = EN_SCALAR,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  // Same resolution the geometry runs, so the frame and the units share a box.
  const width = chartSide(widthProp, DEFAULT_WIDTH);
  const height = chartSide(heightProp, DEFAULT_HEIGHT);

  if (Number.isFinite(total) && total > 20) {
    devWarn(`<PictogramRow> total=${total} — past 20 units, counting fails; use Progress.`);
  }
  if (Number.isFinite(value) && Number.isFinite(total) && value > total) {
    devWarn(
      `<PictogramRow> value ${value} exceeds total ${total} — all units filled, summary keeps the true numbers.`,
    );
  }

  const geo = pictogramGeometry({ width, height, value, total, shape, fractional });
  const fmt = makeFormatter(format, locale);
  const accName = resolveSummary(summary, () => pictogramSummary(value, total, fmt, strings));
  // no custom color: the fill IS the accent ink role (bound in styles.css,
  // retunes with presets); a custom color has no token and stays inline
  const fillRole = color ? undefined : "accent";
  const fillStyle = color ? { fill: color } : undefined;

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // ●●●○○ — one symmetric row of constant-size units. Hollow units hold
      // their place, so the band is the same height at every value and nothing
      // rests on a bottom: centre it on the cap band and it sets like the
      // characters it borrows from.
      seat={{ mode: "center", top: geo.y0, bottom: geo.y1 }}
      className={className ? `mc-pictogram ${className}` : "mc-pictogram"}
      style={style}
    >
      {geo.units.map((u) => {
        if (renderPoint) return renderPoint(u);
        if (u.fill >= 1) {
          return shape === "dot" ? (
            <circle
              key={u.index}
              cx={u.cx}
              cy={u.cy}
              r={u.r}
              data-mc-ink={fillRole}
              style={fillStyle}
            />
          ) : (
            <rect
              key={u.index}
              // rounded on derivation: subtracting two 2-dp numbers reintroduces
              // binary noise (`1.1399999999999997`) straight into the markup
              x={round2(u.cx - u.r)}
              y={round2(u.cy - u.r)}
              width={round2(u.r * 2)}
              height={round2(u.r * 2)}
              shapeRendering="crispEdges"
              data-mc-ink={fillRole}
              style={fillStyle}
            />
          );
        }
        // Below here the unit is empty or partial, so the ring always shows —
        // it used to be built for filled units too, with every attribute behind
        // a `u.fill >= 1` ternary that the early return above had already ruled
        // out. One throwaway element per filled unit, and three dead branches.
        const ring =
          shape === "dot" ? (
            <circle
              key={`r${u.index}`}
              cx={u.cx}
              cy={u.cy}
              r={u.ringR}
              fill="none"
              data-mc-ink="muted"
              data-mc-w="hair"
            />
          ) : (
            <rect
              key={`r${u.index}`}
              x={round2(u.cx - u.ringR)}
              y={round2(u.cy - u.ringR)}
              width={round2(u.ringR * 2)}
              height={round2(u.ringR * 2)}
              fill="none"
              data-mc-ink="muted"
              data-mc-w="hair"
            />
          );
        if (u.partial) {
          return (
            <g key={u.index}>
              {ring}
              <path d={u.partial} data-mc-ink={fillRole} style={fillStyle} />
            </g>
          );
        }
        return ring;
      })}
      {children}
    </Chart>
  );
}
