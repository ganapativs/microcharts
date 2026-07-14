import type { ReactNode } from "react";

/**
 * Calm route transition for docs pages. A `template` remounts on every
 * navigation (unlike `layout`), so the `.route-fade` animation re-runs each
 * route change — reusing the same fade + lift as the (home) group. RSC-safe,
 * zero client JS; reduced-motion is handled by the `.route-fade` CSS.
 */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="route-fade">{children}</div>;
}
