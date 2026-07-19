"use client";
// Interactive <ParetoStrip>. useActivePicker owns interaction: one pointer
// listener + nearest-bar-by-x lookup, ←/→/Home/End rove bars, T jumps to the
// threshold-crossing bar, click / Enter / Space selects (onSelect). The live
// region states each bar's share + cumulative. Composes the static component
// (canon); the crosshair + persistent pin + readout chip are overlay children.
import { useCallback, useMemo, useRef } from "react";
import { labelFont } from "../../core/labels.js";
import { EN_PARETO, type ParetoStrings } from "../../core/strings-pareto.js";
import { FILL, useActivePicker, wrap, type PickerProps } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { paretoGeometry } from "./geometry.js";
import { ParetoStrip as StaticParetoStrip, paretoSummary, type ParetoStripProps } from "./index.js";

export interface InteractiveParetoStripProps extends ParetoStripProps, PickerProps {
  strings?: ParetoStrings;
  /**
   * Opt-in entrance motion (default `false`): bars rise from the baseline,
   * left to right, on first client-side mount, and the cumulative-share line
   * fades in once the bars have mostly landed. Inert on the server and on
   * hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

const pct = (frac: number): string => `${Math.round(frac * 100)}%`;

export function ParetoStrip(props: InteractiveParetoStripProps): React.ReactNode {
  const {
    data,
    threshold = 80,
    max = 8,
    unit = "causes",
    metric = "the total",
    width = 80,
    height = 20,
    strings = EN_PARETO,
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
  // The cumulative line carries "muted" ink, not data/accent, so it's not a
  // bar-rise candidate — it's excluded from the selector below (rects only)
  // Three acts: the bars cascade left→right (story) and the cumulative line
  // is deferred to the closing act — it arrives as the last bar lands, the
  // conclusion drawn over the evidence.
  useEntrance(hostRef, "rise", animate, {
    selector: 'rect[data-mc-ink="accent"], rect[data-mc-ink="neutral"], rect[data-mc-ink="bar"]',
    order: "x",
    // Bars cascade up L→R by rank, then the cumulative 80% curve DRAWS across
    // them — the running total traces itself over the evidence.
    link: 'path[data-mc-ink="muted"]',
  });

  // Mirror the static's label gutter so `totalWidth` matches the rendered
  // viewBox — without it the pointer map and readout run short and the
  // crosshair drifts from the cursor.
  const geo = useMemo(() => {
    const base = paretoGeometry({ width, height, data, threshold, max });
    const showLabel = (props.label ?? "count") === "count" && base != null && base.crossing != null;
    const gutterCh = showLabel
      ? `${base!.vitalCount} of ${base!.n} → ${pct(base!.cumAtCrossing)}`.length
      : 0;
    return paretoGeometry({
      width,
      height,
      data,
      threshold,
      max,
      gutterCh,
      fontSize: labelFont(height),
    });
  }, [width, height, data, threshold, max, props.label]);

  const count = geo?.bars.length ?? 0;
  const vbWidth = geo?.totalWidth ?? width;

  // Nearest bar to the pointer x (viewBox space). Bars index 1:1 into the
  // sorted/rolled-up rows — datum.index is that bar index ("Other" is the last
  // bar when present, never re-ranked).
  const locate = useCallback(
    (x: number) => {
      if (!geo || geo.bars.length === 0) return null;
      let best = 0;
      let bestDist = Infinity;
      geo.bars.forEach((b, i) => {
        const d = Math.abs(b.x + b.width / 2 - x);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      return best;
    },
    [geo],
  );

  // 1-D rove, plus T → the threshold-crossing bar (kept from the old client).
  const step = useCallback(
    (cur: number, key: string) => {
      switch (key) {
        case "ArrowRight":
          return Math.min(count - 1, cur + 1);
        case "ArrowLeft":
          return cur <= 0 ? 0 : cur - 1;
        case "Home":
          return 0;
        case "End":
          return count - 1;
        case "t":
        case "T":
          return geo?.crossing ? geo.crossing.index : null;
      }
      return null;
    },
    [count, geo],
  );

  const datum = useCallback(
    (i: number) => {
      const b = geo?.bars[i];
      return { index: i, value: b?.value ?? null, label: b?.label };
    },
    [geo],
  );

  const { active, selected, bind } = useActivePicker({
    count,
    width: vbWidth,
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
        : geo === null
          ? strings.noData
          : paretoSummary(geo, { unit, metric }, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const outline = (i: number, pinned: boolean) => {
    const b = geo?.bars[i];
    if (!b) return null;
    return (
      <rect
        x={b.x - 0.6}
        y={0.5}
        width={b.width + 1.2}
        height={height - 1}
        fill="none"
        stroke="var(--mc-accent)"
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const b = shown !== null && geo ? geo.bars[shown] : undefined;
  const announced = b ? strings.paretoAt(b.label, pct(b.share), pct(b.cum)) : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-pareto-strip-live", className, style)}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      {...bind}
    >
      <StaticParetoStrip
        {...rest}
        style={FILL}
        data={data}
        threshold={threshold}
        max={max}
        unit={unit}
        metric={metric}
        width={width}
        height={height}
        strings={strings}
        summary={false}
      >
        {/* Pinned selection persists through pointer-leave; focus outline is transient. */}
        {selected !== null && selected !== active ? outline(selected, true) : null}
        {active !== null ? outline(active, false) : null}
        {rest.children}
      </StaticParetoStrip>
      {b && geo ? (
        <span
          className="mc-pareto-readout mc-spark-readout"
          style={{
            left: `${((b.x + b.width / 2) / geo.totalWidth) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {`${pct(b.share)} · ${pct(b.cum)}`}
        </span>
      ) : null}
      <LiveRegion>{announced}</LiveRegion>
    </span>
  );
}
