"use client";
// Interactive <Progress>. `live` re-announces through a polite
// region, throttled to whole-percent changes (no spam while a value streams).
// Fill-width transition is CSS, reduced-motion-gated. No pointer math (single
// mark) — hover/focus is a reveal of the reading, for the `label="none"` bar
// that prints nothing. Composes the static component (canon).
import { useEffect, useRef, useState } from "react";
import { named, fillFor, wrap, type MicroDatum } from "../../shared/interactive.js";
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
  /**
   * Show the floating value chip on hover/focus (default `true`). It appears
   * only when the bar prints no label of its own (`label="none"`).
   */
  readout?: boolean;
  /**
   * The active (hovered / keyboard-focused) unit changed. One bar = one unit, so
   * this fires once with `{ index: 0, … }` on pointer enter or focus and once
   * with `null` when that clears — never repeatedly while the pointer moves
   * inside the mark, and never twice when hover and focus overlap.
   */
  onActive?: ((datum: MicroDatum | null) => void) | undefined;
  /** Click/tap or Enter/Space — `{ index: 0, value: the fraction value/max }`. */
  onSelect?: ((datum: MicroDatum | null) => void) | undefined;
}

export function Progress(props: InteractiveProgressProps): React.ReactNode {
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
  const model = progressModel({ ...rest, strings });
  const wholePct = Number.isFinite(model.fraction) ? Math.round(model.fraction * 100) : null;
  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "sweep", animate);

  const [announced, setAnnounced] = useState("");
  const [hover, setHover] = useState(false);
  const prev = useRef(wholePct);
  useEffect(() => {
    if (prev.current === wholePct) return; // sub-percent movement stays quiet
    prev.current = wholePct;
    if (live) setAnnounced(model.summary);
  }, [wholePct, model.summary, live]);

  const accName =
    summary === false ? undefined : typeof summary === "string" ? summary : model.summary;
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  // One bar, one selectable unit (index 0): the fraction it encodes (unclamped —
  // the label already tells the truth past 100%).
  // `label="none"` is the only mode with nothing painted; every other mode
  // already renders `model.display`, so the chip would just duplicate it.
  // The chip is the percent the bar WOULD have printed, resolved by the same
  // model — never `${wholePct}%`, which hardcoded an en-US percent and ignored
  // `locale` (and `format`) that every other number here honours.
  const chipText =
    rest.label === "none"
      ? progressModel({ ...rest, strings, label: "percent" }).display
      : undefined;
  // One builder, so `onActive` and `onSelect` can never report a different
  // number or a different string than the chip paints.
  const datum = (): MicroDatum => ({
    index: 0,
    value: Number.isFinite(model.fraction) ? model.fraction : null,
    formatted: model.display ?? chipText,
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
      {...wrap("mc-progress-live", className, style)}
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
      <StaticProgress {...rest} style={fillFor(style)} strings={strings} summary={false} />
      <LiveRegion>{live && props.summary !== false ? announced : ""}</LiveRegion>
      {readout && hover && chipText ? (
        <span className="mc-spark-readout" style={{ left: "50%", transform: "translateX(-50%)" }}>
          {chipText}
        </span>
      ) : null}
    </span>
  );
}
