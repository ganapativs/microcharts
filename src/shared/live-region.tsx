// One polite SR-only live region for interactive announcements + inline seat hoist
// (see seat-hoist.ts). Always render; mute with empty children for decorative charts —
// unmounting drops the hoist and detaches inline readouts ~28–40px
// (live-region-seat.browser.test.tsx). Pattern:
//   <LiveRegion>{live && props.summary !== false ? announced : ""}</LiveRegion>
//
// Nested under role="img" on purpose: live regions are not pruned in Chromium/WebKit/Gecko AX
// (2026-07-21). If VoiceOver ever misses updates, hoist to a sibling and repoint useSeatHoistFromChild.
//
// No 'use client' here — consumed from client entries (same as shared/motion.ts).
import { useRef, type CSSProperties, type ReactNode } from "react";
import { useSeatHoistFromChild } from "./seat-hoist.js";

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
  const ref = useRef<HTMLSpanElement>(null);
  useSeatHoistFromChild(ref);
  return (
    <span ref={ref} aria-live="polite" style={SR_ONLY}>
      {children}
    </span>
  );
}
