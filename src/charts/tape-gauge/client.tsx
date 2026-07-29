"use client";
// Interactive <TapeGauge>. `live` mode: the readout + chevron
// update as `value`/`rate` change, and a polite live region re-announces
// full reading, throttled (≥ 5 s). No pointer scrubbing — there is no series
// but hover/focus reveals the reading whenever the gauge is too small (or too
// unlabelled) to paint its own hero number.
// ; the scale window stays centered on value.
import { useEffect, useMemo, useRef, useState } from "react";
import { makeFormatter } from "../../core/format.js";
import { named, fillFor, wrap } from "../../shared/interactive.js";
import type { MicroDatum } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_TAPE_GAUGE } from "../../core/strings-tape-gauge.js";
import { resolveTapeScale, tapeGaugeReadoutFont } from "./index.js";
import { TapeGauge as StaticTapeGauge, tapeGaugeSummary, type TapeGaugeProps } from "./index.js";
import { chartSide } from "../../core/types.js";
import { DEFAULT_HEIGHT, DEFAULT_WIDTH, NO_ZONES, tapeGaugeGeometry } from "./geometry.js";

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
  /**
   * The active (hovered / keyboard-focused) unit changed. One reading = one unit,
   * so this fires once with `{ index: 0, … }` on pointer enter or focus and once
   * with `null` when that clears — never repeatedly while the pointer moves
   * inside the instrument, and never twice when hover and focus overlap.
   */
  onActive?: ((datum: MicroDatum | null) => void) | undefined;
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
    width: widthProp = DEFAULT_WIDTH,
    height: heightProp = DEFAULT_HEIGHT,
    format,
    locale,
    strings = EN_TAPE_GAUGE,
    title,
    summary,
    announceEvery = 5000,
    animate = false,
    label = "value",
    readout = true,
    onActive,
    onSelect,
    className,
    style,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "pop", animate);

  // Same resolved scale and same resolved box as the static entry — both go
  // through one function so the hover chip's reveal threshold, the geometry
  // this entry memoises and the SVG the static paints cannot drift apart.
  const width = chartSide(widthProp, DEFAULT_WIDTH);
  const height = chartSide(heightProp, DEFAULT_HEIGHT);
  const { span, tiers } = resolveTapeScale({
    value,
    span: spanProp,
    zones,
    rate,
    rateTiers: tiersProp,
  });
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

  // Tape reading under the pointer. One datum builder — callbacks match the chip.
  const datum = (): MicroDatum => ({
    index: 0,
    value: Number.isFinite(value) ? value : null,
    formatted: valueText || undefined,
  });
  const select = (): void => onSelect?.(datum());
  // ONE unit: `onActive` fires on the enter/leave EDGE only. `hover` alone can't
  // gate it — pointer-enter then focus both set it `true`, which would announce
  // the same unit twice — so the last emitted state is tracked here.
  const shown = useRef(false);
  const activate = (on: boolean): void => {
    setHover(on);
    if (shown.current === on) return;
    shown.current = on;
    onActive?.(on ? datum() : null);
  };

  return (
    <span
      ref={hostRef}
      {...wrap("mc-tape-live", className, style)}
      {...named(name)}
      onPointerEnter={() => activate(true)}
      onPointerLeave={() => activate(false)}
      onFocus={() => activate(true)}
      onBlur={() => activate(false)}
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
