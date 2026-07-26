// Root <svg> wrapper for every chart. Hook-free and
// listener-free → RSC-safe, SSR-static, zero client JS. Owns sizing and the
// accessible naming (deterministic by default; <title>/<desc>+aria-labelledby
// when an explicit stable `id` is supplied — see shared/a11y.ts).
import type { CSSProperties, ReactNode } from "react";
import { accessibleNaming } from "./a11y.js";

/** Inline (`.mc-inline`) baseline seat — viewBox coords from the top; plot box only, never data bbox (values would bob). */
interface Seat {
  /** `"floor"`: baseline anchor; `"center"`: cap-band centre for symmetric glyphs. */
  mode: "floor" | "center";
  /** Topmost edge of the plot box. Only read in `"center"` mode. */
  top?: number | undefined;
  /** Bottommost edge of the plot box. */
  bottom: number;
}

/**
 * Maps Seat → `--mc-seat` / `--mc-seat-mid`. `--mc-seat` is unitless so CSS can
 * multiply by the mark's own height (survives any scale). `--mc-seat-mid` selects
 * the cap-band center; the cap offset lives in CSS (fallback for no-`cap` UAs).
 */
function seatVars(seat: Seat | undefined, height: number): CSSProperties | undefined {
  if (!seat || !(height > 0)) return undefined;
  const anchor = seat.mode === "floor" ? seat.bottom : ((seat.top ?? 0) + seat.bottom) / 2;
  const frac = Math.round(((height - anchor) / height) * 1e4) / 1e4;
  return seat.mode === "floor"
    ? ({ "--mc-seat": frac } as CSSProperties)
    : ({ "--mc-seat": frac, "--mc-seat-mid": 1 } as CSSProperties);
}

export interface ChartProps {
  /** viewBox width/height in integer units. */
  width: number;
  height: number;
  /** Short accessible name. */
  title?: string | undefined;
  /**
   * Accessible description — usually `describeSeries(.)`.
   * `false` = decorative (T0): the chart is hidden from assistive tech.
   */
  summary?: string | false | undefined;
  /** Stable id root — opts into <title>/<desc> + aria-labelledby naming. */
  id?: string | undefined;
  /**
   * Where this mark sits on a line of text when rendered inline. Omitted =
   * the legacy baseline seat (viewBox bottom edge on the baseline).
   */
  seat?: Seat | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  /** SVG content: paths, marks, annotation children. */
  children?: ReactNode;
}

export function Chart(props: ChartProps): ReactNode {
  const { width, height, title, summary, id, seat, className, style, children } = props;
  const naming = accessibleNaming(title, summary, id);
  const seated = seatVars(seat, height);
  const rootStyle = seated ? (style ? { ...style, ...seated } : seated) : style;

  return (
    <svg
      className={className ? `mc-root ${className}` : "mc-root"}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      preserveAspectRatio="xMidYMid meet"
      style={rootStyle}
      {...naming.rootAttrs}
    >
      {naming.renderTitle ? <title id={naming.titleId}>{title}</title> : null}
      {naming.renderDesc && typeof summary === "string" ? (
        <desc id={naming.descId}>{summary}</desc>
      ) : null}
      {children}
    </svg>
  );
}
