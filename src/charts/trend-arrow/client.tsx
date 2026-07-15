"use client";
// Interactive <TrendArrow>. No pointer math — there is nothing to
// point at. `live` mode announces direction changes through a polite region and
// gives the glyph a one-shot pulse (CSS, reduced-motion-gated). Keyboard: the
// wrapper is focusable, nothing more. Composes the static component (canon).
import { useEffect, useRef, useState } from "react";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_SCALAR, type ScalarStrings } from "../../core/strings-scalar.js";
import { TrendArrow as StaticTrendArrow, trendArrowModel, type TrendArrowProps } from "./index.js";

export interface InteractiveTrendArrowProps extends TrendArrowProps {
  /** Announce + pulse when the direction changes (default true). */
  live?: boolean;
  strings?: ScalarStrings;
  /**
   * Opt-in entrance motion (default `false`): the glyph lifts and scales in
   * (a subtle `pop`) when the chart first mounts client-side. The pop is a
   * one-shot at mount; the direction-change pulse (CSS `transform` on this same
   * `.mc-root` svg) only fires on a later value change, so the two never run at
   * once. Inert on the server and on hydrated server HTML;
   * `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function TrendArrow(props: InteractiveTrendArrowProps): React.ReactNode {
  const { live = true, animate = false, strings = EN_SCALAR, title, ...rest } = props;
  const model = trendArrowModel({ ...rest, strings });
  const [pulse, setPulse] = useState(false);
  const prev = useRef(model.direction);
  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "pop", animate);

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
      ref={hostRef}
      className="mc-trend-live"
      data-pulse={pulse ? "1" : undefined}
      tabIndex={0}
      role="img"
      aria-label={label}
    >
      <StaticTrendArrow {...rest} strings={strings} summary={false} />
      {live ? <LiveRegion>{model.summary}</LiveRegion> : null}
    </span>
  );
}
