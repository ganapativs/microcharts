"use client";
// Interactive <TrendArrow> (plan/22 #1). No pointer math — there is nothing to
// point at. `live` mode announces direction changes through a polite region and
// gives the glyph a one-shot pulse (CSS, reduced-motion-gated). Keyboard: the
// wrapper is focusable, nothing more. Composes the static component (canon).
import { useEffect, useRef, useState } from "react";
import { EN_SCALAR, type ScalarStrings } from "../../core/strings-scalar.js";
import { TrendArrow as StaticTrendArrow, trendArrowModel, type TrendArrowProps } from "./index.js";

export interface InteractiveTrendArrowProps extends TrendArrowProps {
  /** Announce + pulse when the direction changes (default true). */
  live?: boolean;
  strings?: ScalarStrings;
}

export function TrendArrow(props: InteractiveTrendArrowProps): React.ReactNode {
  const { live = true, strings = EN_SCALAR, title, ...rest } = props;
  const model = trendArrowModel({ ...rest, strings });
  const [pulse, setPulse] = useState(false);
  const prev = useRef(model.direction);

  useEffect(() => {
    if (prev.current === model.direction) return;
    prev.current = model.direction;
    if (!live) return;
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 450);
    return () => clearTimeout(t);
  }, [model.direction, live]);

  const label = [title, model.summary].filter(Boolean).join(". ") || undefined;

  return (
    <span
      className="mc-trend-live"
      data-pulse={pulse ? "1" : undefined}
      tabIndex={0}
      role="img"
      aria-label={label}
    >
      <StaticTrendArrow {...rest} strings={strings} summary={false} />
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
          {model.summary}
        </span>
      ) : null}
    </span>
  );
}
