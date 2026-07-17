"use client";
// Interactive <CalibrationStrip>. One pointer listener; nearest bin
// by x. ←/→ rove bins. Composes the static component (canon).
import { useCallback, useMemo, useRef, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { FILL, wrap } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_CALIBRATION } from "../../core/strings-calibration.js";
import { calibrationGeometry, isBinned } from "./geometry.js";
import {
  CalibrationStrip as StaticCalibrationStrip,
  calibrationSummary,
  type CalibrationStripProps,
} from "./index.js";

function defaultMinSupport(data: CalibrationStripProps["data"]): number {
  const total = isBinned(data)
    ? data.reduce((s, r) => s + (Number.isFinite(r.count) ? r.count : 0), 0)
    : data.length;
  return Math.max(10, Math.round(total * 0.02));
}

export interface InteractiveCalibrationStripProps extends CalibrationStripProps {
  /**
   * Opt-in entrance motion (default `false`): the per-bin points settle onto
   * the diagonal (dots variant) or the deviation columns fade in (bars
   * variant) on first client-side mount. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function CalibrationStrip(props: InteractiveCalibrationStripProps): React.ReactNode {
  const {
    data,
    bins = 10,
    minSupport,
    variant = "dots",
    width = 100,
    height = 32,
    format,
    locale,
    strings = EN_CALIBRATION,
    title,
    summary,
    animate = false,
    className,
    style,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, variant === "bars" ? "reveal" : "settle", animate, {
    selector:
      variant === "bars"
        ? 'line[data-mc-ink="accent"]'
        : 'circle[data-mc-ink="accent"], circle[data-mc-w="support"]',
  });

  const ms = minSupport ?? defaultMinSupport(data);
  const supportHeight = Math.max(4, Math.round(height * 0.18));
  const geo = useMemo(
    () => calibrationGeometry({ data, bins, minSupport: ms, width, height, supportHeight }),
    [data, bins, ms, width, height, supportHeight],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : calibrationSummary(geo.points, geo.maxGap, strings, fmt);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (geo.points.length === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const x = ((e.clientX - r.left) / r.width) * width;
      let best = 0;
      let bestD = Infinity;
      geo.points.forEach((p, i) => {
        const d = Math.abs(p.x - x);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      setActive(best);
    },
    [geo, width],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (geo.points.length === 0) return;
      setActive((prev) => {
        const cur = prev ?? 0;
        if (e.key === "ArrowRight") {
          e.preventDefault();
          return Math.min(geo.points.length - 1, cur + 1);
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          return Math.max(0, cur - 1);
        }
        if (e.key === "Escape") return null;
        return prev;
      });
    },
    [geo],
  );

  const pt = active != null ? geo.points[active] : undefined;
  const announced = pt
    ? strings.calibrationAt(
        fmt(pt.predicted),
        fmt(pt.observed),
        pt.count,
        pt.lowSupport ? strings.calibrationLow : "",
      )
    : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-calib-live", className, style)}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticCalibrationStrip
        {...rest}
        data={data}
        bins={bins}
        minSupport={minSupport}
        variant={variant}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        style={FILL}
      >
        {pt ? (
          <>
            <line
              x1={pt.x}
              x2={pt.x}
              y1={0.5}
              y2={height - 0.5}
              data-mc-ink="muted"
              data-mc-w="tick"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={pt.x}
              cy={pt.y}
              r={2.4}
              fill="none"
              stroke="var(--mc-accent)"
              data-mc-w="support"
              vectorEffect="non-scaling-stroke"
            />
          </>
        ) : null}
      </StaticCalibrationStrip>
      <LiveRegion>{announced}</LiveRegion>
      {pt ? (
        <span
          className="mc-spark-readout"
          style={{ left: `${(pt.x / width) * 100}%`, transform: "translateX(-50%)" }}
        >
          {`${fmt(pt.predicted)} → ${fmt(pt.observed)}`}
        </span>
      ) : null}
    </span>
  );
}
