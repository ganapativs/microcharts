"use client";
// Interactive <WindBarb>. One glyph, one reading: hover/focus (or click/Enter)
// reports the reading, and a live value change re-announces it through a
// polite region. No sub-part navigation — the shaft is a single unit, and the
// accessible name already carries the full reading.
import { useRef } from "react";
import { useSeatHoist } from "../../shared/seat-hoist.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion, useAnnounceOnChange } from "../../shared/live-region.js";
import { EN_WIND_BARB, octant, type WindBarbStrings } from "../../core/strings-wind-barb.js";
import { makeFormatter } from "../../core/format.js";
import { isFiniteValue } from "../../core/types.js";
import {
  CHIP,
  named,
  fillFor,
  useScalarActive,
  wrap as wrapAttrs,
  type MicroDatum,
} from "../../shared/interactive.js";
import { WindBarb as StaticWindBarb, windBarbSummary, type WindBarbProps } from "./index.js";
import { isCalm, resolveStep } from "./geometry.js";

export interface InteractiveWindBarbProps extends WindBarbProps {
  /** Announce reading changes through a polite region (default true). */
  live?: boolean;
  /** Show the floating reading chip on hover/focus (default `true`). `false`
   *  suppresses only the chip. Inert when `label="value"` already prints it. */
  readout?: boolean;
  strings?: WindBarbStrings;
  /**
   * Opt-in entrance motion (default `false`): the glyph pops in (fade + scale)
   * when the chart first mounts client-side — a whole-svg animation, so it
   * never collides with a direction change. Inert on the server and on
   * hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
  /**
   * The active (hovered / keyboard-focused) unit changed. The glyph is ONE unit,
   * so this fires once with `{ index: 0, … }` on pointer enter or focus and once
   * with `null` when that clears — never repeatedly while the pointer moves
   * inside the glyph, and never twice when hover and focus overlap.
   */
  onActive?: ((datum: MicroDatum | null) => void) | undefined;
  /** Click/tap or Enter/Space — `{ index: 0, value: magnitude }`. */
  onSelect?: ((datum: MicroDatum | null) => void) | undefined;
}

export function WindBarb(props: InteractiveWindBarbProps): React.ReactNode {
  const {
    live = true,
    readout = true,
    strings = EN_WIND_BARB,
    title,
    direction,
    magnitude,
    step: stepProp,
    animate = false,
    onActive,
    onSelect,
    className,
    style,
    ...rest
  } = props;
  // The static resolves the quantum and formats the same way, so the glyph and
  // its name are never drawn against two different scales.
  const step = resolveStep(stepProp);
  const fmt = makeFormatter(props.format, props.locale);
  const text = windBarbSummary(direction, magnitude, step, strings, fmt);
  const wrap = useRef<HTMLSpanElement>(null);
  // seat the wrapper, not just the SVG, so the click target stays on the
  // painted glyph when this sits inline in prose (see seat-hoist).
  useSeatHoist(wrap);
  useEntrance(wrap, "pop", animate);
  const announced = useAnnounceOnChange(text, text, live);

  // The caller's `summary` owns the wrapper's name: `false` is the decorative
  // opt-out (`named()` renders `aria-hidden` and drops the tab stop with it), a
  // string replaces the generated sentence. The generated text stays what the
  // live region announces on a value change.
  const accName =
    props.summary === false ? undefined : typeof props.summary === "string" ? props.summary : text;
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  // One glyph, one selectable unit (index 0). The magnitude is the reading the
  // label prints (`|magnitude|` — the static flips direction, not sign); the
  // octant word names the unit for a consumer that tracks it.
  const readable = isFiniteValue(magnitude) && Number.isFinite(direction);
  const deg = ((Math.round((magnitude ?? 0) < 0 ? direction + 180 : direction) % 360) + 360) % 360;
  const calm = isCalm(direction, magnitude, step);
  // The chip names the READING (direction + magnitude) that the glyph only
  // implies — the same terse form for the visible chip and `datum.formatted`.
  const chipText = calm
    ? strings.windBarbCalm
    : readable
      ? strings.windBarbChip(strings.compass8[octant(deg)]!, String(deg), fmt(Math.abs(magnitude)))
      : "";
  const datum = (): MicroDatum => ({
    index: 0,
    value: readable ? Math.abs(magnitude) : null,
    label: calm
      ? strings.windBarbCalm
      : Number.isFinite(direction)
        ? strings.compass8[octant(deg)]!
        : undefined,
    formatted: chipText,
  });
  const { active: hover, bind } = useScalarActive(datum, onActive, onSelect);

  return (
    <span
      ref={wrap}
      {...wrapAttrs("mc-windbarb-live", className, style)}
      {...named(label)}
      {...bind}
    >
      <StaticWindBarb
        {...rest}
        style={fillFor(style)}
        direction={direction}
        magnitude={magnitude}
        step={stepProp}
        strings={strings}
        summary={false}
      />
      <LiveRegion>{live && props.summary !== false ? announced : ""}</LiveRegion>
      {/* Skip when the static already prints the magnitude beside the glyph
          (`label="value"`, and `mode="arrow"` always prints it) — unless a
          direction reading needs naming (the chip carries the octant the
          static label never paints). */}
      {readout && hover && chipText && props.label !== "value" && props.mode !== "arrow" ? (
        <span className="mc-spark-readout" {...CHIP}>
          {chipText}
        </span>
      ) : null}
    </span>
  );
}
