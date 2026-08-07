"use client";
// Interactive <SparkBar>. useActivePicker: one pointer listener + nearest-bar-by-x,
// roving keyboard, onActive/onSelect. Static renders bars/colors/labels/annotations;
// client overlays focus/pin/readout only (re-implementing SVG used to mis-color ties).
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { describeSeries, EN_SERIES, type SeriesStrings } from "../../core/summary.js";
import { EN_SLOTS, type SlotStrings } from "../../core/strings-slots.js";
import { chartSide, isFiniteValue } from "../../core/types.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import {
  CHIP,
  named,
  fillFor,
  navOrder,
  useActivePicker,
  wrap,
  type LabeledSeriesProps,
  type PickerProps,
} from "../../shared/interactive.js";
import { announceNamed, chipNamed, type NamedStrings } from "../../core/strings-named.js";
import { DEFAULT_HEIGHT, DEFAULT_WIDTH, labelMetrics, sparkBarGeometry } from "./geometry.js";
import { SparkBar as StaticSparkBar, type SparkBarProps } from "./index.js";

// Bars carry valence tokens (bar/accent/positive/negative), not just "bar" —
// the default `rise` selector only matches "bar", so every ink role is listed.
const BAR_SELECTOR =
  'rect[data-mc-ink="bar"], rect[data-mc-ink="accent"], rect[data-mc-ink="positive"], rect[data-mc-ink="negative"]';

// Point announcement uses the shared series template + the slot `pointEmpty`
// wording (a non-finite bar is an empty slot, not a zero). One default object so
// the announcement stays byte-identical to `describeSeries` unless overridden.
const DEFAULT_SERIES_STRINGS: SeriesStrings & SlotStrings & Partial<NamedStrings> = {
  ...EN_SERIES,
  ...EN_SLOTS,
};

export interface InteractiveSparkBarProps extends SparkBarProps, PickerProps, LabeledSeriesProps {
  /** Localized announcement templates; defaults to the English series strings. */
  strings?: SeriesStrings & SlotStrings & Partial<NamedStrings>;
  /**
   * Opt-in entrance motion (default `false`): the bars rise from the baseline
   * when the chart first mounts client-side. Inert on the server and on
   * hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function SparkBar(props: InteractiveSparkBarProps): React.ReactNode {
  const {
    data,
    domain,
    width: widthProp = DEFAULT_WIDTH,
    height: heightProp = DEFAULT_HEIGHT,
    mode = "bar",
    gap = 0.25,
    label = "none",
    positive = "up",
    color,
    title,
    summary,
    format,
    locale,
    strings = DEFAULT_SERIES_STRINGS,
    animate = false,
    readout = true,
    labels,
    className,
    style,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
    ...rest
  } = props;

  // The hit box and the readout are sized in viewBox units off this box, so it
  // has to be the same resolved box the static renders — not the raw prop.
  const width = chartSide(widthProp, DEFAULT_WIDTH);
  const height = chartSide(heightProp, DEFAULT_HEIGHT);

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "rise", animate, { selector: BAR_SELECTOR, origin: "signed" });

  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);

  // Geometry must match the static entry EXACTLY (same right gutter when
  // label="last" shifts the bars), so the overlay + pointer math never drift.
  const geo = useMemo(() => {
    let labelText: string | undefined;
    if (label === "last" && mode === "bar") {
      for (let i = data.length - 1; i >= 0; i--) {
        const v = data[i];
        if (isFiniteValue(v)) {
          labelText = fmt(v);
          break;
        }
      }
    }
    const metrics =
      labelText !== undefined ? labelMetrics(labelText, width, height, props.labelSize) : undefined;
    return sparkBarGeometry(data, {
      width,
      height,
      mode,
      domain,
      gap,
      gutterRight: metrics?.gutter ?? 0,
    });
  }, [data, width, height, mode, domain, gap, label, props.labelSize, fmt]);

  // Bars only (gaps dropped) — the navigable stops. `index` in the datum is the
  // DATA index (what the consumer indexes into); we walk finite bars and never
  // land on a gap.
  const stops = useMemo(() => geo.bars.map((b) => b.index), [geo]);
  // data index → bar. `barAt` runs up to three times a render (focus outline,
  // pin outline, readout) and the bars array is gap-compacted, so a `.find`
  // scan here is a full pass over the series on every unit crossed.
  const barAt = useMemo(() => new Map(geo.bars.map((b) => [b.index, b])), [geo]);

  // ONE listener; nearest bar by x distance to its centre in viewBox space.
  const locate = useCallback(
    (x: number) => {
      if (geo.bars.length === 0) return null;
      let best = geo.bars[0]!.index;
      let bestDist = Infinity;
      for (const b of geo.bars) {
        const d = Math.abs(b.x + b.width / 2 - x);
        if (d < bestDist) {
          bestDist = d;
          best = b.index;
        }
      }
      return best;
    },
    [geo],
  );

  const step = useCallback((cur: number, key: string) => navOrder(stops, cur, key), [stops]);

  const datum = useCallback(
    (i: number) => ({
      index: i,
      value: isFiniteValue(data[i]) ? (data[i] as number) : null,
      label: labels?.[i],
      formatted: isFiniteValue(data[i]) ? fmt(data[i] as number) : undefined,
    }),
    [data, fmt, labels],
  );

  const { active, selected, bind } = useActivePicker({
    count: stops.length,
    width,
    height,
    locate,
    step,
    datum,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
  });

  const accName =
    summary === false ? undefined : (summary ?? describeSeries(data, { format, locale, strings }));

  const outline = (i: number, pinned: boolean) => {
    const bar = barAt.get(i);
    if (!bar) return null;
    // focus / pinned outline over the bar — the static keeps the bar's own
    // valence color; this reads as "measuring", not a recolor. `data-mc-active`
    // hands the paint to styles.css: the ring alone is invisible on the endpoint
    // bar, which is itself accent-inked, so the token block adds the on-fill wash.
    return (
      <rect
        x={bar.x}
        y={bar.y}
        width={bar.width}
        height={bar.height}
        fill="none"
        data-mc-active=""
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
        shapeRendering="crispEdges"
      />
    );
  };

  const shown = active ?? selected;
  const shownBar = shown !== null ? barAt.get(shown) : undefined;
  const shownValue = shownBar && isFiniteValue(shownBar.value) ? shownBar.value : null;
  // `shown` is a DATA index (bars are gap-compacted, so `stops.length` would
  // undercount) — total is `data.length` and `shown + 1` its 1-based position.
  const name = labels?.[shown ?? -1];
  const announced =
    shown === null
      ? ""
      : announceNamed(
          shownValue !== null
            ? strings.point(shown + 1, data.length, fmt(shownValue))
            : strings.pointEmpty(shown + 1, data.length),
          name,
          strings,
        );

  return (
    <span
      ref={hostRef}
      {...wrap("mc-sparkbar-interactive", className, style)}
      {...named([title, accName].filter(Boolean).join(". ") || undefined)}
      {...bind}
    >
      <StaticSparkBar
        data={data}
        domain={domain}
        width={width}
        height={height}
        mode={mode}
        gap={gap}
        label={label}
        positive={positive}
        color={color}
        format={format}
        locale={locale}
        summary={false}
        style={fillFor(style)}
      >
        {rest.children}
        {selected !== null && selected !== active ? outline(selected, true) : null}
        {active !== null ? outline(active, false) : null}
      </StaticSparkBar>
      <LiveRegion>{announced}</LiveRegion>
      {readout && shownBar && shownValue !== null ? (
        <span className="mc-spark-readout" {...CHIP}>
          {chipNamed(fmt(shownValue), name, strings)}
        </span>
      ) : null}
    </span>
  );
}
