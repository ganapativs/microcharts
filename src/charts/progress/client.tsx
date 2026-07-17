"use client";
// Interactive <Progress>. `live` re-announces through a polite
// region, throttled to whole-percent changes (no spam while a value streams).
// Fill-width transition is CSS, reduced-motion-gated. No pointer math (single
// mark). Composes the static component (canon).
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { FILL } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_SCALAR, type ScalarStrings } from "../../core/strings-scalar.js";
import { Progress as StaticProgress, progressModel, type ProgressProps } from "./index.js";

export interface InteractiveProgressProps extends ProgressProps {
  /** Announce whole-percent changes (default true). */
  live?: boolean;
  strings?: ScalarStrings;
  /**
   * Opt-in entrance motion (default `false`): the fill sweeps in from the left
   * when the chart first mounts client-side. Independent of the existing CSS
   * transition on the fill rect's `width` (which eases live value updates, a
   * different property than the WAAPI `transform` this drives) — the two
   * never run at once, since the entrance fires once on mount before any
   * value update. Inert on the server and on hydrated server HTML;
   * `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function Progress(props: InteractiveProgressProps): React.ReactNode {
  const {
    live = true,
    animate = false,
    strings = EN_SCALAR,
    title,
    className,
    style,
    ...rest
  } = props;
  const model = progressModel({ ...rest, strings });
  const wholePct = Number.isFinite(model.fraction) ? Math.round(model.fraction * 100) : null;
  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "sweep", animate);

  const [announced, setAnnounced] = useState("");
  const prev = useRef(wholePct);
  useEffect(() => {
    if (prev.current === wholePct) return; // sub-percent movement stays quiet
    prev.current = wholePct;
    if (live) setAnnounced(model.summary);
  }, [wholePct, model.summary, live]);

  const label = [title, model.summary].filter(Boolean).join(". ") || undefined;

  const wrapStyle: CSSProperties = {
    display: "inline-block",
    position: "relative",
    lineHeight: 0,
    ...style,
  };

  return (
    <span
      ref={hostRef}
      className={className ? `mc-progress-live ${className}` : "mc-progress-live"}
      style={wrapStyle}
      tabIndex={0}
      role="img"
      aria-label={label}
    >
      <StaticProgress {...rest} style={FILL} strings={strings} summary={false} />
      {live ? <LiveRegion>{announced}</LiveRegion> : null}
    </span>
  );
}
