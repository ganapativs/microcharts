"use client";
// Interactive <RetentionCurve>. useActivePicker owns interaction: one pointer
// listener + nearest-period math, roving keyboard (←/→ step periods, Home/End
// ends). touch tap-to-pin, and the onActive/onSelect contract. The live region
// states retention and, when a benchmark is present, its value too.
// the static component
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { labelFont, labelFitsY } from "../../core/labels.js";
import {
  CHIP,
  named,
  fillFor,
  navOrder,
  useActivePicker,
  wrap,
  type PickerProps,
} from "../../shared/interactive.js";
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

type RetentionPoint = NonNullable<ReturnType<typeof retentionGeometry>>["points"][number];

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
    compare,
    benchmark = compare,
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
    // …including the static's DEGRADATION gate. Under a ~7-unit-tall box the
    // static drops the readout and hands its gutter back to the plot; mirroring
    // only the `label` prop kept reserving that gutter here, so `totalWidth`
    // ran ~20 units wider than the SVG the pointer was actually over and every
    // hit landed a period or two early.
    const font = labelFont(height, 0.55, props.labelSize);
    const showLabel =
      (props.label ?? "last") === "last" && base != null && labelFitsY(height / 2, font, height);
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
      fontSize: font,
    });
  }, [
    width,
    height,
    data,
    benchmark,
    plateau,
    curve,
    props.domain,
    props.label,
    props.labelSize,
    fmt,
  ]);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : geo === null
          ? strings.noData
          : retentionSummary(geo, fmt, unit, data.length, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  // The navigable stops are the finite periods, keyed by their PERIOD index —
  // the same index `onSelect` emits, so `selectedIndex` round-trips. Gaps make
  // that space sparse, hence the lookup and `navOrder` below.
  const ptByPeriod = useMemo(() => {
    const m = new Map<number, RetentionPoint>();
    geo?.points.forEach((p) => m.set(p.period, p));
    return m;
  }, [geo]);
  const stops = useMemo(() => geo?.points.map((p) => p.period) ?? [], [geo]);

  // Nearest-period hit-test in viewBox space (scaled into `totalWidth`);
  // returns the PERIOD index.
  const locate = useCallback(
    (x: number) => {
      if (!geo || geo.points.length === 0) return null;
      let best = geo.points[0]!.period;
      let bestDist = Infinity;
      geo.points.forEach((p) => {
        const d = Math.abs(p.x - x);
        if (d < bestDist) {
          bestDist = d;
          best = p.period;
        }
      });
      return best;
    },
    [geo],
  );

  // Walk finite periods (skip gaps): step in stop-space, land on period indices.
  const step = useCallback((cur: number, key: string) => navOrder(stops, cur, key), [stops]);

  // Navigable unit = a finite cohort period; `index` is its original period
  // (the data index the consumer knows), `value` its retained fraction.
  const datum = useCallback(
    (i: number) => {
      const pt = ptByPeriod.get(i);
      return {
        index: i,
        value: pt?.value ?? null,
        formatted: pt
          ? pt.bench === null
            ? fmt(pt.value)
            : `${fmt(pt.value)} · ${fmt(pt.bench)}`
          : undefined,
      };
    },
    [ptByPeriod, fmt],
  );

  const { active, selected, bind } = useActivePicker({
    count: stops.length,
    width: geo?.totalWidth ?? width,
    height,
    locate,
    step,
    datum,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
  });

  const shown = active ?? selected;
  const p = shown !== null ? ptByPeriod.get(shown) : undefined;
  const pin = selected !== null && selected !== active ? ptByPeriod.get(selected) : undefined;
  const announced = p
    ? strings.retentionAt(unit, p.period, fmt(p.value), p.bench === null ? null : fmt(p.bench))
    : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-retention-curve-live", className, style)}
      {...named(ariaLabel)}
      {...bind}
    >
      <StaticRetentionCurve
        {...rest}
        style={fillFor(style)}
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
        {pin ? (
          <circle cx={pin.x} cy={pin.y} r={2.4} fill="none" data-mc-active="" data-mc-w="tick" />
        ) : null}
        {p ? (
          <>
            {/* `data-mc-ui` glides the response marks to the period they name.
                The crosshair travels on a transform — `x1`/`x2` have no CSS
                geometry property in any engine — while the dots move on their
                own `cx`/`cy`, which do. */}
            <line
              x1={0}
              y1={0.5}
              x2={0}
              y2={height - 0.5}
              stroke="var(--mc-neutral)"
              data-mc-ui=""
              data-mc-w="support"
              strokeDasharray="1.5 2"
              style={{ transform: `translateX(${p.x}px)` }}
            />
            <circle cx={p.x} cy={p.y} r={2.4} fill="none" data-mc-active="" data-mc-w="support" />
            {p.benchY !== null ? (
              // ghost-value tick — a small hollow mark on the benchmark line
              <circle
                cx={p.x}
                cy={p.benchY}
                r={1.5}
                fill="none"
                stroke="var(--mc-neutral)"
                data-mc-w="tick"
              />
            ) : null}
          </>
        ) : null}
        {rest.children}
      </StaticRetentionCurve>
      {readout && p ? (
        <span className="mc-retention-readout mc-spark-readout" {...CHIP}>
          {p.bench === null ? fmt(p.value) : `${fmt(p.value)} · ${fmt(p.bench)}`}
        </span>
      ) : null}
      <LiveRegion>{announced}</LiveRegion>
    </span>
  );
}
