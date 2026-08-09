"use client";
// Interactive <QueueDepth>. useActivePicker owns interaction: one pointer
// listener + nearest-x math across the finite samples (non-finite gaps are
// skipped). ←/→ step, Home/End jump ends, click / Enter / Space selects
// (onSelect).crosshair + focus ring
// + pin are overlay children.
import { useCallback, useMemo, useRef, type CSSProperties } from "react";
import { makeFormatter } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import {
  CHIP,
  named,
  fillFor,
  navOrder,
  useActivePicker,
  wrap,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_QUEUE_DEPTH, type QueueDepthStrings } from "../../core/strings-queue-depth.js";
import { queueDepthGeometry } from "./geometry.js";
import {
  QueueDepth as StaticQueueDepth,
  queueDepthLabels,
  queueSummary,
  type QueueDepthProps,
} from "./index.js";

type QueuePoint = NonNullable<ReturnType<typeof queueDepthGeometry>>["points"][number];

/** Ring ink for a sample above the ceiling — module-level so it is one object. */
const ABOVE_INK = { "--mc-active-stroke": "var(--mc-negative)" } as CSSProperties;

export interface InteractiveQueueDepthProps extends QueueDepthProps, PickerProps {
  strings?: QueueDepthStrings;
  /**
   * Opt-in entrance motion (default `false`): the backlog area wipes on when
   * the chart first mounts client-side. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function QueueDepth(props: InteractiveQueueDepthProps): React.ReactNode {
  const {
    data,
    capacity,
    label = "last",
    height = 20,
    width = 80,
    format,
    locale,
    strings = EN_QUEUE_DEPTH,
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
  useEntrance(hostRef, "wipe", animate);

  const geo = useMemo(
    () =>
      queueDepthGeometry({
        width,
        height,
        data,
        capacity,
        domain: props.domain,
        fontSize: labelFont(height, 0.55, props.labelSize),
      }),
    [width, height, data, capacity, props.domain, props.labelSize],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);

  // The navigable stops are the finite samples, keyed by their DATA index; a
  // lookup keeps overlay marks + selection addressable by that same index.
  const ptByIndex = useMemo(() => {
    const m = new Map<number, QueuePoint>();
    geo?.points.forEach((p) => m.set(p.index, p));
    return m;
  }, [geo]);
  const stops = useMemo(() => geo?.points.map((p) => p.index) ?? [], [geo]);

  // Pointer (viewBox space) → nearest finite sample; returns its DATA index.
  const locate = useCallback(
    (x: number) => {
      if (!geo || geo.points.length === 0) return null;
      let best = geo.points[0]!.index;
      let bestDist = Infinity;
      geo.points.forEach((p) => {
        const d = Math.abs(p.x - x);
        if (d < bestDist) {
          bestDist = d;
          best = p.index;
        }
      });
      return best;
    },
    [geo],
  );

  // Walk finite samples (skip gaps): step in stop-space, land on DATA indices.
  const step = useCallback((cur: number, key: string) => navOrder(stops, cur, key), [stops]);

  // Sample DATA index; `value` is the backlog depth there.
  const datum = useCallback(
    (i: number) => {
      const pt = ptByIndex.get(i);
      return {
        index: i,
        value: pt?.value ?? null,
        formatted: pt ? `${fmt(pt.value)}${pt.above ? strings.queueAbove : ""}` : undefined,
      };
    },
    [ptByIndex, fmt, strings],
  );

  // The static reserves a right gutter for the endpoint/capacity labels and
  // widens its viewBox by it — that total, not bare `width`, is the pointer
  // basis (otherwise every hit lands right of the cursor and the last readings
  // are unreachable).
  const vbWidth = geo
    ? queueDepthLabels(geo, { width, height, capacity, label, fmt, labelSize: props.labelSize })
        .totalWidth
    : width;

  const { active, selected, bind } = useActivePicker({
    count: stops.length,
    width: vbWidth,
    height,
    locate,
    step,
    datum,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
  });

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : geo === null
          ? strings.noData
          : queueSummary(geo, fmt, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const shown = active ?? selected;
  const ap = active !== null ? ptByIndex.get(active) : undefined; // transient focus
  const sp = selected !== null && selected !== active ? ptByIndex.get(selected) : undefined; // pin
  const rp = shown !== null ? ptByIndex.get(shown) : undefined; // readout + announce
  const announced = rp
    ? strings.queueAt(rp.index, fmt(rp.value), rp.above ? strings.queueAbove : "")
    : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-queue-depth-live", className, style)}
      {...named(ariaLabel)}
      {...bind}
    >
      <StaticQueueDepth
        {...rest}
        style={fillFor(style)}
        data={data}
        capacity={capacity}
        label={label}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {sp ? (
          <circle
            cx={sp.x}
            cy={sp.y}
            r={2.4}
            fill="none"
            data-mc-active=""
            style={sp.above ? ABOVE_INK : undefined}
            data-mc-w="tick"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {/* Crosshair + focus ring TRAVEL to the sample they name. `x1`/`x2`
            have no CSS geometry property in any engine, so the line sits at
            x=0 and a transitioned `translateX` carries it; the ring's
            `cx`/`cy` are real CSS properties and glide on the same 120 ms
            curve. */}
        {ap ? (
          <>
            <line
              x1={0}
              y1={0.5}
              x2={0}
              y2={height - 0.5}
              stroke="var(--mc-neutral)"
              data-mc-ui=""
              data-mc-w="support"
              strokeDasharray="1.5 2"
              style={{ transform: `translateX(${ap.x}px)` }}
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={ap.x}
              cy={ap.y}
              r={2.4}
              fill="none"
              data-mc-active=""
              style={ap.above ? ABOVE_INK : undefined}
              data-mc-w="support"
              vectorEffect="non-scaling-stroke"
            />
          </>
        ) : null}
        {rest.children}
      </StaticQueueDepth>
      {readout && rp ? (
        <span className="mc-queue-readout mc-spark-readout" {...CHIP}>
          {`${fmt(rp.value)}${rp.above ? strings.queueAbove : ""}`}
        </span>
      ) : null}
      <LiveRegion>{announced}</LiveRegion>
    </span>
  );
}
