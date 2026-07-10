"use client";
// Interactive <QueueDepth> (plan/26 §5). One pointer listener + nearest-x math
// across the finite points; ←/→ step periods, Home/End jump ends. Composes the
// static component (canon); the crosshair + focus ring are overlay children.
import { useCallback, useMemo, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { EN_QUEUE_DEPTH, type QueueDepthStrings } from "../../core/strings-queue-depth.js";
import { queueDepthGeometry } from "./geometry.js";
import { QueueDepth as StaticQueueDepth, queueSummary, type QueueDepthProps } from "./index.js";

export interface InteractiveQueueDepthProps extends QueueDepthProps {
  strings?: QueueDepthStrings;
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
    ...rest
  } = props;

  const geo = useMemo(
    () => queueDepthGeometry({ width, height, data, capacity, domain: props.domain }),
    [width, height, data, capacity, props.domain],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : geo === null
          ? strings.noData
          : queueSummary(geo, fmt, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const count = geo?.points.length ?? 0;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (!geo || count === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const px = ((e.clientX - r.left) / r.width) * width;
      let best = 0;
      let bestDist = Infinity;
      geo.points.forEach((p, i) => {
        const d = Math.abs(p.x - px);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setActive(best);
    },
    [geo, count, width],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (count === 0) return;
      switch (e.key) {
        case "ArrowRight":
          setActive((prev) => Math.min(count - 1, (prev ?? -1) + 1));
          break;
        case "ArrowLeft":
          setActive((prev) => (prev === null || prev <= 0 ? 0 : prev - 1));
          break;
        case "Home":
          setActive(0);
          break;
        case "End":
          setActive(count - 1);
          break;
        case "Escape":
          setActive(null);
          return;
        default:
          return;
      }
      e.preventDefault();
    },
    [count],
  );

  const p = active !== null && geo ? geo.points[active] : undefined;
  const announced = p
    ? strings.queueAt(p.index, fmt(p.value), p.above ? strings.queueAbove : "")
    : "";

  return (
    <span
      className="mc-queue-depth-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticQueueDepth
        {...rest}
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
        {p ? (
          <>
            <line
              x1={p.x}
              y1={0.5}
              x2={p.x}
              y2={height - 0.5}
              stroke="var(--mc-neutral)"
              data-mc-w="support"
              strokeDasharray="1.5 2"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={p.x}
              cy={p.y}
              r={2.4}
              fill="none"
              stroke={p.above ? "var(--mc-negative)" : "var(--mc-accent)"}
              data-mc-w="support"
              vectorEffect="non-scaling-stroke"
            />
          </>
        ) : null}
        {rest.children}
      </StaticQueueDepth>
      {p ? (
        <span
          className="mc-queue-readout mc-spark-readout"
          style={{ left: `${(p.x / width) * 100}%`, transform: "translateX(-50%)" }}
        >
          {fmt(p.value)}
        </span>
      ) : null}
      <span
        aria-live="polite"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
        }}
      >
        {announced}
      </span>
    </span>
  );
}
