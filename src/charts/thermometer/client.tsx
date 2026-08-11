"use client";
// Interactive <Thermometer>. Hover/focus reveals the value readout;
// the fill glides to its new level (CSS, reduced-motion-gated); announces through
// a polite region on change, and calls out a target crossing. No pointer math
// a single value; hover is a reveal, not a lookup.
import { useEffect, useMemo, useRef, useState } from "react";
import { makeFormatter } from "../../core/format.js";
import { isFiniteValue } from "../../core/types.js";
import {
  CHIP,
  named,
  fillFor,
  useScalarActive,
  wrap,
  type MicroDatum,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_THERMOMETER, type ThermometerStrings } from "../../core/strings-thermometer.js";
import {
  Thermometer as StaticThermometer,
  thermometerSummary,
  type ThermometerProps,
} from "./index.js";

// The value-fill capsule is the one rect painted in the accent ink — the tube
// carries the "fill" ROLE (track chrome at `fill-opacity: 0.12`, `--mc-neutral`
// under the accent) and the outline/ticks are "muted" — so the accent rect
// isolates exactly the dynamic mark without touching the static markup.
const FILL_SELECTOR = 'rect[data-mc-ink="accent"]';

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
  /**
   * Show the floating value chip on hover/focus (default `true`). `false`
   * suppresses only the chip. Inert when `label="value"` already prints it.
   */
  readout?: boolean;
  /**
   * The active (hovered / keyboard-focused) unit changed. One reading = one unit,
   * so this fires once with `{ index: 0, … }` on pointer enter or focus and once
   * with `null` when that clears — never repeatedly while the pointer moves
   * inside the tube, and never twice when hover and focus overlap.
   */
  onActive?: ((datum: MicroDatum | null) => void) | undefined;
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
    onActive,
    onSelect,
    className,
    style,
    ...rest
  } = props;
  const text = thermometerSummary(value, { domain, target, strings, format, locale });
  const [announced, setAnnounced] = useState("");
  const prev = useRef(value);
  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, orientation === "horizontal" ? "sweep" : "rise", animate, {
    selector: FILL_SELECTOR,
  });

  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    if (live) setAnnounced(text);
  }, [value, text, live]);

  // The caller's `summary` owns the wrapper's name: `false` is the decorative
  // opt-out (`named()` renders `aria-hidden` and drops the tab stop with it), a
  // string replaces the generated sentence. The generated text stays what the
  // live region announces on a value change.
  const accName =
    props.summary === false ? undefined : typeof props.summary === "string" ? props.summary : text;
  const label = [title, accName].filter(Boolean).join(". ") || undefined;
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  // The chip names the GOAL as well as the reading. A target draws a tick on the
  // tube and, until now, was spoken in the summary but never painted — a sighted
  // reader saw a line with no number and no way to ask for one, while a screen
  // reader was told "target 80". `Bullet` carries the same value-and-target
  // shape and has always printed `value / target · gap`; this is that form.
  //
  // Punctuation only, no words: a visible chip that hardcoded English would sit
  // outside `SummaryStrings` and never translate.
  const hasTarget = target !== undefined && isFiniteValue(target);
  // Em-dash for a missing value — the same no-value glyph the static label
  // paints, so the two never disagree, and `Intl` never leaks a literal "NaN".
  const readoutText = hasTarget
    ? `${isFiniteValue(value) ? fmt(value) : "—"} / ${fmt(target)}`
    : isFiniteValue(value)
      ? fmt(value)
      : "";
  // One reading, one selectable unit (index 0) — the same number the readout
  // shows, in domain units. One builder, so `onActive` and `onSelect` can never
  // report a different number or a different string than the chip paints.
  const datum = (): MicroDatum => ({
    index: 0,
    value: isFiniteValue(value) ? value : null,
    formatted: readoutText,
  });
  const { active: hover, bind } = useScalarActive(datum, onActive, onSelect);

  return (
    <span ref={hostRef} {...wrap("mc-thermo-live", className, style)} {...named(label)} {...bind}>
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
      <LiveRegion>{live && props.summary !== false ? announced : ""}</LiveRegion>
      {/* Skip when `label="value"` already prints the numeral beside the tube —
          unless a target is set, because then the gutter holds only half the
          reading and the goal it is measured against is still unpainted. */}
      {readout && hover && readoutText && (props.label !== "value" || hasTarget) ? (
        <span className="mc-spark-readout" {...CHIP}>
          {readoutText}
        </span>
      ) : null}
    </span>
  );
}
