"use client";
// Interactive <HistogramStrip>. useActivePicker owns interaction: one pointer
// listener + bin-by-x-band lookup, ←/→ rove bins ("40 to 50: 34 values.").
// click / Enter / Space pins one (onSelect).
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
import { histogramGeometry } from "./geometry.js";
import {
  HistogramStrip as StaticHistogramStrip,
  histogramSummary,
  type HistogramStripProps,
} from "./index.js";

export interface InteractiveHistogramStripProps extends HistogramStripProps, PickerProps {
  strings?: DistStrings;
  /**
   * Opt-in entrance motion (default `false`): bins rise from the baseline
   * when the chart first mounts client-side. Inert on the server and on
   * hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function HistogramStrip(props: InteractiveHistogramStripProps): React.ReactNode {
  const {
    data,
    bins,
    markValue,
    domain,
    width = 60,
    height = 16,
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
  useEntrance(hostRef, "rise", animate);

  const geo = useMemo(
    () => histogramGeometry({ width, height, values: data, domain, bins, markValue }),
    [width, height, data, domain, bins, markValue],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  // Counts are cardinal integers, not axis values — format them with the locale
  // (thousands grouping) but never the value `format` (units/decimals).
  const countFmt = useMemo(
    () => makeFormatter(undefined, locale, { maximumFractionDigits: 0 }),
    [locale],
  );

  const modal = geo.modalBin >= 0 ? geo.bars[geo.modalBin] : undefined;
  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : histogramSummary(geo.total, modal, fmt, strings);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const locate = useCallback(
    (x: number) => {
      if (geo.bars.length === 0 || geo.pitch === 0) return null;
      const i = Math.floor(x / geo.pitch);
      return i >= 0 && i < geo.bars.length ? i : null;
    },
    [geo],
  );
  // `index` is the BIN index (not an index into `data`): a histogram's navigable
  // unit is the bin. `value` is the bin's count — `null` for an empty bin — and
  // `label` its formatted range.
  const datum = useCallback(
    (i: number) => {
      const b = geo.bars[i];
      return {
        index: i,
        value: b && b.count > 0 ? b.count : null,
        label: b ? `${fmt(b.x0)}–${fmt(b.x1)}` : undefined,
        formatted: b ? `${fmt(b.x0)}–${fmt(b.x1)}: ${countFmt(b.count)}` : "",
      };
    },
    [geo, fmt, countFmt],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo.bars.length,
    width,
    height,
    locate,
    datum,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
  });

  // The bin shown by the outline + readout: the live hover/keyboard focus,
  // falling back to a pinned selection when the pointer has left.
  const shown = active ?? selected;
  const bar = shown !== null ? geo.bars[shown] : undefined;
  const announced = bar ? strings.binAt(fmt(bar.x0), fmt(bar.x1), bar.count) : "";

  const outline = (i: number, pinned: boolean) => {
    const b = geo.bars[i];
    if (!b) return null;
    return (
      <rect
        x={b.x - 0.5}
        y={-0.5}
        width={b.w + 1}
        height={height + 1}
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
      {...wrap("mc-histogram-live", className, style)}
      {...named(label)}
      {...bind}
    >
      <StaticHistogramStrip
        {...rest}
        style={fillFor(style)}
        data={data}
        bins={bins}
        markValue={markValue}
        domain={domain}
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
      </StaticHistogramStrip>
      <LiveRegion>{announced}</LiveRegion>
      {readout && bar ? (
        <span className="mc-spark-readout" style={crosshairReadoutStyle(bar.x + bar.w / 2, width)}>
          {`${fmt(bar.x0)}–${fmt(bar.x1)}: ${countFmt(bar.count)}`}
        </span>
      ) : null}
    </span>
  );
}
