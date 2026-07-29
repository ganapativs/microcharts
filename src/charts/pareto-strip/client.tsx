"use client";
// Interactive <ParetoStrip>. useActivePicker owns interaction: one pointer
// listener + nearest-bar-by-x lookup, ←/→/Home/End rove bars, T jumps to
// threshold-crossing bar, click / Enter / Space selects (onSelect). The live
// region states each bar's share + cumulative.
import { useCallback, useMemo, useRef } from "react";
import { labelFont } from "../../core/labels.js";
import { EN_PARETO, type ParetoStrings } from "../../core/strings-pareto.js";
import {
  named,
  fillFor,
  navOrder,
  useActivePicker,
  wrap,
  crosshairReadoutStyle,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { chartSide } from "../../core/types.js";
import {
  paretoGeometry,
  DEFAULT_HEIGHT,
  DEFAULT_MAX_ITEMS,
  DEFAULT_THRESHOLD,
  DEFAULT_WIDTH,
} from "./geometry.js";
import {
  ParetoStrip as StaticParetoStrip,
  paretoPercent,
  paretoSummary,
  type ParetoStripProps,
} from "./index.js";

export interface InteractiveParetoStripProps extends ParetoStripProps, PickerProps {
  strings?: ParetoStrings;
  /**
   * Opt-in entrance motion (default `false`): bars rise from the baseline,
   * left to right, on first client-side mount, and the cumulative-share line
   * fades in once the bars have mostly landed. Inert on the server and on
   * hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function ParetoStrip(props: InteractiveParetoStripProps): React.ReactNode {
  const {
    data,
    threshold = DEFAULT_THRESHOLD,
    maxItems = DEFAULT_MAX_ITEMS,
    unit = "causes",
    metric = "the total",
    width: widthProp = DEFAULT_WIDTH,
    height: heightProp = DEFAULT_HEIGHT,
    locale,
    strings = EN_PARETO,
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

  // The same resolved box the static lays out in — the pointer map is scaled by
  // it, so a raw `height={NaN}` would size the hit box against a frame `Chart`
  // had already clamped.
  const width = chartSide(widthProp, DEFAULT_WIDTH);
  const height = chartSide(heightProp, DEFAULT_HEIGHT);

  // The same percent formatter the static renders with — the label gutter is
  // measured off its output, so the two entries must widen identically.
  const pct = useMemo(() => paretoPercent(locale), [locale]);

  const hostRef = useRef<HTMLSpanElement>(null);
  // The cumulative line carries "muted" ink, not data/accent, so it's not a
  // bar-rise candidate — it's excluded from the selector below (rects only)
  // Three acts: the bars cascade left→right (story) and the cumulative line
  // is deferred to the closing act — it arrives as the last bar lands, the
  // conclusion drawn over the evidence.
  useEntrance(hostRef, "rise", animate, {
    selector: 'rect[data-mc-ink="accent"], rect[data-mc-ink="neutral"], rect[data-mc-ink="bar"]',
    order: "x",
    // Bars cascade up L→R by rank, then the cumulative 80% curve DRAWS across
    // them — the running total traces itself over the evidence.
    link: 'path[data-mc-ink="muted"]',
  });

  // Mirror the static's label gutter so `totalWidth` matches the rendered
  // viewBox — without it the pointer map and readout run short and the
  // crosshair drifts from the cursor.
  const geo = useMemo(() => {
    const base = paretoGeometry({ width, height, data, threshold, maxItems });
    const showLabel = (props.label ?? "count") === "count" && base != null && base.crossing != null;
    // Measure the string `strings` will actually paint — a translated caption is
    // a different length, and the gutter is reserved from this count.
    const gutterCh = showLabel
      ? strings.paretoCount(base!.vitalCount, base!.n, pct(base!.cumAtCrossing)).length
      : 0;
    return paretoGeometry({
      width,
      height,
      data,
      threshold,
      maxItems,
      gutterCh,
      fontSize: labelFont(height),
    });
  }, [width, height, data, threshold, maxItems, props.label, pct, strings]);

  // Only bars that PAINT are navigable — a zero-magnitude category (or an
  // all-zero dataset, which draws nothing at all) must not answer the pointer
  // with an outline and a readout chip over blank strip.
  const stops = useMemo(() => geo?.painted ?? [], [geo]);
  const vbWidth = geo?.totalWidth ?? width;

  // Nearest painted bar to the pointer x (viewBox space). Bars index 1:1 into
  // the sorted/rolled-up rows — datum.index is that bar index ("Other" is the
  // last bar when present, never re-ranked).
  const locate = useCallback(
    (x: number) => {
      if (!geo || stops.length === 0) return null;
      let best = stops[0]!;
      let bestDist = Infinity;
      stops.forEach((i) => {
        const b = geo.bars[i]!;
        const d = Math.abs(b.x + b.width / 2 - x);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      return best;
    },
    [geo, stops],
  );

  // Rove the painted bars (the space is sparse when a category is zero), plus
  // T → the threshold-crossing bar (kept from the old client).
  const step = useCallback(
    (cur: number, key: string) => {
      if (key === "t" || key === "T")
        return geo?.crossing && stops.includes(geo.crossing.index) ? geo.crossing.index : null;
      return navOrder(stops, cur, key);
    },
    [geo, stops],
  );

  const datum = useCallback(
    (i: number) => {
      const b = geo?.bars[i];
      return {
        index: i,
        value: b?.value ?? null,
        label: b?.label,
        formatted: b ? `${b.label} ${pct(b.share)} · ${pct(b.cum)}` : "",
      };
    },
    [geo, pct],
  );

  const { active, selected, bind } = useActivePicker({
    count: stops.length,
    width: vbWidth,
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
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : geo === null
          ? strings.noData
          : paretoSummary(geo, { unit, metric }, strings, pct);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  // A bar is addressable only while it paints — a controlled `selectedIndex`
  // may still name a zero-magnitude one.
  const barAt = (i: number) => {
    const b = geo?.bars[i];
    return b && b.height > 0 ? b : undefined;
  };

  const outline = (i: number, pinned: boolean) => {
    const b = barAt(i);
    if (!b) return null;
    return (
      <rect
        x={b.x - 0.6}
        y={0.5}
        width={b.width + 1.2}
        height={height - 1}
        fill="none"
        stroke="var(--mc-accent)"
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const b = shown !== null ? barAt(shown) : undefined;
  const announced = b ? strings.paretoAt(b.label, pct(b.share), pct(b.cum)) : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-pareto-strip-live", className, style)}
      {...named(ariaLabel)}
      {...bind}
    >
      <StaticParetoStrip
        {...rest}
        style={fillFor(style)}
        data={data}
        threshold={threshold}
        maxItems={maxItems}
        unit={unit}
        metric={metric}
        width={width}
        height={height}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {selected !== null && selected !== active ? outline(selected, true) : null}
        {active !== null ? outline(active, false) : null}
        {rest.children}
      </StaticParetoStrip>
      {readout && b && geo ? (
        <span
          className="mc-pareto-readout mc-spark-readout"
          style={crosshairReadoutStyle(b.x + b.width / 2, geo.totalWidth)}
        >
          {`${b.label} ${pct(b.share)} · ${pct(b.cum)}`}
        </span>
      ) : null}
      <LiveRegion>{announced}</LiveRegion>
    </span>
  );
}
