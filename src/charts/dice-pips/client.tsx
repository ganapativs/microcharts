"use client";
// Interactive <DicePips>. Announces the new face through a polite
// region on change; the pip set cross-fades (opacity, reduced-motion → instant).
// No sub-part navigation — the pips are one value. Composes the static component.
import { useEffect, useRef, useState } from "react";
import { EN_DICE, type DiceStrings } from "../../core/strings-dice.js";
import { FILL, wrap as wrapAttrs } from "../../shared/interactive.js";
import { DicePips as StaticDicePips, dicePipsSummary, type DicePipsProps } from "./index.js";

export interface InteractiveDicePipsProps extends DicePipsProps {
  /** Announce face changes through a polite region (default true). */
  live?: boolean;
  strings?: DiceStrings;
}

export function DicePips(props: InteractiveDicePipsProps): React.ReactNode {
  const { live = true, strings = EN_DICE, title, value, className, style, ...rest } = props;
  const summary = dicePipsSummary(value, strings);
  const wrap = useRef<HTMLSpanElement>(null);
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

  return (
    <span
      ref={wrap}
      {...wrapAttrs("mc-dice-live", className, style)}
      tabIndex={0}
      role="img"
      aria-label={label}
    >
      <StaticDicePips {...rest} style={FILL} value={value} strings={strings} summary={false} />
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
