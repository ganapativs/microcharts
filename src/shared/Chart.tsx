// Root <svg> wrapper for every chart (plan/03 §3, plan/08). Hook-free and
// listener-free → RSC-safe, SSR-static, zero client JS. Owns sizing, the
// role=img + <title>/<desc> + aria-labelledby composition, and token plumbing.
import type { CSSProperties, ReactNode } from "react";
import { labelIds, nextId } from "./a11y.js";

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
  /** Explicit id root (overrides the auto counter — for stable client ids). */
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  /** SVG content: paths, marks, annotation children. */
  children?: ReactNode;
}

export function Chart(props: ChartProps): ReactNode {
  const { width, height, title, summary, id, className, style, children } = props;

  const decorative = summary === false;
  const hasTitle = !decorative && typeof title === "string" && title.length > 0;
  const hasDesc = !decorative && typeof summary === "string" && summary.length > 0;
  const base = id ?? nextId();
  const { labelledBy, titleId, descId } = labelIds(base, hasTitle, hasDesc);

  return (
    <svg
      className={className ? `mc-root ${className}` : "mc-root"}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      preserveAspectRatio="xMidYMid meet"
      style={style}
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-labelledby": labelledBy })}
    >
      {hasTitle ? <title id={titleId}>{title}</title> : null}
      {hasDesc ? <desc id={descId}>{summary}</desc> : null}
      {children}
    </svg>
  );
}
