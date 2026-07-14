"use client";
// Interactive <Hourglass>. Sand levels cross-fade on change (opacity
// swap — not d: interpolation); announces at documented thresholds (50 / 90 /
// 100%), not on every tick. Wrapper focus only. Composes the static component.
import { useEffect, useRef, useState } from "react";
import { EN_HOURGLASS, type HourglassStrings } from "../../core/strings-hourglass.js";
import { Hourglass as StaticHourglass, hourglassSummary, type HourglassProps } from "./index.js";

export interface InteractiveHourglassProps extends HourglassProps {
  live?: boolean;
  strings?: HourglassStrings;
}

const THRESHOLDS = [0.5, 0.9, 1];

export function Hourglass(props: InteractiveHourglassProps): React.ReactNode {
  const { live = true, strings = EN_HOURGLASS, title, value, ...rest } = props;
  const summary = hourglassSummary(value, strings);
  const wrap = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);
  const [announced, setAnnounced] = useState("");

  useEffect(() => {
    const before = prev.current;
    if (before === value) return;
    prev.current = value;
    if (!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      // Sand FALLS: the top level settles down as it drains, the bottom pile
      // grows up from the floor as it fills — both scale from the floor (origin
      // set in styles.css) so the motion direction encodes gravity instead of a
      // flat cross-fade. ≤200ms, canonical strong ease-out. Scoped to the sand
      // paths (DOM order: top then bottom) so the glass frame never flickers.
      wrap.current?.querySelectorAll<SVGPathElement>("path.mc-hourglass-sand").forEach((p, i) =>
        p.animate(
          [
            { opacity: 0.4, transform: `scaleY(${i === 0 ? 1.08 : 0.92})` },
            { opacity: 1, transform: "scaleY(1)" },
          ],
          { duration: 200, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
        ),
      );
    }
    // announce only when a documented threshold was crossed
    const crossed = THRESHOLDS.some((t) => before < t !== value < t);
    if (live && crossed) setAnnounced(summary);
  }, [value, summary, live]);

  const label = [title, summary].filter(Boolean).join(". ") || undefined;

  return (
    <span
      ref={wrap}
      className="mc-hourglass-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
    >
      <StaticHourglass {...rest} value={value} strings={strings} summary={false} />
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
