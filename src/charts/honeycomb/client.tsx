"use client";
// Interactive <Honeycomb>. Announces the count on change; hover reveals
// "value of total" readout. useActivePicker adds per-cell picking on top: one
// wrapper listener + nearest-hex lookup, offset-row keyboard roving, click /
// Enter / Space selects a cell (onSelect).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { makeFormatter } from "../../core/format.js";
import {
  CHIP,
  named,
  fillFor,
  useActivePicker,
  wrap,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_HONEYCOMB, type HoneycombStrings } from "../../core/strings-honeycomb.js";
import { hexPath, honeycombGeometry, resolveTotal, resolveValue } from "./geometry.js";
import { Honeycomb as StaticHoneycomb, honeycombSummary, type HoneycombProps } from "./index.js";

export interface InteractiveHoneycombProps extends HoneycombProps, PickerProps {
  live?: boolean;
  strings?: HoneycombStrings;
  /**
   * Opt-in entrance motion (default `false`): the comb grows in concentrically
   * from the center on first client-side mount — a whole-shape reveal that
   * suits the near-square multi-row grid (a vertical clip would slice hexes
   * mid-shape). Inert on the server and on hydrated server HTML;
   * `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

const PAD = 1;

export function Honeycomb(props: InteractiveHoneycombProps): React.ReactNode {
  const {
    live = true,
    strings = EN_HONEYCOMB,
    title,
    value,
    total = 10,
    rows = "auto",
    cell = 4,
    unit = "",
    format,
    locale,
    animate = false,
    // `readout` (the public chip toggle) is aliased: a local `readout` const
    // below already holds the chip's numerals string.
    readout: showChip = true,
    summary,
    className,
    style,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
    ...rest
  } = props;
  const generated = honeycombSummary(value, { total, unit, strings, format, locale });
  const accName = summary === false ? undefined : typeof summary === "string" ? summary : generated;
  const [hover, setHover] = useState(false);
  const [announced, setAnnounced] = useState("");
  const prev = useRef(value);
  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "grow", animate);

  const geo = useMemo(
    () => honeycombGeometry({ total, value, rows, cellR: cell, pad: PAD }),
    [total, value, rows, cell],
  );
  // Cells per row, read back off the laid-out geometry (never re-derived from
  // the rows/total formula, which could drift from it).
  const cols = useMemo(() => {
    const first = geo.cells[0];
    if (!first) return 0;
    let n = 0;
    while (geo.cells[n] && geo.cells[n]!.cy === first.cy) n++;
    return n;
  }, [geo]);
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);

  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    if (live) setAnnounced(generated);
  }, [value, generated, live]);

  // Pointer (viewBox space) → cell index: nearest hex center within one
  // circumradius (hexes tile, so the nearest center is the containing cell).
  const locate = useCallback(
    (x: number, y: number) => {
      let best: number | null = null;
      // The RESOLVED circumradius: a NaN `cell` prop made every comparison
      // false, so nothing was ever pickable on a comb that drew fine.
      let bestD = geo.cell * geo.cell;
      for (let i = 0; i < geo.cells.length; i++) {
        const c = geo.cells[i]!;
        const dx = x - c.cx;
        const dy = y - c.cy;
        const d = dx * dx + dy * dy;
        if (d <= bestD) {
          bestD = d;
          best = i;
        }
      }
      return best;
    },
    [geo],
  );

  // Offset-row roving. ←/→ walk WITHIN a row (never wrapping into the next);
  // ↑/↓ hold the column. Odd rows are shifted a half cell, so both candidates in
  // an adjacent row sit equidistant — holding the column resolves that tie
  // stably, which keeps ↑ then ↓ a round trip back to the same cell. Boundary
  // keys are consumed (return the current index) rather than ignored.
  const step = useCallback(
    (cur: number, key: string) => {
      const n = geo.cells.length;
      if (n === 0 || cols === 0) return null;
      if (key === "Home") return 0;
      if (key === "End") return n - 1;
      // Nothing active yet: the first arrow lands on cell 0 (kernel contract).
      const first = cur < 0;
      const c = first ? 0 : cur;
      const row = Math.floor(c / cols);
      const col = c % cols;
      const clamp = (i: number) => (i >= 0 && i < n ? i : null);
      let next: number;
      switch (key) {
        case "ArrowRight":
          next = col < cols - 1 ? (clamp(c + 1) ?? c) : c;
          break;
        case "ArrowLeft":
          next = col > 0 ? c - 1 : c;
          break;
        case "ArrowDown":
          next = clamp((row + 1) * cols + col) ?? c;
          break;
        case "ArrowUp":
          next = clamp((row - 1) * cols + col) ?? c;
          break;
        default:
          return null;
      }
      return first ? 0 : next;
    },
    [geo, cols],
  );

  // index = cell index (row-major from the top-left, the fill order); value =
  // the cell's occupancy — 1 when filled, 0 when empty (a cell has no other
  // encoded number; the chart's magnitude is the count of filled cells).
  const datum = useCallback(
    (i: number) => ({
      index: i,
      value: geo.cells[i] ? (geo.cells[i]!.filled ? 1 : 0) : null,
      // Mirror the visual chip's per-cell numerals ("7 / 40").
      formatted: geo.cells[i] ? `${fmt(i + 1)} / ${fmt(geo.cells.length)}` : undefined,
    }),
    [geo, fmt],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo.cells.length,
    width: geo.width,
    height: geo.height,
    locate,
    step,
    datum,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
  });

  const label = [title, accName].filter(Boolean).join(". ") || undefined;
  const shown = active ?? selected;
  // The VISUAL chip is numerals only ("7 / 40") — it sits next to the comb, which
  // supplies the rest. The SPOKEN form can't lean on that context, so it goes
  // through the strings contract and names the cell's state.
  const cellReadout = shown === null ? "" : `${fmt(shown + 1)} / ${fmt(geo.cells.length)}`;
  const cellSpoken =
    shown === null
      ? ""
      : strings.honeycombCell(shown + 1, geo.cells.length, geo.cells[shown]?.filled ?? false);
  // Through the same resolvers as the comb and the summary — the chip is the
  // reading the chart paints, so it can never say "5 / NaN" over ten hexes.
  const readout = `${fmt(resolveValue(value))} / ${fmt(resolveTotal(total))}`;

  const ring = (i: number, pinned: boolean) => {
    const c = geo.cells[i];
    if (!c) return null;
    return (
      <path
        d={hexPath(c.cx, c.cy, geo.cell)}
        fill="none"
        data-mc-active=""
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  return (
    <span
      ref={hostRef}
      {...wrap("mc-honeycomb-live", className, style)}
      {...named(label)}
      {...bind}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => {
        bind.onPointerLeave();
        setHover(false);
      }}
      onFocus={() => setHover(true)}
      onBlur={() => {
        bind.onBlur();
        setHover(false);
      }}
    >
      <StaticHoneycomb
        {...rest}
        style={fillFor(style)}
        value={value}
        total={total}
        rows={rows}
        cell={cell}
        unit={unit}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {selected !== null && selected !== active ? ring(selected, true) : null}
        {active !== null ? ring(active, false) : null}
        {rest.children}
      </StaticHoneycomb>
      <LiveRegion>
        {live && props.summary !== false ? (shown === null ? announced : cellSpoken) : ""}
      </LiveRegion>
      {showChip && (hover || shown !== null) ? (
        <span className="mc-spark-readout" {...CHIP}>
          {shown === null ? readout : cellReadout}
        </span>
      ) : null}
    </span>
  );
}
