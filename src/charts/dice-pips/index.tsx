// <DicePips> — a small count/severity read instantly as a die face (S4).
// Canonical pip patterns 1–6 only; 0 is an empty face (zero, not
// missing), and > 6 shows a centered numeral rather than inventing a 7/8/9
// pattern — the face never pretends. Static, hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { labelFont, labelFitsY } from "../../core/labels.js";
import { EN_DICE, type DiceStrings } from "../../core/strings-dice.js";
import { dicePipsGeometry } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

export interface DicePipsProps {
  /** Integer 0–6 (rounded). Above 6 renders a centered numeral. */
  value: number;
  /** Draw the die outline (default true); false = pips only, dense cells. */
  face?: boolean | undefined;
  size?: number | undefined;
  strings?: DiceStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const PAD_DIVISOR = 0.28; // pip inset from the face edge

export function dicePipsSummary(value: number, strings: DiceStrings = EN_DICE): string {
  const v = Number.isFinite(value) ? Math.round(value) : NaN;
  if (Number.isNaN(v) || v < 0) return strings.noData;
  return v > 6 ? strings.dicePipsOver(String(v)) : strings.dicePips(String(v));
}

export function DicePips(props: DicePipsProps): ReactNode {
  const {
    value,
    face = true,
    size = 16,
    strings = EN_DICE,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const geo = dicePipsGeometry({ value, size, pad: size * PAD_DIVISOR });
  const fontSize = labelFont(size, 0.6);
  const showNumeral = geo.numeral !== null && labelFitsY(size / 2, fontSize, size);
  const accName = resolveSummary(summary, () => dicePipsSummary(value, strings));

  return (
    <Chart
      width={size}
      height={size}
      title={title}
      summary={accName}
      id={id}
      // The die face is a symmetric token, not a bar standing on a floor, so it
      // centres on the cap band. Seat the face frame even when `face={false}`:
      // the pip grid is laid out inside it, so the seat survives the switch.
      seat={{ mode: "center", top: geo.face.y, bottom: geo.face.y + geo.face.height }}
      className={className ? `mc-dice ${className}` : "mc-dice"}
      style={{ ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties}
    >
      {face ? (
        <rect
          x={geo.face.x}
          y={geo.face.y}
          width={geo.face.width}
          height={geo.face.height}
          rx={geo.face.rx}
          data-mc-ink="muted"
          style={{ strokeWidth: "var(--mc-stroke-width)" }}
        />
      ) : null}
      {geo.pips.map((p) => (
        <circle key={`${p.cx},${p.cy}`} cx={p.cx} cy={p.cy} r={p.r} data-mc-ink="point" />
      ))}
      {showNumeral ? (
        <text
          x={size / 2}
          y={size / 2}
          fontSize={fontSize}
          dominantBaseline="central"
          textAnchor="middle"
          data-mc-ink="point"
        >
          {geo.numeral}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
