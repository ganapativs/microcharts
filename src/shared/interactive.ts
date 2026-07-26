// Shared helpers for the `…/interactive` client entries. This module is consumed
// by client files (which carry the 'use client' directive); like shared/motion.ts
// it doesn't declare it itself.
import { useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, MouseEvent, PointerEvent } from "react";

/** Static SVG fills the wrapper box — pointer→viewBox math and overlays stay aligned. */
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
 * SVG style: consumer `style` lives on the wrapper; SIZING props pass through so
 * `height: 1.2em` shrinks the mark like the static entry (not just the wrapper).
 * Margin/background/border stay on the wrapper only — never pass decorative
 * style through to the SVG (would double margin / paint the box twice).
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
 * Interactive wrapper base: inline, positioned, line-height 0,
 * `verticalAlign: middle` (~2px table-cell drift vs baseline),
 * `width: fit-content` (flex stretch vs FILL's 100%). No `alignSelf: center` —
 * left KPI columns stay left; tab rows center via parent `items-center`.
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

/** Wrapper className/style + `data-mc-host` (table strut hook; `-live`/`-interactive` suffixes differ). */
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

/** Chip `left` as % of plot — not clamped; word-sized marks overhang honestly (text length capped instead). */
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

/** Row-anchored chip — multi-row charts must not use `bottom: 100%` on the whole plate. */
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
 * Decorative only when no name (`summary={false}` AND no title) → `aria-hidden`.
 * A title alone still yields `role="img"` + tab stop (matches static a11y.ts).
 */
export function named(
  name: string | undefined,
): { role: "img"; tabIndex: 0; "aria-label": string } | { "aria-hidden": true } {
  return name ? { role: "img", tabIndex: 0, "aria-label": name } : { "aria-hidden": true };
}

/** Shared `onActive`/`onSelect` payload — `index` is the navigable unit (per chart). */
export interface MicroDatum {
  index: number;
  value: number | null;
  label?: string | undefined;
  /** Chip/display string — pair with `readout={false}`; `value` stays raw. */
  formatted?: string | undefined;
}

/** Public interaction props shared by every `…/interactive` entry. */
export interface PickerProps {
  /** Hover/focus unit; `null` when cleared. */
  onActive?: ((datum: MicroDatum | null) => void) | undefined;
  /** Click/tap/Enter/Space; `null` when deselected. */
  onSelect?: ((datum: MicroDatum | null) => void) | undefined;
  selectedIndex?: number | null | undefined;
  defaultSelectedIndex?: number | null | undefined;
  /** In-chart chip (default true). `false` hides chip only — crosshair/callbacks stay. */
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
   * index → payload. `value` = primary encoded number (often derived: share,
   * duration, gap…); `null` if empty. Second channel goes in `label` — never
   * invent another numeric field.
   */
  datum?: (index: number) => MicroDatum;
  /**
   * Custom keyboard step — required for sparse indices (`navOrder`) and 2-D
   * (intercept all four arrows; don't fall through to `nav1d`). `current` is -1
   * when idle; return next index, `null` to ignore, or `current` at a boundary.
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

/** Default 1-D step (both axes → prev/next). Override for 2-D / circular. `cur` may be -1. */
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
 * Shared picker kernel: pointer scrub, tap-to-pin, roving keyboard, selection.
 * Touch: drag scrubs; pointerup clears hover; short tap pins via onSelect.
 * Chart supplies `locate`/`datum`/`step`; overlays read `active`/`selected`.
 */
export function useActivePicker(opts: PickerOptions): Picker {
  const { count, width, height, locate, datum, step, onActive, onSelect } = opts;
  const controlled = opts.selectedIndex !== undefined;
  const [selInternal, setSel] = useState<number | null>(opts.defaultSelectedIndex ?? null);
  const selected = controlled ? (opts.selectedIndex ?? null) : selInternal;
  const [active, setActive] = useState<number | null>(null);

  // `activeRef`: batched pointermove must not re-fire `onActive` per pixel. `selected` stays
  // state-only — a render-time ref mirror breaks under StrictMode/concurrent discard.
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

  // Hit-test the painted SVG — `.mc-inline` seat translates the mark, not the wrapper box.
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
      // Keyboard rove ends on Escape/onBlur — pointerleave alone must not clear it
      // (readout layout can shift under a parked cursor and fake a leave).
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
