"use client";
// Interactive <TallyMarks>. Announces the new total through a
// polite region on change; newly added marks draw in via a one-shot
// stroke-dashoffset sweep (≤200 ms, reduced-motion → instant). No pointer or
// keyboard model beyond wrapper focus — a count has no sub-parts to navigate.
// Composes the static component (canon); geometry is never re-implemented.
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { FILL } from "../../shared/interactive.js";
import { EN_TALLY, type TallyStrings } from "../../core/strings-tally.js";
import { TallyMarks as StaticTallyMarks, tallySummary, type TallyMarksProps } from "./index.js";

export interface InteractiveTallyMarksProps extends TallyMarksProps {
  /** Announce count changes through a polite region (default true). */
  live?: boolean;
  strings?: TallyStrings;
}

export function TallyMarks(props: InteractiveTallyMarksProps): React.ReactNode {
  const { live = true, strings = EN_TALLY, title, value, pen, className, style, ...rest } = props;
  const summary = tallySummary(value, strings);
  const wrapStyle: CSSProperties = {
    display: "inline-block",
    position: "relative",
    lineHeight: 0,
    ...style,
  };
  const wrap = useRef<HTMLSpanElement>(null);
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

  return (
    <span
      ref={wrap}
      className={className ? `mc-tally-live ${className}` : "mc-tally-live"}
      style={wrapStyle}
      tabIndex={0}
      role="img"
      aria-label={label}
    >
      <StaticTallyMarks
        {...rest}
        pen={pen}
        value={value}
        strings={strings}
        summary={false}
        style={FILL}
      />
      {live ? (
        <span
          aria-live="polite"
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            overflow: "hidden",
            clip: "rect(0 0 0 0)",
            whiteSpace: "nowrap",
          }}
        >
          {announced}
        </span>
      ) : null}
    </span>
  );
}
