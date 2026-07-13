"use client";
// Interactive <HeatCell>. One target — no pointer lookup needed;
// focus/hover reveals the formatted value + calibrated level with ActivityGrid
// announcement parity ("42 — level 3 of 5."). Composes the static entry.
import { useMemo, useRef, useState } from "react";
import { makeFormatter } from "../../core/format.js";
import { useEntrance } from "../../shared/motion-gate.js";
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

  return (
    <span
      ref={hostRef}
      className="mc-heat-cell-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
    >
      <StaticHeatCell
        {...rest}
        value={value}
        steps={steps}
        shape={shape}
        domain={domain}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      />
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
        {active ? text : ""}
      </span>
      {active && geo.step !== null ? (
        <span className="mc-spark-readout" style={{ left: "50%", transform: "translateX(-50%)" }}>
          {fmt(value)}
        </span>
      ) : null}
    </span>
  );
}
