"use client";
// Interactive <ForecastCone>. useActivePicker owns interaction: one pointer
// listener + region-aware nearest-x (history points announce a value, forecast
// points the median + 80% interval), ←/→ (Home/End) rove, click / Enter /
// Space selects (onSelect). Composes the static component (canon); the
// crosshair + readout chip are overlay children.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import { FILL, useActivePicker, wrap, type PickerProps } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_FORECAST, type ForecastStrings } from "../../core/strings-forecast.js";
import { forecastConeGeometry } from "./geometry.js";
import {
  ForecastCone as StaticForecastCone,
  forecastSummary,
  type ForecastConeProps,
} from "./index.js";

export interface InteractiveForecastConeProps extends ForecastConeProps, PickerProps {
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
    className,
    style,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  // The cone widens left→right, so a wipe (left→right clip) uncovers the fan
  // in forecast order — the best available archetype here. An ideal
  // fan-from-origin grow doesn't exist in the engine yet.
  useEntrance(hostRef, "wipe", animate);

  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  // Mirror the static's label gutter so `totalWidth` matches the rendered
  // viewBox — without it the pointer map and readout run short and the
  // crosshair drifts from the cursor.
  const geo = useMemo(() => {
    const base = forecastConeGeometry({
      width,
      height,
      data,
      forecast,
      target,
      domain: props.domain,
    });
    const showLabel = (props.label ?? "landing") === "landing" && base != null;
    const gutterCh = showLabel ? fmt(base!.landing.value).length : 0;
    return forecastConeGeometry({
      width,
      height,
      data,
      forecast,
      target,
      domain: props.domain,
      gutterCh,
      fontSize: labelFont(height),
    });
  }, [width, height, data, forecast, target, props.domain, props.label, fmt]);

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

  const locate = useCallback(
    (x: number) => {
      if (!geo || geo.points.length === 0) return null;
      let best = 0;
      let bestDist = Infinity;
      geo.points.forEach((p, i) => {
        const d = Math.abs(p.x - x);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      return best;
    },
    [geo],
  );
  // index = the point's position on the whole period axis (history then
  // forecast, non-finite inputs dropped); value = the actual in the history
  // region, the CENTRAL (median) forecast in the forecast region.
  const datum = useCallback(
    (i: number) => {
      const p = geo?.points[i];
      return { index: i, value: p ? p.value : null };
    },
    [geo],
  );

  const { active, selected, bind } = useActivePicker({
    count,
    width: geo?.totalWidth ?? width,
    height,
    locate,
    datum,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
  });

  const dot = (i: number, pinned: boolean) => {
    const pt = geo?.points[i];
    if (!pt) return null;
    /* circle isn't covered by the path/line/polyline accent element-split
       (styles.css) — a plain data-mc-ink="accent" would fill it solid and
       drop the stroke, so ink stays a justified literal; width still takes
       a role (orthogonal to ink). */
    return (
      <circle
        cx={pt.x}
        cy={pt.y}
        r={2.4}
        fill="none"
        stroke="var(--mc-accent)"
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  // The point shown by the crosshair + readout: the live hover/keyboard focus,
  // falling back to a pinned selection when the pointer has left.
  const shown = active ?? selected;
  const p = shown !== null && geo ? geo.points[shown] : undefined;
  const announced = p
    ? p.kind === "history"
      ? strings.forecastAtHistory(unit, p.period, fmt(p.value))
      : strings.forecastAtForecast(unit, p.period, fmt(p.value), fmt(p.lo!), fmt(p.hi!))
    : "";
  const readout = p
    ? p.kind === "history"
      ? `${unit} ${p.period}: ${fmt(p.value)}`
      : `${unit} ${p.period}: ${fmt(p.value)} · ${fmt(p.lo!)}–${fmt(p.hi!)}`
    : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-forecast-cone-live", className, style)}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      {...bind}
    >
      <StaticForecastCone
        {...rest}
        style={FILL}
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
        {/* Pinned selection persists through pointer-leave; the crosshair is transient. */}
        {selected !== null && selected !== active ? dot(selected, true) : null}
        {p ? (
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
        ) : null}
        {active !== null ? dot(active, false) : null}
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
      <LiveRegion>{announced}</LiveRegion>
    </span>
  );
}
