"use client";
// Interactive <SpiralYear>. useActivePicker owns interaction: one pointer
// listener + nearest-mark lookup (squared 2-D distance over the precomputed
// spiral marks). ←/→ step chronologically along the finite marks, click / Enter
// / Space selects (onSelect).
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import {
  named,
  fillFor,
  navOrder,
  useActivePicker,
  wrap,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { dayOfYear } from "../../core/calendar-grid.js";
import { EN_SPIRAL_YEAR, type SpiralYearStrings } from "../../core/strings-spiral-year.js";
import { SPIRAL_PAD, spiralYearGeometry } from "./geometry.js";
import {
  SpiralYear as StaticSpiralYear,
  spiralYearSummary,
  periodLabel,
  type SpiralYearProps,
} from "./index.js";

export interface InteractiveSpiralYearProps extends SpiralYearProps, PickerProps {
  strings?: SpiralYearStrings;
  /**
   * Opt-in entrance motion (default `false`): the coil grows outward from its
   * centre as it fades in, on first client-side mount. Inert on the server and on
   * hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

function inferCadence(n: number, explicit?: "day" | "week"): "day" | "week" {
  if (explicit) return explicit;
  return n > 0 && n <= 60 ? "week" : "day";
}

export function SpiralYear(props: InteractiveSpiralYearProps): React.ReactNode {
  const {
    data,
    cadence: cadenceProp,
    startDate,
    steps = 5,
    mark = "dot",
    size = 24,
    format,
    locale,
    strings = EN_SPIRAL_YEAR,
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
  // The spiral's angle encodes the time of year, so the entrance must not
  // rotate — "grow" scales it concentrically from the center, keeping every
  // period at its true angular position.
  useEntrance(hostRef, "grow", animate);

  const cadence = inferCadence(data.length, cadenceProp);
  const startIndex = useMemo(() => {
    const doy = startDate ? dayOfYear(startDate) : null;
    return doy === null ? 0 : cadence === "week" ? Math.floor(doy / 7) : doy;
  }, [startDate, cadence]);

  const geo = useMemo(
    () =>
      spiralYearGeometry({ values: data, size, steps, cadence, startIndex, pad: SPIRAL_PAD, mark }),
    [data, size, steps, cadence, startIndex, mark],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);

  // The finite marks carry a DATA index (nulls are skipped); callbacks report
  // that data index, so hit-testing + nav walk marks but never land on a gap.
  // Indexed once per geometry: a daily spiral carries ~366 marks and `markOf`
  // runs up to three times a render (focus ring, pin ring, readout).
  const markByIndex = useMemo(() => new Map(geo.marks.map((m) => [m.index, m])), [geo]);
  const markOf = useCallback((i: number) => markByIndex.get(i), [markByIndex]);

  // Pointer (viewBox space) → nearest mark's data index by squared distance.
  const locate = useCallback(
    (x: number, y: number) => {
      if (geo.marks.length === 0) return null;
      let best = geo.marks[0]!;
      let bestDist = Infinity;
      for (const m of geo.marks) {
        const dist = (m.cx - x) ** 2 + (m.cy - y) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          best = m;
        }
      }
      return best.index;
    },
    [geo],
  );

  // Chronological stops: the finite marks' data indices, in spiral order.
  const stops = useMemo(() => geo.marks.map((m) => m.index), [geo]);
  const step = useCallback((cur: number, key: string) => navOrder(stops, cur, key), [stops]);

  const datum = useCallback(
    (i: number) => {
      const v = data[i];
      return {
        index: i,
        value: typeof v === "number" && Number.isFinite(v) ? v : null,
        label: periodLabel(i, cadence),
        formatted:
          typeof v === "number" && Number.isFinite(v)
            ? `${periodLabel(i, cadence)}: ${fmt(v)}`
            : "",
      };
    },
    [data, cadence, fmt],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo.marks.length,
    width: geo.size,
    height: geo.size,
    locate,
    datum,
    step,
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
        : spiralYearSummary(data, { cadence: cadenceProp, strings, format, locale });
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const ring = (i: number, pinned: boolean) => {
    const m = markOf(i);
    if (!m) return null;
    return (
      <circle
        cx={m.cx}
        cy={m.cy}
        r={m.r + 1.5}
        fill="none"
        stroke="var(--mc-accent)"
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const shownMark = shown !== null ? markOf(shown) : undefined;
  const shownVal = shown !== null ? data[shown] : undefined;
  const shownLabel = shown !== null ? periodLabel(shown, cadence) : "";
  const announced =
    shownMark && typeof shownVal === "number" && Number.isFinite(shownVal)
      ? strings.spiralYearAt(shownLabel, fmt(shownVal))
      : "";
  const chip =
    shownMark && typeof shownVal === "number" && Number.isFinite(shownVal)
      ? `${shownLabel}: ${fmt(shownVal)}`
      : "";

  return (
    <span ref={hostRef} {...wrap("mc-spiral-live", className, style)} {...named(label)} {...bind}>
      <StaticSpiralYear
        {...rest}
        style={fillFor(style)}
        data={data}
        cadence={cadence}
        startDate={startDate}
        steps={steps}
        mark={mark}
        size={size}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {selected !== null && selected !== active ? ring(selected, true) : null}
        {active !== null ? ring(active, false) : null}
        {rest.children}
      </StaticSpiralYear>
      <LiveRegion>{announced}</LiveRegion>
      {readout && shownMark && chip ? (
        <span className="mc-spark-readout" style={{ left: "50%", transform: "translateX(-50%)" }}>
          {chip}
        </span>
      ) : null}
    </span>
  );
}
