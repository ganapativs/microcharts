"use client";
// Interactive <BurnChart> (plan/23 #8). One pointer listener + nearest-period
// math across history AND the projection region. ←/→ step days, Home/End jump
// start/deadline. Composes the static component (canon); the crosshair + marker
// are overlay children.
import { useCallback, useMemo, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { EN_BURN, type BurnStrings } from "../../core/strings-burn.js";
import { burnGeometry } from "./geometry.js";
import { BurnChart as StaticBurnChart, burnSummary, type BurnChartProps } from "./index.js";

export interface InteractiveBurnChartProps extends BurnChartProps {
  strings?: BurnStrings;
}

export function BurnChart(props: InteractiveBurnChartProps): React.ReactNode {
  const {
    data,
    mode = "down",
    projection = true,
    work = "points",
    unit = "day",
    height = 20,
    width = 80,
    format,
    locale,
    strings = EN_BURN,
    title,
    summary,
    ...rest
  } = props;

  const geo = useMemo(
    () =>
      burnGeometry({
        width,
        height,
        plan: data.plan,
        actual: data.actual,
        mode,
        projection,
        domain: props.domain,
      }),
    [width, height, data.plan, data.actual, mode, projection, props.domain],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : geo === null
          ? strings.noData
          : burnSummary(
              geo,
              fmt,
              { unit, work, mode, elapsed: data.actual.length, total: data.plan.length },
              strings,
            );
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const count = geo?.points.length ?? 0;
  const verb = mode === "down" ? strings.burnRemain : strings.burnDone;

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
    ? p.actual !== null
      ? strings.burnAt(
          unit,
          p.period,
          fmt(p.actual),
          work,
          verb,
          p.plan === null ? null : fmt(p.plan),
        )
      : p.projected !== null
        ? strings.burnAtProjected(unit, p.period, fmt(p.projected), work, verb)
        : p.plan !== null
          ? strings.burnAt(unit, p.period, fmt(p.plan), work, verb, null)
          : ""
    : "";

  return (
    <span
      className="mc-burn-chart-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticBurnChart
        {...rest}
        data={data}
        mode={mode}
        projection={projection}
        work={work}
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
      </StaticBurnChart>
      {p ? (
        <span
          className="mc-burn-readout mc-spark-readout"
          style={{ left: `${(p.x / geo!.totalWidth) * 100}%`, transform: "translateX(-50%)" }}
        >
          {p.actual !== null
            ? fmt(p.actual)
            : p.projected !== null
              ? `${fmt(p.projected)}⋯`
              : p.plan !== null
                ? fmt(p.plan)
                : ""}
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
