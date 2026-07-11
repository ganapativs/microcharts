"use client";
// Interactive <ProgressRing> (plan/22 #17). `live` announces at 25/50/75/100%
// threshold crossings only (documented anti-spam rule). No pointer lookup
// (single mark). Composes the static component (canon).
import { useEffect, useMemo, useRef, useState } from "react";
import { makeFormatter } from "../../core/format.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { EN_SCALAR, type ScalarStrings } from "../../core/strings-scalar.js";
import { ProgressRing as StaticProgressRing, type ProgressRingProps } from "./index.js";

export interface InteractiveProgressRingProps extends ProgressRingProps {
  /** Announce at quarter-threshold crossings (default true). */
  live?: boolean;
  strings?: ScalarStrings;
  /**
   * Opt-in entrance motion (default `false`): the arc draws on when the chart
   * first mounts client-side. Inert on the server and on hydrated server
   * HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

const THRESHOLDS = [0.25, 0.5, 0.75, 1];

export function ProgressRing(props: InteractiveProgressRingProps): React.ReactNode {
  const { live = true, animate = false, strings = EN_SCALAR, title, ...rest } = props;
  const { value, max = 1, sweep = false, format, locale } = rest;
  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "draw", animate);
  const fraction =
    Number.isFinite(value) && Number.isFinite(max) && max > 0 ? value / max : Number.NaN;
  const pctFmt = useMemo(
    () => makeFormatter(format, locale, { style: "percent", maximumFractionDigits: 0 }),
    [format, locale],
  );

  const [announced, setAnnounced] = useState("");
  const prev = useRef(fraction);
  useEffect(() => {
    const before = prev.current;
    prev.current = fraction;
    if (!live || !Number.isFinite(fraction) || !Number.isFinite(before)) return;
    const crossed = THRESHOLDS.some((t) => before < t && fraction >= t);
    if (!crossed) return;
    setAnnounced(
      sweep
        ? strings.remaining(pctFmt(Math.max(0, 1 - fraction)))
        : strings.progress(pctFmt(Math.min(1, fraction))),
    );
  }, [fraction, live, sweep, strings, pctFmt]);

  const summaryText = Number.isFinite(fraction)
    ? sweep
      ? strings.remaining(pctFmt(Math.max(0, 1 - fraction)))
      : strings.progress(pctFmt(fraction))
    : strings.noData;
  const label = [title, summaryText].filter(Boolean).join(". ") || undefined;

  return (
    <span
      ref={hostRef}
      className="mc-ring-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
    >
      <StaticProgressRing {...rest} strings={strings} summary={false} />
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
