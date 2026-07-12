"use client";
// Interactive <PercentileTrace> (plan/26 §8). One pointer listener + nearest-
// reading math; ←/→ step readings and the live region states the percentile at
// that reading. Composes the static component (canon) — the crosshair + focus
// ring are overlay children, never a re-implemented SVG.
import { useCallback, useMemo, useRef, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { useEntrance } from "../../shared/motion-gate.js";
import {
  EN_PERCENTILE_TRACE,
  type PercentileTraceStrings,
} from "../../core/strings-percentile-trace.js";
import { percentileGeometry } from "./geometry.js";
import {
  PercentileTrace as StaticPercentileTrace,
  percentileSummary,
  type PercentileTraceProps,
} from "./index.js";

const INT: Intl.NumberFormatOptions = { maximumFractionDigits: 0 };

export interface InteractivePercentileTraceProps extends PercentileTraceProps {
  strings?: PercentileTraceStrings;
  /**
   * Opt-in entrance motion (default `false`): the line draws on when the
   * chart first mounts client-side. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function PercentileTrace(props: InteractivePercentileTraceProps): React.ReactNode {
  const {
    data,
    unit = "step",
    height = 20,
    width = 80,
    format = INT,
    locale,
    strings = EN_PERCENTILE_TRACE,
    title,
    summary,
    animate = false,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "draw", animate);

  const geo = useMemo(() => percentileGeometry({ width, height, data }), [width, height, data]);
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const pStr = useCallback((n: number) => strings.percentileValue(fmt(n)), [strings, fmt]);
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : geo === null
          ? strings.noData
          : percentileSummary(geo, pStr, fmt, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const count = geo?.points.length ?? 0;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (!geo || count === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const px = ((e.clientX - r.left) / r.width) * width;
      let best = 0;
      let bestDist = Infinity;
      geo.points.forEach((p, i) => {
        const d = Math.abs(p.x - px);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setActive(best);
    },
    [geo, count, width],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (count === 0) return;
      switch (e.key) {
        case "ArrowRight":
          setActive((prev) => Math.min(count - 1, (prev ?? -1) + 1));
          break;
        case "ArrowLeft":
          setActive((prev) => (prev === null || prev <= 0 ? 0 : prev - 1));
          break;
        case "Home":
          setActive(0);
          break;
        case "End":
          setActive(count - 1);
          break;
        case "Escape":
          setActive(null);
          return;
        default:
          return;
      }
      e.preventDefault();
    },
    [count],
  );

  const p = active !== null && geo ? geo.points[active] : undefined;
  const announced = p ? strings.percentileTraceAt(unit, p.index, pStr(p.value)) : "";

  return (
    <span
      ref={hostRef}
      className="mc-percentile-trace-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticPercentileTrace
        {...rest}
        data={data}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {p ? (
          <>
            <line
              x1={p.x}
              y1={0.5}
              x2={p.x}
              y2={height - 0.5}
              stroke="var(--mc-neutral)"
              data-mc-w="support"
              strokeDasharray="1.5 2"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={p.x}
              cy={p.y}
              r={2.4}
              fill="none"
              stroke="var(--mc-accent)"
              data-mc-w="support"
              vectorEffect="non-scaling-stroke"
            />
          </>
        ) : null}
        {rest.children}
      </StaticPercentileTrace>
      {p ? (
        <span
          className="mc-percentile-readout mc-spark-readout"
          style={{ left: `${(p.x / width) * 100}%`, transform: "translateX(-50%)" }}
        >
          {pStr(p.value)}
        </span>
      ) : null}
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
    </span>
  );
}
