"use client";
// Interactive <IconArray>. useActivePicker owns interaction: one pointer
// listener + pure grid lookup, ←/→/↑/↓ 2-D roving (row-major), click / Enter /
// Space selects (onSelect). Each unit announces the running count — genuinely
// useful for a SR user counting. Composes the static component (canon); the
// focus ring + persistent pin are overlay children re-using geometry.
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
import { EN_FREQ, type FreqStrings } from "../../core/strings-freq.js";
import { iconArrayGeometry } from "./geometry.js";
import { IconArray as StaticIconArray, iconArraySummary, type IconArrayProps } from "./index.js";

export interface InteractiveIconArrayProps extends IconArrayProps, PickerProps {
  strings?: FreqStrings;
  /**
   * Opt-in entrance motion (default `false`): the unit grid fades in,
   * staggered, when the chart first mounts client-side. Inert on the server
   * and on hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function IconArray(props: InteractiveIconArrayProps): React.ReactNode {
  const {
    value,
    total = 20,
    label = "ratio",
    shape = "square",
    width = 140,
    height = 28,
    locale,
    strings = EN_FREQ,
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
  // "reveal" — a fixed-N grid of unit cells is exactly the cell-grid case;
  // the default selector only matches "unit-off" (empty) cells, so a custom
  // selector scoped to unit rects (excludes the label text) catches filled
  // units too. Index order over a 450ms window gives the grid a counting
  // feel (units light up one at a time, reading order) instead of a uniform
  // staggered fade. `maxMarks: 100` keeps the per-unit cascade alive at the
  // bounded 100-unit array — above the 80 default it would collapse to a
  // whole-svg wipe, killing the count-up that IS the point here.
  useEntrance(hostRef, "reveal", animate, {
    selector: "rect[data-mc-ink]",
    order: "index",
    window: 450,
    maxMarks: 100,
  });

  const FONT = Math.min(10, Math.max(7, Math.round(height * 0.5)));
  const gutterCh = label === "ratio" ? 9 : label === "percent" ? 5 : 0;
  const geo = useMemo(
    () => iconArrayGeometry({ width, height, value, total, shape, gutterCh, fontSize: FONT }),
    [width, height, value, total, shape, gutterCh, FONT],
  );
  const pctFmt = useMemo(
    () => makeFormatter({ style: "percent", maximumFractionDigits: 0 }, locale),
    [locale],
  );

  // Navigable units are the icons; datum.index is the unit index (0…n-1 in
  // reading order). value = its filled state (1 filled / 0 empty) — the unit's
  // primary encoding; the running fill count is in the announcement.
  const locate = useCallback(
    (x: number, y: number) => {
      let best: number | null = null;
      let bestDist = Infinity;
      for (const u of geo.units) {
        const cx = u.x + geo.cell / 2;
        const cy = u.y + geo.cell / 2;
        const d = (cx - x) ** 2 + (cy - y) ** 2;
        if (d < bestDist) {
          bestDist = d;
          best = u.index;
        }
      }
      return best;
    },
    [geo],
  );

  // 2-D row-major roving (ActivityGrid keyboard model). Boundary keys consume
  // (return the current index); a first arrow from nothing focuses unit 0.
  const step = useCallback(
    (cur: number, key: string) => {
      const { cols, rows, n } = geo;
      if ((n as number) === 0) return null;
      if (key === "Home") return 0;
      if (key === "End") return n - 1;
      if (cur < 0) return 0;
      const row = Math.floor(cur / cols);
      const col = cur % cols;
      switch (key) {
        case "ArrowRight":
          return col < cols - 1 ? cur + 1 : cur;
        case "ArrowLeft":
          return col > 0 ? cur - 1 : cur;
        case "ArrowDown":
          return row < rows - 1 ? Math.min(n - 1, cur + cols) : cur;
        case "ArrowUp":
          return row > 0 ? cur - cols : cur;
      }
      return null;
    },
    [geo],
  );

  const datum = useCallback(
    (i: number) => ({ index: i, value: geo.units[i]?.filled ? 1 : 0 }),
    [geo],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo.n,
    width: geo.totalWidth,
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
        : iconArraySummary(geo, pctFmt, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const ring = (i: number, pinned: boolean) => {
    const u = geo.units[i];
    if (!u) return null;
    return (
      <rect
        x={u.x - 0.75}
        y={u.y - 0.75}
        width={geo.cell + 1.5}
        height={geo.cell + 1.5}
        rx={geo.rx + 0.75}
        fill="none"
        stroke="var(--mc-accent)"
        data-mc-w={pinned ? "tick" : "full"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const unit = shown !== null ? geo.units[shown] : undefined;
  const announced = unit ? strings.iconArrayUnit(shown! + 1, geo.n, unit.filled, geo.k) : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-icon-array-live", className, style)}
      {...named(ariaLabel)}
      {...bind}
    >
      <StaticIconArray
        {...rest}
        style={fillFor(style)}
        value={value}
        total={total}
        label={label}
        shape={shape}
        width={width}
        height={height}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {/* Pinned selection persists through pointer-leave; focus ring is transient. */}
        {selected !== null && selected !== active ? ring(selected, true) : null}
        {active !== null ? ring(active, false) : null}
        {rest.children}
      </StaticIconArray>
      <LiveRegion>{announced}</LiveRegion>
    </span>
  );
}
