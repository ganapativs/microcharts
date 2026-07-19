"use client";
// Interactive <MicroBox>. useActivePicker owns interaction: one pointer
// listener + nearest-stat-by-x math, roving the fixed 5-stop model
// min → q1 → median → q3 → max ("Median: 42."), click / Enter / Space selects
// (onSelect). Composes the static component (canon) — the SVG is never
// re-implemented.
//
// Unit = one of the five summary STATS, so `datum.index` is the STAT POSITION
// (0 = min … 4 = max), not a data index; `value` is that stat's value and
// `label` its name.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { EN_DIST, type DistStrings } from "../../core/strings-dist.js";
import { FILL, useActivePicker, wrap, type PickerProps } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { computeFive, microBoxGeometry } from "./geometry.js";
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
  const geo = useMemo(
    () =>
      resolved
        ? microBoxGeometry({
            width,
            height,
            five: resolved.five,
            raw: resolved.raw,
            whiskers,
            domain,
          })
        : null,
    [resolved, width, height, whiskers, domain],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);

  const locate = useCallback(
    (x: number) => {
      if (!geo) return null;
      let best = 0;
      let bestDist = Infinity;
      STOPS.forEach((stop, i) => {
        const dist = Math.abs(geo.statX[stop] - x);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      return best;
    },
    [geo],
  );

  const datum = useCallback(
    (i: number) => ({
      index: i,
      value: resolved ? resolved.five[STOPS[i]!] : null,
      label: STOPS[i],
    }),
    [resolved],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo ? STOPS.length : 0,
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
    if (!geo || !stop) return null;
    return (
      <line
        x1={geo.statX[stop]}
        y1={0.5}
        x2={geo.statX[stop]}
        y2={height - 0.5}
        stroke="var(--mc-accent)"
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
    <span
      ref={hostRef}
      {...wrap("mc-box-live", className, style)}
      tabIndex={0}
      role="img"
      aria-label={label}
      {...bind}
    >
      <StaticMicroBox
        {...rest}
        style={FILL}
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
        {/* Pinned selection persists through pointer-leave; focus rule is transient. */}
        {selected !== null && selected !== active ? rule(selected, true) : null}
        {active !== null ? rule(active, false) : null}
        {rest.children}
      </StaticMicroBox>
      <LiveRegion>{announced}</LiveRegion>
      {shownStop && geo && resolved ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${(geo.statX[shownStop] / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {fmt(resolved.five[shownStop])}
        </span>
      ) : null}
    </span>
  );
}
