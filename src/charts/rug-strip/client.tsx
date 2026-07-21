"use client";
// Interactive <RugStrip>. useActivePicker owns interaction: one pointer
// listener + nearest tick by binary search over the sorted positions, ←/→/↑/↓
// step through the SORTED observations ("5.2 — 19th of 38."), click / Enter /
// Space pins one (onSelect). Composes the static component (canon).
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import {
  named,
  fillFor,
  useActivePicker,
  wrap,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_DIST, type DistStrings } from "../../core/strings-dist.js";
import { rugGeometry } from "./geometry.js";
import { RugStrip as StaticRugStrip, rugSummary, type RugStripProps } from "./index.js";

export interface InteractiveRugStripProps extends RugStripProps, PickerProps {
  strings?: DistStrings;
  /**
   * Opt-in entrance motion (default `false`): the tiers of ticks fade onto the
   * strip on first client-side mount. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

/** Index of the tick nearest to `pos` (ticks sorted by value ⇒ by pos). */
function nearestTick(ticks: readonly { pos: number }[], pos: number): number {
  let lo = 0;
  let hi = ticks.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (ticks[mid]!.pos < pos) lo = mid + 1;
    else hi = mid;
  }
  if (lo > 0 && Math.abs(ticks[lo - 1]!.pos - pos) <= Math.abs(ticks[lo]!.pos - pos)) return lo - 1;
  return lo;
}

export function RugStrip(props: InteractiveRugStripProps): React.ReactNode {
  const {
    data,
    markValue,
    orientation = "horizontal",
    domain,
    format,
    locale,
    strings = EN_DIST,
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
  const width = props.width ?? (orientation === "horizontal" ? 60 : 10);
  const height = props.height ?? (orientation === "horizontal" ? 10 : 60);
  const length = orientation === "horizontal" ? width : height;

  const hostRef = useRef<HTMLSpanElement>(null);
  // Ticks are merged per-opacity-tier paths, not discrete per-observation
  // elements, so there is nothing to cascade — and a directional `wipe`/`reveal`
  // would be wrong for `orientation="vertical"` (value axis is Y, not X). `pop`
  // (whole-svg opacity + a subtle scale) is the honest orientation-agnostic
  // reveal, and reads as arriving rather than a flat fade.
  useEntrance(hostRef, "pop", animate);

  const geo = useMemo(
    () =>
      rugGeometry({
        length,
        thickness: orientation === "horizontal" ? height : width,
        values: data,
        domain,
        markValue,
        orientation,
      }),
    [length, width, height, data, domain, markValue, orientation],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);

  // `rugSummary` quantiles the ticks (a sort over every observation) — compute
  // it only on the path that actually uses it.
  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : rugSummary(geo.ticks, fmt, strings);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const locate = useCallback(
    (x: number, y: number) =>
      geo.ticks.length === 0 ? null : nearestTick(geo.ticks, orientation === "horizontal" ? x : y),
    [geo, orientation],
  );
  // The navigable unit is one OBSERVATION, and `index` is its RANK in the
  // ascending-sorted finite values — not its position in `data`. The rug draws
  // (and announces) observations in sorted order, and non-finite entries are
  // dropped, so rank is the only stable identity the chart itself exposes.
  const datum = useCallback(
    (i: number) => ({ index: i, value: geo.ticks[i]?.value ?? null }),
    [geo],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo.ticks.length,
    width,
    height,
    locate,
    datum,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
  });

  // The tick shown by the crosshair + readout: the live hover/keyboard focus,
  // falling back to a pinned selection when the pointer has left.
  const shown = active ?? selected;
  const shownTick = shown !== null ? geo.ticks[shown] : undefined;
  const announced = shownTick
    ? strings.observation(fmt(shownTick.value), (shown ?? 0) + 1, geo.ticks.length)
    : "";

  const mark = (i: number, pinned: boolean) => {
    const t = geo.ticks[i];
    if (!t) return null;
    // pin = "tick" (convention); the transient mark uses "full", not "support",
    // because the static already emits "support" ticks — "support" would collide.
    const w = pinned ? "tick" : "full";
    return orientation === "horizontal" ? (
      <line
        x1={t.pos}
        y1={0}
        x2={t.pos}
        y2={height}
        data-mc-ink="accent"
        data-mc-w={w}
        vectorEffect="non-scaling-stroke"
      />
    ) : (
      <line
        x1={0}
        y1={t.pos}
        x2={width}
        y2={t.pos}
        data-mc-ink="accent"
        data-mc-w={w}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  return (
    <span ref={hostRef} {...wrap("mc-rug-live", className, style)} {...named(label)} {...bind}>
      <StaticRugStrip
        {...rest}
        style={fillFor(style)}
        data={data}
        markValue={markValue}
        orientation={orientation}
        domain={domain}
        format={format}
        locale={locale}
        strings={strings}
        width={width}
        height={height}
        summary={false}
      >
        {selected !== null && selected !== active ? mark(selected, true) : null}
        {active !== null ? mark(active, false) : null}
        {rest.children}
      </StaticRugStrip>
      <LiveRegion>{announced}</LiveRegion>
      {shownTick ? (
        <span
          className="mc-spark-readout"
          style={
            orientation === "horizontal"
              ? { left: `${(shownTick.pos / width) * 100}%`, transform: "translateX(-50%)" }
              : {
                  left: "100%",
                  top: `${(shownTick.pos / height) * 100}%`,
                  bottom: "auto",
                  transform: "translateY(-50%)",
                  marginLeft: "0.3em",
                }
          }
        >
          {fmt(shownTick.value)}
        </span>
      ) : null}
    </span>
  );
}
