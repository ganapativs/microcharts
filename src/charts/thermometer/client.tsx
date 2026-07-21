"use client";
// Interactive <Thermometer>. Hover/focus reveals the value readout;
// the fill glides to its new level (CSS, reduced-motion-gated); announces through
// a polite region on change, and calls out a target crossing. No pointer math —
// a single value; hover is a reveal, not a lookup. Composes the static component.
import { useEffect, useMemo, useRef, useState } from "react";
import { makeFormatter } from "../../core/format.js";
import { isFiniteValue } from "../../core/types.js";
import { named, fillFor, wrap, type MicroDatum } from "../../shared/interactive.js";
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
  /** Show the floating value chip on hover/focus (default `true`). `false` suppresses only the chip. */
  readout?: boolean;
  /** Click/tap or Enter/Space — `{ index: 0, value: the reading }`. */
  onSelect?: ((datum: MicroDatum | null) => void) | undefined;
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
    readout = true,
    onSelect,
    className,
    style,
    ...rest
  } = props;
  const summary = thermometerSummary(value, { domain, target, strings, format, locale });
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
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const readoutText = isFiniteValue(value) ? fmt(value) : "";
  // One reading, one selectable unit (index 0) — the same number the readout
  // shows, in domain units.
  const pick = (): void =>
    onSelect?.({ index: 0, value: isFiniteValue(value) ? value : null, formatted: readoutText });

  return (
    <span
      ref={hostRef}
      {...wrap("mc-thermo-live", className, style)}
      {...named(label)}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      onClick={pick}
      onKeyDown={(e) => {
        if (!onSelect || (e.key !== "Enter" && e.key !== " ")) return;
        e.preventDefault();
        pick();
      }}
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
        style={fillFor(style)}
      />
      {live ? <LiveRegion>{announced}</LiveRegion> : null}
      {readout && hover && readoutText ? (
        <span className="mc-spark-readout" style={{ left: "50%", transform: "translateX(-50%)" }}>
          {readoutText}
        </span>
      ) : null}
    </span>
  );
}
