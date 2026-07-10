// <HeatCell> — one calibrated color step (plan/22 #3, S4). The building block
// for host-owned grids: "how intense is this value against a known scale?"
// Static, hook-free, RSC-safe. Discrete steps only, and every cell in one host
// grid must share one `domain` — per-cell auto-scaling is the lie SparkGroup
// exists to kill, so a lone cell defaults to [0, 1] (documented loudly).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter } from "../../core/format.js";
import { EN_SCALAR, type ScalarStrings } from "../../core/strings-scalar.js";
import { valueStepOpacity, type CellShape } from "../../shared/cell.js";
import { heatCellGeometry } from "./geometry.js";

/** Factual S4 summary — value + calibrated level. Shared with the interactive
 *  entry (one wording, no drift; ActivityGrid announcement parity). */
export function heatCellSummary(
  value: number,
  step: number | null,
  steps: number,
  fmt: (n: number) => string,
  strings: ScalarStrings,
): string {
  if (step === null || !Number.isFinite(value)) return strings.noData;
  return strings.level(fmt(value), step + 1, steps);
}

export interface HeatCellProps {
  value: number;
  /** Discrete perceptual steps (shared scale with ActivityGrid/HeatStrip). */
  steps?: number | undefined;
  /** Shared cell vocabulary (plan/21 §3). */
  shape?: CellShape | undefined;
  /** Calibration scale. Defaults to [0, 1] — a lone cell has no data to
   *  auto-scale from; pass the host grid's real domain. */
  domain?: readonly [number, number] | undefined;
  /** `"value"` renders the number centered in the cell (wider table cells). */
  label?: "value" | "none" | undefined;
  color?: string | undefined;
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
  locale?: string | string[] | undefined;
  strings?: ScalarStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const SIZE = 12;

export function HeatCell(props: HeatCellProps): ReactNode {
  const {
    value,
    steps = 5,
    shape = "square",
    domain = [0, 1],
    label = "none",
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

  if (domain[1] - domain[0] === 0) {
    devWarn("<HeatCell> zero-width domain — rendering the single mid step.");
  }

  const geo = heatCellGeometry({ width: SIZE, height: SIZE, value, domain, steps, shape });
  const fmt = makeFormatter(format, locale);
  const accName =
    summary === false ? false : (summary ?? heatCellSummary(value, geo.step, steps, fmt, strings));

  const fontSize = 6;
  const text = geo.step !== null && label === "value" ? fmt(value) : undefined;
  const showLabel = text !== undefined && geo.labelFits(text.length, fontSize);

  return (
    <Chart
      width={SIZE}
      height={SIZE}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-heat-cell ${className}` : "mc-heat-cell"}
      style={style}
    >
      <rect
        x={geo.x}
        y={geo.y}
        width={geo.w}
        height={geo.h}
        rx={geo.rx}
        shapeRendering={geo.crisp ? "crispEdges" : undefined}
        // no-data uses "gap" (a measured-nothing-here slot), never "band" — a
        // real background band would be the invisible 8% fill this cell must
        // NOT collapse into (empty must read distinct from any real value)
        data-mc-ink={geo.step === null ? "gap" : "cell"}
        fillOpacity={geo.step === null ? undefined : valueStepOpacity(geo.step, steps)}
        style={geo.step === null || !color ? undefined : { fill: color }}
      />
      {showLabel ? (
        <text
          x={SIZE / 2}
          y={SIZE / 2}
          fontSize={fontSize}
          dominantBaseline="central"
          textAnchor="middle"
        >
          {text}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
