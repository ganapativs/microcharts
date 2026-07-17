"use client";
// Interactive <RetentionCurve>. One pointer listener + nearest-
// period math. ←/→ step periods; the live region states retention and, when a
// benchmark is present, its value too. Composes the static component (canon);
// the crosshair + ghost-value tick are overlay children.
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { makeFormatter } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import { FILL } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_RETENTION, type RetentionStrings } from "../../core/strings-retention.js";
import { retentionGeometry } from "./geometry.js";
import {
  RetentionCurve as StaticRetentionCurve,
  retentionSummary,
  PCT,
  type RetentionCurveProps,
} from "./index.js";

export interface InteractiveRetentionCurveProps extends RetentionCurveProps {
  strings?: RetentionStrings;
  /**
   * Opt-in entrance motion (default `false`): the line draws on when the
   * chart first mounts client-side. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function RetentionCurve(props: InteractiveRetentionCurveProps): React.ReactNode {
  const {
    data,
    benchmark,
    plateau = true,
    curve = "step",
    unit = "period",
    height = 20,
    width = 80,
    format = PCT,
    locale,
    strings = EN_RETENTION,
    title,
    summary,
    animate = false,
    className,
    style,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "draw", animate);

  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  // Mirror the static's label gutter so `totalWidth` matches the rendered
  // viewBox — without it the pointer map and readout run short and the
  // crosshair drifts from the cursor.
  const geo = useMemo(() => {
    const base = retentionGeometry({
      width,
      height,
      data,
      benchmark,
      plateau,
      curve,
      domain: props.domain,
    });
    const showLabel = (props.label ?? "last") === "last" && base != null;
    const gutterCh = showLabel ? fmt(base!.last.value).length : 0;
    return retentionGeometry({
      width,
      height,
      data,
      benchmark,
      plateau,
      curve,
      domain: props.domain,
      gutterCh,
      fontSize: labelFont(height),
    });
  }, [width, height, data, benchmark, plateau, curve, props.domain, props.label, fmt]);
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : geo === null
          ? strings.noData
          : retentionSummary(geo, fmt, unit, data.length, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const count = geo?.points.length ?? 0;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (!geo || count === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const px = ((e.clientX - r.left) / r.width) * geo.totalWidth;
      let best = 0;
      let bestDist = Infinity;
      geo.points.forEach((p, i) => {
        const d = Math.abs(p.x - px);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setActive(best);
    },
    [geo, count],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (count === 0) return;
      switch (e.key) {
        case "ArrowRight":
          setActive((prev) => Math.min(count - 1, (prev ?? -1) + 1));
          break;
        case "ArrowLeft":
          setActive((prev) => (prev === null || prev <= 0 ? 0 : prev - 1));
          break;
        case "Home":
          setActive(0);
          break;
        case "End":
          setActive(count - 1);
          break;
        case "Escape":
          setActive(null);
          return;
        default:
          return;
      }
      e.preventDefault();
    },
    [count],
  );

  const p = active !== null && geo ? geo.points[active] : undefined;
  const announced = p
    ? strings.retentionAt(unit, p.period, fmt(p.value), p.bench === null ? null : fmt(p.bench))
    : "";

  const wrapStyle: CSSProperties = {
    display: "inline-block",
    position: "relative",
    lineHeight: 0,
    ...style,
  };

  return (
    <span
      ref={hostRef}
      className={className ? `mc-retention-curve-live ${className}` : "mc-retention-curve-live"}
      style={wrapStyle}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticRetentionCurve
        {...rest}
        style={FILL}
        data={data}
        benchmark={benchmark}
        plateau={plateau}
        curve={curve}
        unit={unit}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {p ? (
          <>
            <line
              x1={p.x}
              y1={0.5}
              x2={p.x}
              y2={height - 0.5}
              stroke="var(--mc-neutral)"
              data-mc-w="support"
              strokeDasharray="1.5 2"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={p.x}
              cy={p.y}
              r={2.4}
              fill="none"
              stroke="var(--mc-accent)"
              data-mc-w="support"
              vectorEffect="non-scaling-stroke"
            />
            {p.benchY !== null ? (
              // ghost-value tick — a small hollow mark on the benchmark line
              <circle
                cx={p.x}
                cy={p.benchY}
                r={1.5}
                fill="none"
                stroke="var(--mc-neutral)"
                data-mc-w="tick"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
          </>
        ) : null}
        {rest.children}
      </StaticRetentionCurve>
      {p ? (
        <span
          className="mc-retention-readout mc-spark-readout"
          style={{ left: `${(p.x / geo!.totalWidth) * 100}%`, transform: "translateX(-50%)" }}
        >
          {p.bench === null ? fmt(p.value) : `${fmt(p.value)} · ${fmt(p.bench)}`}
        </span>
      ) : null}
      <LiveRegion>{announced}</LiveRegion>
    </span>
  );
}
