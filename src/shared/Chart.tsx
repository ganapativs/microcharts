// Root <svg> wrapper for every chart (plan/03 §3, plan/08). Hook-free and
// listener-free → RSC-safe, SSR-static, zero client JS. Owns sizing and the
// accessible naming (deterministic by default; <title>/<desc>+aria-labelledby
// when an explicit stable `id` is supplied — see shared/a11y.ts).
import type { CSSProperties, ReactNode } from "react";
import { accessibleNaming } from "./a11y.js";

export interface ChartProps {
  /** viewBox width/height in integer units (plan/03 §3). */
  width: number;
  height: number;
  /** Short accessible name. */
  title?: string | undefined;
  /**
   * Accessible description — usually `describeSeries(...)` (plan/08 §2).
   * `false` = decorative (T0): the chart is hidden from assistive tech.
   */
  summary?: string | false | undefined;
  /** Stable id root — opts into <title>/<desc> + aria-labelledby naming. */
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  /** SVG content: paths, marks, annotation children. */
  children?: ReactNode;
}

export function Chart(props: ChartProps): ReactNode {
  const { width, height, title, summary, id, className, style, children } = props;
  const naming = accessibleNaming(title, summary, id);

  return (
    <svg
      className={className ? `mc-root ${className}` : "mc-root"}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      preserveAspectRatio="xMidYMid meet"
      style={style}
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
