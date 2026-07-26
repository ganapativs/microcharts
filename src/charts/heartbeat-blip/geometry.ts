// Is it alive, and how busy? A baseline with an ECG-style spike at each event's
// position across the recent window (x = how long ago). Zero events → an empty
// spike path and the flat baseline IS the down signal (shape, not color). The
// clock is passed in (`now`) — this file never calls Date.now (SSR must be
// deterministic; a mismatch is a hydration bug). All coords 2-dp.
import { round2 } from "../../core/types.js";
import { maxOf } from "../../core/scale.js";

/** Documented default window (ms) — also the fallback for an unusable one. */
export const DEFAULT_WINDOW = 60_000;

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

export function heartbeatGeometry(opts: {
  events: readonly number[];
  window: number;
  now: number;
  width: number;
  height: number;
  pad: number;
}): HeartbeatGeometry {
  const { events, now, width, height, pad } = opts;
  // The window is a DIVISOR for every spike's x, so a zero / non-finite one
  // emits `x="NaN"` and the spikes vanish silently. Fall back to the documented
  // default rather than drawing nothing.
  const win = Number.isFinite(opts.window) && opts.window > 0 ? opts.window : DEFAULT_WINDOW;
  const innerW = width - pad * 2;
  const baseY = round2(height * 0.62);
  const peakY = round2(pad + 1); // top of the spike
  const dipY = round2(Math.min(height - pad, baseY + height * 0.14));

  const start = now - win;
  // In-window, finite events; events after `now` clamped to now (clock skew).
  const inWindow = events
    .filter((t) => Number.isFinite(t) && t >= start && t <= now + win)
    .map((t) => Math.min(t, now));

  const xOf = (t: number): number => round2(pad + ((t - start) / win) * innerW);

  let spikesPath = "";
  for (const t of inWindow) {
    const x = xOf(t);
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
