"use client";
// Interactive <PercentileTrace>. useActivePicker owns interaction: one pointer
// listener + nearest-reading math, roving keyboard, touch tap-to-pin, and
// onActive/onSelect contract; the live region states the percentile at
// focused reading.the crosshair +
// focus ring are overlay children, never a re-implemented SVG.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
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
import {
  EN_PERCENTILE_TRACE,
  type PercentileTraceStrings,
} from "../../core/strings-percentile-trace.js";
import { chartSide } from "../../core/types.js";
import { DEFAULT_HEIGHT, DEFAULT_WIDTH, percentileGeometry } from "./geometry.js";
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
    domain,
    unit = "step",
    height: heightProp = DEFAULT_HEIGHT,
    width: widthProp = DEFAULT_WIDTH,
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

  // The static resolves a non-finite box to the documented one; the hit box and
  // the crosshair have to be measured against the SAME box or the pointer maps
  // onto a plot nobody drew.
  const width = chartSide(widthProp, DEFAULT_WIDTH);
  const height = chartSide(heightProp, DEFAULT_HEIGHT);

  const geo = useMemo(
    () => percentileGeometry({ width, height, data, domain }),
    [width, height, data, domain],
  );
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

  // One reading, one sentence — the announcement, the visible chip and
  // `datum.formatted` all say it. It comes out of the string bundle because an
  // inline `${unit} ${i}: ${v}` template left the chip the one rendered surface
  // a localized `strings` could not reach.
  const readingText = useCallback(
    (i: number, v: number) => strings.percentileTraceAt(unit, i, pStr(v)),
    [strings, unit, pStr],
  );

  // `value` = the percentile rank at that reading (this chart's only channel).
  const datum = useCallback(
    (i: number) => {
      const pt = pointAt(i);
      return {
        index: i,
        value: pt?.value ?? null,
        formatted: pt ? readingText(pt.index, pt.value) : undefined,
      };
    },
    [pointAt, readingText],
  );

  // The static reserves a right gutter for the `label="last"` readout and
  // widens its viewBox by it, so THIS is the pointer basis — not bare `width`.
  const vbWidth =
    width + (geo && label === "last" ? percentileGutter(pStr(geo.last.value), height, props.labelSize) : 0);

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
  const announced = p ? readingText(p.index, p.value) : "";

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
        domain={domain}
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
            data-mc-active=""
            data-mc-w="tick"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {/* Crosshair + focus ring TRAVEL to the reading they name. `x1`/`x2`
            have no CSS geometry property in any engine, so the line sits at
            x=0 and a transitioned `translateX` carries it; the ring's
            `cx`/`cy` are real CSS properties and glide on the same 120 ms
            curve. */}
        {p ? (
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
              style={{ transform: `translateX(${p.x}px)` }}
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={p.x}
              cy={p.y}
              r={2.4}
              fill="none"
              data-mc-active=""
              data-mc-w="support"
              vectorEffect="non-scaling-stroke"
            />
          </>
        ) : null}
        {rest.children}
      </StaticPercentileTrace>
      {readout && p ? (
        <span className="mc-percentile-readout mc-spark-readout" {...CHIP}>
          {announced}
        </span>
      ) : null}
      <LiveRegion>{announced}</LiveRegion>
    </span>
  );
}
