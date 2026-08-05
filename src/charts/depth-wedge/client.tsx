"use client";
// Interactive <DepthWedge>. useActivePicker owns interaction: one pointer
// listener + nearest-level-by-x math reveals the cumulative depth on that side,
// ←/→ walk levels across the book, click / Enter / Space selects (onSelect).
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
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
import { EN_DEPTH_WEDGE } from "../../core/strings-depth-wedge.js";
import { depthWedgeGeometry } from "./geometry.js";
import {
  DepthWedge as StaticDepthWedge,
  depthWedgeSummary,
  type DepthWedgeProps,
} from "./index.js";

export interface InteractiveDepthWedgeProps extends DepthWedgeProps, PickerProps {
  /**
   * Opt-in entrance motion (default `false`): the bid/ask wedges sweep
   * outward from the mid-price on first client-side mount. Inert on the
   * server and on hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function DepthWedge(props: InteractiveDepthWedgeProps): React.ReactNode {
  const {
    data,
    levels,
    normalize = false,
    width = 100,
    height = 24,
    format,
    locale,
    strings = EN_DEPTH_WEDGE,
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
  // The two sides are separate paths (demand = "positive", supply =
  // "negative"), never merged. Each carries its own `data-mc-origin` in the
  // static markup — demand pinned right, supply pinned left — so both sweep
  // outward from the mid-price gap while the spread between them stays put,
  // rather than the gap visibly widening/closing under a shared center origin.
  useEntrance(hostRef, "sweep", animate, {
    selector: 'path[data-mc-ink="positive"], path[data-mc-ink="negative"]',
  });

  const geo = useMemo(
    () =>
      depthWedgeGeometry({
        demand: data.demand,
        supply: data.supply,
        levels: levels ?? null,
        normalize,
        width,
        height,
      }),
    [data, levels, normalize, width, height],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const combined = useMemo(
    () =>
      [
        ...geo.demandSteps.map((s) => ({ ...s, side: 0 as const })),
        ...geo.supplySteps.map((s) => ({ ...s, side: 1 as const })),
      ].sort((a, b) => a.x - b.x),
    [geo],
  );
  // index = position in the two sides MERGED and sorted by x (a unit position,
  // not an index into `data.demand` / `data.supply`).
  const locate = useCallback(
    (x: number) => {
      if (combined.length === 0) return null;
      let best = 0;
      let bestD = Infinity;
      combined.forEach((s, i) => {
        const d = Math.abs(s.x - x);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      return best;
    },
    [combined],
  );
  const datum = useCallback(
    (i: number) => {
      const s = combined[i];
      return {
        index: i,
        value: s?.cum ?? null,
        formatted: s
          ? `${strings.depthWedgeSides[s.side].toLowerCase()} ${fmt(s.cum)} (± ${fmt(s.dist)})`
          : "",
      };
    },
    [combined, fmt, strings],
  );

  const { active, selected, bind } = useActivePicker({
    count: combined.length,
    width,
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
        : depthWedgeSummary(geo, strings, fmt);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const probe = (i: number, pinned: boolean) => {
    const s = combined[i];
    if (!s) return null;
    return (
      // The probe travels on `transform`: `x1`/`x2` have no CSS geometry
      // property behind them in any engine, so a line placed by those
      // attributes teleports to the next level instead of gliding to it.
      <line
        x1={0}
        x2={0}
        y1={0.5}
        y2={height - 0.5}
        data-mc-ink={pinned ? "accent" : "muted"}
        data-mc-active=""
        data-mc-ui=""
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
        style={{ transform: `translateX(${s.x}px)` }}
      />
    );
  };

  const shown = active ?? selected;
  const step = shown != null ? combined[shown] : undefined;
  const sideName = step ? strings.depthWedgeSides[step.side].toLowerCase() : "";
  const announced = step ? strings.depthWedgeAt(sideName, fmt(step.cum), fmt(step.dist)) : "";

  return (
    <span ref={hostRef} {...wrap("mc-depth-live", className, style)} {...named(label)} {...bind}>
      <StaticDepthWedge
        {...rest}
        data={data}
        levels={levels}
        normalize={normalize}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        style={fillFor(style)}
      >
        {selected !== null && selected !== active ? probe(selected, true) : null}
        {active !== null ? probe(active, false) : null}
        {rest.children}
      </StaticDepthWedge>
      <LiveRegion>{announced}</LiveRegion>
      {readout && step ? (
        <span className="mc-spark-readout" style={crosshairReadoutStyle(step.x, width)}>
          {`${sideName} ${fmt(step.cum)} (± ${fmt(step.dist)})`}
        </span>
      ) : null}
    </span>
  );
}
