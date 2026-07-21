"use client";
// Interactive <DualSparkline>. useActivePicker owns interaction: one pointer
// listener + nearest-x lookup announcing BOTH series ("Point 9 of 12: 17 vs
// 15."), ←/→ step x, click / Enter / Space selects (onSelect). The crosshair
// touches both lines. Composes the static component (canon).
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import {
  named,
  fillFor,
  useActivePicker,
  wrap,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_VS, type VsStrings } from "../../core/strings-vs.js";
import { EN_SERIES, type SeriesStrings } from "../../core/summary.js";
import { isFiniteValue } from "../../core/types.js";
import { dualSparklineGeometry } from "./geometry.js";
import {
  DualSparkline as StaticDualSparkline,
  dualSummary,
  type DualSparklineProps,
} from "./index.js";

export interface InteractiveDualSparklineProps extends DualSparklineProps, PickerProps {
  strings?: VsStrings;
  seriesStrings?: SeriesStrings;
  /**
   * Opt-in entrance motion (default `false`): the primary line draws on when
   * the chart first mounts client-side. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function DualSparkline(props: InteractiveDualSparklineProps): React.ReactNode {
  const {
    data,
    compare,
    curve = "linear",
    band,
    label = "none",
    domain,
    width = 60,
    height = 16,
    format,
    locale,
    strings = EN_VS,
    seriesStrings = EN_SERIES,
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

  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const fontSize = labelFont(height, 0.4);
  // Last finite primary value — scanned backwards in place (a `[...data]
  // .reverse()` copies the whole series) and memoised: the interactive entry
  // re-renders on every unit crossed during a scrub, and this feeds `geo`.
  const lastText = useMemo(() => {
    if (label !== "last") return undefined;
    for (let i = data.length - 1; i >= 0; i--) {
      const v = data[i];
      if (Number.isFinite(v ?? Number.NaN)) return v as number;
    }
    return undefined;
  }, [data, label]);
  const geo = useMemo(
    () =>
      dualSparklineGeometry({
        width,
        height,
        primary: data,
        compare,
        domain,
        band,
        curve,
        gutterCh: lastText !== undefined ? fmt(lastText).length : 0,
        fontSize,
      }),
    [width, height, data, compare, domain, band, curve, lastText, fmt, fontSize],
  );
  // Navigable unit = one x position on the SHARED index range — 1:1 with the
  // data index of both series (the shorter one simply has no point there).
  const n = Math.max(data.length, compare.length);

  const locate = useCallback(
    (x: number) => {
      if (n === 0) return null;
      const span = geo.plot.x1 - geo.plot.x0;
      const i = Math.round(((x - geo.plot.x0) / Math.max(1, span)) * (n - 1));
      return Math.min(n - 1, Math.max(0, i));
    },
    [n, geo],
  );

  // `value` = the PRIMARY series' value at that x (the accent line is what the
  // chart is about); the compare value rides in the readout + announcement,
  // which state both ("17 vs 15").
  const datum = useCallback(
    (i: number) => {
      const v = data[i];
      const c = compare[i];
      return {
        index: i,
        value: isFiniteValue(v) ? v : null,
        formatted: `${isFiniteValue(v) ? fmt(v) : "—"} / ${isFiniteValue(c) ? fmt(c) : "—"}`,
      };
    },
    [data, compare, fmt],
  );

  const { active, selected, bind } = useActivePicker({
    count: n,
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
        : dualSummary(data, compare, fmt, strings, seriesStrings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  // The x shown by the crosshair + readout: the live hover/keyboard focus,
  // falling back to a pinned selection when the pointer has left.
  const shown = active ?? selected;
  const pv = shown !== null ? data[shown] : undefined;
  const cv = shown !== null ? compare[shown] : undefined;
  const announced =
    shown !== null
      ? strings.vsAt(
          shown + 1,
          n,
          isFiniteValue(pv) ? fmt(pv) : seriesStrings.noData,
          isFiniteValue(cv) ? fmt(cv) : seriesStrings.noData,
        )
      : "";
  const crossX =
    shown !== null ? (geo.primaryPoints[shown]?.[0] ?? geo.comparePoints[shown]?.[0]) : undefined;
  const selPoint =
    selected !== null ? (geo.primaryPoints[selected] ?? geo.comparePoints[selected] ?? null) : null;

  return (
    <span ref={hostRef} {...wrap("mc-dual-live", className, style)} {...named(ariaLabel)} {...bind}>
      <StaticDualSparkline
        {...rest}
        style={fillFor(style)}
        data={data}
        compare={compare}
        curve={curve}
        band={band}
        label={label}
        domain={domain}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        seriesStrings={seriesStrings}
        summary={false}
      >
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
        {crossX !== undefined ? (
          <>
            <line
              x1={crossX}
              y1={0}
              x2={crossX}
              y2={height}
              data-mc-ink="muted"
              data-mc-w="support"
              vectorEffect="non-scaling-stroke"
            />
            {geo.primaryPoints[shown!] ? (
              <circle
                cx={geo.primaryPoints[shown!]![0]}
                cy={geo.primaryPoints[shown!]![1]}
                r={2}
                data-mc-ink="accent"
              />
            ) : null}
            {geo.comparePoints[shown!] ? (
              <circle
                cx={geo.comparePoints[shown!]![0]}
                cy={geo.comparePoints[shown!]![1]}
                r={1.5}
                style={{ fill: "var(--mc-neutral)" }}
              />
            ) : null}
          </>
        ) : null}
        {rest.children}
      </StaticDualSparkline>
      <LiveRegion>{announced}</LiveRegion>
      {readout && shown !== null && crossX !== undefined ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${(crossX / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {`${isFiniteValue(pv) ? fmt(pv) : "—"} / ${isFiniteValue(cv) ? fmt(cv) : "—"}`}
        </span>
      ) : null}
    </span>
  );
}
