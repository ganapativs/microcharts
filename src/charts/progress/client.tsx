"use client";
// Interactive <Progress>. `live` re-announces through a polite
// region, throttled to whole-percent changes (no spam while a value streams).
// Fill-width transition is CSS, reduced-motion-gated. No pointer math (single
// mark). Composes the static component (canon).
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
  const pick = (): void =>
    onSelect?.({ index: 0, value: Number.isFinite(model.fraction) ? model.fraction : null });

  return (
    <span
      ref={hostRef}
      {...wrap("mc-progress-live", className, style)}
      {...named(label)}
      onClick={pick}
      onKeyDown={(e) => {
        if (!onSelect || (e.key !== "Enter" && e.key !== " ")) return;
        e.preventDefault();
        pick();
      }}
    >
      <StaticProgress {...rest} style={fillFor(style)} strings={strings} summary={false} />
      {live ? <LiveRegion>{announced}</LiveRegion> : null}
    </span>
  );
}
