// <PictogramRow> — counts a human can verify by counting.
// ●●●○○ — filled vs hollow is a SHAPE difference too, never opacity-alone.
// One row only (wrapped grids are ActivityGrid
// territory); unit size is constant — never scaled by value.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { EN_SCALAR, type ScalarStrings } from "../../core/strings-scalar.js";
import { pictogramGeometry, type PictogramUnit } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

/** True numbers even on overflow ("9 of 8."). */
export function pictogramSummary(
  value: number,
  total: number,
  fmt: (n: number) => string,
  strings: ScalarStrings,
): string {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) return strings.noData;
  return strings.countOf(fmt(value), Math.floor(total));
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
    width = 60,
    height = 12,
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
        const ring =
          shape === "dot" ? (
            <circle
              key={`r${u.index}`}
              cx={u.cx}
              cy={u.cy}
              r={u.r - 0.3}
              fill="none"
              data-mc-ink={u.fill >= 1 ? undefined : "muted"}
              data-mc-w={u.fill >= 1 ? undefined : "hair"}
              stroke={u.fill >= 1 ? "none" : undefined}
            />
          ) : (
            <rect
              key={`r${u.index}`}
              x={u.cx - u.r + 0.3}
              y={u.cy - u.r + 0.3}
              width={(u.r - 0.3) * 2}
              height={(u.r - 0.3) * 2}
              fill="none"
              data-mc-ink={u.fill >= 1 ? undefined : "muted"}
              data-mc-w={u.fill >= 1 ? undefined : "hair"}
              stroke={u.fill >= 1 ? "none" : undefined}
            />
          );
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
              x={u.cx - u.r}
              y={u.cy - u.r}
              width={u.r * 2}
              height={u.r * 2}
              shapeRendering="crispEdges"
              data-mc-ink={fillRole}
              style={fillStyle}
            />
          );
        }
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
