"use client";
// Interactive <MoonPhase>. Hover/focus reveals the percent; on
// change the lit region cross-fades (opacity, NOT d: interpolation — no Safari);
// announces through a polite region, throttled to ≥1 s. Wrapper focus only.
// Composes the static component.
import { useEffect, useRef, useState } from "react";
import { EN_MOON, type MoonStrings } from "../../core/strings-moon.js";
import { named, fillFor, wrap as wrapAttrs, type MicroDatum } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { MoonPhase as StaticMoonPhase, moonPhaseSummary, type MoonPhaseProps } from "./index.js";

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
    animate = false,
    readout = true,
    onSelect,
    className,
    style,
    ...rest
  } = props;
  const summary = moonPhaseSummary(value, mode, strings);
  const wrap = useRef<HTMLSpanElement>(null);
  useEntrance(wrap, "pop", animate);
  const prev = useRef(value);
  const last = useRef(0);
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
      const lit = wrap.current?.querySelector<SVGPathElement>("path");
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
      setAnnounced(summary);
    };
    const since = performance.now() - last.current;
    if (since >= 1000) emit();
    else {
      clearTimeout(timer.current);
      timer.current = setTimeout(emit, 1000 - since);
    }
    return () => clearTimeout(timer.current);
  }, [value, summary, live]);

  const label = [title, summary].filter(Boolean).join(". ") || undefined;
  // The lit AREA is the datum, so the clamped fraction is what both the readout
  // and `onSelect` report — one disc, one selectable unit (index 0).
  const frac = Math.min(1, Math.max(0, value));
  const pct = `${Math.round((Number.isFinite(frac) ? frac : 0) * 100)}%`;
  const pick = (): void =>
    onSelect?.({ index: 0, value: Number.isFinite(frac) ? frac : null, formatted: pct });

  return (
    <span
      ref={wrap}
      {...wrapAttrs("mc-moon-live", className, style)}
      {...named(label)}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
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
        strings={strings}
        summary={false}
      />
      <LiveRegion>{live && props.summary !== false ? announced : ""}</LiveRegion>
      {readout && hover ? (
        <span className="mc-spark-readout" style={{ left: "50%", transform: "translateX(-50%)" }}>
          {pct}
        </span>
      ) : null}
    </span>
  );
}
