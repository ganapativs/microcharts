"use client";
// Interactive <Thermometer>. Hover/focus reveals the value readout;
// the fill glides to its new level (CSS, reduced-motion-gated); announces through
// a polite region on change, and calls out a target crossing. No pointer math —
// a single value; hover is a reveal, not a lookup. Composes the static component.
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { makeFormatter } from "../../core/format.js";
import { isFiniteValue } from "../../core/types.js";
import { FILL } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_THERMOMETER, type ThermometerStrings } from "../../core/strings-thermometer.js";
import {
  Thermometer as StaticThermometer,
  thermometerSummary,
  type ThermometerProps,
} from "./index.js";

// The value-fill capsule is the one rect with no data-mc-ink role (the tube is
// "fill"-role track chrome, the outline is "muted") — this selector isolates
// exactly the dynamic mark without touching the static markup.
const FILL_SELECTOR = "rect:not([data-mc-ink])";

export interface InteractiveThermometerProps extends ThermometerProps {
  live?: boolean;
  strings?: ThermometerStrings;
  /**
   * Opt-in entrance motion (default `false`): the fill rises from the bulb end
   * (vertical) or sweeps in from it (horizontal) when the chart first mounts
   * client-side. Independent of the existing CSS transition on the fill rect's
   * `y`/`height`/`width` (which eases live value updates, different properties
   * than the WAAPI `transform` this drives) — the two never run at once, since
   * the entrance fires once on mount before any value update. Inert on the
   * server and on hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function Thermometer(props: InteractiveThermometerProps): React.ReactNode {
  const {
    live = true,
    strings = EN_THERMOMETER,
    title,
    value,
    target,
    domain = [0, 100],
    orientation = "vertical",
    format,
    locale,
    animate = false,
    className,
    style,
    ...rest
  } = props;
  const summary = thermometerSummary(value, { domain, target, strings, format, locale });
  const wrapStyle: CSSProperties = {
    display: "inline-block",
    position: "relative",
    lineHeight: 0,
    ...style,
  };
  const [hover, setHover] = useState(false);
  const [announced, setAnnounced] = useState("");
  const prev = useRef(value);
  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, orientation === "horizontal" ? "sweep" : "rise", animate, {
    selector: FILL_SELECTOR,
  });

  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    if (live) setAnnounced(summary);
  }, [value, summary, live]);

  const label = [title, summary].filter(Boolean).join(". ") || undefined;
  const readout = isFiniteValue(value) ? makeFormatter(format, locale)(value) : "";

  return (
    <span
      ref={hostRef}
      className={className ? `mc-thermo-live ${className}` : "mc-thermo-live"}
      style={wrapStyle}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      <StaticThermometer
        {...rest}
        value={value}
        target={target}
        domain={domain}
        orientation={orientation}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        style={FILL}
      />
      {live ? <LiveRegion>{announced}</LiveRegion> : null}
      {hover && readout ? (
        <span className="mc-spark-readout" style={{ left: "50%", transform: "translateX(-50%)" }}>
          {readout}
        </span>
      ) : null}
    </span>
  );
}
