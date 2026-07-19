"use client";
// Interactive <Waterfall>. useActivePicker owns interaction: one pointer
// listener + column-by-x band lookup, ←/→ rove steps ("Refunds: −140, running
// 1,410."), End focuses the total, click / Enter / Space selects (onSelect).
// Composes the static component (canon) — the SVG is never re-implemented.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { EN_FLOW, type FlowStrings } from "../../core/strings-flow.js";
import { isFiniteValue } from "../../core/types.js";
import { FILL, useActivePicker, wrap, type PickerProps } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { waterfallGeometry } from "./geometry.js";
import { Waterfall as StaticWaterfall, waterfallSummary, type WaterfallProps } from "./index.js";

export interface InteractiveWaterfallProps extends WaterfallProps, PickerProps {
  strings?: FlowStrings;
  /**
   * Opt-in entrance motion (default `false`): the sequence of steps reveals
   * left-to-right when the chart first mounts client-side. Inert on the
   * server and on hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function Waterfall(props: InteractiveWaterfallProps): React.ReactNode {
  const {
    data,
    start = 0,
    total = true,
    domain,
    width = 70,
    height = 18,
    format,
    locale,
    strings = EN_FLOW,
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
  // Waterfall bars float between running totals rather than sharing a zero
  // baseline, so a per-bar scaleY "rise" points the wrong way for roughly
  // half the steps. "trail" ordered by x tells the actual waterfall story
  // instead: each step (and the total, being rightmost) lands in sequence.
  // `rect[data-mc-ink]` catches every step bar (ink="positive"/"negative"/
  // "neutral") and the total bar (ink="bar") but not the connector hairlines
  // (those are <line>, not <rect>).
  useEntrance(hostRef, "trail", animate, { selector: "rect[data-mc-ink]", order: "x" });

  const geo = useMemo(
    () =>
      waterfallGeometry({
        width,
        height,
        deltas: data.map((d) => d.value),
        start,
        total,
        domain,
      }),
    [width, height, data, start, total, domain],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  /** Navigable units = COLUMNS: 0..n-1 = steps (1:1 with `data`), n = the total bar. */
  const cols = data.length + (total ? 1 : 0);
  const endLevel = geo.levels.length > 0 ? geo.levels[geo.levels.length - 1]! : start;

  // Pointer (viewBox space) → column by x band. `y` is ignored: with
  // `label="delta"` the static viewBox grows a label band below the plot, so
  // only the x axis is a reliable shared coordinate here.
  const locate = useCallback(
    (x: number) => {
      if (cols === 0 || geo.pitch === 0) return null;
      const i = Math.floor(x / geo.pitch);
      return i >= 0 && i < cols ? i : null;
    },
    [cols, geo],
  );

  // `value` = the step's own DELTA (the bar's encoded length), NOT the running
  // total — the running level is the readout's job. The total column (index n)
  // reports the closing level, since that is what its zero-anchored bar encodes.
  const datum = useCallback(
    (i: number) => {
      const d = data[i];
      // The total column has no i18n-able name, so it carries no `label`.
      if (!d) return { index: i, value: endLevel };
      return { index: i, value: isFiniteValue(d.value) ? d.value : null, label: d.label };
    },
    [data, endLevel],
  );

  const { active, selected, bind } = useActivePicker({
    count: cols,
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
        : waterfallSummary(data, start, fmt, strings);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const box = (i: number, pinned: boolean) => (
    <rect
      x={i * geo.pitch - 0.5}
      y={-0.5}
      width={(geo.bars[0]?.w ?? geo.pitch - 1) + 1}
      height={height + 1}
      fill="none"
      stroke="var(--mc-accent)"
      data-mc-w={pinned ? "tick" : "support"}
      vectorEffect="non-scaling-stroke"
    />
  );

  const shown = active ?? selected;
  const isTotal = shown !== null && total && shown === data.length;
  const step = shown !== null && !isTotal ? data[shown] : undefined;
  const announced = isTotal
    ? `Total: ${fmt(endLevel)}.`
    : step
      ? strings.waterfallStep(
          step.label,
          isFiniteValue(step.value)
            ? `${step.value < 0 ? "−" : "+"}${fmt(Math.abs(step.value))}`
            : strings.noData,
          fmt(geo.levels[shown!] ?? start),
        )
      : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-waterfall-live", className, style)}
      tabIndex={0}
      role="img"
      aria-label={label}
      {...bind}
    >
      <StaticWaterfall
        {...rest}
        data={data}
        start={start}
        total={total}
        domain={domain}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        style={FILL}
      >
        {/* Pinned selection persists through pointer-leave; focus box is transient. */}
        {selected !== null && selected !== active ? box(selected, true) : null}
        {active !== null ? box(active, false) : null}
        {rest.children}
      </StaticWaterfall>
      <LiveRegion>{announced}</LiveRegion>
      {shown !== null ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${((shown * geo.pitch + geo.pitch / 2) / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {isTotal ? fmt(endLevel) : fmt(geo.levels[shown] ?? start)}
        </span>
      ) : null}
    </span>
  );
}
