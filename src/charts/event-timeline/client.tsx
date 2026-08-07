"use client";
// Interactive <EventTimeline>. useActivePicker owns interaction: one pointer
// listener + nearest-item-by-x math (span hit = containment, else nearest
// edge/point). ←/→ cycle items chronologically, click / Enter / Space selects
// (onSelect); announces "Deploy freeze: Jun 3, 09:00 to 13:30 — 4h 30m."
import { useCallback, useMemo, useRef } from "react";
import { makeDateFormatter, makeUnitFormatter, type DateFormat } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import {
  CHIP,
  named,
  fillFor,
  useActivePicker,
  wrap,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_TIMELINE, type TimelineStrings } from "../../core/strings-timeline.js";
import { eventTimelineGeometry, timelineBox } from "./geometry.js";
import {
  EventTimeline as StaticEventTimeline,
  eventTimelineSummary,
  formatDuration,
  normalizeItems,
  timelineDomain,
  type EventTimelineProps,
} from "./index.js";

export interface InteractiveEventTimelineProps extends EventTimelineProps, PickerProps {
  strings?: TimelineStrings;
  /** Announced instant label (defaults to "Jun 3, 11:12" UTC). */
  dateFormat?: DateFormat;
  /**
   * Opt-in entrance motion (default `false`): spans and events pop in one after
   * another along the axis, earliest first, on first client-side mount. Inert on
   * the server and on hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function EventTimeline(props: InteractiveEventTimelineProps): React.ReactNode {
  const {
    data,
    domain,
    now,
    label = "none",
    width: widthProp = 80,
    height: heightProp = 12,
    format,
    locale,
    strings = EN_TIMELINE,
    dateFormat,
    title,
    summary,
    animate = false,
    readout = true,
    className,
    style,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  // "trail" ordered by x — events appear in chronological (left→right) order
  // instead of a uniform staggered fade. Same selector as before: spans
  // (rect) and point events (path[data-mc-ink]).
  useEntrance(hostRef, "trail", animate, { selector: "rect, path[data-mc-ink]", order: "x" });

  const items = useMemo(() => normalizeItems(data), [data]);
  const win = useMemo(() => timelineDomain(items, domain), [items, domain]);
  // Same resolved box the static entry uses — the hit box, the readout anchor
  // and the focus outline are all in viewBox units, so a box that disagrees with
  // the painted one puts the outline somewhere the marks are not.
  const [width, height] = timelineBox(widthProp, heightProp);
  const fontSize = labelFont(height, 0.45);
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

  // Unit = a RENDERED item at its chronological position (not the data index):
  // invalid items are dropped and items outside the window are excluded, so the
  // two spaces are not 1:1.
  const locate = useCallback(
    (x: number) => {
      if (ordered.length === 0) return null;
      let best = 0;
      let bestDist = Infinity;
      ordered.forEach((o, k) => {
        const dist =
          x >= o.x && x <= o.xEnd ? 0 : Math.min(Math.abs(o.x - x), Math.abs(o.xEnd - x));
        if (dist < bestDist) {
          bestDist = dist;
          best = k;
        }
      });
      return best;
    },
    [ordered],
  );

  // value = the item's DURATION in ms — the number the mark's length encodes.
  // A point event is an instant, so its duration is 0.
  const datum = useCallback(
    (k: number) => {
      const o = ordered[k]!;
      const it = items[o.i]!;
      return {
        index: k,
        value: it.end === undefined ? 0 : it.end - it.start,
        label: it.label,
        formatted:
          it.end !== undefined
            ? `${it.label ?? strings.timelineFallback(o.i + 1, "span")}: ${formatDuration(it.end - it.start)}`
            : `${it.label ?? strings.timelineFallback(o.i + 1, "point")}: ${dateFmt(new Date(it.start))}`,
      };
    },
    [ordered, items, dateFmt, strings],
  );

  const { active, selected, bind } = useActivePicker({
    count: ordered.length,
    width,
    height,
    locate,
    datum,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
  });

  const pctFmt = useMemo(
    () => makeUnitFormatter(format, locale, { style: "percent", maximumFractionDigits: 0 }),
    [format, locale],
  );
  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : eventTimelineSummary(geo.spans.length, geo.points.length, geo.coverage, pctFmt, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const shown = active ?? selected;
  const shownItem = shown !== null ? ordered[shown] : undefined;
  const item = shownItem ? items[shownItem.i] : undefined;
  const pinned = selected !== null && selected !== active ? ordered[selected] : undefined;
  const announced =
    shownItem && item
      ? item.end !== undefined
        ? strings.spanAt(
            item.label ?? strings.timelineFallback(shownItem.i + 1, "span"),
            dateFmt(new Date(item.start)),
            dateFmt(new Date(item.end)),
            formatDuration(item.end - item.start),
          )
        : strings.eventAt(
            item.label ?? strings.timelineFallback(shownItem.i + 1, "point"),
            dateFmt(new Date(item.start)),
          )
      : "";

  const outline = (o: { x: number; xEnd: number }, isPinned: boolean) => (
    <rect
      x={Math.max(0, o.x - 1.5)}
      y={0.5}
      width={Math.min(width, o.xEnd - o.x + 3)}
      height={height - 1}
      fill="none"
      data-mc-active=""
      data-mc-w={isPinned ? "tick" : "support"}
      vectorEffect="non-scaling-stroke"
    />
  );

  return (
    <span
      ref={hostRef}
      {...wrap("mc-timeline-live", className, style)}
      {...named(ariaLabel)}
      {...bind}
    >
      <StaticEventTimeline
        {...rest}
        style={fillFor(style)}
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
        {pinned ? outline(pinned, true) : null}
        {active !== null && ordered[active] ? outline(ordered[active]!, false) : null}
        {rest.children}
      </StaticEventTimeline>
      <LiveRegion>{announced}</LiveRegion>
      {readout && shownItem && item ? (
        <span className="mc-spark-readout" {...CHIP}>
          {item.end !== undefined
            ? `${item.label ?? strings.timelineFallback(shownItem.i + 1, "span")}: ${formatDuration(item.end - item.start)}`
            : `${item.label ?? strings.timelineFallback(shownItem.i + 1, "point")}: ${dateFmt(new Date(item.start))}`}
        </span>
      ) : null}
    </span>
  );
}
