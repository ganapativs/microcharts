"use client";
// Interactive <HeatCell>. One target — no pointer lookup needed;
// focus/hover reveals the formatted value + calibrated level with ActivityGrid
// announcement parity ("42 — level 3 of 5.").
import { useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { CHIP, named, fillFor, useScalarActive, wrap } from "../../shared/interactive.js";
import type { MicroDatum } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_SCALAR, type ScalarStrings } from "../../core/strings-scalar.js";
import { heatCellGeometry, heatCellFont } from "./geometry.js";
import { HeatCell as StaticHeatCell, heatCellSummary, type HeatCellProps } from "./index.js";

export interface InteractiveHeatCellProps extends HeatCellProps {
  strings?: ScalarStrings;
  /**
   * Opt-in entrance motion (default `false`): the cell fades and scales in on
   * first client-side mount. Inert on the server and on hydrated server HTML;
   * `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
  /**
   * Show the floating value chip on hover/focus (default `true`). `false`
   * suppresses only the chip. Inert when `label="value"` already paints the
   * numeral on the cell — a value too wide to fit still gets the chip.
   */
  readout?: boolean;
  /**
   * The active (hovered / keyboard-focused) unit changed. One cell = one unit, so
   * this fires once with `{ index: 0, … }` on pointer enter or focus and once
   * with `null` when that clears — never repeatedly while the pointer moves
   * inside the cell, and never twice when hover and focus overlap.
   */
  onActive?: ((datum: MicroDatum | null) => void) | undefined;
  /** The cell was activated (click, tap, Enter or Space): `{ index: 0, value }` — the cell's value. */
  onSelect?: ((datum: MicroDatum | null) => void) | undefined;
}

export function HeatCell(props: InteractiveHeatCellProps): React.ReactNode {
  const {
    value,
    steps = 5,
    shape = "square",
    domain = [0, 1],
    format,
    locale,
    title,
    summary,
    strings = EN_SCALAR,
    animate = false,
    readout = true,
    onActive,
    onSelect,
    className,
    style,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "pop", animate);

  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const geo = heatCellGeometry({ width: 12, height: 12, value, domain, steps, shape });
  // `geo.steps`, not the prop: the static bins and paints against the resolved
  // count, and the chip has to name the same scale the cell was binned on.
  const text = heatCellSummary(value, geo.step, geo.steps, fmt, strings);

  const accName = summary === false ? undefined : typeof summary === "string" ? summary : text;
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  // Chip drops the summary's trailing period; keeps value + level (the cell
  // alone doesn't name the step). Its own `strings` token, never an inline
  // template — a chip is rendered text, so English in it is untranslatable.
  // Suppressed when `label="value"` already prints the number on the cell.
  const chip =
    geo.step !== null ? strings.levelChip(fmt(value), geo.step + 1, geo.steps) : fmt(value);

  // The static DROPS the numeral when it is wider than the cell, so
  // `label="value"` alone was the wrong suppression test: a wide value painted
  // no numeral and got no chip either, leaving an announcement with nothing on
  // screen. Ask geometry the same question the static asks.
  const numeralPainted =
    props.label === "value" &&
    geo.step !== null &&
    geo.labelFits(fmt(value).length, heatCellFont(12, props.labelSize));

  // Cell value (readout number). One datum builder — callbacks match the chip.
  const datum = (): MicroDatum => ({
    index: 0,
    value: Number.isFinite(value) ? value : null,
    formatted: chip,
  });
  const { active, bind } = useScalarActive(datum, onActive, onSelect);

  return (
    <span
      ref={hostRef}
      {...wrap("mc-heat-cell-live", className, style)}
      {...named(label)}
      {...bind}
    >
      <StaticHeatCell
        {...rest}
        style={fillFor(style)}
        value={value}
        steps={steps}
        shape={shape}
        domain={domain}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      />
      <LiveRegion>{active ? text : ""}</LiveRegion>
      {readout && active && geo.step !== null && !numeralPainted ? (
        <span className="mc-spark-readout" {...CHIP}>
          {chip}
        </span>
      ) : null}
    </span>
  );
}
