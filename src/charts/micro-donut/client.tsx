"use client";
// Interactive <MicroDonut>. useActivePicker owns interaction: one pointer
// listener + wedge-by-atan2 angle lookup (pure). ←/→ rove wedges, click / Enter
// / Space selects (onSelect). Disabled entirely when `decorative` — an
// aria-hidden chart must not be a tab stop.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter, makePercentFormatter, type Format } from "../../core/format.js";
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
import { donutMaxWedges, donutSize, microDonutGeometry } from "./geometry.js";
import { MicroDonut as StaticMicroDonut, type MicroDonutProps } from "./index.js";

const TAU = Math.PI * 2;

export interface InteractiveMicroDonutProps extends MicroDonutProps, PickerProps {
  strings?: CompositionStrings;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  /**
   * Opt-in entrance motion (default `false`): the ring DRAWS itself on first
   * client-side mount — one clockwise sweep from 12 o'clock, each wedge's
   * stroke unrolling for a span proportional to its own arc. Inert on the
   * server and on hydrated server HTML; `prefers-reduced-motion` always wins.
   * Skipped when
   * `decorative` (an aria-hidden ornament renders through the static entry
   * directly, before any hook that could wire it runs).
   */
  animate?: boolean;
}

export function MicroDonut(props: InteractiveMicroDonutProps): React.ReactNode {
  const {
    data,
    decorative = false,
    weight,
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

  // Resolved through the geometry's own resolvers, exactly as the static entry
  // does: the pointer math, the picker box and the painted ring all have to be
  // on one scale, and a hostile `size` must not survive into `--mc-seat`.
  const size = donutSize(props.size);
  const maxWedges = donutMaxWedges(props.maxWedges);

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
  // Largest-remainder integers (they must still sum to 100) through the one
  // sanctioned percent formatter — the old `${n}%` hardcoded the sign and its
  // spacing. Threaded into `sharesSummary` too, so the accessible name and the
  // chip can never disagree about how a percent is written.
  const pctFmt = useMemo(() => makePercentFormatter(locale), [locale]);
  const pctAt = useCallback((i: number) => pctFmt((pcts[i] ?? 0) / 100), [pctFmt, pcts]);

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
        formatted: d ? `${d.label} ${pctAt(i)} (${fmt(d.value)})` : "",
      };
    },
    [geo, rolled, pctAt, fmt],
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
        format={format}
        locale={locale}
        strings={strings}
      />
    );
  }

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : sharesSummary(rolled, strings, pctFmt);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const mark = (i: number, pinned: boolean) => {
    const w = geo.wedges[i];
    if (!w) return null;
    return (
      <path
        d={w.d}
        fill="none"
        data-mc-active=""
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
        ? strings.shareOther(
            shownDatum.label,
            pctAt(shown!),
            shownDatum.members,
            fmt(shownDatum.value),
          )
        : strings.shareAt(shownDatum.label, pctAt(shown!), fmt(shownDatum.value))
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
        // `format`/`locale` are destructured for the readout, so they were no
        // longer in `...rest` — the static's `label="total"` centre figure fell
        // back to the default formatter the moment a chart went interactive.
        format={format}
        locale={locale}
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
          {/* The localized sentence, minus its full stop — the chip must never
              hand-compose English (i18n canon), and this is the same text the
              live region announces. Siblings (TreeRings, SproutRow, BubbleRow)
              render `announced` here too. */}
          {announced.replace(/[.。]$/, "")}
        </span>
      ) : null}
    </span>
  );
}
