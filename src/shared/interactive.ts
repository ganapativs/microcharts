// Shared helpers for the `…/interactive` client entries. This module is consumed
// by client files (which carry the 'use client' directive); like shared/motion.ts
// it doesn't declare it itself.
import { useEffect, useRef, useState } from "react";
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
 * `verticalAlign: middle` (~2px table-cell drift vs baseline). No
 * `alignSelf: center` — left KPI columns stay left; tab rows center via parent
 * `items-center`. The width defaults (`fit-content` / `max-width: 100%`) live in
 * `styles.css` under `:where([data-mc-host])`: inline they outranked a consumer
 * `className="w-full"`, which the static entry obeys — same props, two layouts.
 */
const WRAP: CSSProperties = {
  display: "inline-block",
  position: "relative",
  lineHeight: 0,
  verticalAlign: "middle",
};

type WrapAttrs = { className: string; style: CSSProperties; "data-mc-host": "" };

/**
 * Default wrap() result per base class — stable identity across renders. A bare
 * object rather than a Map: the keys are this package's own class-name literals,
 * so there is no untrusted key to reach a prototype slot, and `??=` on a plain
 * object is the cheapest cache in the shared kernel's ~100 bundles.
 */
const WRAP_CACHE: Record<string, WrapAttrs> = {};

/** Wrapper className/style + `data-mc-host` (table strut hook; `-live`/`-interactive` suffixes differ). */
export function wrap(
  base: string,
  className: string | undefined,
  style: CSSProperties | undefined,
): WrapAttrs {
  if (!className && !style) {
    return (WRAP_CACHE[base] ??= { className: base, style: WRAP, "data-mc-host": "" });
  }
  return {
    className: className ? `${base} ${className}` : base,
    style: style ? { ...WRAP, ...style } : WRAP,
    // Stable CSS hook — class suffixes are `-live` OR `-interactive`, so
    // table-cell strut rules must not key off either name alone.
    "data-mc-host": "",
  };
}

/**
 * Chip attrs: put the readout in the TOP LAYER. `styles.css` anchors and clamps
 * it there; the top layer is the only escape from an ancestor with a
 * `transform`/`filter`/`contain`, which becomes the containing block and clips
 * even `position: fixed`. A ref rather than an effect — one call, no cleanup
 * (removing the element pops it) and no render cost on the 100 entries that
 * spread this. The `catch` is for a detached element and for StrictMode's
 * double attach — re-opening an open popover is a no-op in current browsers,
 * not a throw. When the chip is NOT promoted the stylesheet still paints and
 * places it: `display: block` there answers the UA's `[popover]:not(
 * :popover-open) { display: none }`, which would otherwise hide it outright.
 */
export const CHIP = {
  popover: "manual",
  ref: (el: HTMLElement | null): void => {
    // Promote ONLY where the stylesheet can place it. `popover` shipped years
    // before anchor positioning (Firefox 125, Safari 17), and in that gap the
    // two gates disagreed: the chip went to the top layer, where its containing
    // block is the viewport, while the `@supports`-gated anchoring never
    // applied — so `bottom: 100%` resolved against the WINDOW and the chip flew
    // to y=-28 above a chart at y=200. Measured, not theorised. Left un-opened
    // it stays an ordinary absolutely-positioned box against its wrapper, which
    // is the pre-anchor behaviour this was always supposed to fall back to.
    // `globalThis.CSS` rather than a `typeof` guard, and not memoized into a
    // module-level flag: refs never run during SSR, so the guard bought nothing,
    // and the flag measured +52 B on the shared kernel — enough to push two
    // interactive subpaths past their budgets to save one support-query parse
    // per hover. Bytes are the scarcer resource; the parse is not per-frame.
    if (!el || !globalThis.CSS?.supports?.("anchor-name: --mc")) return;
    try {
      el.showPopover();
    } catch {
      /* detached, or already open under StrictMode's double attach */
    }
  },
} as const;

/*
 * `crosshairReadoutStyle` / `rowReadoutStyle` used to live here and returned an
 * inline `left`/`top`/`transform` per datum. They are gone, and their absence is
 * load-bearing rather than a tidy-up: an inline `left` beats every stylesheet
 * rule, so it overrode the anchored insets in `styles.css` and the chip centred
 * itself in the VIEWPORT instead of on its chart — measured at 73 of 100
 * chart x layout combinations before they were removed. Placement is now the
 * stylesheet's job alone, which is also what lets the engine clamp the chip to
 * the screen; nothing here can fight it. The crosshair inside the SVG still
 * marks the exact datum, so the chip names the value and the mark points at it.
 */

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

/**
 * Names for the navigable units, indexed the same way `MicroDatum.index` is
 * (for a series chart, the data index). Mixed into every MULTI-UNIT interactive
 * entry whose `data` is a bare numeric series — those charts can otherwise only
 * say "Point 3 of 12", never "Aug 2026". Charts whose data already carries a
 * `label` field name their units from that instead and don't take this prop.
 *
 * Sparse arrays are fine: a hole (or an empty string) falls back to the
 * positional wording for that unit alone. Interactive-only by design — a static
 * chart has no readout to name, and the generated summary stays value-based.
 *
 * Charts read this in their own `datum` callback (for `MicroDatum.label`) and
 * hand `labels?.[i]` to `announceNamed` / `chipNamed`, rather than wiring it into
 * `useActivePicker`: the kernel is bundled into all ~90 multi-unit interactive
 * subpaths, so naming it there charged 23 B to the 61 charts that identify their
 * units some other way.
 */
export interface LabeledSeriesProps {
  labels?: readonly (string | undefined)[] | undefined;
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
   * invent another numeric field. Required: all ~85 picker charts name their
   * units, and the "index only" fallback the kernel used to carry for the ones
   * that didn't was dead weight in every one of their bundles.
   */
  datum: (index: number) => MicroDatum;
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
  // `indexOf` is -1 when nothing is active or `cur` is off-list; a null step
  // (a key we don't rove on) indexes -1, which is the same miss as a gap.
  return order[nav1d(order.indexOf(cur), n, key) ?? -1] ?? null;
}

/** Handlers the scalar (single-unit) entries spread on their wrapper. */
export interface ScalarBind {
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  onFocus: () => void;
  onBlur: () => void;
  onClick: () => void;
  onKeyDown: (e: KeyboardEvent) => void;
}

/**
 * Whole-chart activation for the single-unit (scalar) entries: one glyph, one
 * reading. Hover and focus are ONE edge-gated `onActive` pair — pointer-enter
 * then focus never report the same unit twice — and click/Enter/Space report
 * the same datum through `onSelect`. Scalars have no pin: `onSelect` is a
 * report, not a toggle, so there is no selection to light-dismiss. Escape
 * still clears the reveal (chip + `onActive(null)`) without moving focus —
 * before it, a keyboard reader could raise the chip and had no way to lower
 * it short of leaving the chart, the exact hole the picker's Escape closes.
 *
 * `active` is the reveal state the chip renders on. Every scalar entry used to
 * carry this block verbatim (the edge ref, the six listeners, the Enter/Space
 * guard); one hook keeps the family identical by construction.
 */
export function useScalarActive(
  datum: () => MicroDatum,
  onActive?: ((datum: MicroDatum | null) => void) | undefined,
  onSelect?: ((datum: MicroDatum | null) => void) | undefined,
): { active: boolean; bind: ScalarBind } {
  const [active, setActive] = useState(false);
  const shown = useRef(false);
  const act = (on: boolean): void => {
    setActive(on);
    if (shown.current === on) return;
    shown.current = on;
    onActive?.(on ? datum() : null);
  };
  const on = (): void => act(true);
  const off = (): void => act(false);
  return {
    active,
    bind: {
      onPointerEnter: on,
      onPointerLeave: off,
      onFocus: on,
      onBlur: off,
      onClick: () => onSelect?.(datum()),
      onKeyDown: (e) => {
        if (e.key === "Escape") return off();
        if (!onSelect || (e.key !== "Enter" && e.key !== " ")) return;
        e.preventDefault();
        onSelect(datum());
      },
    },
  };
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
  // The last native event this chart handled. Two jobs, one slot: the tap/drag
  // test in `onClick` reads its coordinates, and the light-dismiss listener
  // compares identity against it.
  const down = useRef<Event | null>(null);
  // Cache the painted SVG across a scrub — skip querySelector on every move.
  // Still measure getBoundingClientRect each move (scroll/resize while hovering
  // would stale a cached rect).
  const svgRef = useRef<Element | null>(null);

  const act = (i: number | null): void => {
    if (activeRef.current === i) return; // renders track unit changes, not moves
    activeRef.current = i;
    setActive(i);
    onActive?.(i === null ? null : datum(i));
  };
  const select = (i: number | null): void => {
    const next = i === null || selected === i ? null : i; // re-tap clears
    if (!controlled) setSel(next);
    onSelect?.(next === null ? null : datum(next));
  };

  // LIGHT DISMISS. A pin outlives the pointer by design, which used to mean it
  // outlived the reader's interest in it too: re-tapping the same unit and
  // Escape were the only ways out, and Escape only reached a chart that still
  // had focus. Clicking away — the thing everyone tries first — left the mark
  // ringed and every other mark dimmed by `:has([data-mc-active])`, with no way
  // back short of tabbing to the chart. So a pointerdown that is not this
  // chart's own drops the selection, and Escape does it from anywhere.
  //
  // The listeners exist ONLY while something is pinned: an idle chart adds none,
  // and a page of 500 charts adds as many as it has pins. They bind on `window`
  // (the bare globals are `window.addEventListener`/`removeEventListener`, and
  // dropping the `document.` qualifier is 36 B across ~90 bundles) so they run
  // after React's root listener, which sits on the app container or a portal
  // container — both inside the document.
  //
  // Identity, not containment, decides "not ours": `bind`'s own handler stamps
  // the native event as it passes, so an event raised inside this chart is
  // already stamped by the time it arrives here, and a chart with no host ref
  // needs none. Comparing the event itself cannot go stale either — a handler
  // that never runs leaves no flag behind for the next event to trip over.
  //
  // `e.key ?? "Escape"` reads as "a pointerdown, or the one key that dismisses":
  // pointer events carry no `key`, so the nullish default admits them and every
  // other keystroke falls out. Cheaper than testing `e.type` and no less exact,
  // since these two listeners are the only ones that reach this function.
  useEffect(() => {
    if (selected === null) return;
    const off = (e: Event & { key?: string }): void => {
      if (e !== down.current && (e.key ?? "Escape") === "Escape") select(null);
    };
    addEventListener("pointerdown", off);
    addEventListener("keydown", off);
    return () => {
      removeEventListener("pointerdown", off);
      removeEventListener("keydown", off);
    };
  });

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
      down.current = e.nativeEvent; // also the stamp the dismiss listener skips
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
      const d = down.current as { clientX: number; clientY: number } | null;
      down.current = null;
      // A drag (down→up far apart) is a scrub, not a tap — don't select.
      if (d && Math.abs(e.clientX - d.clientX) + Math.abs(e.clientY - d.clientY) > 6) return;
      select(at(e));
    },
    onKeyDown: (e) => {
      down.current = e.nativeEvent; // stamp, so the dismiss listener doesn't double-clear
      const cur = activeRef.current ?? -1;
      // Escape is handled BEFORE the empty guard: a chart whose data went away
      // under a pin still has a pin to clear, and refusing the key there was the
      // one state the keyboard could not get out of.
      if (e.key === "Escape") {
        byKey.current = false;
        act(null);
        if (selected !== null) select(null);
        return;
      }
      if (count === 0) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        return select(cur < 0 ? selected : cur);
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
