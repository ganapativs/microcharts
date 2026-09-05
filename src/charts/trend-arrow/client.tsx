"use client";
// Interactive <TrendArrow>. No pointer math — there is nothing to
// point at. `live` mode announces direction changes through a polite region and
// gives the glyph a one-shot pulse (CSS, reduced-motion-gated). Keyboard:
// wrapper is focusable, nothing more.
import { memo, useRef } from "react";
import { named, useScalarActive, type MicroDatum } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { usePulseOnChange } from "../../shared/motion.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_SCALAR, type ScalarStrings } from "../../core/strings-scalar.js";
import { TrendArrow as StaticTrendArrow, trendArrowModel, type TrendArrowProps } from "./index.js";

// Memoized: hover only flips wrapper state, so the static SVG must not re-render.
const Static = memo(StaticTrendArrow);

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
  /**
   * The active (hovered / keyboard-focused) unit changed. One glyph = one unit, so
   * this fires once with `{ index: 0, … }` on pointer enter or focus and once
   * with `null` when that clears — never repeatedly while the pointer moves
   * inside the glyph, and never twice when hover and focus overlap.
   */
  onActive?: ((datum: MicroDatum | null) => void) | undefined;
  /** Click/tap or Enter/Space — `{ index: 0, value: the signed change, label: direction }`. */
  onSelect?: ((datum: MicroDatum | null) => void) | undefined;
}

export function TrendArrow(props: InteractiveTrendArrowProps): React.ReactNode {
  const {
    live = true,
    animate = false,
    strings = EN_SCALAR,
    title,
    summary,
    onActive,
    onSelect,
    ...rest
  } = props;
  const model = trendArrowModel({ ...rest, strings });
  const pulse = usePulseOnChange(model.direction, live);
  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "pop", animate);

  const accName =
    summary === false ? undefined : typeof summary === "string" ? summary : model.summary;
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  // One glyph, one selectable unit (index 0): the signed change it encodes,
  // with the resolved direction as its name. No roving — nothing to rove. One
  // builder, so `onActive` and `onSelect` can never report a different change.
  const datum = (): MicroDatum => ({
    index: 0,
    value: Number.isFinite(rest.value) ? rest.value : null,
    label: model.direction,
  });
  const { bind } = useScalarActive(datum, onActive, onSelect);

  return (
    <span
      ref={hostRef}
      className="mc-trend-live"
      data-mc-host=""
      data-pulse={pulse ? "1" : undefined}
      {...named(label)}
      {...bind}
    >
      <Static {...rest} strings={strings} summary={false} />
      <LiveRegion>{live && summary !== false ? model.summary : ""}</LiveRegion>
    </span>
  );
}
