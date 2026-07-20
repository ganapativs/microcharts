"use client";
// Interactive <Sparkline>. Opt-in entry:
//   import { Sparkline } from '@microcharts/react/sparkline/interactive'
//
//   1. COMPOSE the static component (`summary={false}`, overlay marks passed
//      as its children) — never re-implement the visual; it cannot drift.
//   2. useActivePicker owns interaction: ONE pointer listener + nearest-stop
//      math, roving keyboard, touch tap-to-pin, and the onActive/onSelect
//      contract — never a DOM node per point (500 rows × 30 pts stays cheap).
//   3. The wrapper owns the accessible name (role=img + aria-label) and the
//      roving keyboard; announcements go through a polite live region using
//      the i18n-able SummaryStrings.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import {
  named,
  fillFor,
  navOrder,
  useActivePicker,
  wrap,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { describeSeries, EN_SERIES, type SeriesStrings } from "../../core/summary.js";
import { lastFinite } from "../../core/stats.js";
import { isFiniteValue } from "../../core/types.js";
import { labelMetrics, sparkGeometry } from "./geometry.js";
import { Sparkline as StaticSparkline, type SparklineProps } from "./index.js";

export interface InteractiveSparklineProps extends SparklineProps, PickerProps {
  /** Swappable announcement strings (defaults to EN). */
  strings?: SeriesStrings;
  /**
   * Opt-in entrance motion (default `false`): the line draws on when the chart
   * first mounts client-side. Inert on the server and on hydrated server HTML;
   * `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function Sparkline(props: InteractiveSparklineProps): React.ReactNode {
  const {
    data,
    domain,
    width = 80,
    height = 20,
    fill = false,
    band,
    label = "none",
    title,
    summary,
    format,
    locale,
    strings = EN_SERIES,
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
  useEntrance(hostRef, "draw", animate);

  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);

  // Same geometry inputs as the static render (pure → identical numbers),
  // including the label gutters, so overlay marks line up exactly.
  const geo = useMemo(() => {
    const last = lastFinite(data);
    const labelText = label === "last" && last !== undefined ? fmt(last) : undefined;
    const gutterRight = labelText !== undefined ? labelMetrics(labelText, width, height).gutter : 0;
    const mmSize = Math.max(5, Math.min(Math.round(height * 0.22), 9));
    const gutterY = label === "minmax" && height >= (mmSize + 1) * 2 + 12 ? mmSize + 1 : 0;
    return sparkGeometry(data, {
      width,
      height,
      domain,
      zero: fill,
      band,
      gutterRight,
      gutterTop: gutterY,
      gutterBottom: gutterY,
      maxPoints: props.maxPoints,
    });
  }, [data, width, height, domain, fill, band, label, fmt, props.maxPoints]);

  // Indices with a finite value — the only navigable stops. Callbacks report the
  // DATA index (what the consumer indexes into), so we walk finite indices and
  // hit-test to the nearest one, but never land on a gap.
  const stops = useMemo(
    () => data.map((v, i) => (isFiniteValue(v) ? i : -1)).filter((i) => i >= 0),
    [data],
  );

  const locate = useCallback(
    (x: number) => {
      if (stops.length === 0) return null;
      let best = stops[0]!;
      let bestDist = Infinity;
      for (const i of stops) {
        const p = geo.points[i];
        if (!p) continue;
        const d = Math.abs(p[0] - x);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      }
      return best;
    },
    [stops, geo],
  );

  const step = useCallback((cur: number, key: string) => navOrder(stops, cur, key), [stops]);

  const datum = useCallback((i: number) => ({ index: i, value: data[i] as number }), [data]);

  const { active, selected, bind } = useActivePicker({
    count: stops.length,
    width,
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
    summary === false ? undefined : (summary ?? describeSeries(data, { format, locale }));
  // The unit shown by the crosshair + readout: the live hover/keyboard focus,
  // falling back to a pinned selection when the pointer has left.
  const shown = active ?? selected;
  const shownValue = shown !== null ? (data[shown] as number) : null;
  const shownPoint = shown !== null ? geo.points[shown] : null;
  const shownPos = shown !== null ? stops.indexOf(shown) + 1 : 0;
  const selPoint = selected !== null ? geo.points[selected] : null;

  return (
    <span
      ref={hostRef}
      {...wrap("mc-spark-interactive", className, style)}
      {...named([title, accName].filter(Boolean).join(". ") || undefined)}
      {...bind}
    >
      <StaticSparkline
        {...rest}
        data={data}
        domain={domain}
        width={width}
        height={height}
        fill={fill}
        band={band}
        label={label}
        format={format}
        locale={locale}
        summary={false}
        /* Fill the focusable wrapper exactly so pointer math + overlay marks
           map 1:1 (the wrapper box === the SVG box) and the chart is fluid. */
        style={fillFor(style)}
      >
        {/* Pinned selection: a persistent ring that survives pointer-leave. */}
        {selPoint ? (
          <circle
            cx={selPoint[0]}
            cy={selPoint[1]}
            r={3.2}
            fill="none"
            data-mc-ink="accent"
            data-mc-w="tick"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {shownPoint ? (
          <line
            x1={shownPoint[0]}
            y1={geo.plot.y0}
            x2={shownPoint[0]}
            y2={geo.plot.y1}
            data-mc-ink="muted"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {shownPoint ? (
          <circle cx={shownPoint[0]} cy={shownPoint[1]} r={2.6} data-mc-ink="accent" />
        ) : null}
        {rest.children}
      </StaticSparkline>
      <LiveRegion>
        {shownValue !== null ? strings.point(shownPos, stops.length, fmt(shownValue)) : ""}
      </LiveRegion>
      {shownPoint &&
      shownValue !== null &&
      /* At the endpoint the persistent `label="last"` already shows this value —
         a floating readout there just collides with it. Skip it; every other
         point still gets the readout. */
      !(label === "last" && shown === stops[stops.length - 1]) ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${(shownPoint[0] / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {fmt(shownValue)}
        </span>
      ) : null}
    </span>
  );
}
