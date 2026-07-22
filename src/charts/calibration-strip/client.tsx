"use client";
// Interactive <CalibrationStrip>. useActivePicker owns interaction: one pointer
// listener + nearest-bin-by-x math, ←/→ (and ↑/↓) rove bins, click / Enter /
// Space selects (onSelect). Composes the static component (canon) — the SVG is
// never re-implemented.
//
// Unit = a calibration BIN, so `datum.index` is the bin's position among the
// PLOTTED bins (the geometry drops empty ones, `count === 0`), which is the data
// row index whenever every bin has support. `value` is the OBSERVED rate (what
// actually happened); the bin's predicted rate travels as `label`.
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
import { EN_CALIBRATION } from "../../core/strings-calibration.js";
import { calibrationGeometry, isBinned } from "./geometry.js";
import {
  CalibrationStrip as StaticCalibrationStrip,
  calibrationSummary,
  type CalibrationStripProps,
} from "./index.js";

function defaultMinSupport(data: CalibrationStripProps["data"]): number {
  const total = isBinned(data)
    ? data.reduce((s, r) => s + (Number.isFinite(r.count) ? r.count : 0), 0)
    : data.length;
  return Math.max(10, Math.round(total * 0.02));
}

export interface InteractiveCalibrationStripProps extends CalibrationStripProps, PickerProps {
  /**
   * Opt-in entrance motion (default `false`): the per-bin points settle onto
   * the diagonal (dots mode) or the deviation columns fade in (bars
   * mode) on first client-side mount. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function CalibrationStrip(props: InteractiveCalibrationStripProps): React.ReactNode {
  const {
    data,
    bins = 10,
    minSupport,
    mode = "dots",
    width = 100,
    height = 32,
    format,
    locale,
    strings = EN_CALIBRATION,
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
  useEntrance(hostRef, mode === "bars" ? "reveal" : "settle", animate, {
    selector:
      mode === "bars"
        ? 'line[data-mc-ink="accent"]'
        : 'circle[data-mc-ink="accent"], circle[data-mc-w="support"]',
  });

  // `defaultMinSupport` sums the whole series, so it is memoised: the
  // interactive entry re-renders on every unit crossed during a scrub.
  const ms = useMemo(() => minSupport ?? defaultMinSupport(data), [minSupport, data]);
  const supportHeight = Math.max(4, Math.round(height * 0.18));
  const geo = useMemo(
    () => calibrationGeometry({ data, bins, minSupport: ms, width, height, supportHeight }),
    [data, bins, ms, width, height, supportHeight],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);

  const locate = useCallback(
    (x: number) => {
      if (geo.points.length === 0) return null;
      let best = 0;
      let bestD = Infinity;
      geo.points.forEach((p, i) => {
        const d = Math.abs(p.x - x);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      return best;
    },
    [geo],
  );

  const datum = useCallback(
    (i: number) => {
      const p = geo.points[i];
      return {
        index: i,
        value: p?.observed ?? null,
        label: p ? fmt(p.predicted) : undefined,
        formatted: p
          ? strings.calibrationChip(
              fmt(p.predicted),
              fmt(p.observed),
              String(p.count),
              p.lowSupport ? strings.calibrationLow : "",
            )
          : undefined,
      };
    },
    [geo, fmt, strings],
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

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : calibrationSummary(geo.points, geo.maxGap, strings, fmt);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const shown = active ?? selected;
  const pt = shown !== null ? geo.points[shown] : undefined;
  const pinned = selected !== null && selected !== active ? geo.points[selected] : undefined;
  const announced = pt
    ? strings.calibrationAt(
        fmt(pt.predicted),
        fmt(pt.observed),
        pt.count,
        pt.lowSupport ? strings.calibrationLow : "",
      )
    : "";

  return (
    <span ref={hostRef} {...wrap("mc-calib-live", className, style)} {...named(label)} {...bind}>
      <StaticCalibrationStrip
        {...rest}
        data={data}
        bins={bins}
        minSupport={minSupport}
        mode={mode}
        width={width}
        height={height}
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
            stroke="var(--mc-accent)"
            data-mc-w="tick"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {active !== null && geo.points[active] ? (
          <>
            <line
              x1={geo.points[active]!.x}
              x2={geo.points[active]!.x}
              y1={0.5}
              y2={height - 0.5}
              data-mc-ink="muted"
              data-mc-w="tick"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={geo.points[active]!.x}
              cy={geo.points[active]!.y}
              r={2.4}
              fill="none"
              stroke="var(--mc-accent)"
              data-mc-w="support"
              vectorEffect="non-scaling-stroke"
            />
          </>
        ) : null}
        {rest.children}
      </StaticCalibrationStrip>
      <LiveRegion>{announced}</LiveRegion>
      {readout && pt ? (
        <span className="mc-spark-readout" style={crosshairReadoutStyle(pt.x, width)}>
          {strings.calibrationChip(
            fmt(pt.predicted),
            fmt(pt.observed),
            String(pt.count),
            pt.lowSupport ? strings.calibrationLow : "",
          )}
        </span>
      ) : null}
    </span>
  );
}
