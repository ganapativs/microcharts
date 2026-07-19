"use client";
// Interactive <PhaseTrace>. Hover snaps to the nearest DATA point by 2-D
// distance (which carries a definite time index — spatial interpolation would
// lie at crossings); arrows step time. useActivePicker owns interaction: one
// pointer listener + pure nearest-point math, roving keyboard, touch tap-to-pin
// and the onActive/onSelect contract. Composes the static component (canon).
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { FILL, useActivePicker, wrap, type PickerProps } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_PHASE_TRACE } from "../../core/strings-phase-trace.js";
import { phaseTraceGeometry } from "./geometry.js";
import {
  PhaseTrace as StaticPhaseTrace,
  phaseTraceSummary,
  type PhaseTraceProps,
} from "./index.js";
import { isFiniteValue } from "../../core/types.js";

export interface InteractivePhaseTraceProps extends PhaseTraceProps, PickerProps {
  /**
   * Opt-in entrance motion (default `false`): the trail draws on when the
   * chart first mounts client-side. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

function extent(vals: number[]): readonly [number, number] {
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of vals) {
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  if (!Number.isFinite(lo)) return [0, 1];
  if (lo === hi) return [lo - 1, hi + 1];
  return [lo, hi];
}

export function PhaseTrace(props: InteractivePhaseTraceProps): React.ReactNode {
  const {
    data,
    xLabel = "x",
    yLabel = "y",
    xDomain,
    yDomain,
    tail = 0.25,
    width = 40,
    height = 32,
    format,
    locale,
    strings = EN_PHASE_TRACE,
    title,
    summary,
    animate = false,
    className,
    style,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "draw", animate, {
    selector: 'path[data-mc-ink="muted"], path[data-mc-ink="accent"]',
    order: "index",
  });

  const finite = useMemo(
    () => data.filter((p) => isFiniteValue(p.x) && isFiniteValue(p.y)),
    [data],
  );
  const xd = useMemo(() => xDomain ?? extent(finite.map((p) => p.x)), [xDomain, finite]);
  const yd = useMemo(() => yDomain ?? extent(finite.map((p) => p.y)), [yDomain, finite]);
  const geo = useMemo(
    () => phaseTraceGeometry({ data, xDomain: xd, yDomain: yd, tail, width, height }),
    [data, xd, yd, tail, width, height],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : phaseTraceSummary(data, xLabel, yLabel, geo.heading, strings, fmt);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  // Navigable units are the PLOTTED points, in trajectory (time) order: the
  // geometry drops non-finite readings and collapses consecutive duplicates, so
  // this is the point's position along the drawn path, NOT the raw data index.
  const locate = useCallback(
    (x: number, y: number) => {
      if (geo.points.length === 0) return null;
      let best = 0;
      let bestD = Infinity;
      geo.points.forEach((p, i) => {
        const d = (p.x - x) ** 2 + (p.y - y) ** 2;
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      return best;
    },
    [geo],
  );

  // A phase point is 2-D, so `value` reports the y channel (the response axis,
  // named by `yLabel`); `label` carries the paired x reading so the other half
  // of the observation is still recoverable from the datum.
  const datum = useCallback(
    (i: number) => {
      const p = geo.points[i];
      return { index: i, value: p?.dataY ?? null, label: p ? fmt(p.dataX) : undefined };
    },
    [geo, fmt],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo.points.length,
    width,
    height,
    locate,
    datum,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
  });

  // The point shown by the focus ring + readout: the live hover/keyboard focus,
  // falling back to a pinned selection when the pointer has left.
  const shown = active ?? selected;
  const pt = shown !== null ? geo.points[shown] : undefined;
  const pinned = selected !== null && selected !== active ? geo.points[selected] : undefined;
  const announced = pt
    ? strings.phaseAt(shown! + 1, geo.points.length, xLabel, fmt(pt.dataX), yLabel, fmt(pt.dataY))
    : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-phase-live", className, style)}
      tabIndex={0}
      role="img"
      aria-label={label}
      {...bind}
    >
      <StaticPhaseTrace
        {...rest}
        data={data}
        xLabel={xLabel}
        yLabel={yLabel}
        xDomain={xd}
        yDomain={yd}
        tail={tail}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        style={FILL}
      >
        {/* Pinned selection persists through pointer-leave; the ring is transient. */}
        {pinned ? (
          <circle
            cx={pinned.x}
            cy={pinned.y}
            r={2.4}
            fill="none"
            stroke="var(--mc-accent)"
            data-mc-w="tick"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {pt ? (
          <circle
            cx={pt.x}
            cy={pt.y}
            r={2.4}
            fill="none"
            stroke="var(--mc-accent)"
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticPhaseTrace>
      <LiveRegion>{announced}</LiveRegion>
      {pt ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${(pt.x / width) * 100}%`,
            top: `${(pt.y / height) * 100}%`,
            transform: "translate(-50%, -140%)",
            bottom: "auto",
          }}
        >
          {`${fmt(pt.dataX)}, ${fmt(pt.dataY)}`}
        </span>
      ) : null}
    </span>
  );
}
