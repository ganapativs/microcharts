"use client";
// Interactive <PercentileTrace>. useActivePicker owns interaction: one pointer
// listener + nearest-reading math, roving keyboard, touch tap-to-pin, and the
// onActive/onSelect contract; the live region states the percentile at the
// focused reading. Composes the static component (canon) — the crosshair +
// focus ring are overlay children, never a re-implemented SVG.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import {
  named,
  fillFor,
  navOrder,
  useActivePicker,
  wrap,
  crosshairReadoutStyle,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import {
  EN_PERCENTILE_TRACE,
  type PercentileTraceStrings,
} from "../../core/strings-percentile-trace.js";
import { percentileGeometry } from "./geometry.js";
import {
  PercentileTrace as StaticPercentileTrace,
  percentileSummary,
  percentileGutter,
  INT,
  type PercentileTraceProps,
} from "./index.js";

export interface InteractivePercentileTraceProps extends PercentileTraceProps, PickerProps {
  strings?: PercentileTraceStrings;
  /**
   * Reading noun for the hover/focus announcement (default `"step"`).
   * Interactive-only: the static entry announces percentiles, never an
   * individual reading, so it has no unit to name.
   */
  unit?: string;
  /**
   * Opt-in entrance motion (default `false`): the line draws on when the
   * chart first mounts client-side. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function PercentileTrace(props: InteractivePercentileTraceProps): React.ReactNode {
  const {
    data,
    unit = "step",
    height = 20,
    width = 80,
    label = "last",
    format = INT,
    locale,
    strings = EN_PERCENTILE_TRACE,
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
  useEntrance(hostRef, "draw", animate);

  const geo = useMemo(() => percentileGeometry({ width, height, data }), [width, height, data]);
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const pStr = useCallback((n: number) => strings.percentileValue(fmt(n)), [strings, fmt]);

  // Navigable units are the READINGS that exist (non-finite entries are gaps and
  // are skipped), but the reported index is the DATA index — `stops` maps stop
  // position → data index, exactly like the sparkline pilot.
  const stops = useMemo(() => (geo ? geo.points.map((p) => p.index) : []), [geo]);
  // data index → point, so lookups are O(1): `pointAt` runs up to three times a
  // render (focus, pin, readout) and a render happens per unit crossed.
  const byIndex = useMemo(() => new Map(geo?.points.map((p) => [p.index, p])), [geo]);
  const pointAt = useCallback((i: number) => byIndex.get(i), [byIndex]);

  const locate = useCallback(
    (x: number) => {
      if (!geo || geo.points.length === 0) return null;
      let best = geo.points[0]!.index;
      let bestDist = Infinity;
      for (const p of geo.points) {
        const d = Math.abs(p.x - x);
        if (d < bestDist) {
          bestDist = d;
          best = p.index;
        }
      }
      return best;
    },
    [geo],
  );

  // Walk stop positions (never landing on a gap) but return data indices.
  const step = useCallback((cur: number, key: string) => navOrder(stops, cur, key), [stops]);

  // `value` = the percentile rank at that reading (this chart's only channel).
  const datum = useCallback(
    (i: number) => {
      const pt = pointAt(i);
      return {
        index: i,
        value: pt?.value ?? null,
        formatted: pt ? `${unit} ${pt.index}: ${pStr(pt.value)}` : undefined,
      };
    },
    [pointAt, unit, pStr],
  );

  // The static reserves a right gutter for the `label="last"` readout and
  // widens its viewBox by it, so THIS is the pointer basis — not bare `width`.
  const vbWidth =
    width + (geo && label === "last" ? percentileGutter(pStr(geo.last.value), height) : 0);

  const { active, selected, bind } = useActivePicker({
    count: stops.length,
    width: vbWidth,
    height,
    locate,
    datum,
    step,
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
          : percentileSummary(geo, pStr, fmt, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  // The reading shown by the crosshair + readout: the live hover/keyboard focus,
  // falling back to a pinned selection when the pointer has left.
  const shown = active ?? selected;
  const p = shown !== null ? pointAt(shown) : undefined;
  const pinned = selected !== null && selected !== active ? pointAt(selected) : undefined;
  const announced = p ? strings.percentileTraceAt(unit, p.index, pStr(p.value)) : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-percentile-trace-live", className, style)}
      {...named(ariaLabel)}
      {...bind}
    >
      <StaticPercentileTrace
        {...rest}
        style={fillFor(style)}
        data={data}
        width={width}
        height={height}
        label={label}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
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
              stroke="var(--mc-accent)"
              data-mc-w="support"
              vectorEffect="non-scaling-stroke"
            />
          </>
        ) : null}
        {rest.children}
      </StaticPercentileTrace>
      {readout && p ? (
        <span
          className="mc-percentile-readout mc-spark-readout"
          style={crosshairReadoutStyle(p.x, vbWidth)}
        >
          {`${unit} ${p.index}: ${pStr(p.value)}`}
        </span>
      ) : null}
      <LiveRegion>{announced}</LiveRegion>
    </span>
  );
}
