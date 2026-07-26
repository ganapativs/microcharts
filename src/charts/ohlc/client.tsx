"use client";
// Interactive <Ohlc>. useActivePicker owns interaction: one pointer listener +
// nearest-x lookup over the rendered periods, ←/→ (Home/End) rove them
// ("Period 18 of 20: open 145.10, high 149.30, low 144.00, close 148.20."),
// click / Enter / Space selects (onSelect). Composes the static component
// (canon) — the SVG is never re-implemented.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import { EN_OHLC, type OhlcStrings } from "../../core/strings-ohlc.js";
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
import { ohlcGeometry } from "./geometry.js";
import { Ohlc as StaticOhlc, ohlcSummary, type OhlcProps } from "./index.js";

export interface InteractiveOhlcProps extends OhlcProps, PickerProps {
  strings?: OhlcStrings;
  /**
   * Opt-in entrance motion (default `false`): the periods pop in one candle at a
   * time, oldest to newest, when the chart first mounts client-side. Inert on the
   * server and on hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function Ohlc(props: InteractiveOhlcProps): React.ReactNode {
  const {
    data,
    mode = "candle",
    maxPeriods = 20,
    label = "none",
    domain,
    width = 80,
    height = 16,
    format,
    locale,
    strings = EN_OHLC,
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
  // "trail" ordered by x — periods land oldest→newest, one candle at a time.
  // A candle is body + wick: the body rect carries `data-mc-ohlc`, the wick is
  // a `line[data-mc-w="support"]` at the same x. Selecting BOTH keeps each
  // period whole — the wick used to ride the quiet stage and so every wick
  // faded in before any body popped. `order: "x"` clusters each period's marks
  // at one x, so they enter together (a thin vertical wick scaling from its
  // center is fine). The "bars" mode has no body rect, only support-tick
  // lines; they now trail per period too instead of the whole-svg wipe.
  useEntrance(hostRef, "trail", animate, {
    selector: 'rect[data-mc-ohlc], line[data-mc-w="support"]',
    order: "x",
  });

  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const pctFmt = useMemo(
    () => makeFormatter(format, locale, { style: "percent", maximumFractionDigits: 1 }),
    [format, locale],
  );
  const fontSize = labelFont(height, 0.4);
  const lastClose = data.at(-1)?.close;
  const geo = useMemo(
    () =>
      ohlcGeometry({
        width,
        height,
        periods: data,
        maxPeriods,
        domain,
        gutterCh:
          label === "last" && Number.isFinite(lastClose) ? fmt(lastClose as number).length : 0,
        fontSize,
      }),
    [width, height, data, maxPeriods, domain, label, lastClose, fmt, fontSize],
  );
  const rendered = useMemo(
    () => (data.length > maxPeriods ? data.slice(-maxPeriods) : [...data]),
    [data, maxPeriods],
  );

  // The navigable stops are the PAINTED candles, keyed by their period index in
  // `rendered`; corrupt periods are dropped, so that space is sparse and a
  // lookup — not mark order — is what addresses a period.
  const markByIndex = useMemo(() => {
    const m = new Map<number, (typeof geo.marks)[number]>();
    geo.marks.forEach((k) => m.set(k.index, k));
    return m;
  }, [geo]);
  const stops = useMemo(() => geo.marks.map((m) => m.index), [geo]);

  // Pointer (viewBox space) → nearest candle; returns its PERIOD index.
  const locate = useCallback(
    (x: number) => {
      if (geo.marks.length === 0) return null;
      let best = geo.marks[0]!.index;
      let bestDist = Infinity;
      geo.marks.forEach((m) => {
        const dist = Math.abs(m.x - x);
        if (dist < bestDist) {
          bestDist = dist;
          best = m.index;
        }
      });
      return best;
    },
    [geo],
  );
  // Walk painted candles (skip corrupt periods): step in stop-space, land on
  // period indices.
  const step = useCallback((cur: number, key: string) => navOrder(stops, cur, key), [stops]);
  // index = the RENDERED period (the most recent `maxPeriods`, corrupt periods
  // skipped); value = that period's close, the settlement price.
  const datum = useCallback(
    (i: number) => {
      const p = rendered[i];
      return {
        index: i,
        value: p ? p.close : null,
        formatted: p
          ? `O${fmt(p.open)} H${fmt(p.high)} L${fmt(p.low)} C${fmt(p.close)}`
          : undefined,
      };
    },
    [rendered, fmt],
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
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : ohlcSummary(data, fmt, pctFmt, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const frame = (i: number, pinned: boolean) => {
    const m = markByIndex.get(i);
    if (!m) return null;
    return (
      <rect
        x={m.x - m.bodyW / 2 - 1}
        y={0.5}
        width={m.bodyW + 2}
        height={height - 1}
        fill="none"
        stroke="var(--mc-accent)"
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  // The unit shown by the frame + readout: the live hover/keyboard focus,
  // falling back to a pinned selection when the pointer has left.
  const shown = active ?? selected;
  const mark = shown !== null ? markByIndex.get(shown) : undefined;
  const period = shown !== null ? rendered[shown] : undefined;
  // Ordinal + total are stated over the rendered WINDOW, not the painted
  // candles: the ordinal is the period's own place in it, so a skipped corrupt
  // period must still be counted or "period 3 of 4" would name period 4.
  const announced =
    mark && period
      ? strings.ohlcAt(
          shown! + 1,
          rendered.length,
          fmt(period.open),
          fmt(period.high),
          fmt(period.low),
          fmt(period.close),
        )
      : "";

  return (
    <span ref={hostRef} {...wrap("mc-ohlc-live", className, style)} {...named(ariaLabel)} {...bind}>
      <StaticOhlc
        {...rest}
        style={fillFor(style)}
        data={data}
        mode={mode}
        maxPeriods={maxPeriods}
        label={label}
        domain={domain}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {selected !== null && selected !== active ? frame(selected, true) : null}
        {active !== null ? frame(active, false) : null}
        {rest.children}
      </StaticOhlc>
      <LiveRegion>{announced}</LiveRegion>
      {readout && mark && period ? (
        <span className="mc-spark-readout" style={crosshairReadoutStyle(mark.x, width)}>
          {`O${fmt(period.open)} H${fmt(period.high)} L${fmt(period.low)} C${fmt(period.close)}`}
        </span>
      ) : null}
    </span>
  );
}
