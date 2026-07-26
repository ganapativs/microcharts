"use client";
// Interactive <HeatCell>. One target — no pointer lookup needed;
// focus/hover reveals the formatted value + calibrated level with ActivityGrid
// announcement parity ("42 — level 3 of 5."). Composes the static entry.
import { useMemo, useRef, useState } from "react";
import { makeFormatter } from "../../core/format.js";
import { named, fillFor, wrap } from "../../shared/interactive.js";
import type { MicroDatum } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_SCALAR, type ScalarStrings } from "../../core/strings-scalar.js";
import { heatCellGeometry } from "./geometry.js";
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
   * suppresses only the chip. Inert when `label="value"` already prints it.
   */
  readout?: boolean;
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
    onSelect,
    className,
    style,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "pop", animate);

  const [active, setActive] = useState(false);
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const geo = heatCellGeometry({ width: 12, height: 12, value, domain, steps, shape });
  const text = heatCellSummary(value, geo.step, steps, fmt, strings);

  const accName = summary === false ? undefined : typeof summary === "string" ? summary : text;
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  // Chip drops the summary's trailing period; keeps value + level (the cell
  // alone doesn't name the step). Its own `strings` token, never an inline
  // template — a chip is rendered text, so English in it is untranslatable.
  // Suppressed when `label="value"` already prints the number on the cell.
  const chip = geo.step !== null ? strings.levelChip(fmt(value), geo.step + 1, steps) : fmt(value);

  // Drill-down: the cell's own value (the number the readout shows).
  const select = (): void =>
    onSelect?.({
      index: 0,
      value: Number.isFinite(value) ? value : null,
      formatted: chip,
    });

  return (
    <span
      ref={hostRef}
      {...wrap("mc-heat-cell-live", className, style)}
      {...named(label)}
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      onClick={select}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          select();
        }
      }}
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
      {readout && active && geo.step !== null && props.label !== "value" ? (
        <span className="mc-spark-readout" style={{ left: "50%", transform: "translateX(-50%)" }}>
          {chip}
        </span>
      ) : null}
    </span>
  );
}
