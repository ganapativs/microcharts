// <DicePips> — a small count/severity read instantly as a die face (S4).
// Canonical pip patterns 1–6 only; 0 is an empty face (zero, not
// missing). and > 6 shows a centered numeral rather than inventing a 7/8/9
// pattern — the face never pretends.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { labelFont, labelFitsY, textGutter } from "../../core/labels.js";
import { EN_DICE, type DiceStrings } from "../../core/strings-dice.js";
import { DEFAULT_SIZE, dicePipsGeometry } from "./geometry.js";
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

const NUMERAL_FACTOR = 0.6; // the fallback numeral is the loudest mark on the face
// `labelFont`'s own 7-unit floor, read from the helper rather than restated, so
// the numeral's shrink range can never drift from the library's minimum.
const NUMERAL_FLOOR = labelFont(0);

/**
 * Largest size the fallback numeral can be set at and still land inside the
 * face — 0 when it cannot. `labelFitsY` only clears the numeral VERTICALLY, so
 * a three-digit fallback (`value={120}`) was painted straight through the die
 * and out into the page: at the default 16-unit box the reserved run is 18.6
 * units against a 15-unit face, and `.mc-root` is `overflow: visible`, so it
 * spilled rather than clipped. Shrink toward the floor first; below it the
 * numeral drops and the summary carries the count, the same degradation
 * TallyMarks makes with its `+N`.
 */
function numeralFont(chars: number, size: number, room: number): number {
  for (let f = labelFont(size, NUMERAL_FACTOR); f >= NUMERAL_FLOOR; f--) {
    if (textGutter(chars, f, 0) <= room && labelFitsY(size / 2, f, size)) return f;
  }
  return 0;
}

export function dicePipsSummary(value: number, strings: DiceStrings = EN_DICE): string {
  const v = Number.isFinite(value) ? Math.round(value) : NaN;
  if (Number.isNaN(v) || v < 0) return strings.noData;
  return v > 6 ? strings.dicePipsOver(String(v)) : strings.dicePips(String(v));
}

export function DicePips(props: DicePipsProps): ReactNode {
  const {
    value,
    face = true,
    size = DEFAULT_SIZE,
    strings = EN_DICE,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const geo = dicePipsGeometry({ value, size });
  // Everything below reads the RESOLVED box, never the prop (see resolveSize).
  const box = geo.size;
  const fitted = geo.numeral === null ? 0 : numeralFont(geo.numeral.length, box, geo.face.width);
  const showNumeral = fitted > 0;
  const fontSize = showNumeral ? fitted : labelFont(box, NUMERAL_FACTOR);
  const accName = resolveSummary(summary, () => dicePipsSummary(value, strings));

  return (
    <Chart
      width={box}
      height={box}
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
          style={{ strokeWidth: "var(--mc-sw)" }}
        />
      ) : null}
      {geo.pips.map((p) => (
        <circle key={`${p.cx},${p.cy}`} cx={p.cx} cy={p.cy} r={p.r} data-mc-ink="point" />
      ))}
      {showNumeral ? (
        <text
          x={box / 2}
          y={box / 2}
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
