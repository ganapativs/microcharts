"use client";
// Interactive <Honeycomb>. Announces the count on change; hover
// reveals the "value of total" readout. No per-cell keyboard nav — cells are
// anonymous units, not addressable data points. Composes the static component.
import { useEffect, useRef, useState } from "react";
import { makeFormatter } from "../../core/format.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { EN_HONEYCOMB, type HoneycombStrings } from "../../core/strings-honeycomb.js";
import { Honeycomb as StaticHoneycomb, honeycombSummary, type HoneycombProps } from "./index.js";

export interface InteractiveHoneycombProps extends HoneycombProps {
  live?: boolean;
  strings?: HoneycombStrings;
  /**
   * Opt-in entrance motion (default `false`): the comb grows in concentrically
   * from the center on first client-side mount — a whole-shape reveal that
   * suits the near-square multi-row grid (a vertical clip would slice hexes
   * mid-shape). Inert on the server and on hydrated server HTML;
   * `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function Honeycomb(props: InteractiveHoneycombProps): React.ReactNode {
  const {
    live = true,
    strings = EN_HONEYCOMB,
    title,
    value,
    total = 10,
    unit = "",
    format,
    locale,
    animate = false,
    ...rest
  } = props;
  const summary = honeycombSummary(value, { total, unit, strings, format, locale });
  const [hover, setHover] = useState(false);
  const [announced, setAnnounced] = useState("");
  const prev = useRef(value);
  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "grow", animate);

  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    if (live) setAnnounced(summary);
  }, [value, summary, live]);

  const label = [title, summary].filter(Boolean).join(". ") || undefined;
  const fmt = makeFormatter(format, locale);
  const readout = `${fmt(Math.max(0, Math.round(value)))} / ${fmt(Math.floor(total))}`;

  return (
    <span
      ref={hostRef}
      className="mc-honeycomb-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      <StaticHoneycomb
        {...rest}
        value={value}
        total={total}
        unit={unit}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      />
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
      {hover ? (
        <span className="mc-spark-readout" style={{ left: "50%", transform: "translateX(-50%)" }}>
          {readout}
        </span>
      ) : null}
    </span>
  );
}
