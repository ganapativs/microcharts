"use client";
// Interactive <PhaseTrace>. Hover snaps to the nearest DATA point by 2-D
// distance (which carries a definite time index — spatial interpolation would
// lie at crossings); arrows step time. useActivePicker owns interaction: one
// pointer listener + pure nearest-point math, roving keyboard, touch tap-to-pin
// and the onActive/onSelect contract.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import {
  named,
  fillFor,
  useActivePicker,
  wrap,
  crosshairReadoutStyle,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_PHASE_TRACE } from "../../core/strings-phase-trace.js";
import { DEFAULT_HEIGHT, DEFAULT_TAIL, DEFAULT_WIDTH, phaseTraceGeometry } from "./geometry.js";
import {
  PhaseTrace as StaticPhaseTrace,
  phaseTraceSummary,
  type PhaseTraceProps,
} from "./index.js";
import { chartSide } from "../../core/types.js";

export interface InteractivePhaseTraceProps extends PhaseTraceProps, PickerProps {
  /**
   * Opt-in entrance motion (default `false`): the trail draws on when the
   * chart first mounts client-side. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function PhaseTrace(props: InteractivePhaseTraceProps): React.ReactNode {
  const {
    data,
    xLabel = "x",
    yLabel = "y",
    xDomain,
    domain,
    tail = DEFAULT_TAIL,
    width = DEFAULT_WIDTH,
    height = DEFAULT_HEIGHT,
    format,
    locale,
    strings = EN_PHASE_TRACE,
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
  useEntrance(hostRef, "draw", animate, {
    // The trajectory only. The quadrant grid shares the muted ink role (it needs
    // the forced-colors mapping) but it is chrome, so it never takes a beat.
    selector: 'path[data-mc-ink="muted"]:not([data-mc-w="hair"]), path[data-mc-ink="accent"]',
    // A trajectory doubles back in x, so it is drawn along its own stroke in
    // data order — a left→right front would uncover the return leg first.
    trace: true,
    order: "index",
  });

  // Pointer math is measured against the box that actually got painted, and the
  // static child resolves the same props through the same helper (see chartSide).
  const w = chartSide(width, DEFAULT_WIDTH);
  const h = chartSide(height, DEFAULT_HEIGHT);
  const geo = useMemo(
    () => phaseTraceGeometry({ data, xDomain, yDomain: domain, tail, width: w, height: h }),
    [data, xDomain, domain, tail, w, h],
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
      return {
        index: i,
        value: p?.dataY ?? null,
        label: p ? fmt(p.dataX) : undefined,
        formatted: p ? `${fmt(p.dataX)}, ${fmt(p.dataY)}` : undefined,
      };
    },
    [geo, fmt],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo.points.length,
    width: w,
    height: h,
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
    <span ref={hostRef} {...wrap("mc-phase-live", className, style)} {...named(label)} {...bind}>
      <StaticPhaseTrace
        {...rest}
        data={data}
        xLabel={xLabel}
        yLabel={yLabel}
        xDomain={xDomain}
        domain={domain}
        tail={tail}
        width={w}
        height={h}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        style={fillFor(style)}
      >
        {pinned ? (
          <circle
            cx={pinned.x}
            cy={pinned.y}
            r={2.4}
            fill="none"
            data-mc-active=""
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
            data-mc-active=""
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticPhaseTrace>
      <LiveRegion>{announced}</LiveRegion>
      {readout && pt ? (
        <span
          className="mc-spark-readout"
          style={{
            ...crosshairReadoutStyle(pt.x, w),
            top: `${(pt.y / h) * 100}%`,
            transform: "translate(-50%, -140%)",
            bottom: "auto",
          }}
        >
          {/* Same grammar as quadrant-dot: the axis names are chart-constant
              context, not part of the datum, and repeating them on every hover
              pushed a two-number readout past its cap on a 40px chart. */}
          {`${fmt(pt.dataX)}, ${fmt(pt.dataY)}`}
        </span>
      ) : null}
    </span>
  );
}
