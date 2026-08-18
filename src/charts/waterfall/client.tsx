"use client";
// Interactive <Waterfall>. useActivePicker owns interaction: one pointer
// listener + column-by-x band lookup, ←/→ rove steps ("Refunds: −140, running
// 1,410."). End focuses the total, click / Enter / Space selects (onSelect).
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter, unsigned, withPlus } from "../../core/format.js";
import { EN_FLOW, type FlowStrings } from "../../core/strings-flow.js";
import { isFiniteValue } from "../../core/types.js";
import {
  CHIP,
  named,
  fillFor,
  useActivePicker,
  wrap,
  type PickerProps,
} from "../../shared/interactive.js";
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
    open = 0,
    totalBar = true,
    domain,
    width = 70,
    height = 18,
    format,
    locale,
    strings = EN_FLOW,
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
        open,
        total: totalBar,
        domain,
      }),
    [width, height, data, open, totalBar, domain],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  /** Navigable units = COLUMNS: 0..n-1 = steps (1:1 with `data`), n = the total bar. */
  const cols = data.length + (totalBar ? 1 : 0);
  const endLevel = geo.levels.length > 0 ? geo.levels[geo.levels.length - 1]! : open;

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
      if (!d) return { index: i, value: endLevel, formatted: fmt(endLevel) };
      return {
        index: i,
        value: isFiniteValue(d.value) ? d.value : null,
        label: d.label,
        formatted: `${d.label}: ${
          isFiniteValue(d.value)
            ? `${d.value < 0 ? "−" : "+"}${unsigned(fmt(Math.abs(d.value)))}`
            : strings.noData
        } → ${fmt(geo.levels[i] ?? open)}`,
      };
    },
    [data, endLevel, fmt, geo, strings, open],
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
        : waterfallSummary(data, open, fmt, strings);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  // Built from the column this box names — its own painted rect — never from the
  // band (`i * pitch`, width `bars[0].w`): the band's trailing gap would land
  // entirely on one side, and the last column's bar is clipped to the box edge,
  // so bar 0's width is not every column's width.
  const box = (i: number, pinned: boolean) => {
    const col = geo.bars[i] ?? geo.totalBar;
    if (!col) return null;
    return (
      <rect
        x={col.x - 0.5}
        y={-0.5}
        width={col.w + 1}
        height={height + 1}
        fill="none"
        data-mc-active=""
        // Deliberately NOT `data-mc-ui`: this box names one discrete column, and
        // a box in transit encloses none. It is placed by `x`/`width` rather
        // than a transform, which is what makes it snap — see the scrub-response
        // rule in styles.css.
        data-mc-w={pinned ? "tick" : "support"}
      />
    );
  };

  const shown = active ?? selected;
  const isTotal = shown !== null && totalBar && shown === data.length;
  const step = shown !== null && !isTotal ? data[shown] : undefined;
  const announced = isTotal
    ? strings.waterfallTotal(fmt(endLevel))
    : step
      ? strings.waterfallStep(
          step.label,
          isFiniteValue(step.value)
            ? `${step.value < 0 ? "−" : "+"}${unsigned(fmt(Math.abs(step.value)))}`
            : strings.noData,
          fmt(geo.levels[shown!] ?? open),
        )
      : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-waterfall-live", className, style)}
      {...named(label)}
      {...bind}
    >
      <StaticWaterfall
        {...rest}
        data={data}
        open={open}
        totalBar={totalBar}
        domain={domain}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        style={fillFor(style)}
      >
        {selected !== null && selected !== active ? box(selected, true) : null}
        {active !== null ? box(active, false) : null}
        {rest.children}
      </StaticWaterfall>
      <LiveRegion>{announced}</LiveRegion>
      {readout && shown !== null ? (
        <span className="mc-spark-readout" {...CHIP}>
          {isTotal
            ? fmt(endLevel)
            : step
              ? `${step.label}: ${
                  isFiniteValue(step.value)
                    ? step.value < 0
                      ? `−${unsigned(fmt(Math.abs(step.value)))}`
                      : withPlus(step.value, (v) => fmt(Math.abs(v)))
                    : strings.noData
                } → ${fmt(geo.levels[shown] ?? open)}`
              : fmt(geo.levels[shown] ?? open)}
        </span>
      ) : null}
    </span>
  );
}
