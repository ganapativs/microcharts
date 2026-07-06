"use client";
// Interactive <Sparkline> (plan/04 §4, plan/08 T2). Opt-in entry:
//   import { Sparkline } from '@microcharts/react/sparkline/interactive'
// Adds pointer + keyboard point navigation over the static geometry. Navigation
// rides an HTML overlay with roving focus (Visa/Data-Navigator pattern) — never
// per-point SVG focus — and announces the focused value through a throttle-free
// polite live region. The static marks are unchanged, so the visual is identical
// to the RSC entry; only behavior is layered on. Motion/geometry gate on the
// browser, which exists here (unlike the static entry).
import { useCallback, useId, useMemo, useState, type CSSProperties } from "react";
import { linePath, smoothPath, stepPath, areaPath, type Curve } from "../../core/path.js";
import { describeSeries } from "../../core/summary.js";
import { isFiniteValue } from "../../core/types.js";
import { sparkGeometry } from "./geometry.js";
import type { SparklineProps } from "./index.js";

const CURVE: Record<Curve, (p: readonly (readonly [number, number] | null)[]) => string> = {
  linear: linePath,
  smooth: smoothPath,
  step: stepPath,
};

export interface InteractiveSparklineProps extends SparklineProps {
  /** Called with the index of the focused point (or `null` when cleared). */
  onPointFocus?: (index: number | null) => void;
}

export function Sparkline(props: InteractiveSparklineProps): React.ReactNode {
  const {
    data,
    domain,
    width = 80,
    height = 20,
    curve = "linear",
    fill = false,
    band,
    dots = "auto",
    color,
    title,
    summary,
    format,
    locale,
    onPointFocus,
    className,
    style,
    children,
  } = props;

  const geo = useMemo(
    () => sparkGeometry(data, { width, height, domain, zero: fill, band }),
    [data, width, height, domain, fill, band],
  );
  const d = CURVE[curve](geo.points);
  const base = useId();

  // Indices with a finite value — the only navigable stops.
  const stops = useMemo(
    () => data.map((v, i) => (isFiniteValue(v) ? i : -1)).filter((i) => i >= 0),
    [data],
  );
  const [active, setActive] = useState<number | null>(null);

  const fmt = useMemo(
    () =>
      typeof format === "function"
        ? format
        : (n: number) => new Intl.NumberFormat(locale, format).format(n),
    [format, locale],
  );

  const move = useCallback(
    (next: number | null) => {
      setActive(next);
      onPointFocus?.(next);
    },
    [onPointFocus],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (stops.length === 0) return;
      const pos = active === null ? -1 : stops.indexOf(active);
      let target = pos;
      switch (e.key) {
        case "ArrowRight":
          target = Math.min(stops.length - 1, pos + 1);
          break;
        case "ArrowLeft":
          target = pos <= 0 ? 0 : pos - 1;
          break;
        case "Home":
          target = 0;
          break;
        case "End":
          target = stops.length - 1;
          break;
        case "Escape":
          move(null);
          return;
        default:
          return;
      }
      e.preventDefault();
      move(stops[target]!);
    },
    [active, stops, move],
  );

  const accName =
    summary === false ? undefined : (summary ?? describeSeries(data, { format, locale }));
  const activeValue = active !== null ? (data[active] as number) : null;
  const activePoint = active !== null ? geo.points[active] : null;
  const strokeStyle = color ? { stroke: color } : undefined;
  const fillStyle = color ? { fill: color } : undefined;

  const wrapStyle: CSSProperties = {
    display: "inline-block",
    position: "relative",
    lineHeight: 0,
    ...style,
  };

  return (
    <span
      className={className ? `mc-spark-interactive ${className}` : "mc-spark-interactive"}
      style={wrapStyle}
      tabIndex={0}
      role="img"
      aria-label={[title, accName].filter(Boolean).join(". ") || undefined}
      onKeyDown={onKeyDown}
      onBlur={() => move(null)}
    >
      <svg
        className="mc-root"
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        {geo.band ? (
          <rect
            x={geo.band.x}
            y={geo.band.y}
            width={geo.band.width}
            height={geo.band.height}
            data-mc-ink="band"
          />
        ) : null}
        {fill && d ? (
          <path
            d={areaPath(geo.points, geo.baselineY, curve)}
            data-mc-ink="fill"
            style={fillStyle}
          />
        ) : null}
        {d ? (
          <path d={d} vectorEffect="non-scaling-stroke" data-mc-ink="data" style={strokeStyle} />
        ) : null}
        {activePoint ? (
          <line
            x1={activePoint[0]}
            y1={geo.plot.y0}
            x2={activePoint[0]}
            y2={geo.plot.y1}
            data-mc-ink="muted"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {dots !== "none" && geo.last ? (
          <circle cx={geo.last.x} cy={geo.last.y} r={2} data-mc-ink="accent" />
        ) : null}
        {activePoint ? (
          <circle cx={activePoint[0]} cy={activePoint[1]} r={2.5} data-mc-ink="accent" />
        ) : null}
        {children}
      </svg>
      {/* pointer hit targets — one invisible slice per finite point */}
      <span aria-hidden="true" style={{ position: "absolute", inset: 0 }}>
        {stops.map((i) => {
          const p = geo.points[i]!;
          const left = `${(p[0] / width) * 100}%`;
          return (
            <span
              key={i}
              onPointerEnter={() => move(i)}
              onPointerLeave={() => move(null)}
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left,
                width: `${100 / stops.length}%`,
                transform: "translateX(-50%)",
              }}
            />
          );
        })}
      </span>
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
        {activeValue !== null ? `Point ${active! + 1}: ${fmt(activeValue)}` : ""}
      </span>
      {activePoint && activeValue !== null ? (
        <span
          className="mc-spark-readout"
          data-id={`${base}-readout`}
          style={{
            position: "absolute",
            left: `${(activePoint[0] / width) * 100}%`,
            bottom: "100%",
            transform: "translateX(-50%)",
            font: "var(--mc-label-size, 0.75em) var(--mc-font, inherit)",
            fontVariantNumeric: "tabular-nums",
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          {fmt(activeValue)}
        </span>
      ) : null}
    </span>
  );
}
