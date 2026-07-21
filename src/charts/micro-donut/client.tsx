"use client";
// Interactive <MicroDonut>. useActivePicker owns interaction: one pointer
// listener + wedge-by-atan2 angle lookup (pure), ←/→ rove wedges, click / Enter
// / Space selects (onSelect). Disabled entirely when `decorative` — an
// aria-hidden chart must not be a tab stop. Composes the static component
// (canon) — the SVG is never re-implemented.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter, type Format } from "../../core/format.js";
import {
  named,
  fillFor,
  useActivePicker,
  wrap,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_COMPOSITION, type CompositionStrings } from "../../core/strings-composition.js";
import { largestRemainderPercents, rollup } from "../segmented-bar/geometry.js";
import { sharesSummary } from "../segmented-bar/index.js";
import { microDonutGeometry } from "./geometry.js";
import { MicroDonut as StaticMicroDonut, type MicroDonutProps } from "./index.js";

const TAU = Math.PI * 2;

export interface InteractiveMicroDonutProps extends MicroDonutProps, PickerProps {
  strings?: CompositionStrings;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  /**
   * Opt-in entrance motion (default `false`): the wedges fade in, staggered,
   * when the chart first mounts client-side. Inert on the server and on
   * hydrated server HTML; `prefers-reduced-motion` always wins. Skipped when
   * `decorative` (an aria-hidden ornament renders through the static entry
   * directly, before any hook that could wire it runs).
   */
  animate?: boolean;
}

export function MicroDonut(props: InteractiveMicroDonutProps): React.ReactNode {
  const {
    data,
    maxWedges = 4,
    decorative = false,
    weight = 5,
    size = 24,
    format,
    locale,
    strings = EN_COMPOSITION,
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
  // Wedges are stroked centerlines (see geometry), so the entrance DRAWS the
  // wheel as ONE continuous sweep, clockwise from 12 o'clock — the ring fills
  // like a value accumulating. `proportional` makes each wedge's draw time
  // track its arc length and baton-passes them end to end, so the sweep holds a
  // constant angular velocity instead of every wedge racing in the same 450ms.
  // The selector spans every wedge — categories and the rolled-up "other".
  useEntrance(hostRef, "draw", animate, {
    selector: ".mc-donut-wedge",
    proportional: true,
    window: 520, // whole-ring sweep span
  });

  const rolled = useMemo(
    () => rollup(data, maxWedges, strings.otherLabel),
    [data, maxWedges, strings],
  );
  const geo = useMemo(
    () => microDonutGeometry({ size, shares: rolled.map((d) => d.value), weight }),
    [size, rolled, weight],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const pcts = useMemo(() => largestRemainderPercents(geo.wedges.map((w) => w.share)), [geo]);

  // Pointer (viewBox space) → wedge index by atan2 angle lookup (0 at 12
  // o'clock, clockwise — matches core/arc + geometry).
  const locate = useCallback(
    (x: number, y: number) => {
      const dx = x - size / 2;
      const dy = y - size / 2;
      const angle = (Math.atan2(dx, -dy) + TAU) % TAU;
      const i = geo.wedges.findIndex((w) => angle >= w.a0 && angle <= w.a1);
      return i >= 0 ? i : null;
    },
    [geo, size],
  );
  // index = wedge index (position in geo.wedges); value/label from its rolled datum.
  const datum = useCallback(
    (i: number) => {
      const d = rolled[geo.wedges[i]!.index];
      return {
        index: i,
        value: d?.value ?? null,
        label: d?.label,
        formatted: d
          ? d.members > 1
            ? `${d.label} ${pcts[i]}% (${d.members} ${d.members === 1 ? "category" : "categories"})`
            : `${d.label} ${pcts[i]}% (${fmt(d.value)})`
          : "",
      };
    },
    [geo, rolled, pcts, fmt],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo.wedges.length,
    width: size,
    height: size,
    locate,
    datum,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
  });

  // decorative = ornament: no naming, no tab stop, no interaction. This path
  // renders the static directly (no focusable wrapper), so `className`/`style`
  // go straight onto it — exactly as they would on the static entry. All hooks
  // above run first (they cannot be conditional); this branch just ignores them.
  if (decorative) {
    return (
      <StaticMicroDonut
        {...rest}
        className={className}
        style={style}
        data={data}
        maxWedges={maxWedges}
        decorative
        weight={weight}
        size={size}
        strings={strings}
      />
    );
  }

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : sharesSummary(rolled, strings);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const mark = (i: number, pinned: boolean) => {
    const w = geo.wedges[i];
    if (!w) return null;
    return (
      <path
        d={w.d}
        fill="none"
        stroke="var(--mc-accent)"
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const shownWedge = shown !== null ? geo.wedges[shown] : undefined;
  const shownDatum = shownWedge ? rolled[shownWedge.index] : undefined;
  const announced =
    shownWedge && shownDatum
      ? shownDatum.members > 1
        ? strings.shareOther(shownDatum.label, `${pcts[shown!]}%`, shownDatum.members)
        : strings.shareAt(shownDatum.label, `${pcts[shown!]}%`, fmt(shownDatum.value))
      : "";

  return (
    <span ref={hostRef} {...wrap("mc-donut-live", className, style)} {...named(label)} {...bind}>
      <StaticMicroDonut
        {...rest}
        style={fillFor(style)}
        data={data}
        maxWedges={maxWedges}
        weight={weight}
        size={size}
        strings={strings}
        summary={false}
      >
        {selected !== null && selected !== active ? mark(selected, true) : null}
        {active !== null ? mark(active, false) : null}
        {rest.children}
      </StaticMicroDonut>
      <LiveRegion>{announced}</LiveRegion>
      {readout && shownWedge && shownDatum ? (
        <span className="mc-spark-readout" style={{ left: "50%", transform: "translateX(-50%)" }}>
          {shownDatum.members > 1
            ? `${shownDatum.label} ${pcts[shown!]}% (${shownDatum.members} ${shownDatum.members === 1 ? "category" : "categories"})`
            : `${shownDatum.label} ${pcts[shown!]}% (${fmt(shownDatum.value)})`}
        </span>
      ) : null}
    </span>
  );
}
