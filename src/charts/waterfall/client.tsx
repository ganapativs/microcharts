"use client";
// Interactive <Waterfall>. One pointer listener; step by x-band.
// ←/→ rove steps ("Refunds: −140, running 1,410."); End focuses the total.
// Composes the static component (canon).
import { useCallback, useMemo, useRef, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { EN_FLOW, type FlowStrings } from "../../core/strings-flow.js";
import { isFiniteValue } from "../../core/types.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { waterfallGeometry } from "./geometry.js";
import { Waterfall as StaticWaterfall, waterfallSummary, type WaterfallProps } from "./index.js";

export interface InteractiveWaterfallProps extends WaterfallProps {
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
  /** Active column: 0..n-1 = steps, n = the total bar. */
  const [active, setActive] = useState<number | null>(null);
  const cols = data.length + (total ? 1 : 0);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : waterfallSummary(data, start, fmt, strings);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (cols === 0 || geo.pitch === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const x = ((e.clientX - r.left) / r.width) * width;
      const i = Math.floor(x / geo.pitch);
      setActive(i >= 0 && i < cols ? i : null);
    },
    [cols, geo, width],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (cols === 0) return;
      const cur = active ?? 0;
      let next = cur;
      switch (e.key) {
        case "ArrowRight":
          next = Math.min(cols - 1, cur + 1);
          break;
        case "ArrowLeft":
          next = Math.max(0, cur - 1);
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = cols - 1; // the total (or last step)
          break;
        case "Escape":
          setActive(null);
          return;
        default:
          return;
      }
      e.preventDefault();
      setActive(next);
    },
    [active, cols],
  );

  const isTotal = active !== null && total && active === data.length;
  const datum = active !== null && !isTotal ? data[active] : undefined;
  const announced = isTotal
    ? `Total: ${fmt(geo.levels.at(-1) ?? start)}.`
    : datum
      ? strings.waterfallStep(
          datum.label,
          isFiniteValue(datum.value)
            ? `${datum.value < 0 ? "−" : "+"}${fmt(Math.abs(datum.value))}`
            : strings.noData,
          fmt(geo.levels[active!] ?? start),
        )
      : "";

  return (
    <span
      ref={hostRef}
      className="mc-waterfall-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
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
      >
        {active !== null ? (
          <rect
            x={active * geo.pitch - 0.5}
            y={-0.5}
            width={(geo.bars[0]?.w ?? geo.pitch - 1) + 1}
            height={height + 1}
            fill="none"
            stroke="var(--mc-accent)"
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticWaterfall>
      <span
        aria-live="polite"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
        }}
      >
        {announced}
      </span>
      {active !== null ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${((active * geo.pitch + geo.pitch / 2) / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {isTotal ? fmt(geo.levels.at(-1) ?? start) : fmt(geo.levels[active!] ?? start)}
        </span>
      ) : null}
    </span>
  );
}
