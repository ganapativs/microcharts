"use client";
// Interactive <TapeGauge>. `live` mode: the readout + chevron
// update as `value`/`rate` change, and a polite live region re-announces the
// full reading, throttled (≥ 5 s). No pointer scrubbing — there is no series —
// but hover/focus reveals the reading whenever the gauge is too small (or too
// unlabelled) to paint its own hero number.
// Composes the static entry (canon); the scale window stays centered on value.
import { useEffect, useMemo, useRef, useState } from "react";
import { makeFormatter } from "../../core/format.js";
import { named, fillFor, wrap } from "../../shared/interactive.js";
import type { MicroDatum } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_TAPE_GAUGE } from "../../core/strings-tape-gauge.js";
import { autoSpan, tapeGaugeReadoutFont } from "./index.js";
import { TapeGauge as StaticTapeGauge, tapeGaugeSummary, type TapeGaugeProps } from "./index.js";
import { NO_ZONES, tapeGaugeGeometry } from "./geometry.js";

export interface InteractiveTapeGaugeProps extends TapeGaugeProps {
  /** Minimum ms between live-region announcements (documented throttle). */
  announceEvery?: number;
  /**
   * Show the floating value chip on hover/focus (default `true`). It appears
   * only when the gauge is NOT painting its own number — `label="none"`, or a
   * gauge too small to fit the hero numeral.
   */
  readout?: boolean;
  /**
   * Opt-in entrance motion (default `false`): the instrument fades and scales
   * in when the chart first mounts client-side. A whole-glyph entrance rather
   * than a per-mark one — the tape has no single fill/sweep mark (zone
   * stripes, ticks, a fixed pointer, and chevrons all read together as one
   * instrument). Inert on the server and on hydrated server HTML;
   * `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
  /** The gauge was activated (click, tap, Enter or Space): `{ index: 0, value }` — the current reading. */
  onSelect?: ((datum: MicroDatum | null) => void) | undefined;
}

export function TapeGauge(props: InteractiveTapeGaugeProps): React.ReactNode {
  const {
    value,
    rate,
    zones = NO_ZONES,
    span: spanProp,
    rateTiers: tiersProp,
    orientation = "vertical",
    width = 46,
    height = 60,
    format,
    locale,
    strings = EN_TAPE_GAUGE,
    title,
    summary,
    announceEvery = 5000,
    animate = false,
    label = "value",
    readout = true,
    onSelect,
    className,
    style,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "pop", animate);

  const span = spanProp && spanProp > 0 ? spanProp : autoSpan(value, zones, rate);
  const tiers = tiersProp ?? [span / 60, span / 15];
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  // The tape walks ticks and zones; in `live` use this component re-renders on
  // every reading, so keep it off the render path when only the throttled
  // announcement changed.
  const geo = useMemo(
    () => tapeGaugeGeometry({ value, span, zones, tick: null, width, height, orientation }),
    [value, span, zones, width, height, orientation],
  );
  const full =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : tapeGaugeSummary(value, rate, tiers, geo.containingZone, strings, fmt);
  // `label` is a PROP here (the static's numeral switch), so the accessible
  // name gets its own binding.
  const name = [title, full].filter(Boolean).join(". ") || undefined;

  const [announced, setAnnounced] = useState("");
  const [hover, setHover] = useState(false);
  const last = useRef(-Infinity);
  useEffect(() => {
    if (!full) return;
    const now = performance.now();
    if (now - last.current >= announceEvery) {
      last.current = now;
      setAnnounced(full);
    }
  }, [full, announceEvery]);

  // Does the gauge itself paint the number? `label="none"` opts out, and a
  // small gauge DROPS it (the static's documented degradation). Whenever it
  // doesn't, hover/focus reveals it — otherwise the reading is unavailable to a
  // sighted reader at exactly the sizes this chart is designed for.
  const valueText = Number.isFinite(value) ? fmt(value) : "";
  const painted =
    label === "value" &&
    tapeGaugeReadoutFont({
      valueText,
      gutter: geo.readout.gutter,
      band: geo.readout.band,
      labelY: geo.pointer.labelY,
      width,
      height,
      vertical: orientation !== "horizontal",
    }) !== null;

  // Drill-down: the reading under the fixed pointer — the number the tape shows.
  const select = (): void =>
    onSelect?.({
      index: 0,
      value: Number.isFinite(value) ? value : null,
      formatted: valueText || undefined,
    });

  return (
    <span
      ref={hostRef}
      {...wrap("mc-tape-live", className, style)}
      {...named(name)}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      onClick={select}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          select();
        }
      }}
    >
      <StaticTapeGauge
        {...rest}
        value={value}
        rate={rate}
        zones={zones}
        span={span}
        rateTiers={tiers}
        orientation={orientation}
        label={label}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        style={fillFor(style)}
      />
      <LiveRegion>{announced}</LiveRegion>
      {readout && hover && valueText && !painted ? (
        <span className="mc-spark-readout" style={{ left: "50%", transform: "translateX(-50%)" }}>
          {valueText}
        </span>
      ) : null}
    </span>
  );
}
