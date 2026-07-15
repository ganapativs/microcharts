"use client";
// Interactive <MoonPhase>. Hover/focus reveals the percent; on
// change the lit region cross-fades (opacity, NOT d: interpolation — );
// announces through a polite region, throttled to ≥1 s. Wrapper focus only.
// Composes the static component.
import { useEffect, useRef, useState } from "react";
import { EN_MOON, type MoonStrings } from "../../core/strings-moon.js";
import { LiveRegion } from "../../shared/live-region.js";
import { MoonPhase as StaticMoonPhase, moonPhaseSummary, type MoonPhaseProps } from "./index.js";

export interface InteractiveMoonPhaseProps extends MoonPhaseProps {
  live?: boolean;
  strings?: MoonStrings;
}

export function MoonPhase(props: InteractiveMoonPhaseProps): React.ReactNode {
  const { live = true, strings = EN_MOON, title, value, mode = "progress", ...rest } = props;
  const summary = moonPhaseSummary(value, mode, strings);
  const wrap = useRef<HTMLSpanElement>(null);
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
  const pct = `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%`;

  return (
    <span
      ref={wrap}
      className="mc-moon-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      <StaticMoonPhase {...rest} value={value} mode={mode} strings={strings} summary={false} />
      {live ? <LiveRegion>{announced}</LiveRegion> : null}
      {hover ? (
        <span className="mc-spark-readout" style={{ left: "50%", transform: "translateX(-50%)" }}>
          {pct}
        </span>
      ) : null}
    </span>
  );
}
