"use client";
// Interactive <Delta> (plan/04 §4, plan/08 §5). The static glyph+value plus a
// `live` mode: when the value changes it re-announces the new figure through a
// polite region (for updating KPI cards) and gives a one-shot pulse. Motion is
// gated on reduced-motion in CSS; the announcement always fires.
import { useEffect, useRef, useState } from "react";
import { Delta as StaticDelta, deltaModel, type DeltaProps } from "./index.js";

export interface InteractiveDeltaProps extends DeltaProps {
  /** Announce + pulse when the value changes (default true). */
  live?: boolean;
}

export function Delta({ live = true, ...props }: InteractiveDeltaProps): React.ReactNode {
  const [pulse, setPulse] = useState(false);
  const prev = useRef(props.value);
  const { summary } = deltaModel(props);

  useEffect(() => {
    if (prev.current === props.value) return;
    prev.current = props.value;
    if (!live) return;
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 450);
    return () => clearTimeout(t);
  }, [props.value, live]);

  return (
    <span className="mc-delta-live" data-pulse={pulse ? "1" : undefined}>
      <StaticDelta {...props} />
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
          {summary}
        </span>
      ) : null}
    </span>
  );
}
