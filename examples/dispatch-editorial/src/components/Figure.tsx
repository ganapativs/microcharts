import type { ReactNode } from "react";
import { useReveal } from "./useReveal";

/**
 * A block figure with a rule-topped caption. Reveals once on scroll-in.
 * `wide` breaks the reading measure for the large charts.
 */
export function Figure({
  children,
  caption,
  wide = false,
}: {
  children: ReactNode;
  caption: ReactNode;
  wide?: boolean;
}) {
  const ref = useReveal<HTMLElement>();
  return (
    <figure ref={ref} className={wide ? "figure figure--wide" : "figure"}>
      <div className="figure__plate">{children}</div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
