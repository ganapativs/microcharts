"use client";
// Interactive <CyclePlot>. ←/→ step slots (left→right); Enter/Space/click pins (onSelect).
// Index = slot (not raw data index); value = slot center (mean/median) or null if empty.
// ↑/↓ drills into observations within the active slot — held as local `{slot,cycle}`
// keyed by slot (moving slots drops it). `step` eats ↑/↓; don't extend useActivePicker
// to 2-D selection. onActive/onSelect still report the slot (readout depth only).
import { useCallback, useMemo, useRef, useState } from "react";
import { makeFormatter } from "../../core/format.js";
import { isFiniteValue } from "../../core/types.js";
import {
  named,
  fillFor,
  useActivePicker,
  wrap,
  crosshairReadoutStyle,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_CYCLE, type CycleStrings } from "../../core/strings-cycle.js";
import { cycleGeometry } from "./geometry.js";
import { CyclePlot as StaticCyclePlot, cycleSummary, type CyclePlotProps } from "./index.js";

export interface InteractiveCyclePlotProps extends CyclePlotProps, PickerProps {
  strings?: CycleStrings;
  /**
   * Opt-in entrance motion (default `false`): the spine draws on when the
   * chart first mounts client-side. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

const slotName = (slots: readonly string[] | undefined, i: number): string =>
  slots?.[i] ?? `slot ${i + 1}`;

/** Within-slot drill state: which slot, and which observation inside it (-1 = none). */
type Drill = { slot: number; cycle: number } | null;

const driftDir = (d: number): "rising" | "falling" | "steady" =>
  d > 0 ? "rising" : d < 0 ? "falling" : "steady";

/** Localized drift word. `driftDir` stays: the summary passes the English token
 *  on as a semantic discriminant, which a translator branches on. What must not
 *  ship is that token rendered straight into the readout as display text. */
const driftName = (strings: { cycleDriftNames: readonly [string, string, string] }, d: number) =>
  strings.cycleDriftNames[d > 0 ? 2 : d < 0 ? 0 : 1];

export function CyclePlot(props: InteractiveCyclePlotProps): React.ReactNode {
  const {
    data,
    period,
    slots,
    center = "mean",
    cycleUnit = "cycles",
    domain,
    format,
    locale,
    width = 80,
    height = 20,
    strings = EN_CYCLE,
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
  // The spine (ink="data") is the primary draw. With `spine={false}` (the rare
  // within-slot-drift-only mode) there's no data path, so draw the ghost
  // within-slot polylines instead of falling through to a whole-svg wipe.
  useEntrance(
    hostRef,
    "draw",
    animate,
    props.spine === false ? { selector: 'path[data-mc-ink="ghost"]' } : undefined,
  );

  const geo = useMemo(
    () => cycleGeometry({ width, height, data, period, center, domain }),
    [width, height, data, period, center, domain],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);

  // Non-empty slots in render order — the actual navigable stops (empties are
  // skipped, like the pointer already does).
  const stops = useMemo(
    () => (geo ? geo.slots.map((sl, i) => (sl.n > 0 ? i : -1)).filter((i) => i >= 0) : []),
    [geo],
  );

  const locate = useCallback(
    (x: number) => {
      if (!geo || stops.length === 0) return null;
      let best = stops[0]!;
      let bestDist = Infinity;
      for (const i of stops) {
        const d = Math.abs(geo.slots[i]!.center.x - x);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      }
      return best;
    },
    [geo, stops],
  );

  // Within-slot drill: `cycle` is the index into the slot's observations in time
  // order, -1 meaning "the whole slot" (the ↑ exit rung). Keyed by slot so a
  // stale drill can never leak onto a different slot's readout. A ref mirrors
  // the state (the kernel's own pattern) so back-to-back keydowns in one tick
  // read the fresh cycle instead of the last render's closure.
  const [drill, setDrill] = useState<Drill>(null);
  const drillRef = useRef<Drill>(null);
  const drillTo = (d: Drill): void => {
    drillRef.current = d;
    setDrill(d);
  };

  const step = useCallback(
    (cur: number, key: string) => {
      // ↑/↓ drill inside the active slot rather than moving between slots. With
      // nothing active yet, ↓ enters the first slot's first observation and ↑
      // just lands on the slot (matching the kernel's "first arrow selects unit
      // 0" contract). Returning the slot index consumes the key without moving.
      if (key === "ArrowDown" || key === "ArrowUp") {
        const slot = cur < 0 ? stops[0] : cur;
        if (slot === undefined) return null;
        const n = geo?.values[slot]?.length ?? 0;
        const d = drillRef.current;
        const at = d && d.slot === slot ? d.cycle : -1;
        drillTo({
          slot,
          cycle: key === "ArrowDown" ? Math.min(n - 1, at + 1) : Math.max(-1, at - 1),
        });
        return slot;
      }
      const pos = cur < 0 ? -1 : stops.indexOf(cur);
      let t = pos;
      switch (key) {
        case "ArrowRight":
          t = Math.min(stops.length - 1, pos + 1);
          break;
        case "ArrowLeft":
          t = pos <= 0 ? 0 : pos - 1;
          break;
        case "Home":
          t = 0;
          break;
        case "End":
          t = stops.length - 1;
          break;
        default:
          return null;
      }
      drillTo(null); // a slot move drops the drill (only on keys that move)
      return stops[t] ?? null;
    },
    // `drillTo` touches only a ref + a setter, so it needs no dep of its own.
    [stops, geo],
  );

  // index = slot index (render order); value = the slot center, null when empty;
  // label = the slot's name when supplied.
  const datum = useCallback(
    (i: number) => {
      const s = geo?.slots[i];
      const c = s?.center.value;
      return {
        index: i,
        value: c !== undefined && Number.isFinite(c) ? c : null,
        label: slots?.[i],
        // The slot-level readout (the drill is a keyboard-only readout depth, not
        // a reported unit — datum always speaks the whole slot).
        formatted: s
          ? !isFiniteValue(s.center.value)
            ? `${slotName(slots, i)}: —`
            : `${slotName(slots, i)}: ${fmt(s.center.value)} (${driftName(strings, s.drift)})`
          : undefined,
      };
    },
    [geo, slots, fmt, strings],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo?.slots.length ?? 0,
    width,
    height,
    locate,
    step,
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
          : cycleSummary(geo, { slots, cycleUnit }, fmt, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  // The slot shown by the focus band + readout: live focus, falling back to a
  // pinned selection when the pointer has left.
  const shown = active ?? selected;
  const sl = shown !== null && geo ? geo.slots[shown] : undefined;
  // Drilled observation, when ↑/↓ have gone below the slot level. The drill is
  // keyed by slot, so it simply doesn't apply once `shown` moves elsewhere.
  const cycleVals = shown !== null && geo ? (geo.values[shown] ?? []) : [];
  const cycle = drill && drill.slot === shown ? drill.cycle : -1;
  const obs = cycle >= 0 ? cycleVals[cycle] : undefined;
  const announced =
    sl && shown !== null
      ? obs !== undefined
        ? strings.cyclePoint(slotName(slots, shown), cycle + 1, cycleVals.length, fmt(obs))
        : // An empty slot has no center (geometry sets center.value = NaN); never
          // format it — announce the slot as having no data.
          !isFiniteValue(sl.center.value)
          ? strings.cycleEmpty(slotName(slots, shown))
          : strings.cycleAt(
              slotName(slots, shown),
              center,
              fmt(sl.center.value),
              sl.n,
              cycleUnit,
              driftDir(sl.drift),
            )
      : "";

  const band = (i: number, pinned: boolean) => {
    const s = geo?.slots[i];
    if (!s) return null;
    return (
      <rect
        x={s.x0}
        y={0.5}
        width={Math.max(0, s.x1 - s.x0)}
        height={height - 1}
        fill="var(--mc-accent)"
        fillOpacity={pinned ? 0.14 : 0.08}
        stroke="var(--mc-accent)"
        data-mc-w={pinned ? "tick" : "hair"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  return (
    <span
      ref={hostRef}
      {...wrap("mc-cycle-plot-live", className, style)}
      {...named(ariaLabel)}
      {...bind}
      // The drill is keyboard-only: a pointer picks whole slots, so scrubbing
      // must not resurrect a drill left on the slot the cursor returns to.
      // Escape clears everything (the kernel never routes it through `step`).
      onPointerMove={(e) => {
        if (drillRef.current) drillTo(null);
        bind.onPointerMove(e);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") drillTo(null);
        bind.onKeyDown(e);
      }}
    >
      <StaticCyclePlot
        {...rest}
        style={fillFor(style)}
        data={data}
        period={period}
        slots={slots}
        center={center}
        cycleUnit={cycleUnit}
        domain={domain}
        format={format}
        locale={locale}
        width={width}
        height={height}
        strings={strings}
        summary={false}
      >
        {selected !== null && selected !== active ? band(selected, true) : null}
        {active !== null ? band(active, false) : null}
        {rest.children}
      </StaticCyclePlot>
      {readout && sl && geo && shown !== null ? (
        <span
          className="mc-cycle-plot-readout mc-spark-readout"
          style={crosshairReadoutStyle(sl.center.x, width)}
        >
          {obs !== undefined
            ? `${slotName(slots, shown)} ${cycle + 1}/${cycleVals.length}: ${fmt(obs)}`
            : !isFiniteValue(sl.center.value)
              ? `${slotName(slots, shown)}: —`
              : `${slotName(slots, shown)}: ${fmt(sl.center.value)} (${driftName(strings, sl.drift)})`}
        </span>
      ) : null}
      <LiveRegion>{announced}</LiveRegion>
    </span>
  );
}
