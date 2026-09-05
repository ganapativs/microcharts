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
import { useRef, useState, type CSSProperties, type ReactNode } from "react";
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

/**
 * The announcement text for a chart whose value can change under it: empty until
 * the tracked `key` actually moves, then whatever `text` said at that moment.
 *
 * Nine charts each kept their own copy of this as a `useRef` + `useEffect` that
 * called `setAnnounced` synchronously — a second render per value change, and
 * the pattern React's own `set-state-in-effect` rule exists to steer off. The
 * state is DERIVED from the key, so it is derived during render instead: React
 * re-runs the component before committing, so the intermediate paint the effect
 * version briefly showed never happens.
 *
 * Mount stays silent (the key starts as its own initial value), because an
 * aria-live region's first content is read by some screen readers anyway and
 * the channel should stay quiet until the data actually moves. A change while
 * `live` is false is swallowed but still consumes the key, so re-enabling
 * `live` does not replay a stale announcement — and the previous text is kept
 * rather than cleared, which is what the effect version did.
 */
export function useAnnounceOnChange(key: unknown, text: string, live: boolean): string {
  const [seen, setSeen] = useState<{ key: unknown; text: string }>({ key, text: "" });
  if (!Object.is(seen.key, key)) setSeen({ key, text: live ? text : seen.text });
  return seen.text;
}
