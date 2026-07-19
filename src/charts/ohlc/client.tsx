"use client";
// Interactive <Ohlc>. useActivePicker owns interaction: one pointer listener +
// nearest-x lookup over the rendered periods, ←/→ (Home/End) rove them
// ("Period 18 of 20: open 145.10, high 149.30, low 144.00, close 148.20."),
// click / Enter / Space selects (onSelect). Composes the static component
// (canon) — the SVG is never re-implemented.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { EN_OHLC, type OhlcStrings } from "../../core/strings-ohlc.js";
import { FILL, useActivePicker, wrap, type PickerProps } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { ohlcGeometry } from "./geometry.js";
import { Ohlc as StaticOhlc, ohlcSummary, type OhlcProps } from "./index.js";

export interface InteractiveOhlcProps extends OhlcProps, PickerProps {
  strings?: OhlcStrings;
  /**
   * Opt-in entrance motion (default `false`): periods reveal left-to-right
   * when the chart first mounts client-side. Inert on the server and on
   * hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function Ohlc(props: InteractiveOhlcProps): React.ReactNode {
  const {
    data,
    variant = "candle",
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
  // center is fine). The "bars" variant has no body rect, only support-tick
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
  const fontSize = Math.max(5, Math.min(Math.round(height * 0.4), 7));
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

  const locate = useCallback(
    (x: number) => {
      if (geo.marks.length === 0) return null;
      let best = 0;
      let bestDist = Infinity;
      geo.marks.forEach((m, i) => {
        const dist = Math.abs(m.x - x);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      return best;
    },
    [geo],
  );
  // index = the RENDERED period (the most recent `maxPeriods`, corrupt periods
  // skipped); value = that period's close, the settlement price.
  const datum = useCallback(
    (i: number) => {
      const m = geo.marks[i];
      const p = m ? rendered[m.index] : undefined;
      return { index: i, value: p ? p.close : null };
    },
    [geo, rendered],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo.marks.length,
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
        : ohlcSummary(data, fmt, pctFmt, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const frame = (i: number, pinned: boolean) => {
    const m = geo.marks[i];
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
  const mark = shown !== null ? geo.marks[shown] : undefined;
  const period = mark ? rendered[mark.index] : undefined;
  const announced =
    mark && period
      ? strings.ohlcAt(
          mark.index + 1,
          geo.marks.length,
          fmt(period.open),
          fmt(period.high),
          fmt(period.low),
          fmt(period.close),
        )
      : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-ohlc-live", className, style)}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      {...bind}
    >
      <StaticOhlc
        {...rest}
        style={FILL}
        data={data}
        variant={variant}
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
        {/* Pinned selection persists through pointer-leave; the focus frame is transient. */}
        {selected !== null && selected !== active ? frame(selected, true) : null}
        {active !== null ? frame(active, false) : null}
        {rest.children}
      </StaticOhlc>
      <LiveRegion>{announced}</LiveRegion>
      {mark && period ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${(mark.x / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {`O${fmt(period.open)} H${fmt(period.high)} L${fmt(period.low)} C${fmt(period.close)}`}
        </span>
      ) : null}
    </span>
  );
}
