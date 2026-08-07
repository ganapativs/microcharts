"use client";
// Interactive <ProgressRing>. `live` announces at 25/50/75/100%
// threshold crossings only (documented anti-spam rule). No pointer lookup
// (single mark) — hover/focus is a reveal of the percent, not a lookup.
import { useEffect, useMemo, useRef, useState } from "react";
import { makeUnitFormatter } from "../../core/format.js";
import { CHIP, named, fillFor, wrap, type MicroDatum } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_SCALAR, type ScalarStrings } from "../../core/strings-scalar.js";
import { ringLabelSize } from "./geometry.js";
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
  /**
   * Show the floating percent chip on hover/focus (default `true`). `false`
   * suppresses only the chip. Inert when `label="percent"` already prints it.
   */
  readout?: boolean;
  /**
   * The active (hovered / keyboard-focused) unit changed. One arc = one unit, so
   * this fires once with `{ index: 0, … }` on pointer enter or focus and once
   * with `null` when that clears — never repeatedly while the pointer moves
   * inside the ring, and never twice when hover and focus overlap.
   */
  onActive?: ((datum: MicroDatum | null) => void) | undefined;
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
    readout = true,
    onActive,
    onSelect,
    className,
    style,
    ...rest
  } = props;
  const { value, max = 1, sweep = false, format, locale } = rest;
  const hostRef = useRef<HTMLSpanElement>(null);
  // `trace`: the arc is drawn along its own stroke, clockwise from 12 o'clock.
  // A ring is not x-monotone, so the shared left→right front would open it from
  // both sides at once instead of accumulating like a value.
  useEntrance(hostRef, "draw", animate, { trace: true });
  const fraction =
    Number.isFinite(value) && Number.isFinite(max) && max > 0 ? value / max : Number.NaN;
  const pctFmt = useMemo(
    () => makeUnitFormatter(format, locale, { style: "percent", maximumFractionDigits: 0 }),
    [format, locale],
  );

  const [announced, setAnnounced] = useState("");
  const [hover, setHover] = useState(false);
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

  // What the chip shows: the swept percent, or the REMAINING percent in
  // `sweep` mode — the same number the summary speaks, and `formatted` mirrors
  // it exactly.
  const readoutText = !Number.isFinite(fraction)
    ? "—"
    : sweep
      ? pctFmt(Math.max(0, 1 - fraction))
      : pctFmt(fraction);

  // `readoutText` is character-for-character what the static entry prints in
  // the hole (both modes, and "—" for no data), so its length is the fit budget
  // geometry weighs.
  const printsLabel =
    rest.label === "percent" && ringLabelSize(rest.size, rest.weight, readoutText.length) > 0;

  // One arc, one selectable unit (index 0): the fraction it sweeps. One builder,
  // so `onActive` and `onSelect` can never report a different number or a
  // different string than the chip paints.
  const datum = (): MicroDatum => ({
    index: 0,
    value: Number.isFinite(fraction) ? fraction : null,
    formatted: readoutText,
  });
  const pick = (): void => onSelect?.(datum());
  // ONE unit: `onActive` fires on the enter/leave EDGE only. `hover` alone can't
  // gate it — pointer-enter then focus both set it `true`, which would announce
  // the same unit twice — so the last emitted state is tracked here.
  const shown = useRef(false);
  const activate = (on: boolean): void => {
    setHover(on);
    if (shown.current === on) return;
    shown.current = on;
    onActive?.(on ? datum() : null);
  };

  return (
    <span
      ref={hostRef}
      {...wrap("mc-ring-live", className, style)}
      {...named(label)}
      onPointerEnter={() => activate(true)}
      onPointerLeave={() => activate(false)}
      onFocus={() => activate(true)}
      onBlur={() => activate(false)}
      onClick={pick}
      onKeyDown={(e) => {
        if (!onSelect || (e.key !== "Enter" && e.key !== " ")) return;
        e.preventDefault();
        pick();
      }}
    >
      <StaticProgressRing {...rest} style={fillFor(style)} strings={strings} summary={false} />
      <LiveRegion>{live && props.summary !== false ? announced : ""}</LiveRegion>
      {/* An arc is a rough gauge — the percent is invisible unless
          `label="percent"` prints it inside the ring. Hover/focus reveals it,
          the same reveal Bullet and Thermometer ship. Asking for the label is
          not the same as getting it: geometry drops the figure when the hole is
          too small (a 16px ring), and gating on the request alone left the
          percent painted nowhere while the name still announced it. */}
      {readout && hover && !printsLabel ? (
        <span className="mc-spark-readout" {...CHIP}>
          {readoutText}
        </span>
      ) : null}
    </span>
  );
}
