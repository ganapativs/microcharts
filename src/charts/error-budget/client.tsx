"use client";
// Interactive <ErrorBudget>. useActivePicker owns interaction: one pointer
// listener + nearest-step math, ←/→ step, End jumps to now, click / Enter /
// Space selects (onSelect). The live region states remaining AND the local burn
// multiple.crosshair + focus ring +
// pin + readout chip are overlay children.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
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
import { EN_ERROR_BUDGET, type ErrorBudgetStrings } from "../../core/strings-error-budget.js";
import { labelFont } from "../../core/labels.js";
import { errorBudgetGeometry } from "./geometry.js";
import {
  ErrorBudget as StaticErrorBudget,
  errorBudgetSummary,
  RATE_FMT,
  PCT,
  type ErrorBudgetProps,
} from "./index.js";

export interface InteractiveErrorBudgetProps extends ErrorBudgetProps, PickerProps {
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
  useEntrance(hostRef, "draw", animate);

  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  // Mirror the static's label gutter so `totalWidth` matches the rendered
  // viewBox. The composed static reserves a right gutter for the "remaining"
  // label (widening the viewBox past `width`); without it the pointer map and
  // readout run at a short scale and the crosshair drifts from the cursor.
  const geo = useMemo(() => {
    const base = errorBudgetGeometry({ width, height, data, window, rates });
    const showLabel = (props.label ?? "remaining") === "remaining" && base != null;
    const gutterCh = showLabel ? fmt(base!.remaining.value).length : 0;
    return errorBudgetGeometry({
      width,
      height,
      data,
      window,
      rates,
      gutterCh,
      fontSize: labelFont(height, 0.55, props.labelSize),
    });
  }, [width, height, data, window, rates, props.label, props.labelSize, fmt]);

  const total = window ?? data.length;
  const count = geo?.points.length ?? 0;

  // Pointer (viewBox space) → nearest observed step by x.
  const locate = useCallback(
    (x: number) => {
      if (!geo || count === 0) return null;
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
    [geo, count],
  );

  // Observed-step index; `value` is the budget remaining fraction (0–1).
  const datum = useCallback(
    (i: number) => {
      const p = geo?.points[i];
      return {
        index: i,
        value: p?.value ?? null,
        formatted: p ? `${fmt(p.value)} · ${RATE_FMT(p.rate)}×` : undefined,
      };
    },
    [geo, fmt],
  );

  const { active, selected, bind } = useActivePicker({
    count,
    width: geo ? geo.totalWidth : width,
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
        : geo === null
          ? strings.noData
          : errorBudgetSummary(
              geo,
              fmt,
              RATE_FMT,
              { unit, elapsed: data.length, total: window ?? data.length },
              strings,
            );
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const shown = active ?? selected;
  const ap = active !== null && geo ? geo.points[active] : undefined; // transient focus
  const sp = selected !== null && selected !== active && geo ? geo.points[selected] : undefined; // pin
  const rp = shown !== null && geo ? geo.points[shown] : undefined; // readout + announce
  const announced = rp
    ? strings.errorBudgetAt(unit, rp.index + 1, total, fmt(rp.value), RATE_FMT(rp.rate))
    : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-error-budget-live", className, style)}
      {...named(ariaLabel)}
      {...bind}
    >
      <StaticErrorBudget
        {...rest}
        style={fillFor(style)}
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
        {sp ? (
          <circle
            cx={sp.x}
            cy={sp.y}
            r={2.4}
            fill="none"
            data-mc-active=""
            data-mc-w="tick"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {/* The live pair tracks a continuum, so it TRAVELS to the point it
            names. Both marks ride one transformed group horizontally and the
            dot carries its own vertical offset, so the two never separate —
            a dot gliding beside a teleporting line is worse than both
            snapping. Transform rather than coordinates because `x1`/`x2` have
            no CSS geometry property in any engine, and `cy` has none before
            Safari 17.4. */}
        {/* No `vectorEffect` inside this group: styles.css pins it for every
            stroked mark under `[data-mc-ui]`, and a presentation attribute
            loses to a CSS declaration anyway. The mark above is outside the
            group, so it keeps its own. */}
        {ap ? (
          <g data-mc-ui="" style={{ transform: `translateX(${ap.x}px)` }}>
            <line
              x1={0}
              y1={0.5}
              x2={0}
              y2={height - 0.5}
              stroke="var(--mc-neutral)"
              data-mc-w="support"
              strokeDasharray="1.5 2"
            />
            <circle
              cx={0}
              cy={0}
              r={2.4}
              fill="none"
              data-mc-active=""
              data-mc-w="support"
              style={{ transform: `translateY(${ap.y}px)` }}
            />
          </g>
        ) : null}
        {rest.children}
      </StaticErrorBudget>
      {readout && rp ? (
        <span className="mc-error-budget-readout mc-spark-readout" {...CHIP}>
          {`${fmt(rp.value)} · ${RATE_FMT(rp.rate)}×`}
        </span>
      ) : null}
      <LiveRegion>{announced}</LiveRegion>
    </span>
  );
}
