"use client";
// @microcharts/react/fluid — measure a container, pass its width to a chart.
//
//   const { ref, width } = useFluidWidth(240);
//   <div ref={ref}>
//     <Sparkline data={data} width={width} />
//   </div>
//
// Static charts are hook-free, listener-free and observer-free by architecture:
// they render on the server, where there is nothing to measure. A consumer that
// wants a chart to reflow therefore measures the box itself, and every hand-
// written version of this hook has to decide the same three things — what to
// paint before the first measurement, what to do when the box measures 0, and
// what to do where `ResizeObserver` does not exist. This entry answers them
// once. Nothing in the library imports it; you pay for it only when you do.
import { useEffect, useRef, useState, type RefObject } from "react";

/** What {@link useFluidWidth} returns. */
export interface FluidWidth<T extends Element> {
  /** Attach to the element you want measured — usually the chart's container. */
  ref: RefObject<T | null>;
  /** Integer CSS pixels: `initial` until a non-zero measurement lands. */
  width: number;
}

/**
 * Track a container's width and feed it to a chart's `width` prop.
 *
 * `initial` is the width you render on the server, on the first client paint,
 * and in any environment without `ResizeObserver`. It defaults to 80 — the
 * width most charts fall back to when you pass no `width` at all — so the hook
 * starts where the chart already starts. Pass your own number to reserve the
 * layout you expect and skip the reflow when the measurement arrives.
 *
 * A measured 0 never reaches `width`. A collapsed disclosure, an inactive tab
 * and a `display: none` ancestor all measure 0, and a chart 0 units wide draws
 * nothing, so the last real width holds until the box comes back.
 *
 * Widths round to whole pixels, matching the integer viewBox coordinates the
 * charts render in, and commit once per animation frame.
 *
 * Attach `ref` to one element and keep it for the life of the component: the
 * observer binds on mount, so swapping the node out leaves it on the old one.
 */
export function useFluidWidth<T extends Element = HTMLDivElement>(initial = 80): FluidWidth<T> {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(initial);

  useEffect(() => {
    const el = ref.current;
    // Nothing attached, or a runtime with no ResizeObserver (older WebKit, a
    // non-DOM renderer, a bare test environment). Keep `initial` and stay quiet
    // rather than throwing on a constructor that isn't there.
    if (!el || typeof ResizeObserver === "undefined") return;

    let frame = 0;
    let next = 0;
    const commit = (): void => {
      frame = 0;
      // React bails out when the value is unchanged, so a resize that rounds to
      // the same pixel costs no render.
      setWidth(next);
    };

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      // `contentRect` is the content box — the space the chart actually gets.
      const measured = Math.round(entry.contentRect.width);
      if (measured <= 0 || measured === next) return;
      next = measured;
      // One commit per frame. Dragging a window edge fires the observer inside
      // every frame's layout pass; setting state there re-enters that pass and
      // is what "ResizeObserver loop completed with undelivered notifications"
      // reports. rAF hands the write to the next frame instead.
      if (!frame) frame = requestAnimationFrame(commit);
    });

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return { ref, width };
}
