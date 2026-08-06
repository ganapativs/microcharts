"use client";
// Interactive <MoonPhase>. Hover/focus reveals the percent; on
// change the lit region cross-fades (opacity, NOT d: interpolation — no Safari);
// announces through a polite region, throttled to ≥1 s. Wrapper focus only.
import { useEffect, useRef, useState } from "react";
import { EN_MOON, type MoonStrings } from "../../core/strings-moon.js";
import {
  CHIP,
  named,
  fillFor,
  wrap as wrapAttrs,
  type MicroDatum,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import {
  MoonPhase as StaticMoonPhase,
  moonPct,
  moonPhaseSummary,
  type MoonPhaseProps,
} from "./index.js";

export interface InteractiveMoonPhaseProps extends MoonPhaseProps {
  live?: boolean;
  strings?: MoonStrings;
  /**
   * Opt-in entrance motion (default `false`): the disc pops in (fade + scale)
   * when the chart first mounts client-side — a whole-svg animation, so it
   * never collides with the per-change bloom the lit region already plays.
   * Inert on the server and on hydrated server HTML; `prefers-reduced-motion`
   * always wins.
   */
  animate?: boolean;
  /** Show the floating value chip on hover/focus (default `true`). `false` suppresses only the chip. */
  readout?: boolean;
  /**
   * The active (hovered / keyboard-focused) unit changed. One disc = one unit, so
   * this fires once with `{ index: 0, … }` on pointer enter or focus and once
   * with `null` when that clears — never repeatedly while the pointer moves
   * inside the disc, and never twice when hover and focus overlap.
   */
  onActive?: ((datum: MicroDatum | null) => void) | undefined;
  /** Click/tap or Enter/Space — `{ index: 0, value: the clamped 0–1 fraction }`. */
  onSelect?: ((datum: MicroDatum | null) => void) | undefined;
}

export function MoonPhase(props: InteractiveMoonPhaseProps): React.ReactNode {
  const {
    live = true,
    strings = EN_MOON,
    title,
    value,
    mode = "progress",
    locale,
    animate = false,
    readout = true,
    onActive,
    onSelect,
    className,
    style,
    ...rest
  } = props;
  const text = moonPhaseSummary(value, mode, strings, locale);
  const wrap = useRef<HTMLSpanElement>(null);
  useEntrance(wrap, "pop", animate);
  const prev = useRef(value);
  // -Infinity, not 0: `performance.now()` counts from THIS document's time
  // origin, so 0 reads as "announced at page load" and defers the leading edge
  // by up to a full second for any change in the page's first second — the
  // exact window a chart streamed into a reply lands in. -Infinity means "never
  // announced", so the first change emits at once and only repeats throttle.
  const last = useRef(-Infinity);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [hover, setHover] = useState(false);
  const [announced, setAnnounced] = useState("");

  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    if (!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      // The terminator can't morph (no d: interpolation on Safari), but a bare
      // fade reads flat — pair it with a subtle bloom so the light visibly
      // changes rather than dissolving.
      const lit = wrap.current?.querySelector<SVGPathElement>("[data-mc-moon]");
      if (lit) {
        lit.style.transformBox = "fill-box";
        lit.style.transformOrigin = "center";
        lit
          .animate(
            [
              { opacity: 0, transform: "scale(0.94)" },
              { opacity: 1, transform: "scale(1)" },
            ],
            { duration: 200, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
          )
          .finished.then(
            () => {
              lit.style.transformBox = "";
              lit.style.transformOrigin = "";
            },
            () => {},
          );
      }
    }
    if (!live) return;
    const emit = () => {
      last.current = performance.now();
      setAnnounced(text);
    };
    const since = performance.now() - last.current;
    if (since >= 1000) emit();
    else {
      clearTimeout(timer.current);
      timer.current = setTimeout(emit, 1000 - since);
    }
    return () => clearTimeout(timer.current);
  }, [value, text, live]);

  // The caller's `summary` owns the wrapper's name: `false` is the decorative
  // opt-out (`named()` renders `aria-hidden` and drops the tab stop with it), a
  // string replaces the generated sentence. The generated text stays what the
  // live region announces on a value change.
  const accName =
    props.summary === false ? undefined : typeof props.summary === "string" ? props.summary : text;
  const label = [title, accName].filter(Boolean).join(". ") || undefined;
  // The lit AREA is the datum, so the clamped fraction is what both the readout
  // and `onSelect` report — one disc, one selectable unit (index 0).
  const frac = Math.min(1, Math.max(0, value));
  const pct = moonPct(value, locale);
  // One builder, so `onActive` and `onSelect` can never report a different
  // number or a different string than the chip paints.
  const datum = (): MicroDatum => ({
    index: 0,
    value: Number.isFinite(frac) ? frac : null,
    formatted: pct,
  });
  const pick = (): void => onSelect?.(datum());
  // ONE unit: `onActive` fires on the enter/leave EDGE only. `hover` alone can't
  // gate it — pointer-enter then focus both set it `true`, which would announce
  // the same unit twice — so the last emitted state is tracked here.
  const shown = useRef(false);
  const activate = (on: boolean): void => {
    setHover(on);
    if (shown.current === on) return;
    shown.current = on;
    onActive?.(on ? datum() : null);
  };

  return (
    <span
      ref={wrap}
      {...wrapAttrs("mc-moon-live", className, style)}
      {...named(label)}
      onPointerEnter={() => activate(true)}
      onPointerLeave={() => activate(false)}
      onFocus={() => activate(true)}
      onBlur={() => activate(false)}
      onClick={pick}
      onKeyDown={(e) => {
        if (!onSelect || (e.key !== "Enter" && e.key !== " ")) return;
        e.preventDefault();
        pick();
      }}
    >
      <StaticMoonPhase
        {...rest}
        style={fillFor(style)}
        value={value}
        mode={mode}
        locale={locale}
        strings={strings}
        summary={false}
      />
      <LiveRegion>{live && props.summary !== false ? announced : ""}</LiveRegion>
      {readout && hover ? (
        <span className="mc-spark-readout" {...CHIP}>
          {pct}
        </span>
      ) : null}
    </span>
  );
}
