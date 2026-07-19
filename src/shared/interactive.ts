// Shared helpers for the `…/interactive` client entries. This module is consumed
// by client files (which carry the 'use client' directive); like shared/motion.ts
// it doesn't declare it itself.
import { useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, MouseEvent, PointerEvent } from "react";

/**
 * The composed static SVG must fill the focusable wrapper so the wrapper's box
 * and the SVG's box coincide — pointer→viewBox math and overlay marks stay
 * exact, and the chart scales fluidly with its container. Every interactive
 * entry that hit-tests against the wrapper spreads this on its inner `<svg>`.
 */
export const FILL: CSSProperties = { display: "block", width: "100%", height: "auto" };

/**
 * Base style for a hit-testing interactive wrapper: an inline, positioned,
 * line-height-collapsed box that hugs the composed SVG (so absolute overlay
 * marks anchor to it and pointer→viewBox math stays exact).
 */
const WRAP: CSSProperties = { display: "inline-block", position: "relative", lineHeight: 0 };

/**
 * Compose the interactive wrapper's `className`/`style` from the chart's base
 * class and the consumer's overrides. Centralized so every `…/interactive`
 * entry costs one call instead of six inline lines (per-subpath size budgets):
 * spread the result onto the focusable `<span>`. Consumer `style` merges over
 * the base; `className` composes after the base class.
 */
export function wrap(
  base: string,
  className: string | undefined,
  style: CSSProperties | undefined,
): { className: string; style: CSSProperties } {
  return {
    className: className ? `${base} ${className}` : base,
    style: style ? { ...WRAP, ...style } : WRAP,
  };
}

/**
 * The datum handed to `onActive`/`onSelect`. One shape for every chart so a
 * consumer's handler reads the same on a Sparkline, an ActivityGrid or a
 * SegmentedBar: `index` identifies the navigable unit (the point, cell, segment,
 * run… — documented per chart), `value` is its primary encoded number (`null`
 * for an empty/undefined unit), `label` its human name when the chart has one.
 */
export interface MicroDatum {
  index: number;
  value: number | null;
  label?: string | undefined;
}

/** Public interaction props shared by every `…/interactive` entry. */
export interface PickerProps {
  /** The active (hovered / keyboard-focused) unit changed; `null` when cleared. */
  onActive?: ((datum: MicroDatum | null) => void) | undefined;
  /** A unit was activated (click, tap, Enter or Space); `null` when deselected. */
  onSelect?: ((datum: MicroDatum | null) => void) | undefined;
  /** Controlled selected unit (index into the navigable units), or `null`. */
  selectedIndex?: number | null | undefined;
  /** Uncontrolled initial selection. Ignored once `selectedIndex` is set. */
  defaultSelectedIndex?: number | null | undefined;
}

interface PickerOptions extends PickerProps {
  /** Number of navigable units. */
  count: number;
  /** viewBox width/height — pointer coords are scaled into this space. */
  width: number;
  height: number;
  /** viewBox-space (x, y) → unit index, or `null` for a miss. */
  locate: (x: number, y: number) => number | null;
  /**
   * index → payload. Defaults to `{ index, value: null }`. `value` is the unit's
   * PRIMARY ENCODED number, which may be derived rather than a raw input — a
   * segment's share, a run's duration, a signed gap, a bin's count — and `null`
   * when the unit encodes nothing (gap/empty). Put the other half of a two-value
   * unit in `label`; never invent a second numeric field.
   */
  datum?: (index: number) => MicroDatum;
  /**
   * Custom keyboard step. Required when the index space is SPARSE — i.e. the
   * navigable indices are not `0…count-1` (gap-skipping series, reordered or
   * rolled-up spaces): the default `nav1d` walks the dense range and would emit
   * indices that don't exist. Use `navOrder` for those. Also required for 2-D
   * layouts, which must intercept ALL FOUR arrows — never fall through to
   * `nav1d` for ←/→, or sideways movement silently crosses a row/lane.
   *
   * `current` is -1 when nothing is active. Return the next index, or `null` to
   * ignore the key. On a boundary return `current` to consume without moving.
   * `e` carries modifier state (e.g. `e.shiftKey` for a reversible custom key).
   */
  step?: (current: number, key: string, e: KeyboardEvent) => number | null;
}

/** Active + selected indices and the handlers to spread on the focusable wrapper. */
export interface Picker {
  active: number | null;
  selected: number | null;
  bind: {
    onPointerDown: (e: PointerEvent<HTMLElement>) => void;
    onPointerMove: (e: PointerEvent<HTMLElement>) => void;
    onPointerUp: (e: PointerEvent<HTMLElement>) => void;
    onPointerLeave: () => void;
    onClick: (e: MouseEvent<HTMLElement>) => void;
    onKeyDown: (e: KeyboardEvent) => void;
    onBlur: () => void;
  };
}

/**
 * Default linear keyboard step. Both axes map to prev/next so vertical layouts
 * (rows, dumbbells, thermometers) work without a bespoke `step` — only 2-D grids
 * and circular charts need to override. Exported so a chart that adds one custom
 * key can fall back to it instead of re-deriving the whole switch. `cur` may be
 * `-1` (nothing active) → first ←/↑ or →/↓ lands on unit 0.
 */
export function nav1d(cur: number, count: number, key: string): number | null {
  switch (key) {
    case "ArrowRight":
    case "ArrowDown":
      return Math.min(count - 1, cur + 1);
    case "ArrowLeft":
    case "ArrowUp":
      return cur <= 0 ? 0 : cur - 1;
    case "Home":
      return 0;
    case "End":
      return count - 1;
  }
  return null;
}

/**
 * `nav1d` for a SPARSE index space: `order` lists the navigable indices in
 * navigation order (finite stops of a gappy series, x-sorted dots, chronological
 * stars…), and the returned value is an index FROM that list, not a position in
 * it. One helper so every gap-skipping and reordered chart roves identically —
 * they were each re-deriving this, which is where off-by-one and
 * lands-on-a-gap bugs hide. `cur` is the current index (or -1 for nothing).
 */
export function navOrder(order: readonly number[], cur: number, key: string): number | null {
  const n = order.length;
  if (n === 0) return null;
  const pos = order.indexOf(cur); // -1 when nothing active or cur is off-list
  const next = nav1d(pos, n, key);
  return next === null ? null : (order[next] ?? null);
}

/**
 * The one interaction kernel behind every `…/interactive` entry: pointer scrub
 * (mouse hover + touch drag), touch tap-to-pin, roving keyboard (←/→/Home/End,
 * Enter/Space to select, Escape to clear), and controlled/uncontrolled
 * selection — all firing the shared `onActive`/`onSelect` contract. The chart
 * supplies only its pure `locate`/`datum`/`step`; overlay marks are still
 * rendered by the client from the returned `active`/`selected`, so the visual
 * cannot drift from the composed static component.
 */
export function useActivePicker(opts: PickerOptions): Picker {
  const { count, width, height, locate, datum, step, onActive, onSelect } = opts;
  const controlled = opts.selectedIndex !== undefined;
  const [selInternal, setSel] = useState<number | null>(opts.defaultSelectedIndex ?? null);
  const selected = controlled ? (opts.selectedIndex ?? null) : selInternal;
  const [active, setActive] = useState<number | null>(null);

  // Refs mirror state so handlers read fresh values and callbacks fire exactly
  // on change — no effect, no stale closure, no memoisation needed (the handlers
  // land on one DOM span; re-attach is free).
  const activeRef = useRef<number | null>(null);
  const selRef = useRef(selected);
  selRef.current = selected;
  const down = useRef<[number, number] | null>(null);

  const dat = (i: number): MicroDatum => (datum ? datum(i) : { index: i, value: null });
  const act = (i: number | null): void => {
    if (activeRef.current === i) return; // renders track unit changes, not moves
    activeRef.current = i;
    setActive(i);
    onActive?.(i === null ? null : dat(i));
  };
  const select = (i: number | null): void => {
    const next = i === null || selRef.current === i ? null : i; // re-tap clears
    if (!controlled) setSel(next);
    onSelect?.(next === null ? null : dat(next));
  };
  // Pointer coords → viewBox space → unit index; `null` before layout.
  const at = (e: MouseEvent<HTMLElement>): number | null => {
    const r = e.currentTarget.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    return locate(
      ((e.clientX - r.left) / r.width) * width,
      ((e.clientY - r.top) / r.height) * height,
    );
  };

  const bind: Picker["bind"] = {
    onPointerDown: (e) => (down.current = [e.clientX, e.clientY]),
    onPointerMove: (e) => act(at(e)),
    // Touch/pen have no hover: drop the transient active on lift so a pinned
    // selection is what stays visible. Mouse keeps its hover.
    onPointerUp: (e) => e.pointerType !== "mouse" && act(null),
    onPointerLeave: () => act(null),
    onClick: (e) => {
      const d = down.current;
      down.current = null;
      // A drag (down→up far apart) is a scrub, not a tap — don't select.
      if (d && Math.abs(e.clientX - d[0]) + Math.abs(e.clientY - d[1]) > 6) return;
      select(at(e));
    },
    onKeyDown: (e) => {
      if (count === 0) return;
      const cur = activeRef.current ?? -1;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        return select(cur < 0 ? selRef.current : cur);
      }
      if (e.key === "Escape") {
        act(null);
        if (selRef.current !== null) select(null);
        return;
      }
      const next = step ? step(cur, e.key, e) : nav1d(cur, count, e.key);
      if (next === null) return;
      e.preventDefault();
      act(next);
    },
    onBlur: () => act(null),
  };

  return { active, selected, bind };
}
