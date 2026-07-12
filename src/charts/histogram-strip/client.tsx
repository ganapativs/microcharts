"use client";
// Interactive <HistogramStrip>. One pointer listener; bin by
// x-band. ←/→ rove bins ("40 to 50: 34 values."). Composes the static entry.
import { useCallback, useMemo, useRef, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { EN_DIST, type DistStrings } from "../../core/strings-dist.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { histogramGeometry } from "./geometry.js";
import {
  HistogramStrip as StaticHistogramStrip,
  histogramSummary,
  type HistogramStripProps,
} from "./index.js";

export interface InteractiveHistogramStripProps extends HistogramStripProps {
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
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "rise", animate);

  const geo = useMemo(
    () => histogramGeometry({ width, height, values: data, domain, bins, markValue }),
    [width, height, data, domain, bins, markValue],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const [active, setActive] = useState<number | null>(null);

  const modal = geo.modalBin >= 0 ? geo.bars[geo.modalBin] : undefined;
  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : histogramSummary(geo.total, modal, fmt, strings);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (geo.bars.length === 0 || geo.pitch === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const x = ((e.clientX - r.left) / r.width) * width;
      const i = Math.floor(x / geo.pitch);
      setActive(i >= 0 && i < geo.bars.length ? i : null);
    },
    [geo, width],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (geo.bars.length === 0) return;
      const cur = active ?? 0;
      let next = cur;
      switch (e.key) {
        case "ArrowRight":
          next = Math.min(geo.bars.length - 1, cur + 1);
          break;
        case "ArrowLeft":
          next = Math.max(0, cur - 1);
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = geo.bars.length - 1;
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
    [active, geo],
  );

  const bar = active !== null ? geo.bars[active] : undefined;
  const announced = bar ? strings.binAt(fmt(bar.x0), fmt(bar.x1), bar.count) : "";

  return (
    <span
      ref={hostRef}
      className="mc-histogram-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticHistogramStrip
        {...rest}
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
        {bar ? (
          <rect
            x={bar.x - 0.5}
            y={-0.5}
            width={bar.w + 1}
            height={height + 1}
            fill="none"
            stroke="var(--mc-accent)"
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticHistogramStrip>
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
      {bar ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${((bar.x + bar.w / 2) / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {bar.count}
        </span>
      ) : null}
    </span>
  );
}
