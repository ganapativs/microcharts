"use client";
// Interactive <ForecastCone> (plan/23 #11). One pointer listener + region-aware
// nearest-x: history points announce a value, forecast points announce the
// median + 80% interval. ←/→ step; Home/End jump the ends. Composes the static
// component (canon); the crosshair + readout chip are overlay children.
import { useCallback, useMemo, useRef, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { EN_FORECAST, type ForecastStrings } from "../../core/strings-forecast.js";
import { forecastConeGeometry } from "./geometry.js";
import {
  ForecastCone as StaticForecastCone,
  forecastSummary,
  type ForecastConeProps,
} from "./index.js";

export interface InteractiveForecastConeProps extends ForecastConeProps {
  strings?: ForecastStrings;
  /**
   * Opt-in entrance motion (default `false`): the history line and fan cone
   * wipe on when the chart first mounts client-side. Inert on the server and
   * on hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function ForecastCone(props: InteractiveForecastConeProps): React.ReactNode {
  const {
    data,
    forecast,
    target,
    unit = "week",
    height = 20,
    width = 80,
    format,
    locale,
    strings = EN_FORECAST,
    title,
    summary,
    animate = false,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "wipe", animate);

  const geo = useMemo(
    () => forecastConeGeometry({ width, height, data, forecast, target, domain: props.domain }),
    [width, height, data, forecast, target, props.domain],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const [active, setActive] = useState<number | null>(null);

  const at = data.length + forecast.mid.length;
  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : geo === null
          ? strings.noData
          : forecastSummary(geo, fmt, { unit, at, target }, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const count = geo?.points.length ?? 0;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (!geo || count === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const px = ((e.clientX - r.left) / r.width) * geo.totalWidth;
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
    [geo, count],
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
  const announced = p
    ? p.kind === "history"
      ? strings.forecastAtHistory(unit, p.period, fmt(p.value))
      : strings.forecastAtForecast(unit, p.period, fmt(p.value), fmt(p.lo!), fmt(p.hi!))
    : "";
  const readout = p
    ? p.kind === "history"
      ? fmt(p.value)
      : `${fmt(p.value)} · ${fmt(p.lo!)}–${fmt(p.hi!)}`
    : "";

  return (
    <span
      ref={hostRef}
      className="mc-forecast-cone-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticForecastCone
        {...rest}
        data={data}
        forecast={forecast}
        target={target}
        unit={unit}
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
              data-mc-ink="muted"
              data-mc-w="support"
              strokeDasharray="1.5 2"
              vectorEffect="non-scaling-stroke"
            />
            {/* circle isn't covered by the path/line/polyline accent element-split
                (styles.css) — a plain data-mc-ink="accent" would fill it solid and
                drop the stroke, so ink stays a justified literal; width still takes
                a role (orthogonal to ink). */}
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
      </StaticForecastCone>
      {p ? (
        <span
          className="mc-forecast-readout mc-spark-readout"
          style={{ left: `${(p.x / geo!.totalWidth) * 100}%`, transform: "translateX(-50%)" }}
        >
          {readout}
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
