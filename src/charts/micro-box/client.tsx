"use client";
// Interactive <MicroBox>. useActivePicker owns interaction: one pointer
// listener + nearest-stat-by-x math, roving the fixed 5-stop model
// min → q1 → median → q3 → max ("Median: 42."). click / Enter / Space selects
// (onSelect).
// Unit = one of the five summary STATS, so `datum.index` is the STAT POSITION
// (0 = min … 4 = max). not a data index; `value` is that stat's value and
// `label` its name.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { EN_DIST, type DistStrings } from "../../core/strings-dist.js";
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
import { computeFive, microBoxDots, microBoxGeometry } from "./geometry.js";
import { MicroBox as StaticMicroBox, microBoxSummary, type MicroBoxProps } from "./index.js";

const STOPS = ["min", "q1", "median", "q3", "max"] as const;

// The CENTRAL marks — box (q1–q3) + median tick — plus the too-few-observations
// raw dots. Settling them into place as markers fits a floating box-and-whisker
// read (no shared zero baseline to rise from). The whisker is deliberately
// EXCLUDED: settle scales each mark from its own center, and the whisker's
// x-center (the full min–max midpoint) differs from the box's and the median's,
// so settling all three would slide them apart during the pop. The whisker
// instead fades in quietly on the stage while the box and median settle.
const BOX_SELECTOR =
  'rect[data-mc-ink="band"], line[data-mc-ink="data"], circle[data-mc-ink="point"]';

export interface InteractiveMicroBoxProps extends MicroBoxProps, PickerProps {
  strings?: DistStrings;
  /**
   * Opt-in entrance motion (default `false`): the whisker, box, median tick
   * (or the raw dots, below 5 observations) settle into place when the chart
   * first mounts client-side. Inert on the server and on hydrated server
   * HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function MicroBox(props: InteractiveMicroBoxProps): React.ReactNode {
  const {
    data,
    stats,
    whiskers = "minmax",
    domain,
    width = 40,
    height = 14,
    format,
    locale,
    strings = EN_DIST,
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
  useEntrance(hostRef, "settle", animate, { selector: BOX_SELECTOR });

  const resolved = useMemo(() => computeFive(data, stats), [data, stats]);
  // Only the stat x's matter here (crosshair, nearest-stat picking, readout).
  // Below 5 observations the static paints raw dots instead of a box, on a
  // different domain — hit-test the scale that is actually on screen.
  const statX = useMemo(() => {
    if (!resolved) return null;
    if (stats === undefined && resolved.raw.length < 5) {
      return microBoxDots({ raw: resolved.raw, width, five: resolved.five, domain }).statX;
    }
    return microBoxGeometry({
      width,
      height,
      five: resolved.five,
      raw: resolved.raw,
      whiskers,
      domain,
    }).statX;
  }, [resolved, stats, width, height, whiskers, domain]);
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);

  const locate = useCallback(
    (x: number) => {
      if (!statX) return null;
      let best = 0;
      let bestDist = Infinity;
      STOPS.forEach((stop, i) => {
        const dist = Math.abs(statX[stop] - x);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      return best;
    },
    [statX],
  );

  const datum = useCallback(
    (i: number) => ({
      index: i,
      value: resolved ? resolved.five[STOPS[i]!] : null,
      label: STOPS[i],
      formatted: resolved
        ? strings.boxStat(STOPS[i]!, fmt(resolved.five[STOPS[i]!])).replace(/\.$/, "")
        : undefined,
    }),
    [resolved, fmt, strings],
  );

  const { active, selected, bind } = useActivePicker({
    count: statX ? STOPS.length : 0,
    width,
    height,
    locate,
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
        : resolved
          ? microBoxSummary(resolved.five, fmt, strings)
          : strings.noData;
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const rule = (i: number, pinned: boolean) => {
    const stop = STOPS[i];
    if (!statX || !stop) return null;
    return (
      <line
        x1={statX[stop]}
        y1={0.5}
        x2={statX[stop]}
        y2={height - 0.5}
        data-mc-active=""
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const shownStop = shown !== null ? STOPS[shown] : undefined;
  const announced =
    shownStop && resolved ? strings.boxStat(shownStop, fmt(resolved.five[shownStop])) : "";

  return (
    <span ref={hostRef} {...wrap("mc-box-live", className, style)} {...named(label)} {...bind}>
      <StaticMicroBox
        {...rest}
        style={fillFor(style)}
        data={data}
        stats={stats}
        whiskers={whiskers}
        domain={domain}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {selected !== null && selected !== active ? rule(selected, true) : null}
        {active !== null ? rule(active, false) : null}
        {rest.children}
      </StaticMicroBox>
      <LiveRegion>{announced}</LiveRegion>
      {readout && shownStop && statX && resolved ? (
        <span className="mc-spark-readout" style={crosshairReadoutStyle(statX[shownStop], width)}>
          {strings.boxStat(shownStop, fmt(resolved.five[shownStop])).replace(/\.$/, "")}
        </span>
      ) : null}
    </span>
  );
}
