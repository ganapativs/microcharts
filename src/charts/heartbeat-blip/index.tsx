// <HeartbeatBlip> — is it alive, and how busy? (structured events, motion
// type, flagship). A baseline with an ECG-style spike at each event across
// the recent window; the STATIC frame shows the spike positions with zero JS, and
// an empty baseline IS the down signal (shape, never color). The interactive entry
// sweeps the trace left in real time and blips each arriving event. Every spike is
// ONE real event — never a synthesized heartbeat on a timer. `now` is passed in so
// SSR is deterministic (never Date.now here).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { EN_HEARTBEAT, type HeartbeatStrings } from "../../core/strings-heartbeat.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { labelFitsBand, labelFont, textGutter } from "../../core/labels.js";
import { DEFAULT_WINDOW, heartbeatCount, heartbeatGeometry } from "./geometry.js";

export interface HeartbeatBlipProps {
  /** Event timestamps (ms). Not a value series. */
  events: readonly number[];
  /** The visible recent window (ms). Default 60000. */
  window?: number | undefined;
  /** Explicit clock (ms) — defaults to the latest event. Pass from the data layer. */
  now?: number | undefined;
  /** Event-count numeral at the right (`count`), or none (default). */
  label?: "count" | "none" | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  fontSize?: number | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: HeartbeatStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const PAD = 1;

function resolveNow(events: readonly number[], now?: number): number {
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

export function heartbeatSummary(
  events: readonly number[],
  opts: {
    window?: number | undefined;
    now?: number | undefined;
    strings?: HeartbeatStrings | undefined;
    format?: Format | undefined;
    locale?: string | string[] | undefined;
  } = {},
): string {
  const { strings = EN_HEARTBEAT } = opts;
  // Same fallback the geometry applies, so the spoken window can never disagree
  // with the drawn one — and "in the last NaN minutes" never reaches a reader.
  const win =
    Number.isFinite(opts.window) && (opts.window as number) > 0
      ? (opts.window as number)
      : DEFAULT_WINDOW;
  const now = resolveNow(events, opts.now);
  const geo = heartbeatGeometry({
    events,
    window: win,
    now,
    width: 60,
    height: 16,
    pad: PAD,
  });
  const windowLabel = strings.heartbeatWindow(win);
  if (geo.count === 0) return strings.heartbeatFlat(windowLabel);
  return strings.heartbeat(geo.count, windowLabel, strings.heartbeatAgo(geo.lastAgoMs ?? 0));
}

export function HeartbeatBlip(props: HeartbeatBlipProps): ReactNode {
  const {
    events,
    window: win = 60_000,
    now,
    label = "none",
    width = 60,
    height = 16,
    color,
    format,
    locale,
    strings = EN_HEARTBEAT,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;
  // A host-computed size (`Number(field.value)` on an empty input → NaN) used to
  // reach the reserved band, and from there every coordinate in the chart.
  const fs = props.fontSize;
  const fontSize = fs !== undefined && Number.isFinite(fs) && fs > 0 ? fs : labelFont(height);

  const resolvedNow = resolveNow(events, now);
  // The tally is a pure time filter — width-independent — so the numeral is
  // known before the gutter it needs is reserved, with no throwaway geometry.
  const countText =
    label === "count"
      ? makeFormatter(format, locale)(heartbeatCount(events, win, resolvedNow))
      : "";
  // Text that no longer fits is dropped, never painted outside the box. The
  // numeral is anchored at the right edge, so an over-long count runs off the
  // LEFT of the viewBox — `width` is the budget, not the reserved band.
  const showCount =
    countText !== "" &&
    labelFitsBand(height, fontSize) &&
    textGutter(countText.length, fontSize, PAD) <= width;
  // `fontSize * 2` was a two-digit guess held as the floor (it keeps the roomy
  // gap between the now-dot and the numeral); a four-digit count asks for more.
  // The 45% budget is the real fix: the old band could exceed `width` outright,
  // which inverted the plot and painted every mark left of the viewBox.
  const labelBand = showCount
    ? Math.min(
        Math.max(fontSize * 2, textGutter(countText.length, fontSize, 1)),
        Math.max(0, Math.floor(width * 0.45)),
      )
    : 0;
  const geo = heartbeatGeometry({
    events,
    window: win,
    now: resolvedNow,
    width: width - labelBand,
    height,
    pad: PAD,
  });
  const accName =
    summary === false
      ? false
      : (summary ?? heartbeatSummary(events, { window: win, now, strings, format, locale }));
  // The empty-state word is translatable, so it can outgrow the plot it centres in.
  const showEmpty =
    geo.spikesPath === "" &&
    labelFitsBand(height, fontSize) &&
    textGutter(strings.heartbeatEmpty.length, fontSize, 0) <= geo.width;

  return (
    <Chart
      width={width}
      height={geo.height}
      title={title}
      summary={accName}
      id={id}
      // A monitor trace has no floor — it excursions either side of a resting
      // line — so the band peak-to-dip centres on the cap band. That band is set
      // by `height` alone, so a flat window seats identically to a busy one, and
      // the baseline lands low in the cap band the way a real trace reads.
      seat={{ mode: "center", top: geo.y0, bottom: geo.y1 }}
      className={className ? `mc-heartbeat ${className}` : "mc-heartbeat"}
      style={{ ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties}
    >
      <line
        x1={geo.baseline.x1}
        y1={geo.baseline.y}
        x2={geo.baseline.x2}
        y2={geo.baseline.y}
        data-mc-ink="muted"
        data-mc-w="hair"
        strokeOpacity={0.55}
      />
      {/* The trace is the whole reading, so its paint comes from the accent ink
          ROLE — an inline `stroke: var(--mc-accent)` is preserved verbatim by
          `.mc-root { forced-color-adjust: none }`, i.e. a brand hex on the user's
          own High Contrast background. `color` still overrides inline. */}
      {geo.spikesPath ? (
        <path
          className="mc-heartbeat-spikes"
          d={geo.spikesPath}
          data-mc-ink="accent"
          data-mc-w="full"
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
          style={color ? { stroke: color } : undefined}
        />
      ) : showEmpty ? (
        <text
          x={geo.width / 2}
          y={height / 2}
          fontSize={fontSize}
          textAnchor="middle"
          dominantBaseline="central"
          data-mc-ink="label"
          fillOpacity={0.7}
        >
          {strings.heartbeatEmpty}
        </text>
      ) : null}
      <circle
        className="mc-heartbeat-now"
        cx={geo.nowDot.cx}
        cy={geo.nowDot.cy}
        r={geo.nowDot.r + 0.6}
        data-mc-ink="accent"
      />
      {showCount ? (
        <text
          x={width - PAD}
          // Clamped so the descender stays inside a short box — the label is
          // seated, not dropped, for the sake of 0.1 units.
          y={Math.min(geo.baseline.y + fontSize * 0.34, height - fontSize * 0.22)}
          fontSize={fontSize}
          textAnchor="end"
          data-mc-ink="label"
        >
          {countText}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
