"use client";
// Interactive <RetentionCurve>. useActivePicker owns interaction: one pointer
// listener + nearest-period math, roving keyboard (←/→ step periods, Home/End
// ends), touch tap-to-pin, and the onActive/onSelect contract. The live region
// states retention and, when a benchmark is present, its value too. Composes
// the static component (canon); the crosshair + ghost-value tick are children.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import { FILL, useActivePicker, wrap, type PickerProps } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_RETENTION, type RetentionStrings } from "../../core/strings-retention.js";
import { retentionGeometry } from "./geometry.js";
import {
  RetentionCurve as StaticRetentionCurve,
  retentionSummary,
  PCT,
  type RetentionCurveProps,
} from "./index.js";

export interface InteractiveRetentionCurveProps extends RetentionCurveProps, PickerProps {
  strings?: RetentionStrings;
  /**
   * Opt-in entrance motion (default `false`): the line draws on when the
   * chart first mounts client-side. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function RetentionCurve(props: InteractiveRetentionCurveProps): React.ReactNode {
  const {
    data,
    benchmark,
    plateau = true,
    curve = "step",
    unit = "period",
    height = 20,
    width = 80,
    format = PCT,
    locale,
    strings = EN_RETENTION,
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
  useEntrance(hostRef, "draw", animate);

  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  // Mirror the static's label gutter so `totalWidth` matches the rendered
  // viewBox — without it the pointer map and readout run short and the
  // crosshair drifts from the cursor.
  const geo = useMemo(() => {
    const base = retentionGeometry({
      width,
      height,
      data,
      benchmark,
      plateau,
      curve,
      domain: props.domain,
    });
    const showLabel = (props.label ?? "last") === "last" && base != null;
    const gutterCh = showLabel ? fmt(base!.last.value).length : 0;
    return retentionGeometry({
      width,
      height,
      data,
      benchmark,
      plateau,
      curve,
      domain: props.domain,
      gutterCh,
      fontSize: labelFont(height),
    });
  }, [width, height, data, benchmark, plateau, curve, props.domain, props.label, fmt]);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : geo === null
          ? strings.noData
          : retentionSummary(geo, fmt, unit, data.length, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const count = geo?.points.length ?? 0;

  // Nearest-period hit-test in viewBox space (scaled into `totalWidth`).
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

  // Navigable unit = a finite cohort period; `index` is its original period
  // (the data index the consumer knows), `value` its retained fraction.
  const datum = useCallback(
    (i: number) => {
      const pt = geo?.points[i];
      return { index: pt?.period ?? i, value: pt?.value ?? null };
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
    ? strings.retentionAt(unit, p.period, fmt(p.value), p.bench === null ? null : fmt(p.bench))
    : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-retention-curve-live", className, style)}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      {...bind}
    >
      <StaticRetentionCurve
        {...rest}
        style={FILL}
        data={data}
        benchmark={benchmark}
        plateau={plateau}
        curve={curve}
        unit={unit}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {/* Pinned selection persists through pointer-leave; the crosshair is transient. */}
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
            {p.benchY !== null ? (
              // ghost-value tick — a small hollow mark on the benchmark line
              <circle
                cx={p.x}
                cy={p.benchY}
                r={1.5}
                fill="none"
                stroke="var(--mc-neutral)"
                data-mc-w="tick"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
          </>
        ) : null}
        {rest.children}
      </StaticRetentionCurve>
      {p ? (
        <span
          className="mc-retention-readout mc-spark-readout"
          style={{ left: `${(p.x / geo!.totalWidth) * 100}%`, transform: "translateX(-50%)" }}
        >
          {`${unit} ${p.period}: ${
            p.bench === null ? fmt(p.value) : `${fmt(p.value)} · ${fmt(p.bench)}`
          }`}
        </span>
      ) : null}
      <LiveRegion>{announced}</LiveRegion>
    </span>
  );
}
