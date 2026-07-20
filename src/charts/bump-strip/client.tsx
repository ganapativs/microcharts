"use client";
// Interactive <BumpStrip>. useActivePicker owns interaction: one pointer
// listener + nearest-x lookup, ←/→/Home/End step periods, click / Enter / Space
// selects (onSelect). Composes the static component (canon); the focus ring +
// persistent pin + readout chip are overlay children.
import { useCallback, useMemo, useRef } from "react";
import { EN_FLOW, type FlowStrings } from "../../core/strings-flow.js";
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
import { isFiniteValue } from "../../core/types.js";
import { bumpGeometry } from "./geometry.js";
import { BumpStrip as StaticBumpStrip, bumpSummary, type BumpStripProps } from "./index.js";

export interface InteractiveBumpStripProps extends BumpStripProps, PickerProps {
  strings?: FlowStrings;
  /**
   * Opt-in entrance motion (default `false`): the line draws on when the
   * chart first mounts client-side. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function BumpStrip(props: InteractiveBumpStripProps): React.ReactNode {
  const {
    data,
    maxRank,
    label = "ends",
    width = 60,
    height = 16,
    strings = EN_FLOW,
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

  const fontSize = Math.max(5, Math.min(Math.round(height * 0.4), 7));
  // Widest rank label, in chars. A full scan of the series, so it is memoised:
  // the interactive entry re-renders on every unit crossed during a scrub.
  const maxLabelChars = useMemo(() => {
    if (label === "none") return 0;
    let max = 1;
    for (const r of data) if (isFiniteValue(r)) max = Math.max(max, Math.round(r));
    return 1 + String(max).length;
  }, [data, label]);
  const geo = useMemo(
    () =>
      bumpGeometry({
        width,
        height,
        ranks: data,
        maxRank,
        gutterLeftCh: label === "ends" ? maxLabelChars : 0,
        gutterRightCh: label !== "none" ? maxLabelChars : 0,
        fontSize,
      }),
    [width, height, data, maxRank, label, maxLabelChars, fontSize],
  );

  // Navigable units = the ranked periods (points; unranked periods are gaps and
  // never landed on). Callbacks report the DATA/period index (point.index — what
  // the consumer indexes into `data`), so we walk the finite-period indices and
  // hit-test to the nearest, but never a gap.
  const stops = useMemo(() => geo.points.map((p) => p.index), [geo]);
  const byIndex = useMemo(() => {
    const m = new Map<number, (typeof geo.points)[number]>();
    for (const p of geo.points) m.set(p.index, p);
    return m;
  }, [geo]);

  const locate = useCallback(
    (x: number) => {
      if (geo.points.length === 0) return null;
      let best = geo.points[0]!.index;
      let bestDist = Infinity;
      for (const p of geo.points) {
        const d = Math.abs(p.x - x);
        if (d < bestDist) {
          bestDist = d;
          best = p.index;
        }
      }
      return best;
    },
    [geo],
  );

  const step = useCallback((cur: number, key: string) => navOrder(stops, cur, key), [stops]);

  const datum = useCallback(
    (i: number) => ({ index: i, value: byIndex.get(i)?.rank ?? null }),
    [byIndex],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo.points.length,
    width,
    height,
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
        : bumpSummary(data, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const ring = (i: number, pinned: boolean) => {
    const p = byIndex.get(i);
    if (!p) return null;
    return (
      <circle
        cx={p.x}
        cy={p.y}
        r={2.5}
        fill="none"
        stroke="var(--mc-accent)"
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const point = shown !== null ? byIndex.get(shown) : undefined;
  const announced = point ? strings.rankAt(point.index + 1, data.length, point.rank) : "";

  return (
    <span ref={hostRef} {...wrap("mc-bump-live", className, style)} {...named(ariaLabel)} {...bind}>
      <StaticBumpStrip
        {...rest}
        style={fillFor(style)}
        data={data}
        maxRank={maxRank}
        label={label}
        width={width}
        height={height}
        strings={strings}
        summary={false}
      >
        {/* Pinned selection persists through pointer-leave; focus ring is transient. */}
        {selected !== null && selected !== active ? ring(selected, true) : null}
        {active !== null ? ring(active, false) : null}
        {rest.children}
      </StaticBumpStrip>
      <LiveRegion>{announced}</LiveRegion>
      {point ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${(point.x / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {`#${point.rank}`}
        </span>
      ) : null}
    </span>
  );
}
