"use client";
// Interactive <GradedBand>. One pointer listener + pure nearest-edge math. ←/→
// step levels outward/inward from the median; each announces its interval ("80%
// interval: 17 to 26."). Enter/Space/click pins a level (onSelect).
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter, makePercentFormatter } from "../../core/format.js";
import { labelFont, labelFitsY } from "../../core/labels.js";
import {
  CHIP,
  named,
  fillFor,
  useActivePicker,
  wrap,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_QUANTILE, type QuantileStrings } from "../../core/strings-quantile.js";
import { gradedBandGeometry } from "./geometry.js";
import {
  GradedBand as StaticGradedBand,
  gradedBandSummary,
  type GradedBandProps,
} from "./index.js";

export interface InteractiveGradedBandProps extends GradedBandProps, PickerProps {
  strings?: QuantileStrings;
  /**
   * Opt-in entrance motion (default `false`): the nested bands GROW outward
   * from the median when the chart first mounts client-side. Inert on the
   * server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function GradedBand(props: InteractiveGradedBandProps): React.ReactNode {
  const {
    data,
    levels,
    value,
    label = "none",
    width = 80,
    height = 12,
    format,
    locale,
    strings = EN_QUANTILE,
    title,
    summary,
    animate = false,
    readout = true,
    className,
    style,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  // Nested central intervals are symmetric about the median, so a left→right
  // wipe would imply a false ordering. `grow` blooms the whole band
  // concentrically outward from the center (the point estimate) instead.
  useEntrance(hostRef, "grow", animate);

  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  // The interval LEVEL is a probability, not a measurement — it takes `locale`
  // but never the value `format`. `${b.p}%` was an en-US percent in a visible
  // chip; fr-FR writes "80 %".
  const levelFmt = useMemo(() => makePercentFormatter(locale), [locale]);
  const geo = useMemo(() => {
    const bare = gradedBandGeometry({ width, height, data, levels, value, domain: props.domain });
    if (bare === null) return null;
    // Mirror the static's median right-gutter reservation (index.tsx) so
    // totalWidth/labelX/labelY match byte-for-byte when label="median".
    const FONT = labelFont(height, 0.62, props.labelSize);
    const showLabel = label === "median" && labelFitsY(height / 2, FONT, height);
    if (!showLabel) return bare;
    const medText = fmt(bare.median.value);
    return gradedBandGeometry({
      width,
      height,
      data,
      levels,
      value,
      domain: props.domain,
      gutterCh: medText.length,
      fontSize: FONT,
    })!;
  }, [width, height, data, levels, value, props.domain, label, props.labelSize, fmt]);

  // ascending by level → ←/→ steps from the most-certain (innermost) outward
  const stops = useMemo(() => (geo ? [...geo.bands].sort((a, b) => a.p - b.p) : []), [geo]);

  const locate = useCallback(
    (x: number) => {
      if (stops.length === 0) return null;
      let best = 0;
      let bestDist = Infinity;
      stops.forEach((b, i) => {
        const d = Math.min(Math.abs(b.x - x), Math.abs(b.x + b.width - x));
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      return best;
    },
    [stops],
  );
  // index = band index in ascending level order (0 = innermost / most-certain);
  // value = the band's probability level (p).
  const datum = useCallback(
    (i: number) => {
      const b = stops[i];
      return {
        index: i,
        value: b?.p ?? null,
        formatted: b ? `${levelFmt(b.p / 100)} ${fmt(b.lo)}–${fmt(b.hi)}` : undefined,
      };
    },
    [stops, fmt, levelFmt],
  );

  const { active, selected, bind } = useActivePicker({
    count: stops.length,
    width: geo?.totalWidth ?? width,
    height,
    locate,
    datum,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
  });

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : geo === null
          ? strings.noData
          : gradedBandSummary(geo, fmt, strings, levelFmt);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const edges = (i: number, pinned: boolean) => {
    const b = stops[i];
    if (!b) return null;
    const w = pinned ? "tick" : "support";
    return (
      <>
        <line
          x1={b.x}
          y1={0.5}
          x2={b.x}
          y2={height - 0.5}
          data-mc-ink="accent"
          data-mc-active=""
          data-mc-ui=""
          data-mc-w={w}
        />
        <line
          x1={b.x + b.width}
          y1={0.5}
          x2={b.x + b.width}
          y2={height - 0.5}
          data-mc-ink="accent"
          data-mc-active=""
          data-mc-ui=""
          data-mc-w={w}
        />
      </>
    );
  };

  // The band shown by the edge ticks + readout: live focus, falling back to a
  // pinned selection when the pointer has left.
  const shown = active ?? selected;
  const band = shown !== null ? stops[shown] : undefined;
  const announced = band
    ? strings.bandEdge(levelFmt(band.p / 100), fmt(band.lo), fmt(band.hi))
    : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-graded-band-live", className, style)}
      {...named(ariaLabel)}
      {...bind}
    >
      <StaticGradedBand
        {...rest}
        style={fillFor(style)}
        data={data}
        levels={levels}
        value={value}
        label={label}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {selected !== null && selected !== active ? edges(selected, true) : null}
        {active !== null ? edges(active, false) : null}
        {rest.children}
      </StaticGradedBand>
      {readout && band && geo ? (
        <span className="mc-graded-band-readout mc-spark-readout" {...CHIP}>
          {`${levelFmt(band.p / 100)} ${fmt(band.lo)}–${fmt(band.hi)}`}
        </span>
      ) : null}
      <LiveRegion>{announced}</LiveRegion>
    </span>
  );
}
