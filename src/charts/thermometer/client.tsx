"use client";
// Interactive <Thermometer> (plan/24 #5). Hover/focus reveals the value readout;
// the fill glides to its new level (CSS, reduced-motion-gated); announces through
// a polite region on change, and calls out a target crossing. No pointer math —
// a single value; hover is a reveal, not a lookup. Composes the static component.
import { useEffect, useRef, useState } from "react";
import { makeFormatter } from "../../core/format.js";
import { isFiniteValue } from "../../core/types.js";
import { EN_THERMOMETER, type ThermometerStrings } from "../../core/strings-thermometer.js";
import {
  Thermometer as StaticThermometer,
  thermometerSummary,
  type ThermometerProps,
} from "./index.js";

export interface InteractiveThermometerProps extends ThermometerProps {
  live?: boolean;
  strings?: ThermometerStrings;
}

export function Thermometer(props: InteractiveThermometerProps): React.ReactNode {
  const {
    live = true,
    strings = EN_THERMOMETER,
    title,
    value,
    target,
    domain = [0, 100],
    format,
    locale,
    ...rest
  } = props;
  const summary = thermometerSummary(value, { domain, target, strings, format, locale });
  const [hover, setHover] = useState(false);
  const [announced, setAnnounced] = useState("");
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    if (live) setAnnounced(summary);
  }, [value, summary, live]);

  const label = [title, summary].filter(Boolean).join(". ") || undefined;
  const readout = isFiniteValue(value) ? makeFormatter(format, locale)(value) : "";

  return (
    <span
      className="mc-thermo-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
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
      {hover && readout ? (
        <span className="mc-spark-readout" style={{ left: "50%", transform: "translateX(-50%)" }}>
          {readout}
        </span>
      ) : null}
    </span>
  );
}
