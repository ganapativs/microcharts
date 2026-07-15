// The one visually-hidden polite live region. Every interactive entry announces
// its focused/updated value through this — screen readers hear the change, sighted
// readers never see it. Centralising the SR-only technique keeps it correct in one
// place (and trims a few bytes off each interactive bundle).
//
// No 'use client' of its own: it's a purely presentational component consumed by
// the client entries, which carry the directive — the same convention as the other
// shared client-consumed modules (e.g. shared/motion.ts).
import type { CSSProperties, ReactNode } from "react";

// clip:rect keeps it in the a11y tree (unlike display:none) while collapsing it to
// a 1×1 px sink; whiteSpace:nowrap stops it forcing layout at the bottom of a line.
const SR_ONLY: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
};

/** Visually-hidden `aria-live="polite"` region for interactive announcements. */
export function LiveRegion({ children }: { children?: ReactNode }): React.ReactNode {
  return (
    <span aria-live="polite" style={SR_ONLY}>
      {children}
    </span>
  );
}
