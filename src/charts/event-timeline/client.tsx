"use client";
// Interactive <EventTimeline>. Pointer → nearest item by x
// (span hit = containment, else nearest edge/point); ←/→ cycle items
// chronologically; announces "Deploy freeze: Jun 3, 09:00 to 13:30 — 4h 30m."
// Composes the static component (canon).
import { useMemo, useRef, useState, type PointerEvent } from "react";
import { makeFormatter, makeDateFormatter, type DateFormat } from "../../core/format.js";
import { FILL, wrap } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_TIMELINE, type TimelineStrings } from "../../core/strings-timeline.js";
import { eventTimelineGeometry } from "./geometry.js";
import {
  EventTimeline as StaticEventTimeline,
  formatDuration,
  normalizeItems,
  timelineDomain,
  type EventTimelineProps,
} from "./index.js";

export interface InteractiveEventTimelineProps extends EventTimelineProps {
  strings?: TimelineStrings;
  /** Announced instant label (defaults to "Jun 3, 11:12" UTC). */
  dateFormat?: DateFormat;
  /**
   * Opt-in entrance motion (default `false`): spans and events fade in on
   * first client-side mount. Inert on the server and on hydrated server
   * HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function EventTimeline(props: InteractiveEventTimelineProps): React.ReactNode {
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
    dateFormat,
    title,
    summary,
    animate = false,
    className,
    style,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  // "trail" ordered by x — events appear in chronological (left→right) order
  // instead of a uniform staggered fade. Same selector as before: spans
  // (rect) and point events (path[data-mc-ink]).
  useEntrance(hostRef, "trail", animate, { selector: "rect, path[data-mc-ink]", order: "x" });

  const items = useMemo(() => normalizeItems(data), [data]);
  const win = useMemo(() => timelineDomain(items, domain), [items, domain]);
  const fontSize = Math.max(4, Math.min(Math.round(height * 0.45), 6));
  const geo = useMemo(
    () =>
      eventTimelineGeometry({
        width,
        height,
        items,
        domain: win,
        now: now === undefined ? undefined : now instanceof Date ? now.getTime() : now,
        fontSize,
      }),
    [width, height, items, win, now, fontSize],
  );
  const dateFmt = useMemo(
    () =>
      makeDateFormatter(dateFormat, locale, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    [dateFormat, locale],
  );

  // chronological order over everything rendered
  const ordered = useMemo(() => {
    const list = [
      ...geo.spans.map((s) => ({ kind: "span" as const, x: s.x0, xEnd: s.x1, i: s.i })),
      ...geo.points.map((p) => ({ kind: "point" as const, x: p.x, xEnd: p.x, i: p.i })),
    ];
    return list.sort((a, b) => items[a.i]!.start - items[b.i]!.start);
  }, [geo, items]);

  const [active, setActive] = useState<number | null>(null);

  const pctFmt = useMemo(
    () => makeFormatter(format, locale, { style: "percent", maximumFractionDigits: 0 }),
    [format, locale],
  );
  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : geo.spans.length === 0 && geo.points.length === 0
          ? strings.noData
          : strings.timeline(geo.spans.length, geo.points.length, pctFmt(geo.coverage));
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (ordered.length === 0) return;
    const r = e.currentTarget.getBoundingClientRect();
    if (r.width === 0) return;
    const x = ((e.clientX - r.left) / r.width) * width;
    let best = 0;
    let bestDist = Infinity;
    ordered.forEach((o, k) => {
      const dist = x >= o.x && x <= o.xEnd ? 0 : Math.min(Math.abs(o.x - x), Math.abs(o.xEnd - x));
      if (dist < bestDist) {
        bestDist = dist;
        best = k;
      }
    });
    setActive(best);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (ordered.length === 0) return;
    const cur = active ?? 0;
    let next = cur;
    switch (e.key) {
      case "ArrowRight":
        next = Math.min(ordered.length - 1, cur + 1);
        break;
      case "ArrowLeft":
        next = Math.max(0, cur - 1);
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = ordered.length - 1;
        break;
      case "Escape":
        setActive(null);
        return;
      default:
        return;
    }
    e.preventDefault();
    setActive(next);
  };

  const activeItem = active !== null ? ordered[active] : undefined;
  const item = activeItem ? items[activeItem.i] : undefined;
  const fallbackLabel = (i: number, kind: "span" | "point") =>
    kind === "span" ? `Span ${i + 1}` : `Event ${i + 1}`;
  const announced =
    activeItem && item
      ? item.end !== undefined
        ? strings.spanAt(
            item.label ?? fallbackLabel(activeItem.i, "span"),
            dateFmt(new Date(item.start)),
            dateFmt(new Date(item.end)),
            formatDuration(item.end - item.start),
          )
        : strings.eventAt(
            item.label ?? fallbackLabel(activeItem.i, "point"),
            dateFmt(new Date(item.start)),
          )
      : "";
  const readoutX = activeItem ? (activeItem.x + activeItem.xEnd) / 2 : 0;

  return (
    <span
      ref={hostRef}
      {...wrap("mc-timeline-live", className, style)}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticEventTimeline
        {...rest}
        style={FILL}
        data={data}
        domain={domain}
        now={now}
        label={label}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {activeItem ? (
          <rect
            x={Math.max(0, activeItem.x - 1.5)}
            y={0.5}
            width={Math.min(width, activeItem.xEnd - activeItem.x + 3)}
            height={height - 1}
            fill="none"
            stroke="var(--mc-accent)"
            data-mc-w="tick"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticEventTimeline>
      <LiveRegion>{announced}</LiveRegion>
      {activeItem && item ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${(readoutX / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {item.end !== undefined
            ? formatDuration(item.end - item.start)
            : dateFmt(new Date(item.start))}
        </span>
      ) : null}
    </span>
  );
}
