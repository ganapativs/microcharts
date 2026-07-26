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

/** Declarations that size a box rather than decorate it. */
const SIZING = [
  "width",
  "height",
  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",
  "aspectRatio",
] as const;

/**
 * The style for the composed static SVG, given the consumer's `style`.
 *
 * `wrap` puts the consumer's style on the WRAPPER, which is right for the box
 * but wrong for the mark: `FILL`'s `height: auto` means a consumer `height:
 * 1.2em` resizes the wrapper while the SVG stays at its authored pixel size and
 * overflows the line — the static entry, where `style` lands on the `<svg>`
 * itself, shrinks properly. So any SIZING declaration is passed through to the
 * SVG too, and `FILL`'s own sizing steps aside so it cannot fight it.
 *
 * Decorative declarations (margin, background, border) stay on the wrapper
 * alone — applying those twice would double the margin and paint the box twice.
 */
export function fillFor(style: CSSProperties | undefined): CSSProperties {
  if (!style) return FILL;
  let sized: CSSProperties | undefined;
  for (const k of SIZING) {
    if (style[k] !== undefined) (sized ??= { display: "block" })[k] = style[k] as never;
  }
  if (!sized) return FILL;
  // Size ONE axis and the other must follow, or the SVG keeps its attribute
  // size on that axis and `preserveAspectRatio` letterboxes the drawing inside
  // a box the pointer map still measures in full — the hover ring detaches from
  // the cursor. `width: 100%` in a fluid container is the common case.
  if (sized.width === undefined) sized.width = "auto";
  if (sized.height === undefined) sized.height = "auto";
  return sized;
}

/**
 * Base style for a hit-testing interactive wrapper: an inline, positioned,
 * line-height-collapsed box that hugs the composed SVG (so absolute overlay
 * marks anchor to it and pointer→viewBox math stays exact).
 *
 * `verticalAlign: middle` matches `.mc-root` — without it the wrapper defaults
 * to baseline and drifts ~2px vs adjacent text in table cells (four-homes).
 * `width: fit-content` (+ `maxWidth: 100%`) stops flex/grid stretch from
 * inflating the wrapper past the mark (FILL's `width: 100%` would otherwise
 * grow with a stretched host) without `alignSelf: center`, which left-aligned
 * KPI columns were centering. Tabs keep centering via the parent's
 * `items-center` (`alignSelf: auto`). Fluid hosts still win with
 * `style={{ width: "100%" }}`.
 */
const WRAP: CSSProperties = {
  display: "inline-block",
  position: "relative",
  lineHeight: 0,
  verticalAlign: "middle",
  width: "fit-content",
  maxWidth: "100%",
};

type WrapAttrs = { className: string; style: CSSProperties; "data-mc-host": "" };

/** Default wrap() result per base class — stable identity across renders. */
const WRAP_CACHE = new Map<string, WrapAttrs>();

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
): WrapAttrs {
  if (!className && !style) {
    let hit = WRAP_CACHE.get(base);
    if (!hit) {
      hit = { className: base, style: WRAP, "data-mc-host": "" };
      WRAP_CACHE.set(base, hit);
    }
    return hit;
  }
  return {
    className: className ? `${base} ${className}` : base,
    style: style ? { ...WRAP, ...style } : WRAP,
    // Stable CSS hook — class suffixes are `-live` OR `-interactive`, so
    // table-cell strut rules must not key off either name alone.
    "data-mc-host": "",
  };
}

/** The chip's `left`, as a percentage of the plot width.
 *
 *  Deliberately NOT clamped inward. The chip points AT the unit it reads out,
 *  so any inset decouples it from its mark: a fixed 18%/82% clamp moved the
 *  chip ~100 px off the crosshair on a figure-width chart, and an em-based one
 *  moved it 22% of the box on a word-sized chart (both measured). These marks
 *  are word-sized by design — a chip is often wider than the chart it annotates
 *  — so a chip that overhangs the plot edge is the correct, honest rendering,
 *  and chip TEXT length is what gets capped instead (readout-containment
 *  tests). `.mc-spark-readout` floats above the mark and never affects layout. */
function readoutLeft(x: number, width: number): string {
  return `${(x / Math.max(1, width)) * 100}%`;
}

/** Crosshair chip: centred on the mark's x. */
export function crosshairReadoutStyle(x: number, width: number): CSSProperties {
  return {
    left: readoutLeft(x, width),
    transform: "translateX(-50%)",
  };
}

/** Row-anchored chip: sits just above the active row, not at the plate top.
 *  Multi-row charts (DotPlot, Dumbbell, horizontal bars) must use this — the
 *  default `.mc-spark-readout` `bottom: 100%` floats the chip above the whole
 *  chart and reads as a jump/flicker when the active row changes. */
export function rowReadoutStyle(
  x: number,
  y: number,
  width: number,
  height: number,
): CSSProperties {
  return {
    left: readoutLeft(x, width),
    top: `${(y / Math.max(1, height)) * 100}%`,
    bottom: "auto",
    transform: "translate(-50%, calc(-100% - 0.3em))",
  };
}

/**
 * Naming attributes for an interactive wrapper, given its resolved name.
 *
 * A name of `undefined` means the chart is decorative — the consumer passed
 * `summary={false}` and no `title`. It must then NOT be a tab stop carrying
 * `role="img"` with nothing to announce: assistive tech lands on an unnamed
 * image and reads nothing (WCAG 4.1.2). The static entry hides exactly the same
 * case (`shared/a11y.ts`), so both entries tell one story — including the other
 * half of that rule: `summary={false}` WITH a `title` keeps the name, so the
 * chart stays exposed and focusable on both sides.
 * `Delta` did this by hand; every other entry shipped the bare tab stop.
 */
export function named(
  name: string | undefined,
): { role: "img"; tabIndex: 0; "aria-label": string } | { "aria-hidden": true } {
  return name ? { role: "img", tabIndex: 0, "aria-label": name } : { "aria-hidden": true };
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
  /**
   * The chart's OWN formatted display string for this unit — exactly what its
   * in-chart readout chip would show (`"$0.53"`, `"12%"`, a composed
   * `"3 of 12"`…). Handed to `onActive`/`onSelect` so a consumer can render the
   * value wherever they like (a KPI card, a sentence) without re-deriving
   * `format`/`locale`, and pair it with `readout={false}` to suppress the
   * in-chart chip. Absent only when the unit has no value to format (the
   * kernel's default empty datum). `value` remains the raw number for
   * computation; `formatted` is the presentation of it.
   */
  formatted?: string | undefined;
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
  /**
   * Show the floating in-chart value chip on hover/focus (default `true`).
   * `false` suppresses only the chip — the hover crosshair/marker and the
   * `onActive`/`onSelect` callbacks are untouched — so the value can be rendered
   * elsewhere (a KPI card, a sentence) from `datum.formatted` while the chart
   * itself stays clean. Charts that render no chip ignore it.
   */
  readout?: boolean | undefined;
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
    onPointerCancel: (e: PointerEvent<HTMLElement>) => void;
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
 * (mouse hover + touch/pen drag with pointer capture), touch tap-to-pin, roving
 * keyboard (←/→/Home/End, Enter/Space to select, Escape to clear), and
 * controlled/uncontrolled selection — all firing the shared `onActive`/`onSelect`
 * contract. The chart supplies only its pure `locate`/`datum`/`step`; overlay
 * marks are still rendered by the client from the returned `active`/`selected`,
 * so the visual cannot drift from the composed static component.
 *
 * Touch: drag with the finger down to scrub (readout follows); lift clears the
 * transient highlight; a short tap pins via `onSelect` so the value stays.
 */
export function useActivePicker(opts: PickerOptions): Picker {
  const { count, width, height, locate, datum, step, onActive, onSelect } = opts;
  const controlled = opts.selectedIndex !== undefined;
  const [selInternal, setSel] = useState<number | null>(opts.defaultSelectedIndex ?? null);
  const selected = controlled ? (opts.selectedIndex ?? null) : selInternal;
  const [active, setActive] = useState<number | null>(null);

  // `active` lives in a ref as well as state so `act` can compare against the
  // value the LAST POINTER EVENT set rather than the last render: pointermove is
  // a continuous event, so React batches it and a dozen moves can fire between
  // two renders. Reading state there would re-fire `onActive` for every move
  // across one unit. No effect, no stale closure, no memoisation needed (the
  // handlers land on one DOM span; re-attach is free).
  //
  // `selected` deliberately does NOT get the same treatment. It only ever
  // changes from `onClick`/`onKeyDown`, which are DISCRETE events — React
  // flushes those synchronously, so the next one always runs against a committed
  // render and the closures below are never stale. Mirroring it meant writing a
  // ref DURING RENDER, in the one module all 84 picker charts share: a render
  // that concurrent React discards (Offscreen, a suspended sibling, StrictMode's
  // double invoke) left the ref holding a value that was never committed, and
  // the next tap then cleared the wrong selection.
  const activeRef = useRef<number | null>(null);
  // Did the KEYBOARD put the current unit up, rather than the pointer? See
  // `onPointerLeave` — a boundary event must not wipe a roved unit.
  const byKey = useRef(false);
  const down = useRef<[number, number] | null>(null);
  // Cache the painted SVG across a scrub — skip querySelector on every move.
  // Still measure getBoundingClientRect each move (scroll/resize while hovering
  // would stale a cached rect).
  const svgRef = useRef<Element | null>(null);

  const dat = (i: number): MicroDatum => (datum ? datum(i) : { index: i, value: null });
  const act = (i: number | null): void => {
    if (activeRef.current === i) return; // renders track unit changes, not moves
    activeRef.current = i;
    setActive(i);
    onActive?.(i === null ? null : dat(i));
  };
  const select = (i: number | null): void => {
    const next = i === null || selected === i ? null : i; // re-tap clears
    if (!controlled) setSel(next);
    onSelect?.(next === null ? null : dat(next));
  };

  // Pointer coords → viewBox space → unit index; `null` before layout.
  //
  // Measure the composed SVG, not the wrapper. They coincide in normal flow
  // (FILL + a line-height-collapsed wrapper), but `.mc-inline` seats a mark by
  // `translate`ing `.mc-root` — a VISUAL move that leaves the wrapper's layout
  // box behind. Hit-testing the wrapper there maps the pointer to a unit the
  // reader isn't over, by the whole seat offset (up to ~60% of a centred chart's
  // height): hovering the top row highlights the middle one. Reading the painted
  // box keeps pointer math honest under any transform the seat or the motion
  // engine applies.
  const at = (e: MouseEvent<HTMLElement>): number | null => {
    const host = e.currentTarget;
    let svg = svgRef.current;
    if (!svg || !host.contains(svg)) {
      svg = host.querySelector("svg") ?? host;
      svgRef.current = svg;
    }
    const r = svg.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    return locate(
      ((e.clientX - r.left) / r.width) * width,
      ((e.clientY - r.top) / r.height) * height,
    );
  };

  const bind: Picker["bind"] = {
    onPointerDown: (e) => {
      down.current = [e.clientX, e.clientY];
      // Touch/pen: capture so a drag that leaves the mark still scrubs, and
      // light the unit under the finger immediately (no hover prelude).
      if (e.pointerType !== "mouse") {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* setPointerCapture can throw if the element isn't in the tree */
        }
        byKey.current = false;
        act(at(e));
      }
    },
    onPointerMove: (e) => {
      byKey.current = false;
      act(at(e));
    },
    // Touch/pen have no hover: drop the transient active on lift so a pinned
    // selection is what stays visible. Mouse keeps its hover.
    onPointerUp: (e) => {
      if (e.pointerType === "mouse") return;
      try {
        if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        /* ignore */
      }
      act(null);
    },
    // Hosts allow vertical panning (`touch-action: pan-y`): when the browser
    // takes the gesture over, the stream ends in pointercancel, not pointerup —
    // clear like a lift or the last-touched unit stays lit under the scroll.
    onPointerCancel: (e) => {
      down.current = null;
      try {
        if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        /* ignore */
      }
      act(null);
    },
    onPointerLeave: () => {
      svgRef.current = null;
      // A pointer boundary event must never wipe a unit the reader roved to with
      // the KEYBOARD. `pointerleave` does not imply the reader moved a mouse off
      // the chart: the browser re-runs hit-testing whenever layout changes under
      // a parked cursor, and this chart changes its own layout on every step (the
      // readout chip appears and moves with the active unit). So a reader roving
      // with ←/→ while the cursor happens to rest near the mark had the highlight,
      // the readout and the announcement cleared out from under them mid-sequence
      // — reproduced as a cross-file flake in the browser suite, where a cursor
      // parked by an earlier test fired `pointerleave` ~7 ms after the third
      // arrow key with no pointer event of any kind before it.
      //
      // Hover state still clears on leave, as it must; only the keyboard's claim
      // survives. Escape and `onBlur` are what end a keyboard rove.
      if (!byKey.current) act(null);
    },
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
        return select(cur < 0 ? selected : cur);
      }
      if (e.key === "Escape") {
        byKey.current = false;
        act(null);
        if (selected !== null) select(null);
        return;
      }
      const next = step ? step(cur, e.key, e) : nav1d(cur, count, e.key);
      if (next === null) return;
      e.preventDefault();
      byKey.current = true;
      act(next);
    },
    onBlur: () => {
      svgRef.current = null;
      byKey.current = false;
      act(null);
    },
  };

  return { active, selected, bind };
}
