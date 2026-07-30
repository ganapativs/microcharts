"use client";
// Interactive <FoldedDayBand>. useActivePicker owns interaction: one pointer
// listener + nearest-bin-by-x math, ←/→ (and ↑/↓) rove fold bins, click /
// Enter / Space selects (onSelect). The fold collapses every period onto ONE
// axis, so the navigable space is 1-D (bins). not day × time-of-day.
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
import { EN_FOLDED_BAND } from "../../core/strings-folded-band.js";
import { DEFAULT_PERCENTILES, DEFAULT_PERIOD, foldedBandGeometry } from "./geometry.js";
import {
  FoldedDayBand as StaticFoldedDayBand,
  binPosition,
  foldedBandSummary,
  type FoldedDayBandProps,
} from "./index.js";

export interface InteractiveFoldedDayBandProps extends FoldedDayBandProps, PickerProps {
  /**
   * Opt-in entrance motion (default `false`): the median line draws on when
   * the chart first mounts client-side. Inert on the server and on
   * hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function FoldedDayBand(props: InteractiveFoldedDayBandProps): React.ReactNode {
  const {
    data,
    period = DEFAULT_PERIOD,
    today,
    percentiles = DEFAULT_PERCENTILES,
    bins = 24,
    width = 120,
    height = 32,
    format,
    locale,
    strings = EN_FOLDED_BAND,
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

  const geo = useMemo(
    () =>
      foldedBandGeometry({ data, today: today ?? null, period, bins, percentiles, width, height }),
    [data, today, period, bins, percentiles, width, height],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);

  // Unit = a POPULATED fold bin, i.e. an index into `geo.binStats` (empty bins
  // carry no quantiles and are never rendered, so they are not navigable).
  const locate = useCallback(
    (x: number) => {
      const stats = geo.binStats;
      if (stats.length === 0) return null;
      let best = 0;
      let bestD = Infinity;
      for (let i = 0; i < stats.length; i++) {
        const d = Math.abs(stats[i]!.x - x);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      return best;
    },
    [geo],
  );

  // value = the bin's MEDIAN (the fold's headline encoded number); label = its
  // position on the fold axis.
  const datum = useCallback(
    (i: number) => {
      const s = geo.binStats[i];
      return {
        index: i,
        value: s ? s.median : null,
        label: s ? fmt(binPosition(s.bin, bins, period)) : undefined,
        formatted: s
          ? `${fmt(binPosition(s.bin, bins, period))} · ${fmt(s.median)} (${fmt(s.q1)}–${fmt(s.q3)})`
          : undefined,
      };
    },
    [geo, fmt, bins, period],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo.binStats.length,
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
        : foldedBandSummary(geo, period, strings, fmt);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const shown = active ?? selected;
  const s = shown !== null ? geo.binStats[shown] : undefined;
  const pinned = selected !== null && selected !== active ? geo.binStats[selected] : undefined;
  const todayClause =
    geo.todayPercentile == null
      ? ""
      : geo.todayPercentile < 25
        ? strings.foldedToday[0]
        : geo.todayPercentile > 75
          ? strings.foldedToday[2]
          : strings.foldedToday[1];
  const announced = s
    ? strings.foldedAt(
        fmt(binPosition(s.bin, bins, period)),
        fmt(s.median),
        fmt(s.q1),
        fmt(s.q3),
        todayClause,
      )
    : "";

  return (
    <span ref={hostRef} {...wrap("mc-folded-live", className, style)} {...named(label)} {...bind}>
      <StaticFoldedDayBand
        {...rest}
        data={data}
        period={period}
        today={today}
        percentiles={percentiles}
        bins={bins}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        style={fillFor(style)}
      >
        {/* Both rules TRAVEL to the bin they name (styles.css glides
            `data-mc-ui`). `x1`/`x2` have no CSS geometry property in any
            engine, so the line sits at x=0 and a transitioned `translateX`
            carries it — the fold axis is time-of-day, so only the pointer
            moves, never a value. */}
        {pinned ? (
          <line
            x1={0}
            x2={0}
            y1={0.5}
            y2={height - 0.5}
            stroke="var(--mc-accent)"
            data-mc-ui=""
            data-mc-w="support"
            style={{ transform: `translateX(${pinned.x}px)` }}
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {s ? (
          <line
            x1={0}
            x2={0}
            y1={0.5}
            y2={height - 0.5}
            data-mc-ink="muted"
            data-mc-ui=""
            data-mc-w="tick"
            style={{ transform: `translateX(${s.x}px)` }}
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticFoldedDayBand>
      <LiveRegion>{announced}</LiveRegion>
      {readout && s ? (
        <span className="mc-spark-readout" style={crosshairReadoutStyle(s.x, width)}>
          {`${fmt(binPosition(s.bin, bins, period))} · ${fmt(s.median)} (${fmt(s.q1)}–${fmt(s.q3)})`}
        </span>
      ) : null}
    </span>
  );
}
