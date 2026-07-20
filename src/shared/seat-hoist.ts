// Hoists an inline-seated chart's seat from its `<svg>` up to the interactive
// wrapper. Consumed by client entries (which carry 'use client'), same
// convention as shared/motion.ts.
//
// WHY: `.mc-inline .mc-root` seats a mark by `translate`ing the SVG. That is a
// purely visual move — the wrapper's layout box stays put. Everything the
// wrapper owns is then anchored to a box the mark no longer occupies:
//
//   - the `.mc-spark-readout` chip (`position: absolute; bottom: 100%`) floats a
//     full seat away from the mark it annotates (measured: 28 px on
//     CohortTriangle, 40 px on ActivityGrid — the chip landed ON the chart);
//   - the wrapper is also the hit target, so a whole-chart click area sits off
//     the glyph a reader is aiming at.
//
// Moving the same translate onto the WRAPPER seats the whole box at once, so the
// SVG, the chip and the hit box travel together.
//
// The custom properties are copied, not the resolved pixels: `translate: 100%`
// resolves against the element's own height, and the wrapper's height IS the
// SVG's height, so the fraction means the same thing on either element — and the
// font-relative `cap` term stays live instead of freezing at mount-time metrics.
// `styles.css` cancels the SVG's own translate once `data-mc-seated` is set.
import { useEffect, type RefObject } from "react";

const SEAT = "--mc-seat";
const MID = "--mc-seat-mid";

/** Copy the chart's seat onto `host` (the interactive wrapper). */
function hoist(host: HTMLElement | null | undefined): void {
  // Only inline-seated charts translate at all — skip the DOM work otherwise.
  if (!host?.closest(".mc-inline")) return;
  const svg = host.querySelector("svg");
  const seat = svg?.style.getPropertyValue(SEAT);
  if (!seat) return; // a chart that emits no seat has nothing to hoist
  host.style.setProperty(SEAT, seat);
  host.style.setProperty(MID, svg!.style.getPropertyValue(MID) || "0");
  host.dataset.mcSeated = "";
}

// No cleanup in either hook: the host is torn down in the same unmount, so
// restoring properties on a dying element would be pure bytes.

/**
 * Hoist from a ref to a CHILD of the wrapper — used by `LiveRegion`, which every
 * announcing entry already renders, so those charts need no per-chart wiring.
 */
export function useSeatHoistFromChild(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => hoist(ref.current?.parentElement), [ref]);
}

/**
 * Hoist from a ref to the wrapper itself — for the entries that ship no
 * `LiveRegion` (whole-chart pickers and the scalar glyphs).
 */
export function useSeatHoist(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => hoist(ref.current), [ref]);
}
