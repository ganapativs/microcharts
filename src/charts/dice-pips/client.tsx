"use client";
// Interactive <DicePips> (plan/24 #2). Announces the new face through a polite
// region on change; the pip set cross-fades (opacity, reduced-motion → instant).
// No sub-part navigation — the pips are one value. Composes the static component.
import { useEffect, useRef, useState } from "react";
import { EN_DICE, type DiceStrings } from "../../core/strings-dice.js";
import { DicePips as StaticDicePips, dicePipsSummary, type DicePipsProps } from "./index.js";

export interface InteractiveDicePipsProps extends DicePipsProps {
  /** Announce face changes through a polite region (default true). */
  live?: boolean;
  strings?: DiceStrings;
}

export function DicePips(props: InteractiveDicePipsProps): React.ReactNode {
  const { live = true, strings = EN_DICE, title, value, ...rest } = props;
  const summary = dicePipsSummary(value, strings);
  const wrap = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);
  const [announced, setAnnounced] = useState("");

  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    if (live) setAnnounced(summary);
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const marks = wrap.current?.querySelectorAll<SVGElement>('[data-mc-ink="point"]');
    marks?.forEach((m) =>
      m.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: "ease-out" }),
    );
  }, [value, live, summary]);

  const label = [title, summary].filter(Boolean).join(". ") || undefined;

  return (
    <span
      ref={wrap}
      className="mc-dice-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
    >
      <StaticDicePips {...rest} value={value} strings={strings} summary={false} />
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
