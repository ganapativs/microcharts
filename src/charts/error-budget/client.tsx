"use client";
// Interactive <ErrorBudget>. One pointer listener + nearest-step
// math. ←/→ step; End jumps to now. The live region states remaining AND the
// local burn multiple. Composes the static component (canon); the crosshair +
// focus ring + readout chip are overlay children.
import { useCallback, useMemo, useRef, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_ERROR_BUDGET, type ErrorBudgetStrings } from "../../core/strings-error-budget.js";
import { errorBudgetGeometry } from "./geometry.js";
import { ErrorBudget as StaticErrorBudget, RATE_FMT, PCT, type ErrorBudgetProps } from "./index.js";

export interface InteractiveErrorBudgetProps extends ErrorBudgetProps {
  strings?: ErrorBudgetStrings;
  /**
   * Opt-in entrance motion (default `false`): the remaining-budget line draws
   * on when the chart first mounts client-side. Inert on the server and on
   * hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function ErrorBudget(props: InteractiveErrorBudgetProps): React.ReactNode {
  const {
    data,
    window,
    rates,
    unit = "day",
    height = 20,
    width = 80,
    format = PCT,
    locale,
    strings = EN_ERROR_BUDGET,
    title,
    summary,
    animate = false,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "draw", animate);

  const geo = useMemo(
    () => errorBudgetGeometry({ width, height, data, window, rates }),
    [width, height, data, window, rates],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const [active, setActive] = useState<number | null>(null);

  const total = window ?? data.length;
  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : geo === null
          ? strings.noData
          : geo.exhausted
            ? strings.errorBudgetExhausted(unit, geo.exhausted.index + 1, total)
            : strings.errorBudget(
                fmt(geo.remaining.value),
                data.length,
                total,
                unit,
                RATE_FMT(geo.currentRate),
              );
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
    ? strings.errorBudgetAt(unit, p.index + 1, total, fmt(p.value), RATE_FMT(p.rate))
    : "";

  return (
    <span
      ref={hostRef}
      className="mc-error-budget-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticErrorBudget
        {...rest}
        data={data}
        window={window}
        rates={rates}
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
      </StaticErrorBudget>
      {p ? (
        <span
          className="mc-error-budget-readout mc-spark-readout"
          style={{ left: `${(p.x / geo!.totalWidth) * 100}%`, transform: "translateX(-50%)" }}
        >
          {`${fmt(p.value)} · ${RATE_FMT(p.rate)}×`}
        </span>
      ) : null}
      <LiveRegion>{announced}</LiveRegion>
    </span>
  );
}
