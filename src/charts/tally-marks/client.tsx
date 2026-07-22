"use client";
// Interactive <TallyMarks>. Announces the new total through a
// polite region on change; newly added marks draw in via a one-shot
// stroke-dashoffset sweep (≤200 ms, reduced-motion → instant). No pointer or
// keyboard model beyond wrapper focus — a count has no sub-parts to navigate.
// Composes the static component (canon); geometry is never re-implemented.
import { useEffect, useRef, useState } from "react";
import { useSeatHoist } from "../../shared/seat-hoist.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { named, fillFor, wrap as wrapAttrs, type MicroDatum } from "../../shared/interactive.js";
import { EN_TALLY, type TallyStrings } from "../../core/strings-tally.js";
import { TallyMarks as StaticTallyMarks, tallySummary, type TallyMarksProps } from "./index.js";

export interface InteractiveTallyMarksProps extends TallyMarksProps {
  /** Announce count changes through a polite region (default true). */
  live?: boolean;
  strings?: TallyStrings;
  /**
   * Opt-in entrance motion (default `false`): the whole glyph pops in (fade +
   * scale) when the chart first mounts client-side — a whole-svg animation, so
   * it never collides with the per-increment stroke sweep this entry already
   * drives. Inert on the server and on hydrated server HTML;
   * `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
  /** Click/tap or Enter/Space — `{ index: 0, value: the count }`. */
  onSelect?: ((datum: MicroDatum | null) => void) | undefined;
}

export function TallyMarks(props: InteractiveTallyMarksProps): React.ReactNode {
  const {
    live = true,
    strings = EN_TALLY,
    title,
    value,
    pen,
    animate = false,
    onSelect,
    className,
    style,
    ...rest
  } = props;
  const summary = tallySummary(value, strings);
  const wrap = useRef<HTMLSpanElement>(null);
  // seat the wrapper, not just the SVG, so the click target stays on the
  // painted glyph when this sits inline in prose (see seat-hoist).
  useSeatHoist(wrap);
  useEntrance(wrap, "pop", animate);
  const prev = useRef(value);
  // length of the path at the previous count — lets a +1 draw ONLY the newly
  // added subpath (static dash prefix = the old marks) instead of re-drawing
  // the whole tally on every increment.
  const prevLen = useRef<number | null>(null);
  const [announced, setAnnounced] = useState("");

  useEffect(() => {
    if (prev.current === value) return;
    const grew = value > prev.current;
    prev.current = value;
    if (live) setAnnounced(summary);
    const path = wrap.current?.querySelector<SVGPathElement>('path[data-mc-ink="data"]');
    const len = path ? path.getTotalLength() : 0;
    const from = prevLen.current;
    prevLen.current = len; // keep synced for the next delta (grow OR shrink)
    if (!grew) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    if (!path || len === 0) return;
    // The "ruled" pen appends strokes deterministically, so the prior marks are
    // byte-identical (0…from stays put) and only the [from, len] tail is new —
    // sweep the dashoffset over just that delta. The "drawn" pen re-seeds its
    // jitter from the count, shifting every earlier stroke, so its prefix isn't
    // stable: fall back to re-drawing the whole path. (The first grow after
    // mount has no prior length either, so it also draws whole.)
    const delta = pen !== "drawn" && from !== null && from < len ? len - from : len;
    path.style.strokeDasharray = String(len);
    const anim = path.animate([{ strokeDashoffset: delta }, { strokeDashoffset: 0 }], {
      duration: 200,
      easing: "cubic-bezier(0.23, 1, 0.32, 1)",
    });
    // drop the dash after the sweep so later static renders are clean
    anim.onfinish = () => {
      path.style.strokeDasharray = "";
    };
    return () => {
      anim.cancel();
      path.style.strokeDasharray = "";
    };
  }, [value, live, summary, pen]);

  const label = [title, summary].filter(Boolean).join(". ") || undefined;

  // The strokes are ONE count, not N navigable marks: a single selectable unit
  // (index 0) carrying the integer the tally reads back (floored, ≥ 0).
  const pick = (): void =>
    onSelect?.({
      index: 0,
      value: Number.isFinite(value) ? Math.max(0, Math.floor(value)) : null,
    });

  return (
    <span
      ref={wrap}
      {...wrapAttrs("mc-tally-live", className, style)}
      {...named(label)}
      onClick={pick}
      onKeyDown={(e) => {
        if (!onSelect || (e.key !== "Enter" && e.key !== " ")) return;
        e.preventDefault();
        pick();
      }}
    >
      <StaticTallyMarks
        {...rest}
        pen={pen}
        value={value}
        strings={strings}
        summary={false}
        style={fillFor(style)}
      />
      <LiveRegion>{live && props.summary !== false ? announced : ""}</LiveRegion>
    </span>
  );
}
