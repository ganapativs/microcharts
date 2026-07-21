"use client";
// Interactive <DicePips>. Announces the new face through a polite
// region on change; the pip set cross-fades (opacity, reduced-motion → instant).
// No sub-part navigation — the pips are one value. Composes the static component.
import { useEffect, useRef, useState } from "react";
import { useSeatHoist } from "../../shared/seat-hoist.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_DICE, type DiceStrings } from "../../core/strings-dice.js";
import { named, fillFor, wrap as wrapAttrs, type MicroDatum } from "../../shared/interactive.js";
import { DicePips as StaticDicePips, dicePipsSummary, type DicePipsProps } from "./index.js";

export interface InteractiveDicePipsProps extends DicePipsProps {
  /** Announce face changes through a polite region (default true). */
  live?: boolean;
  strings?: DiceStrings;
  /**
   * Opt-in entrance motion (default `false`): the face pops in (fade + scale)
   * when the chart first mounts client-side — a whole-svg animation, so it
   * never collides with the per-roll pip pop-in this entry already drives.
   * Inert on the server and on hydrated server HTML; `prefers-reduced-motion`
   * always wins.
   */
  animate?: boolean;
  /** Click/tap or Enter/Space — `{ index: 0, value: the face count }`. */
  onSelect?: ((datum: MicroDatum | null) => void) | undefined;
}

export function DicePips(props: InteractiveDicePipsProps): React.ReactNode {
  const {
    live = true,
    strings = EN_DICE,
    title,
    value,
    animate = false,
    onSelect,
    className,
    style,
    ...rest
  } = props;
  const summary = dicePipsSummary(value, strings);
  const wrap = useRef<HTMLSpanElement>(null);
  // seat the wrapper, not just the SVG, so the click target stays on the
  // painted glyph when this sits inline in prose (see seat-hoist).
  useSeatHoist(wrap);
  useEntrance(wrap, "pop", animate);
  const prev = useRef(value);
  const [announced, setAnnounced] = useState("");

  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    if (live) setAnnounced(summary);
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    // A new face is a roll landing — pips pop into place (scale + a tiny
    // per-pip stagger), not a flat dissolve.
    const marks = wrap.current?.querySelectorAll<SVGElement>('[data-mc-ink="point"]');
    marks?.forEach((m, i) => {
      m.style.transformBox = "fill-box";
      m.style.transformOrigin = "center";
      m.animate(
        [
          { opacity: 0, transform: "scale(0.6)" },
          { opacity: 1, transform: "scale(1)" },
        ],
        { duration: 150, delay: i * 20, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
      ).finished.then(
        () => {
          m.style.transformBox = "";
          m.style.transformOrigin = "";
        },
        () => {},
      );
    });
  }, [value, live, summary]);

  const label = [title, summary].filter(Boolean).join(". ") || undefined;

  // The pips are ONE face, not six navigable marks: a single selectable unit
  // (index 0) carrying the rounded count the face renders.
  const pick = (): void =>
    onSelect?.({ index: 0, value: Number.isFinite(value) ? Math.round(value) : null });

  return (
    <span
      ref={wrap}
      {...wrapAttrs("mc-dice-live", className, style)}
      {...named(label)}
      onClick={pick}
      onKeyDown={(e) => {
        if (!onSelect || (e.key !== "Enter" && e.key !== " ")) return;
        e.preventDefault();
        pick();
      }}
    >
      <StaticDicePips
        {...rest}
        style={fillFor(style)}
        value={value}
        strings={strings}
        summary={false}
      />
      {live ? <LiveRegion>{announced}</LiveRegion> : null}
    </span>
  );
}
