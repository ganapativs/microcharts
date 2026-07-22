"use client";
// Interactive <ProgressRing>. `live` announces at 25/50/75/100%
// threshold crossings only (documented anti-spam rule). No pointer lookup
// (single mark). Composes the static component (canon).
import { useEffect, useMemo, useRef, useState } from "react";
import { makeFormatter } from "../../core/format.js";
import { named, fillFor, wrap, type MicroDatum } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
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
  /** Click/tap or Enter/Space — `{ index: 0, value: the fraction value/max }`. */
  onSelect?: ((datum: MicroDatum | null) => void) | undefined;
}

const THRESHOLDS = [0.25, 0.5, 0.75, 1];

export function ProgressRing(props: InteractiveProgressRingProps): React.ReactNode {
  const {
    live = true,
    animate = false,
    strings = EN_SCALAR,
    title,
    summary,
    onSelect,
    className,
    style,
    ...rest
  } = props;
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
  const accName =
    summary === false ? undefined : typeof summary === "string" ? summary : summaryText;
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  // One arc, one selectable unit (index 0): the fraction it sweeps.
  const pick = (): void =>
    onSelect?.({
      index: 0,
      value: Number.isFinite(fraction) ? fraction : null,
      formatted: Number.isFinite(fraction) ? pctFmt(fraction) : undefined,
    });

  return (
    <span
      ref={hostRef}
      {...wrap("mc-ring-live", className, style)}
      {...named(label)}
      onClick={pick}
      onKeyDown={(e) => {
        if (!onSelect || (e.key !== "Enter" && e.key !== " ")) return;
        e.preventDefault();
        pick();
      }}
    >
      <StaticProgressRing {...rest} style={fillFor(style)} strings={strings} summary={false} />
      <LiveRegion>{live && props.summary !== false ? announced : ""}</LiveRegion>
    </span>
  );
}
