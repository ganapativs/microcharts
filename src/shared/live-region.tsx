// The one visually-hidden polite live region. Every interactive entry announces
// its focused/updated value through this — screen readers hear the change, sighted
// readers never see it. Centralising the SR-only technique keeps it correct in one
// place (and trims a few bytes off each interactive bundle).
//
// It also carries the inline seat hoist (see shared/seat-hoist.ts): this is the
// one element every ANNOUNCING interactive wrapper already renders, so hosting it
// here fixes those charts without threading a ref through each of them. The
// handful of entries that ship no LiveRegion call `useSeatHoist` themselves.
//
// BECAUSE of that coupling, a client entry must render this element
// UNCONDITIONALLY and mute its CHILDREN instead:
//
//     <LiveRegion>{live && props.summary !== false ? announced : ""}</LiveRegion>
//
// Unmounting it to silence a decorative chart (`summary={false}`, `live={false}`)
// also removes the seat hoist, so an inline chart loses its baseline seat, and
// its readout chip and hit box detach from the mark by a full seat (28–40 px,
// measured — see seat-hoist.ts). Empty children announce nothing, so muting is
// all the silence a decorative chart needs. Guarded by
// src/test/live-region-seat.browser.test.tsx.
//
// Nesting under role="img" is INTENTIONAL and verified. The interactive wrapper
// carries role="img" + aria-label (see shared/interactive.ts `named`), and this
// region renders as its child. ARIA lists role="img" as "Children Presentational:
// True", which raises the fear that assistive tech prunes the subtree and drops
// these polite announcements. Empirically it does not: browsers carve live regions
// (and focusable descendants) out of that pruning. Measured 2026-07-21 via
// Playwright across all three engines — Chromium's platform accessibility tree
// (CDP Accessibility.getFullAXTree, the tree NVDA/JAWS/Narrator consume on
// Windows) keeps this node NON-ignored with live="polite" AND updates its text
// through mutations; WebKit (VoiceOver's engine) and Gecko keep it un-flattened
// too. So the announce path survives inside role="img"; no sibling restructure is
// needed. Caveat: native VoiceOver-on-macOS was not driven directly — the browser
// AX layer is authoritative for Chromium, strong-but-not-native for WebKit — so if
// you ever see missing announcements specifically under VoiceOver, revisit by
// hoisting this region to a SIBLING outside the role="img" element (keeping
// useSeatHoistFromChild pointed at the new common ancestor).
//
// No 'use client' of its own: it's a purely presentational component consumed by
// the client entries, which carry the directive — the same convention as the other
// shared client-consumed modules (e.g. shared/motion.ts).
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
