// <EventTimeline> — what happened when, and for how long.
// Uptime windows, on-call shifts, release spans + incident points on one row.
// Diamonds mark instants, rects mark durations — the TYPE distinction is a
// shape, so it survives 12 px where color coding wouldn't. Static, hook-free,
// RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { EN_TIMELINE, type TimelineStrings } from "../../core/strings-timeline.js";
import { round2 } from "../../core/types.js";
import { eventTimelineGeometry } from "./geometry.js";

export type EventKind = "neutral" | "positive" | "negative" | "accent";

export interface EventTimelineDatum {
  start: number | Date;
  /** Present = span; absent = point event. */
  end?: number | Date | undefined;
  label?: string | undefined;
  kind?: EventKind | undefined;
}

interface NormalizedItem {
  start: number;
  end?: number | undefined;
  label?: string | undefined;
  kind: EventKind;
}

const ms = (v: number | Date): number => (v instanceof Date ? v.getTime() : v);

/** Normalizes to ms epoch; zero-duration spans demote to points (dev warn);
 *  reversed spans are a dev error and dropped. */
export function normalizeItems(data: readonly EventTimelineDatum[]): NormalizedItem[] {
  const out: NormalizedItem[] = [];
  for (const d of data) {
    const start = ms(d.start);
    if (!Number.isFinite(start)) {
      devWarn("<EventTimeline> item with invalid start dropped.");
      continue;
    }
    let end = d.end === undefined ? undefined : ms(d.end);
    if (end !== undefined && !Number.isFinite(end)) end = undefined;
    if (end !== undefined && end < start) {
      devWarn("<EventTimeline> reversed span (start > end) dropped.");
      continue;
    }
    if (end === start) {
      devWarn("<EventTimeline> zero-duration span rendered as a point event.");
      end = undefined;
    }
    out.push({ start, end, label: d.label, kind: d.kind ?? "neutral" });
  }
  return out;
}

/** "4h 30m" / "45m" / "30s" — coarse two-unit duration for announcements. */
export function formatDuration(msSpan: number): string {
  const sec = Math.round(msSpan / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h < 24) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  const days = Math.floor(h / 24);
  const hr = h % 24;
  return hr > 0 ? `${days}d ${hr}h` : `${days}d`;
}

const KIND_INK: Record<EventKind, string> = {
  neutral: "neutral",
  positive: "positive",
  negative: "negative",
  accent: "accent",
};

/** Factual timeline summary — merged coverage never double-counts. Shared. */
export function eventTimelineSummary(
  spans: number,
  events: number,
  coverage: number,
  pctFmt: (n: number) => string,
  strings: TimelineStrings,
): string {
  if (spans === 0 && events === 0) return strings.noData;
  return strings.timeline(spans, events, pctFmt(coverage));
}

export interface EventTimelineProps {
  data: readonly EventTimelineDatum[];
  /** The window (shared name, time-typed). Fixing it across rows is the
   *  small-multiples contract. Defaults to the data extent. */
  domain?: readonly [number | Date, number | Date] | undefined;
  /** Current-moment tick — authored, never implicit. */
  now?: number | Date | undefined;
  /** `"spans"` = centered in-span labels with deterministic drop-out. */
  label?: "none" | "spans" | undefined;
  width?: number | undefined;
  height?: number | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: TimelineStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

/** Window = explicit domain or the items' extent. */
export function timelineDomain(
  items: readonly NormalizedItem[],
  domain?: readonly [number | Date, number | Date] | undefined,
): readonly [number, number] {
  if (domain) {
    const a = ms(domain[0]);
    const b = ms(domain[1]);
    if (Number.isFinite(a) && Number.isFinite(b)) return a <= b ? [a, b] : [b, a];
  }
  let lo = Infinity;
  let hi = -Infinity;
  for (const it of items) {
    lo = Math.min(lo, it.start);
    hi = Math.max(hi, it.end ?? it.start);
  }
  return lo <= hi ? [lo, hi] : [0, 1];
}

export function EventTimeline(props: EventTimelineProps): ReactNode {
  const {
    data,
    domain,
    now,
    label = "none",
    width = 80,
    height = 12,
    format,
    locale,
    strings = EN_TIMELINE,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const items = normalizeItems(data);
  const win = timelineDomain(items, domain);
  const fontSize = Math.max(4, Math.min(Math.round(height * 0.45), 6));
  const geo = eventTimelineGeometry({
    width,
    height,
    items,
    domain: win,
    now: now === undefined ? undefined : ms(now),
    fontSize,
  });
  const dropped = items.filter((it) => (it.end ?? it.start) < win[0] || it.start > win[1]).length;
  if (dropped > 0) devWarn(`<EventTimeline> ${dropped} item(s) outside the domain excluded.`);

  const pctFmt = makeFormatter(format, locale, { style: "percent", maximumFractionDigits: 0 });
  const accName =
    summary === false
      ? false
      : (summary ??
        eventTimelineSummary(geo.spans.length, geo.points.length, geo.coverage, pctFmt, strings));

  // Pin the label size in viewBox units. `styles.css` sets `font-size` on
  // `.mc-root text`, and a CSS declaration outranks the SVG presentation
  // attribute, so `fontSize={...}` alone is inert and the reserved gutters would
  // be sized for a font the browser never paints (see label-containment tests).
  const rootStyle = { ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties;

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-timeline ${className}` : "mc-timeline"}
      style={rootStyle}
    >
      <line
        x1={geo.track.x0}
        y1={geo.track.y}
        x2={geo.track.x1}
        y2={geo.track.y}
        data-mc-ink="muted"
        data-mc-w="support"
        strokeOpacity={0.35}
        vectorEffect="non-scaling-stroke"
      />
      {geo.spans.map((s) => {
        const it = items[s.i]!;
        return (
          <rect
            key={`s${s.i}`}
            x={s.x0}
            y={s.y}
            width={round2(Math.max(0.5, s.x1 - s.x0))}
            height={s.h}
            shapeRendering="crispEdges"
            data-mc-ink={KIND_INK[it.kind]}
            fillOpacity={0.7}
          />
        );
      })}
      {label === "spans"
        ? geo.spans
            .filter((s) => s.labelFits)
            .map((s) => (
              <text
                key={`l${s.i}`}
                x={round2((s.x0 + s.x1) / 2)}
                y={round2(height / 2)}
                fontSize={fontSize}
                dominantBaseline="central"
                textAnchor="middle"
                data-mc-ink="label"
              >
                {items[s.i]!.label}
              </text>
            ))
        : null}
      {geo.points.map((p) => {
        const it = items[p.i]!;
        const r = 1.25;
        return (
          <path
            key={`p${p.i}`}
            d={`M ${p.x} ${round2(p.y - r * 2)} L ${round2(p.x + r * 2)} ${p.y} L ${p.x} ${round2(p.y + r * 2)} L ${round2(p.x - r * 2)} ${p.y} Z`}
            data-mc-ink={KIND_INK[it.kind]}
          />
        );
      })}
      {geo.nowX !== null ? (
        <line
          x1={geo.nowX}
          y1={0}
          x2={geo.nowX}
          y2={height}
          data-mc-ink="accent"
          data-mc-w="support"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {children}
    </Chart>
  );
}
