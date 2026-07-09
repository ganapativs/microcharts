// <HeartbeatBlip> — is it alive, and how busy? (plan/24 #20, structured events,
// motion type, flagship). A baseline with an ECG-style spike at each event across
// the recent window; the STATIC frame shows the spike positions with zero JS, and
// an empty baseline IS the down signal (shape, never color). The interactive entry
// sweeps the trace left in real time and blips each arriving event. Every spike is
// ONE real event — never a synthesized heartbeat on a timer. `now` is passed in so
// SSR is deterministic (never Date.now here). Static, hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { EN_HEARTBEAT, type HeartbeatStrings } from "../../core/strings-heartbeat.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import { heartbeatGeometry } from "./geometry.js";

export interface HeartbeatBlipProps {
  /** Event timestamps (ms). */
  data: readonly number[];
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

function resolveNow(data: readonly number[], now?: number): number {
  if (typeof now === "number" && Number.isFinite(now)) return now;
  let max = 0;
  let seen = false;
  for (const t of data)
    if (Number.isFinite(t) && (!seen || t > max)) {
      max = t;
      seen = true;
    }
  return seen ? max : 0;
}

export function heartbeatSummary(
  data: readonly number[],
  opts: {
    window?: number | undefined;
    now?: number | undefined;
    strings?: HeartbeatStrings | undefined;
    format?: Format | undefined;
    locale?: string | string[] | undefined;
  } = {},
): string {
  const { window: win = 60_000, strings = EN_HEARTBEAT } = opts;
  const now = resolveNow(data, opts.now);
  const geo = heartbeatGeometry({
    events: data,
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
    data,
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
  const fontSize = props.fontSize ?? labelFont(height);

  const resolvedNow = resolveNow(data, now);
  const labelBand = label === "count" ? fontSize * 2 : 0;
  const geo = heartbeatGeometry({
    events: data,
    window: win,
    now: resolvedNow,
    width: width - labelBand,
    height,
    pad: PAD,
  });
  const accName =
    summary === false
      ? false
      : (summary ?? heartbeatSummary(data, { window: win, now, strings, format, locale }));
  const spikeColor = color ?? "var(--mc-accent)";
  const fmt = makeFormatter(format, locale);

  return (
    <Chart
      width={width}
      height={geo.height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-heartbeat ${className}` : "mc-heartbeat"}
      style={{ "--mc-label-size": `${fontSize}px`, ...style } as CSSProperties}
    >
      {/* baseline — hairline context */}
      <line
        x1={geo.baseline.x1}
        y1={geo.baseline.y}
        x2={geo.baseline.x2}
        y2={geo.baseline.y}
        data-mc-ink="muted"
        style={{ strokeWidth: 0.5, strokeOpacity: 0.55 }}
      />
      {/* spikes — one clean glyph per real event, rounded like a monitor trace */}
      {geo.spikesPath ? (
        <path
          className="mc-heartbeat-spikes"
          d={geo.spikesPath}
          style={{
            fill: "none",
            stroke: spikeColor,
            strokeWidth: 1.4,
            strokeLinejoin: "round",
            strokeLinecap: "round",
          }}
        />
      ) : (
        <text
          x={geo.width / 2}
          y={height / 2}
          fontSize={fontSize}
          textAnchor="middle"
          dominantBaseline="central"
          data-mc-ink="label"
          style={{ fillOpacity: 0.7 }}
        >
          no events
        </text>
      )}
      {/* now endpoint — the live accent cursor */}
      <circle
        className="mc-heartbeat-now"
        cx={geo.nowDot.cx}
        cy={geo.nowDot.cy}
        r={geo.nowDot.r + 0.6}
        data-mc-ink="accent"
      />
      {label === "count" ? (
        <text
          x={width - PAD}
          y={geo.baseline.y + fontSize * 0.34}
          fontSize={fontSize}
          textAnchor="end"
          data-mc-ink="label"
        >
          {fmt(geo.count)}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
