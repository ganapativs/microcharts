"use client";
// Interactive <TimeInRange>. One pointer listener; zone by x/y
// lookup. ←/→ (or ↑/↓ vertical) rove zones, each announcing "{zone}: {pct}".
// Composes the static component (canon) — overlays ride as children.
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { useEntrance } from "../../shared/motion-gate.js";
import { EN_TIME_IN_RANGE } from "../../core/strings-time-in-range.js";
import { timeInRangeGeometry } from "./geometry.js";
import {
  TimeInRange as StaticTimeInRange,
  timeInRangeSummary,
  zonePercentMap,
  type TimeInRangeProps,
} from "./index.js";

const FILL: CSSProperties = { width: "100%", height: "auto" };

export interface InteractiveTimeInRangeProps extends TimeInRangeProps {
  /**
   * Opt-in entrance motion (default `false`): the zone segments reveal on
   * when the chart first mounts client-side. Inert on the server and on
   * hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function TimeInRange(props: InteractiveTimeInRangeProps): React.ReactNode {
  const {
    data,
    orientation = "horizontal",
    width = 80,
    height = 12,
    strings = EN_TIME_IN_RANGE,
    title,
    summary,
    animate = false,
    ...rest
  } = props;
  const horizontal = orientation !== "vertical";

  const hostRef = useRef<HTMLSpanElement>(null);
  // A composition bar should ASSEMBLE, not fade in place: each zone grows from
  // the leading edge and the zones cascade in order, so the whole bar builds
  // up the way its siblings (SegmentedBar, LikertStrip) do. Direction follows
  // orientation — sweep across x when horizontal, rise up y when vertical.
  useEntrance(hostRef, horizontal ? "sweep" : "rise", animate, {
    selector: "rect[data-mc-ink], rect[data-mc-cat]",
    order: horizontal ? "x" : "y",
  });

  const geo = useMemo(
    () => timeInRangeGeometry({ data, width, height, orientation }),
    [data, width, height, orientation],
  );
  const pct = useMemo(() => zonePercentMap(data), [data]);
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : timeInRangeSummary(data, strings);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const nameByKey: Record<string, string> = {
    severeBelow: strings.tirNames[0],
    below: strings.tirNames[1],
    in: strings.tirNames[2],
    above: strings.tirNames[3],
    severeAbove: strings.tirNames[4],
  };

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (geo.zones.length === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const i = horizontal
        ? geo.zones.findIndex((z) => {
            const x = ((e.clientX - r.left) / r.width) * width;
            return x >= z.x && x <= z.x + z.width;
          })
        : geo.zones.findIndex((z) => {
            const y = ((e.clientY - r.top) / r.height) * height;
            return y >= z.y && y <= z.y + z.height;
          });
      setActive(i >= 0 ? i : null);
    },
    [geo, width, height, horizontal],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (geo.zones.length === 0) return;
      const fwd = horizontal ? "ArrowRight" : "ArrowUp";
      const back = horizontal ? "ArrowLeft" : "ArrowDown";
      const cur = active ?? 0;
      let next = cur;
      switch (e.key) {
        case fwd:
          next = Math.min(geo.zones.length - 1, cur + 1);
          break;
        case back:
          next = Math.max(0, cur - 1);
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = geo.zones.length - 1;
          break;
        case "Escape":
          setActive(null);
          return;
        default:
          return;
      }
      e.preventDefault();
      setActive(next);
    },
    [active, geo, horizontal],
  );

  const zone = active !== null ? geo.zones[active] : undefined;
  const announced = zone ? strings.tirZone(nameByKey[zone.key]!, `${pct[zone.key]}%`) : "";
  const chipPos = zone
    ? horizontal
      ? { left: `${((zone.x + zone.width / 2) / width) * 100}%`, transform: "translateX(-50%)" }
      : {
          top: `${((zone.y + zone.height / 2) / height) * 100}%`,
          left: "50%",
          transform: "translate(-50%,-50%)",
        }
    : undefined;

  return (
    <span
      ref={hostRef}
      className="mc-tir-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticTimeInRange
        {...rest}
        data={data}
        orientation={orientation}
        width={width}
        height={height}
        strings={strings}
        summary={false}
        style={FILL}
      >
        {zone ? (
          <rect
            x={zone.x - 0.5}
            y={zone.y - 0.5}
            width={zone.width + 1}
            height={zone.height + 1}
            fill="none"
            stroke="var(--mc-accent)"
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticTimeInRange>
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
      {zone ? (
        <span className="mc-spark-readout" style={chipPos}>
          {`${nameByKey[zone.key]} ${pct[zone.key]}%`}
        </span>
      ) : null}
    </span>
  );
}
