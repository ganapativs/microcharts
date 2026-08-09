"use client";
// Interactive <RateVolume>. useActivePicker owns interaction: one pointer
// listener + nearest-period math, ←/→ rove periods, click / Enter / Space
// selects (onSelect). The live region ALWAYS pairs both numbers — a rate is
// never announced without its volume.// crosshair + rate ring + pin are overlay children re-using geometry.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import { EN_RATE_VOLUME, type RateVolumeStrings } from "../../core/strings-rate-volume.js";
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
import { rateVolumeGeometry } from "./geometry.js";
import {
  RateVolume as StaticRateVolume,
  rateVolumeSummary,
  type RateVolumeProps,
} from "./index.js";

export interface InteractiveRateVolumeProps extends RateVolumeProps, PickerProps {
  strings?: RateVolumeStrings;
  /**
   * Opt-in entrance motion (default `false`): the rate line draws on when the
   * chart first mounts client-side. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function RateVolume(props: InteractiveRateVolumeProps): React.ReactNode {
  const {
    data,
    minVolume,
    volumeFormat,
    unit = "events",
    curve = "linear",
    width = 80,
    height = 20,
    format,
    locale,
    strings = EN_RATE_VOLUME,
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
  // The precise rate line (ink="data") is the primary channel; the ghost
  // volume bars are deliberately low-precision and simply fade in with the
  // base svg opacity — no ink role of their own to animate as "marks".
  useEntrance(hostRef, "draw", animate);

  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  // Mirror the static's label gutter so `totalWidth` matches the rendered
  // viewBox — without it the pointer map and readout run short and the
  // crosshair drifts from the cursor.
  const geo = useMemo(() => {
    const base = rateVolumeGeometry({
      width,
      height,
      data,
      minVolume,
      curve,
      domain: props.domain,
      volumeDomain: props.volumeDomain,
    });
    const showLabel = (props.label ?? "last") === "last" && base?.last != null;
    const gutterCh = showLabel ? fmt(base!.last!.rate).length : 0;
    return rateVolumeGeometry({
      width,
      height,
      data,
      minVolume,
      curve,
      domain: props.domain,
      volumeDomain: props.volumeDomain,
      gutterCh,
      fontSize: labelFont(height, 0.62, props.labelSize),
    });
  }, [
    width,
    height,
    data,
    minVolume,
    curve,
    props.domain,
    props.volumeDomain,
    props.label,
    props.labelSize,
    fmt,
  ]);
  const fmtVol = useMemo(() => makeFormatter(volumeFormat, locale), [volumeFormat, locale]);

  const total = data.length;
  // A period carries a real rate only on a finite rate + positive volume.
  const valid = (i: number): boolean => {
    const d = data[i];
    return !!d && Number.isFinite(d.rate) && Number.isFinite(d.volume) && d.volume > 0;
  };

  // Pointer (viewBox space) → nearest period by bar center.
  const locate = useCallback(
    (x: number) => {
      if (!geo || total === 0) return null;
      let best = 0;
      let bestDist = Infinity;
      geo.bars.forEach((b, i) => {
        const d = Math.abs(b.x + b.width / 2 - x);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      return best;
    },
    [geo, total],
  );

  // Period (DATA) index; `value` is the RATE (the precise primary channel), or
  // `null` on a zero/undefined-volume period. The volume is still announced +
  // shown in the readout.
  const datum = useCallback(
    (i: number) => {
      const d = data[i];
      const ok = !!d && Number.isFinite(d.rate) && Number.isFinite(d.volume) && d.volume > 0;
      return {
        index: i,
        value: ok ? d!.rate : null,
        formatted: !d
          ? undefined
          : ok
            ? strings.rateVolumeChip(
                fmt(d.rate),
                fmtVol(d.volume),
                unit,
                minVolume !== undefined && d.volume < minVolume,
              )
            : strings.rateVolumeChipEmpty,
      };
    },
    [data, fmt, fmtVol, unit, minVolume, strings],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo ? total : 0,
    width: geo ? geo.totalWidth : width,
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
          : rateVolumeSummary(geo, fmt, fmtVol, unit, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  // The active period's mark (crosshair + rate ring); a pin repeats it in "tick"
  // weight so a selection survives pointer-leave.
  const mark = (i: number, pinned: boolean) => {
    const bar = geo?.bars[i];
    if (!bar) return null;
    const cx = bar.x + bar.width / 2;
    const vp = valid(i) ? geo!.points.find((pt) => Math.abs(pt.x - cx) < 0.01) : undefined;
    const w = pinned ? "tick" : "support";
    return (
      <>
        {/* `data-mc-ui` glides both marks to the period they name instead of
            repainting them there. The crosshair travels on a transform because
            `x1`/`x2` have no CSS geometry property behind them in any engine;
            the ring's `cx`/`cy` do, so it moves on its own coordinates. */}
        <line
          x1={0}
          y1={0.5}
          x2={0}
          y2={height - 0.5}
          data-mc-active=""
          data-mc-ui=""
          data-mc-w={w}
          strokeDasharray="1.5 2"
          vectorEffect="non-scaling-stroke"
          style={{ transform: `translateX(${cx}px)` }}
        />
        {vp ? (
          <circle
            cx={vp.x}
            cy={vp.y}
            r={2.6}
            fill="none"
            data-mc-active=""
            data-mc-w={w}
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
      </>
    );
  };

  const shown = active ?? selected;
  const sBar = shown !== null && geo ? geo.bars[shown] : undefined;
  const sDatum = shown !== null ? data[shown] : undefined;
  const announced =
    shown === null || !sDatum
      ? ""
      : valid(shown)
        ? strings.rateVolumeAt(
            shown + 1,
            total,
            fmt(sDatum.rate),
            fmtVol(sDatum.volume),
            unit,
            minVolume !== undefined && sDatum.volume < minVolume,
          )
        : strings.rateVolumeNoEvents(shown + 1, total);

  return (
    <span
      ref={hostRef}
      {...wrap("mc-rate-volume-live", className, style)}
      {...named(ariaLabel)}
      {...bind}
    >
      <StaticRateVolume
        {...rest}
        style={fillFor(style)}
        data={data}
        minVolume={minVolume}
        volumeFormat={volumeFormat}
        unit={unit}
        curve={curve}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {selected !== null && selected !== active ? mark(selected, true) : null}
        {active !== null ? mark(active, false) : null}
        {rest.children}
      </StaticRateVolume>
      {readout && sBar && sDatum ? (
        <span className="mc-rate-volume-readout mc-spark-readout" {...CHIP}>
          {valid(shown!)
            ? strings.rateVolumeChip(
                fmt(sDatum.rate),
                fmtVol(sDatum.volume),
                unit,
                minVolume !== undefined && sDatum.volume < minVolume,
              )
            : strings.rateVolumeChipEmpty}
        </span>
      ) : null}
      <LiveRegion>{announced}</LiveRegion>
    </span>
  );
}
