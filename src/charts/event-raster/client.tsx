"use client";
// Interactive <EventRaster>. One pointer listener; lane from y,
// nearest event from x. ↑/↓ lanes, ←/→ events within a lane (2-D keyboard,
// ActivityGrid model). Composes the static component (canon).
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { makeFormatter } from "../../core/format.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { EN_EVENT_RASTER } from "../../core/strings-event-raster.js";
import { LANE_CAP, rasterDomain } from "./geometry.js";
import {
  EventRaster as StaticEventRaster,
  eventRasterSummary,
  type EventRasterProps,
} from "./index.js";

const FILL: CSSProperties = { width: "100%", height: "auto" };
const LANE_UNIT = 8;

export interface InteractiveEventRasterProps extends EventRasterProps {
  /**
   * Opt-in entrance motion (default `false`): lanes fade in top-to-bottom on
   * first client-side mount. Inert on the server and on hydrated server
   * HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function EventRaster(props: InteractiveEventRasterProps): React.ReactNode {
  const {
    data,
    labels: labelsProp,
    domain: domainProp,
    width = 120,
    height: heightProp,
    format,
    locale,
    strings = EN_EVENT_RASTER,
    title,
    summary,
    animate = false,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  // Each lane's events are merged into one raster path (or, when binned, a
  // handful of count rects) rather than discrete per-event elements —
  // settle's per-mark scale would shift tick x-positions non-uniformly
  // within a lane. wipe (a left→right clip) uncovers events in chronological
  // order along the shared time axis, matching how a raster is read.
  useEntrance(hostRef, "wipe", animate);

  const lanes = useMemo(() => data.slice(0, LANE_CAP), [data]);
  const n = Math.max(1, lanes.length);
  const height = heightProp ?? n * LANE_UNIT;
  const laneH = height / n;
  const labels = labelsProp ?? n <= 8;
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const fontSize = Math.max(5, Math.min(Math.round(laneH * 0.7), 7));
  const domain = useMemo(() => domainProp ?? rasterDomain(data), [domainProp, data]);

  const sorted = useMemo(
    () => lanes.map((l) => [...l.events].filter((e) => Number.isFinite(e)).sort((a, b) => a - b)),
    [lanes],
  );
  const gutter = labels
    ? Math.min(width * 0.45, Math.max(...lanes.map((d) => d.label.length), 1) * fontSize * 0.66 + 4)
    : 0;
  const plotX0 = gutter;
  const plotW = Math.max(1, width - gutter - 1);
  const span = domain[1] - domain[0] || 1;
  const xOf = useCallback(
    (t: number) => plotX0 + ((t - domain[0]) / span) * plotW,
    [plotX0, plotW, span, domain],
  );

  const [pos, setPos] = useState<{ lane: number; ev: number } | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : eventRasterSummary(data, [], strings);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const y = ((e.clientY - r.top) / r.height) * height;
      const lane = Math.max(0, Math.min(n - 1, Math.floor(y / laneH)));
      const evs = sorted[lane]!;
      if (evs.length === 0) {
        setPos({ lane, ev: -1 });
        return;
      }
      const x = ((e.clientX - r.left) / r.width) * width;
      let best = 0;
      let bestD = Infinity;
      evs.forEach((t, i) => {
        const d = Math.abs(xOf(t) - x);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      setPos({ lane, ev: best });
    },
    [height, width, n, laneH, sorted, xOf],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      setPos((prev) => {
        const cur = prev ?? { lane: 0, ev: 0 };
        let { lane, ev } = cur;
        switch (e.key) {
          case "ArrowUp":
            lane = Math.max(0, lane - 1);
            ev = 0;
            break;
          case "ArrowDown":
            lane = Math.min(n - 1, lane + 1);
            ev = 0;
            break;
          case "ArrowLeft":
            ev = Math.max(0, ev - 1);
            break;
          case "ArrowRight":
            ev = Math.min((sorted[lane]?.length ?? 1) - 1, ev + 1);
            break;
          case "Escape":
            return null;
          default:
            return prev;
        }
        e.preventDefault();
        return { lane, ev };
      });
    },
    [n, sorted],
  );

  const evs = pos ? sorted[pos.lane]! : [];
  const t = pos && pos.ev >= 0 && evs.length ? evs[pos.ev] : undefined;
  const announced =
    pos && t !== undefined
      ? strings.eventRasterAt(lanes[pos.lane]!.label, fmt(t), pos.ev + 1, evs.length)
      : "";

  return (
    <span
      ref={hostRef}
      className="mc-raster-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setPos(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setPos(null)}
    >
      <StaticEventRaster
        {...rest}
        data={data}
        labels={labels}
        domain={domain}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        style={FILL}
      >
        {pos ? (
          <rect
            x={plotX0 - 0.5}
            y={pos.lane * laneH + 0.3}
            width={plotW + 1}
            height={laneH - 0.6}
            fill="none"
            stroke="var(--mc-accent)"
            strokeOpacity={0.5}
            data-mc-w="tick"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {t !== undefined ? (
          <line
            x1={xOf(t)}
            x2={xOf(t)}
            y1={0.5}
            y2={height - 0.5}
            data-mc-ink="muted"
            data-mc-w="tick"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticEventRaster>
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
      {t !== undefined ? (
        <span
          className="mc-spark-readout"
          style={{ left: `${(xOf(t) / width) * 100}%`, transform: "translateX(-50%)" }}
        >
          {`${lanes[pos!.lane]!.label} · ${fmt(t)}`}
        </span>
      ) : null}
    </span>
  );
}
