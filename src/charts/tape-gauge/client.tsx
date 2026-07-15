"use client";
// Interactive <TapeGauge>. `live` mode: the readout + chevron
// update as `value`/`rate` change, and a polite live region re-announces the
// full reading, throttled (≥ 5 s). No pointer scrubbing — there is no series.
// Composes the static entry (canon); the scale window stays centered on value.
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { makeFormatter } from "../../core/format.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_TAPE_GAUGE } from "../../core/strings-tape-gauge.js";
import { autoSpan } from "./index.js";
import { TapeGauge as StaticTapeGauge, tapeGaugeSummary, type TapeGaugeProps } from "./index.js";
import { tapeGaugeGeometry } from "./geometry.js";

const FILL: CSSProperties = { width: "100%", height: "auto" };

export interface InteractiveTapeGaugeProps extends TapeGaugeProps {
  /** Minimum ms between live-region announcements (documented throttle). */
  announceEvery?: number;
  /**
   * Opt-in entrance motion (default `false`): the instrument fades and scales
   * in when the chart first mounts client-side. A whole-glyph entrance rather
   * than a per-mark one — the tape has no single fill/sweep mark (zone
   * stripes, ticks, a fixed pointer, and chevrons all read together as one
   * instrument). Inert on the server and on hydrated server HTML;
   * `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function TapeGauge(props: InteractiveTapeGaugeProps): React.ReactNode {
  const {
    value,
    rate,
    zones = [],
    span: spanProp,
    rateTiers: tiersProp,
    orientation = "vertical",
    width = 28,
    height = 48,
    format,
    locale,
    strings = EN_TAPE_GAUGE,
    title,
    summary,
    announceEvery = 5000,
    animate = false,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "pop", animate);

  const span = spanProp && spanProp > 0 ? spanProp : autoSpan(value, zones, rate);
  const tiers = tiersProp ?? [span / 60, span / 15];
  const fmt = makeFormatter(format, locale);
  const geo = tapeGaugeGeometry({ value, span, zones, tick: null, width, height, orientation });
  const full =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : tapeGaugeSummary(value, rate, tiers, geo.containingZone, strings, fmt);
  const label = [title, full].filter(Boolean).join(". ") || undefined;

  const [announced, setAnnounced] = useState("");
  const last = useRef(-Infinity);
  useEffect(() => {
    if (!full) return;
    const now = performance.now();
    if (now - last.current >= announceEvery) {
      last.current = now;
      setAnnounced(full);
    }
  }, [full, announceEvery]);

  return (
    <span
      ref={hostRef}
      className="mc-tape-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
    >
      <StaticTapeGauge
        {...rest}
        value={value}
        rate={rate}
        zones={zones}
        span={span}
        rateTiers={tiers}
        orientation={orientation}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        style={FILL}
      />
      <LiveRegion>{announced}</LiveRegion>
    </span>
  );
}
