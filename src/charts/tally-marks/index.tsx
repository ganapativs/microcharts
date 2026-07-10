// <TallyMarks> — how many, counted the way a human counts (plan/24 #1, S4).
// Four-and-strike clusters of five, then the remainder; the count reads back
// exactly up to `total`, after which a `+N` numeral tells the truth (marks are
// never resized to fit — width grows, honesty holds). Static, hook-free,
// RSC-safe. `pen="drawn"` perturbs stroke rendering only; the count is unchanged.
//
// NOTE (plan/12 audit): the spec named this variant `style`, but every chart
// exposes `style?: CSSProperties`; the knob is `pen` here to keep that passthrough.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { EN_TALLY, type TallyStrings } from "../../core/strings-tally.js";
import { tallyGeometry, type TallyOverflow, type TallyPen } from "./geometry.js";

export interface TallyMarksProps {
  /** The count. Floored to an integer; negatives clamp to 0 (documented). */
  value: number;
  /** Marks drawn before the numeral/clamp overflow. Default 25 (plan/04 §8 —
   *  discrete-count denominator, renamed from `max`). */
  total?: number | undefined;
  /** `numeral` appends `+N`; `clamp` stops drawing (summary keeps the truth). */
  overflow?: TallyOverflow | undefined;
  /** `ruled` (default) or hand-`drawn` (seeded jitter, editorial voice). */
  pen?: TallyPen | undefined;
  height?: number | undefined;
  strings?: TallyStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const FONT = 9; // overflow numeral, viewBox units
const PAD = 2;

export function tallySummary(value: number, strings: TallyStrings = EN_TALLY): string {
  // count is an integer — String() keeps the accessible name SSR-deterministic
  // (a locale-formatter would risk a server/client hydration mismatch).
  const count = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
  return strings.tally(String(count));
}

export function TallyMarks(props: TallyMarksProps): ReactNode {
  const {
    value,
    total = 25,
    overflow = "numeral",
    pen = "ruled",
    height = 16,
    strings = EN_TALLY,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const geo = tallyGeometry({ value, total, height, pad: PAD, pen, overflow, fontSize: FONT });
  const accName = summary === false ? false : (summary ?? tallySummary(value, strings));

  return (
    <Chart
      width={geo.width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-tally ${className}` : "mc-tally"}
      style={{ "--mc-label-size": `${FONT}px`, ...style } as CSSProperties}
    >
      {geo.d ? <path d={geo.d} data-mc-ink="data" /> : null}
      {geo.numeralX !== null ? (
        <text
          x={geo.numeralX}
          y={height / 2}
          fontSize={FONT}
          dominantBaseline="central"
          textAnchor="start"
          data-mc-ink="label"
        >
          {`+${geo.overflow}`}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
