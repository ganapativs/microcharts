"use client";
// Interactive <RateVolume> (plan/23 #5). One pointer listener + nearest-period
// math. ←/→ step periods; the live region ALWAYS pairs both numbers — a rate is
// never announced without its volume. Composes the static component (canon); the
// crosshair + bar highlight are overlay children re-using geometry.
import { useCallback, useMemo, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { EN_RATE_VOLUME, type RateVolumeStrings } from "../../core/strings-rate-volume.js";
import { rateVolumeGeometry } from "./geometry.js";
import {
  RateVolume as StaticRateVolume,
  rateVolumeSummary,
  type RateVolumeProps,
} from "./index.js";

export interface InteractiveRateVolumeProps extends RateVolumeProps {
  strings?: RateVolumeStrings;
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
    ...rest
  } = props;

  const geo = useMemo(
    () =>
      rateVolumeGeometry({
        width,
        height,
        data,
        minVolume,
        curve,
        domain: props.domain,
        volumeDomain: props.volumeDomain,
      }),
    [width, height, data, minVolume, curve, props.domain, props.volumeDomain],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const fmtVol = useMemo(() => makeFormatter(volumeFormat, locale), [volumeFormat, locale]);
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : geo === null
          ? strings.noData
          : rateVolumeSummary(geo, fmt, fmtVol, unit, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const total = data.length;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (!geo || total === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const x = ((e.clientX - r.left) / r.width) * geo.totalWidth;
      let best = 0;
      let bestDist = Infinity;
      geo.bars.forEach((b, i) => {
        const d = Math.abs(b.x + b.width / 2 - x);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setActive(best);
    },
    [geo, total],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (total === 0) return;
      switch (e.key) {
        case "ArrowRight":
          setActive((prev) => Math.min(total - 1, (prev ?? -1) + 1));
          break;
        case "ArrowLeft":
          setActive((prev) => (prev === null || prev <= 0 ? 0 : prev - 1));
          break;
        case "Home":
          setActive(0);
          break;
        case "End":
          setActive(total - 1);
          break;
        case "Escape":
          setActive(null);
          return;
        default:
          return;
      }
      e.preventDefault();
    },
    [total],
  );

  // the active period's mark + announcement (both numbers, always)
  const bar = active !== null && geo ? geo.bars[active] : undefined;
  const datum = active !== null ? data[active] : undefined;
  const validPoint =
    bar && datum && Number.isFinite(datum.rate) && Number.isFinite(datum.volume) && datum.volume > 0
      ? geo!.points.find((p) => Math.abs(p.x - (bar.x + bar.width / 2)) < 0.01)
      : undefined;
  const announced =
    active === null || !datum
      ? ""
      : datum.volume > 0 && Number.isFinite(datum.rate) && Number.isFinite(datum.volume)
        ? strings.rateVolumeAt(
            active + 1,
            total,
            fmt(datum.rate),
            fmtVol(datum.volume),
            unit,
            minVolume !== undefined && datum.volume < minVolume,
          )
        : strings.rateVolumeNoEvents(active + 1, total);

  return (
    <span
      className="mc-rate-volume-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticRateVolume
        {...rest}
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
        {bar ? (
          <>
            <line
              x1={bar.x + bar.width / 2}
              y1={0.5}
              x2={bar.x + bar.width / 2}
              y2={height - 0.5}
              stroke="var(--mc-accent)"
              data-mc-w="support"
              strokeDasharray="1.5 2"
              vectorEffect="non-scaling-stroke"
            />
            {validPoint ? (
              <circle
                cx={validPoint.x}
                cy={validPoint.y}
                r={2.6}
                fill="none"
                stroke="var(--mc-accent)"
                data-mc-w="support"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
          </>
        ) : null}
        {rest.children}
      </StaticRateVolume>
      {bar && datum ? (
        <span
          className="mc-rate-volume-readout mc-spark-readout"
          style={{
            left: `${((bar.x + bar.width / 2) / geo!.totalWidth) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {datum.volume > 0 && Number.isFinite(datum.rate)
            ? `${fmt(datum.rate)} · ${fmtVol(datum.volume)}`
            : "no events"}
        </span>
      ) : null}
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
    </span>
  );
}
