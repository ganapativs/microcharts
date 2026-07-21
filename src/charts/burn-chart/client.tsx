"use client";
// Interactive <BurnChart>. useActivePicker owns interaction: one pointer
// listener + nearest-period math across history AND the projection region,
// roving keyboard (←/→ step days, Home/End jump start/deadline), touch
// tap-to-pin, and the onActive/onSelect contract. Composes the static
// component (canon); the crosshair + marker are overlay children.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import {
  named,
  fillFor,
  useActivePicker,
  wrap,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_BURN, type BurnStrings } from "../../core/strings-burn.js";
import { burnGeometry } from "./geometry.js";
import { BurnChart as StaticBurnChart, burnSummary, type BurnChartProps } from "./index.js";

export interface InteractiveBurnChartProps extends BurnChartProps, PickerProps {
  strings?: BurnStrings;
  /**
   * Opt-in entrance motion (default `false`): the line draws on when the
   * chart first mounts client-side. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function BurnChart(props: InteractiveBurnChartProps): React.ReactNode {
  const {
    data,
    mode = "down",
    projection = true,
    work,
    unit = "day",
    height = 20,
    width = 80,
    format,
    locale,
    strings = EN_BURN,
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

  // The work noun defaults from `strings`, not from a literal: it is rendered
  // display text, so an English default here would survive a localized bundle.
  const workWord = work ?? strings.burnWork;

  const hostRef = useRef<HTMLSpanElement>(null);
  // The actual line (ink="data") draws as the story; the dotted projection is
  // the future, so defer it into the closing act — it arrives as the actual
  // line lands, never before it. (Matched by its unique 1 2 dash pattern so no
  // static markup changes.)
  useEntrance(hostRef, "draw", animate, { defer: 'path[stroke-dasharray="1 2"]' });

  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  // Mirror the static's label gutter so `totalWidth` matches the rendered
  // viewBox — without it the pointer map and readout run short and the
  // crosshair drifts from the cursor.
  const geo = useMemo(() => {
    const base = burnGeometry({
      width,
      height,
      plan: data.plan,
      actual: data.actual,
      mode,
      projection,
      domain: props.domain,
    });
    const showLabel = (props.label ?? "gap") === "gap" && base?.landing != null;
    const gutterCh = showLabel
      ? `${base!.landing!.delta > 0 ? "+" : ""}${base!.landing!.delta} ${unit.charAt(0)}`.length
      : 0;
    return burnGeometry({
      width,
      height,
      plan: data.plan,
      actual: data.actual,
      mode,
      projection,
      domain: props.domain,
      gutterCh,
      fontSize: labelFont(height),
    });
  }, [width, height, data.plan, data.actual, mode, projection, props.domain, props.label, unit]);

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
              { unit, work: workWord, mode, elapsed: data.actual.length, total: data.plan.length },
              strings,
            );
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const count = geo?.points.length ?? 0;
  const verb = mode === "down" ? strings.burnRemain : strings.burnDone;

  // Nearest-period hit-test in viewBox space (scaled into `totalWidth`, the
  // rendered viewBox — the label gutter is part of it).
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

  // Navigable unit = a rendered period point; `index` is that point's period
  // (the data index the consumer knows), `value` its actual/projected/plan.
  const datum = useCallback(
    (i: number) => {
      const pt = geo?.points[i];
      return {
        index: pt?.period ?? i,
        value: pt ? (pt.actual ?? pt.projected ?? pt.plan) : null,
      };
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

  const shown = active ?? selected;
  const p = shown !== null && geo ? geo.points[shown] : undefined;
  const pin = selected !== null && selected !== active && geo ? geo.points[selected] : undefined;
  const announced = p
    ? p.actual !== null
      ? strings.burnAt(
          unit,
          p.period,
          fmt(p.actual),
          workWord,
          verb,
          p.plan === null ? null : fmt(p.plan),
        )
      : p.projected !== null
        ? strings.burnAtProjected(unit, p.period, fmt(p.projected), workWord, verb)
        : p.plan !== null
          ? strings.burnAt(unit, p.period, fmt(p.plan), workWord, verb, null)
          : ""
    : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-burn-chart-live", className, style)}
      {...named(ariaLabel)}
      {...bind}
    >
      <StaticBurnChart
        {...rest}
        style={fillFor(style)}
        data={data}
        mode={mode}
        projection={projection}
        work={workWord}
        unit={unit}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {pin ? (
          <circle
            cx={pin.x}
            cy={pin.y}
            r={2.4}
            fill="none"
            stroke="var(--mc-accent)"
            data-mc-w="tick"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
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
            ? `${fmt(p.actual)}${p.plan !== null ? ` / ${fmt(p.plan)}` : ""} ${workWord}`
            : p.projected !== null
              ? `${fmt(p.projected)}⋯ ${workWord}`
              : p.plan !== null
                ? `${fmt(p.plan)} ${workWord}`
                : ""}
        </span>
      ) : null}
      <LiveRegion>{announced}</LiveRegion>
    </span>
  );
}
