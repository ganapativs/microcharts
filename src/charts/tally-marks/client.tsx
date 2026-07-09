"use client";
// Interactive <TallyMarks> (plan/24 #1). Announces the new total through a
// polite region on change; newly added marks draw in via a one-shot
// stroke-dashoffset sweep (≤200 ms, reduced-motion → instant). No pointer or
// keyboard model beyond wrapper focus — a count has no sub-parts to navigate.
// Composes the static component (canon); geometry is never re-implemented.
import { useEffect, useRef, useState } from "react";
import { EN_TALLY, type TallyStrings } from "../../core/strings-tally.js";
import { TallyMarks as StaticTallyMarks, tallySummary, type TallyMarksProps } from "./index.js";

export interface InteractiveTallyMarksProps extends TallyMarksProps {
  /** Announce count changes through a polite region (default true). */
  live?: boolean;
  strings?: TallyStrings;
}

export function TallyMarks(props: InteractiveTallyMarksProps): React.ReactNode {
  const { live = true, strings = EN_TALLY, title, value, ...rest } = props;
  const summary = tallySummary(value, strings);
  const wrap = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);
  const [announced, setAnnounced] = useState("");

  useEffect(() => {
    if (prev.current === value) return;
    const grew = value > prev.current;
    prev.current = value;
    if (live) setAnnounced(summary);
    if (!grew) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const path = wrap.current?.querySelector<SVGPathElement>('path[data-mc-ink="data"]');
    if (!path) return;
    const len = path.getTotalLength();
    path.style.strokeDasharray = String(len);
    const anim = path.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], {
      duration: 200,
      easing: "ease-out",
    });
    // drop the dash after the sweep so later static renders are clean
    anim.onfinish = () => {
      path.style.strokeDasharray = "";
    };
    return () => {
      anim.cancel();
      path.style.strokeDasharray = "";
    };
  }, [value, live, summary]);

  const label = [title, summary].filter(Boolean).join(". ") || undefined;

  return (
    <span
      ref={wrap}
      className="mc-tally-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
    >
      <StaticTallyMarks {...rest} value={value} strings={strings} summary={false} />
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
