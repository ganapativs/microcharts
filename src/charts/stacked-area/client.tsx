"use client";
// Interactive <StackedArea>. Nearest-x lookup announces ALL layers ("Point 8 of
// 12: Mobile 45%, Web 38%, API 17%."); ←/→ step x-columns, Enter/Space/click
// selects a column (onSelect). useActivePicker owns interaction; the static is
// composed (summary={false}, crosshair + pin as its children) so the SVG never
// drifts.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import type { Curve } from "../../core/path.js";
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
import { EN_STACK, type StackStrings } from "../../core/strings-stack.js";
import { EN_SERIES, type SeriesStrings } from "../../core/summary.js";
import { isFiniteValue } from "../../core/types.js";
import { stackedAreaGeometry } from "./geometry.js";
import {
  StackedArea as StaticStackedArea,
  stackedAreaSummary,
  type StackedAreaProps,
} from "./index.js";

export interface InteractiveStackedAreaProps extends StackedAreaProps, PickerProps {
  strings?: StackStrings;
  seriesStrings?: SeriesStrings;
  /**
   * Opt-in entrance motion (default `false`): the layers wipe on when the
   * chart first mounts client-side. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function StackedArea(props: InteractiveStackedAreaProps): React.ReactNode {
  const {
    data,
    mode = "stacked",
    order = "data",
    curve = "linear",
    domain,
    width = 60,
    height = 16,
    format,
    locale,
    strings = EN_STACK,
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
  useEntrance(hostRef, "wipe", animate);

  const series = useMemo(() => {
    let s = data.slice(0, 3);
    if (order === "asc") {
      s = [...s].sort(
        (a, b) =>
          a.values.reduce<number>((acc, v) => acc + (isFiniteValue(v) ? v : 0), 0) -
          b.values.reduce<number>((acc, v) => acc + (isFiniteValue(v) ? v : 0), 0),
      );
    }
    return s;
  }, [data, order]);

  const usedCurve: Curve = mode === "ridge" ? "smooth" : curve;
  const fontSize = labelFont(height, 0.3);
  const geo = useMemo(
    () =>
      stackedAreaGeometry({
        width,
        height,
        series: series.map((s) => s.values),
        domain,
        curve: usedCurve,
        // MUST mirror the static: the endpoint-label gutter shrinks the plot,
        // so an overlay computed without it lands off the rendered marks.
        gutterCh: rest.label === "last" ? 4 : 0,
        fontSize,
      }),
    [width, height, series, domain, usedCurve, rest.label, fontSize],
  );
  const pctFmt = useMemo(
    () => makeFormatter(format, locale, { style: "percent", maximumFractionDigits: 0 }),
    [format, locale],
  );

  // x-column geometry: the navigable units are the n time-columns (x-samples).
  const colX = useCallback(
    (c: number) =>
      geo.n > 1
        ? geo.plot.x0 + (c * (geo.plot.x1 - geo.plot.x0)) / (geo.n - 1)
        : (geo.plot.x0 + geo.plot.x1) / 2,
    [geo],
  );
  const locate = useCallback(
    (x: number) => {
      if (geo.n === 0) return null;
      const span = geo.plot.x1 - geo.plot.x0;
      const i = Math.round(((x - geo.plot.x0) / Math.max(1, span)) * (geo.n - 1));
      return Math.min(geo.n - 1, Math.max(0, i));
    },
    [geo],
  );
  // The LEADER band at a column, not the whole stack: listing every band makes
  // the chip grow with the series count — unbounded, and already 206px past its
  // cap at three bands (see readout-containment tests). The full breakdown is
  // in the live region, which is where a screen reader wants it anyway.
  const leaderChip = useCallback(
    (shares: readonly number[]) => {
      let top = 0;
      for (let i = 1; i < series.length; i++) {
        if ((shares[i] ?? 0) > (shares[top] ?? 0)) top = i;
      }
      const name = series[top]?.label ?? strings.seriesFallback(top + 1);
      return `${name} ${pctFmt(shares[top] ?? 0)}`;
    },
    [series, pctFmt, strings],
  );
  // index = column (x-sample) index; value = the stack total at that column
  // (series summed, negatives clamped to 0 — matching the drawn stack).
  // `formatted` mirrors the chip (leader band).
  const datum = useCallback(
    (i: number) => {
      const shares = geo.sharesAt[i];
      return {
        index: i,
        value: series.reduce<number>(
          (t, s) => t + (isFiniteValue(s.values[i]) ? Math.max(0, s.values[i] as number) : 0),
          0,
        ),
        formatted: shares ? leaderChip(shares) : undefined,
      };
    },
    [series, geo, leaderChip],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo.n,
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
        : stackedAreaSummary(series, geo.sharesAt.at(-1) ?? [], geo.n, pctFmt, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  // The column shown by the crosshair + readout: live focus, falling back to a
  // pinned selection when the pointer has left.
  const shown = active ?? selected;
  const shares = shown !== null ? geo.sharesAt[shown] : undefined;
  const announced =
    shown !== null && shares
      ? strings.stackAt(
          shown + 1,
          geo.n,
          series
            .map((s, i) =>
              isFiniteValue(s.values[shown])
                ? `${s.label ?? strings.seriesFallback(i + 1)} ${pctFmt(shares[i] ?? 0)}`
                : `${s.label ?? strings.seriesFallback(i + 1)}: ${seriesStrings.noData.replace(/\.$/, "").toLowerCase()}`,
            )
            .join(", "),
        )
      : "";
  const shownX = shown !== null && geo.n > 0 ? colX(shown) : undefined;
  const selX = selected !== null && geo.n > 0 ? colX(selected) : undefined;

  return (
    <span
      ref={hostRef}
      {...wrap("mc-stacked-live", className, style)}
      {...named(ariaLabel)}
      {...bind}
    >
      <StaticStackedArea
        {...rest}
        data={data}
        mode={mode}
        order={order}
        curve={curve}
        domain={domain}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        labelAt={shown !== null ? shown : undefined}
        style={fillFor(style)}
      >
        {selX !== undefined && selected !== active ? (
          <line
            x1={selX}
            y1={0}
            x2={selX}
            y2={height}
            data-mc-ink="accent"
            data-mc-w="tick"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {shownX !== undefined ? (
          <line
            x1={shownX}
            y1={0}
            x2={shownX}
            y2={height}
            data-mc-ink="muted"
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticStackedArea>
      <LiveRegion>{announced}</LiveRegion>
      {readout && shown !== null && shares && shownX !== undefined ? (
        <span className="mc-spark-readout" style={crosshairReadoutStyle(shownX, width)}>
          {leaderChip(shares)}
        </span>
      ) : null}
    </span>
  );
}
