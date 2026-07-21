// Root <svg> wrapper for every chart. Hook-free and
// listener-free → RSC-safe, SSR-static, zero client JS. Owns sizing and the
// accessible naming (deterministic by default; <title>/<desc>+aria-labelledby
// when an explicit stable `id` is supplied — see shared/a11y.ts).
import type { CSSProperties, ReactNode } from "react";
import { accessibleNaming } from "./a11y.js";

/**
 * How this chart's mark should sit on a line of text when it's rendered inline
 * (`.mc-inline`). CSS cannot derive this: the seat depends on the chart's own
 * padding, which only the geometry knows, and which is sometimes a fraction of
 * the height (a centred bar) and sometimes an absolute inset (a dot radius).
 * So the chart emits it and one rule in `styles.css` consumes it.
 *
 * Coordinates are viewBox units measured from the TOP, same as everything else.
 * Give the plot box — the deterministic frame — never the data bounding box: a
 * seat derived from the data makes the mark jump vertically when values change.
 */
interface Seat {
  /**
   * `"floor"` — the mark has a meaningful bottom (bars, areas, lines, columns).
   * Its floor sits ON the text baseline, exactly where letters sit.
   *
   * `"center"` — the mark is vertically symmetric with no floor (arrows, dots,
   * dials, rings, progress strips). Its box is centred on the cap band, so it
   * reads like an icon set in running prose.
   */
  mode: "floor" | "center";
  /** Topmost edge of the plot box. Only read in `"center"` mode. */
  top?: number | undefined;
  /** Bottommost edge of the plot box. */
  bottom: number;
}

/**
 * Turns a Seat into the two custom properties `styles.css` reads.
 *
 * `--mc-seat` is the anchor's height above the viewBox bottom, as a fraction of
 * the height. It stays unitless so the CSS can multiply it by `100%`, which
 * resolves against the mark's OWN rendered height — the seat then survives any
 * scaling (authored px, CSS override, fluid width) without the chart knowing
 * what size it ended up.
 *
 * `--mc-seat-mid` is a 0/1 flag; the cap-band offset lives in CSS so the `cap`
 * unit can carry a fallback for browsers that lack it.
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
