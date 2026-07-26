"use client";
// Interactive <ShiftHistogram>. useActivePicker owns interaction: one pointer
// listener + grid lookup (pointer x → bin), ←/→ step bins, M jumps to the two
// median bins, click / Enter / Space pins one (onSelect). The live region states
// each bin's before/after proportions. Composes the static component (canon);
// the crosshair + readout chip are overlay children.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter, makePercentFormatter } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import { EN_SHIFT, type ShiftStrings } from "../../core/strings-shift.js";
import {
  named,
  fillFor,
  nav1d,
  useActivePicker,
  wrap,
  crosshairReadoutStyle,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { round2 } from "../../core/types.js";
import { shiftHistogramGeometry } from "./geometry.js";
import {
  ShiftHistogram as StaticShiftHistogram,
  shiftSummary,
  shiftDelta,
  type ShiftHistogramProps,
} from "./index.js";

export interface InteractiveShiftHistogramProps extends ShiftHistogramProps, PickerProps {
  strings?: ShiftStrings;
  /**
   * Opt-in entrance motion (default `false`): the mirrored bins RISE out of
   * the shared center axis, cascading left to right, when the chart first
   * mounts client-side. Inert on the server and on hydrated server HTML;
   * `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function ShiftHistogram(props: InteractiveShiftHistogramProps): React.ReactNode {
  const {
    data,
    bins,
    mode = "mirror",
    seriesLabels = ["before", "after"] as const,
    width = 80,
    height = 20,
    format,
    locale,
    strings = EN_SHIFT,
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
  // Bins mirror both up (before) and down (after) from a shared center axis.
  // Each bin rect carries its own `data-mc-origin` in the static markup — up
  // bins pin their bottom edge to the axis, mirror-mode down bins pin their top
  // edge — so every bin grows out of the shared center line and stays attached
  // to it, instead of detaching under a chart-wide centered origin. order "x"
  // sweeps the sequence left-to-right. `rect` alone covers before (neutral
  // fill) and after (filled in mirror mode, outlined in overlay mode) — no
  // other rects live in this chart.
  useEntrance(hostRef, "rise", animate, { selector: "rect", order: "x" });

  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  // Bin SHARES are percents of their own sample, so they take `locale` but never
  // the value `format` (which carries the measurement's units). The old
  // `${Math.round(share * 100)}%` was an en-US percent in a visible chip.
  const pct = useMemo(() => makePercentFormatter(locale), [locale]);
  // Mirror the static's label gutter so `totalWidth` matches the rendered
  // viewBox — without it the pointer map and readout run short and the
  // crosshair drifts from the cursor.
  const geo = useMemo(() => {
    const base = shiftHistogramGeometry({
      width,
      height,
      before: data.before,
      after: data.after,
      bins,
      mode,
      domain: props.domain,
    });
    const showLabel = (props.label ?? "shift") === "shift" && base != null && base.shift !== null;
    const gutterCh = showLabel ? shiftDelta(base!, fmt).length : 0;
    return shiftHistogramGeometry({
      width,
      height,
      before: data.before,
      after: data.after,
      bins,
      mode,
      domain: props.domain,
      gutterCh,
      fontSize: labelFont(height, 0.42),
    });
  }, [width, height, data.before, data.after, bins, mode, props.domain, props.label, fmt]);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : geo === null
          ? strings.noData
          : shiftSummary(geo, fmt, seriesLabels, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const count = geo?.bins.length ?? 0;

  const locate = useCallback(
    (x: number) => {
      if (!geo || geo.bins.length === 0) return null;
      let best = 0;
      let bestDist = Infinity;
      geo.bins.forEach((b, i) => {
        const d = Math.abs(b.x + b.width / 2 - x);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      return best;
    },
    [geo],
  );

  // `index` is the BIN index (bins are shared by both distributions), not an
  // index into either sample. `value` is the bin's SHIFT — its after-share minus
  // its before-share, the quantity this chart exists to show — and is `null`
  // when the bin is empty on both sides. `label` is the bin's formatted range.
  const datum = useCallback(
    (i: number) => {
      const b = geo?.bins[i];
      return {
        index: i,
        value:
          b && (b.beforeShare > 0 || b.afterShare > 0)
            ? round2(b.afterShare - b.beforeShare)
            : null,
        label: b ? `${fmt(b.x0)}–${fmt(b.x1)}` : undefined,
        formatted: b
          ? `${fmt(b.x0)}–${fmt(b.x1)}: ${pct(b.beforeShare)} / ${pct(b.afterShare)}`
          : undefined,
      };
    },
    [geo, fmt, pct],
  );

  const medianBins = useMemo(() => {
    if (!geo) return [] as number[];
    const idx = (x: number | undefined) =>
      x === undefined ? -1 : geo.bins.findIndex((b) => x >= b.x && x <= b.x + b.width);
    return [idx(geo.medians.before?.x), idx(geo.medians.after?.x)].filter((i) => i >= 0);
  }, [geo]);

  // One custom key ("m" cycles the two median bins); everything else falls back
  // to the shared 1-D navigation.
  const step = useCallback(
    (cur: number, key: string) => {
      if (key === "m" || key === "M") {
        if (medianBins.length === 0) return null;
        return medianBins[(medianBins.indexOf(cur) + 1) % medianBins.length]!;
      }
      return nav1d(cur, count, key);
    },
    [medianBins, count],
  );

  const { active, selected, bind } = useActivePicker({
    count,
    width: geo?.totalWidth ?? width,
    height,
    locate,
    datum,
    step,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
  });

  // The bin shown by the outline + readout: the live hover/keyboard focus,
  // falling back to a pinned selection when the pointer has left.
  const shown = active ?? selected;
  const b = shown !== null && geo ? geo.bins[shown] : undefined;
  const announced = b
    ? strings.shiftBin(fmt(b.x0), fmt(b.x1), pct(b.beforeShare), pct(b.afterShare))
    : "";

  const outline = (i: number, pinned: boolean) => {
    const bin = geo?.bins[i];
    if (!bin) return null;
    return (
      <rect
        x={bin.x - 0.6}
        y={0.5}
        width={bin.width + 1.2}
        height={height - 1}
        fill="none"
        stroke="var(--mc-accent)"
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  return (
    <span
      ref={hostRef}
      {...wrap("mc-shift-histogram-live", className, style)}
      {...named(ariaLabel)}
      {...bind}
    >
      <StaticShiftHistogram
        {...rest}
        style={fillFor(style)}
        data={data}
        bins={bins}
        mode={mode}
        seriesLabels={seriesLabels}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {selected !== null && selected !== active ? outline(selected, true) : null}
        {active !== null ? outline(active, false) : null}
        {rest.children}
      </StaticShiftHistogram>
      {readout && b && geo ? (
        <span
          className="mc-shift-readout mc-spark-readout"
          style={crosshairReadoutStyle(b.x + b.width / 2, geo.totalWidth)}
        >
          {`${fmt(b.x0)}–${fmt(b.x1)}: ${pct(b.beforeShare)} / ${pct(b.afterShare)}`}
        </span>
      ) : null}
      <LiveRegion>{announced}</LiveRegion>
    </span>
  );
}
