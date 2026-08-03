// Is it alive, and how busy? A baseline with an ECG-style spike at each event's
// position across the recent window (x = how long ago). Zero events → an empty
// spike path and the flat baseline IS the down signal (shape, not color). The
// clock is passed in (`now`) — this file never calls Date.now (SSR must be
// deterministic; a mismatch is a hydration bug). All coords 2-dp.
import { round2 } from "../../core/types.js";
import { maxOf } from "../../core/scale.js";

/** Documented default window (ms) — also the fallback for an unusable one. */
export const DEFAULT_WINDOW = 60_000;

/**
 * The clock: the caller's `now` when it is finite, else the latest finite
 * event, else 0. Shared by the static frame, the summary, and the live sweep
 * so they can never disagree — and never Date.now (SSR determinism).
 */
export function resolveNow(events: readonly number[], now?: number): number {
  if (typeof now === "number" && Number.isFinite(now)) return now;
  let max = 0;
  let seen = false;
  for (const t of events)
    if (Number.isFinite(t) && (!seen || t > max)) {
      max = t;
      seen = true;
    }
  return seen ? max : 0;
}

export interface HeartbeatGeometry {
  baseline: { x1: number; x2: number; y: number };
  /** ECG spikes, one glyph per in-window event; "" when there are none (down). */
  spikesPath: string;
  nowDot: { cx: number; cy: number; r: number };
  count: number;
  /** ms since the most recent in-window event, or null when there are none. */
  lastAgoMs: number | null;
  width: number;
  height: number;
  /** Top edge of the trace band — the spike peak. Fixed by `height`/`pad`, so a
   *  quiet window and a busy one occupy the same frame. */
  y0: number;
  /** Bottom edge of the trace band — the post-spike dip, below the baseline. */
  y1: number;
}

// The window is a DIVISOR for every spike's x, so a zero / non-finite one emits
// `x="NaN"` and the spikes vanish silently. Fall back to the documented default
// rather than drawing nothing. `heartbeatSummary` applies the same rule, so the
// window a reader hears can never disagree with the one the trace is drawn on.
const resolveWindow = (w: number): number => (Number.isFinite(w) && w > 0 ? w : DEFAULT_WINDOW);

/** In-window, finite events; events after `now` clamped to now (clock skew). */
function inWindowEvents(events: readonly number[], win: number, now: number): number[] {
  const start = now - win;
  const out: number[] = [];
  for (const t of events)
    if (Number.isFinite(t) && t >= start && t <= now + win) out.push(Math.min(t, now));
  return out;
}

/**
 * In-window tally, without the path build. `label="count"` has to know the
 * numeral before it can reserve the gutter that numeral needs, and the
 * interactive entry recomputes the tally four times a second as the clock
 * advances — neither wants a throwaway spike path each time.
 */
export function heartbeatCount(events: readonly number[], window: number, now: number): number {
  return inWindowEvents(events, resolveWindow(window), now).length;
}

export function heartbeatGeometry(opts: {
  events: readonly number[];
  window: number;
  now: number;
  width: number;
  height: number;
  pad: number;
}): HeartbeatGeometry {
  const { events, now, width, height, pad } = opts;
  const win = resolveWindow(opts.window);
  // A reserved label gutter wider than the box used to make this negative, which
  // mirrored every spike out of the viewBox instead of collapsing the plot.
  const innerW = Math.max(0, width - pad * 2);
  const baseY = round2(height * 0.62);
  const peakY = round2(pad + 1); // top of the spike
  const dipY = round2(Math.min(height - pad, baseY + height * 0.14));

  const start = now - win;
  const inWindow = inWindowEvents(events, win, now);

  // The fraction is [0, 1] by construction — except that `t - start` overflows to
  // Infinity once `start` underflows (a window near 1e308 makes it -Infinity),
  // and that used to reach the emitted path as `x="Infinity"`.
  const xOf = (t: number): number =>
    round2(pad + Math.min(1, Math.max(0, (t - start) / win)) * innerW);

  let spikesPath = "";
  // Two events that round to the same x emit the same glyph over itself: same
  // pixels, more bytes. A busy minute (tens of thousands of timestamps on a
  // 60-unit strip) used to build a multi-megabyte `d`; `count` is taken from the
  // unfiltered set below, so the reading is untouched.
  const drawn = new Set<number>();
  for (const t of inWindow) {
    const x = xOf(t);
    if (drawn.has(x)) continue;
    drawn.add(x);
    // QRS-ish glyph ~3 units wide: baseline → up to peak → small dip → baseline.
    const xl = round2(Math.max(pad, x - 1.2));
    const xr = round2(Math.min(width - pad, x + 1.2));
    spikesPath += `M${xl} ${baseY}L${round2(x - 0.4)} ${baseY}L${x} ${peakY}L${round2(x + 0.5)} ${dipY}L${xr} ${baseY}`;
  }

  let lastAgoMs: number | null = null;
  if (inWindow.length) {
    const last = maxOf(inWindow);
    lastAgoMs = Math.max(0, Math.round(now - last));
  }

  return {
    baseline: { x1: round2(pad), x2: round2(width - pad), y: baseY },
    spikesPath,
    nowDot: { cx: round2(width - pad - 1.5), cy: baseY, r: 1 },
    count: inWindow.length,
    lastAgoMs,
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
    y0: peakY,
    y1: dipY,
  };
}
