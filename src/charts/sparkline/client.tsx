"use client";
// Interactive <Sparkline> (plan/04 §4, plan/08 T2). Opt-in entry:
//   import { Sparkline } from '@microcharts/react/sparkline/interactive'
//
// CANONICAL INTERACTIVE PATTERN (CLAUDE.md — every chart follows this):
//   1. COMPOSE the static component (`summary={false}`, overlay marks passed
//      as its children) — never re-implement the visual; it cannot drift.
//   2. ONE pointer listener on the wrapper + nearest-stop math — never a DOM
//      node per point (500 rows × 30 pts must stay cheap, plan/03 §6).
//   3. The wrapper owns the accessible name (role=img + aria-label) and the
//      roving keyboard; announcements go through a polite live region using
//      the i18n-able SummaryStrings (plan/08 §5).
import { useCallback, useMemo, useState, type CSSProperties, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { describeSeries, EN_SERIES, type SeriesStrings } from "../../core/summary.js";
import { lastFinite } from "../../core/stats.js";
import { isFiniteValue } from "../../core/types.js";
import { labelMetrics, sparkGeometry } from "./geometry.js";
import { Sparkline as StaticSparkline, type SparklineProps } from "./index.js";

// The composed static SVG fills the focusable wrapper so the wrapper's box and
// the SVG's box coincide — pointer→viewBox math and overlay marks stay exact,
// and the chart scales fluidly with its container.
const FILL: CSSProperties = { display: "block", width: "100%", height: "auto" };

export interface InteractiveSparklineProps extends SparklineProps {
  /** Called with the index of the focused point (or `null` when cleared). */
  onPointFocus?: (index: number | null) => void;
  /** Swappable announcement strings (defaults to EN). */
  strings?: SeriesStrings;
}

export function Sparkline(props: InteractiveSparklineProps): React.ReactNode {
  const {
    data,
    domain,
    width = 80,
    height = 20,
    fill = false,
    band,
    label = "none",
    title,
    summary,
    format,
    locale,
    onPointFocus,
    strings = EN_SERIES,
    className,
    style,
    ...rest
  } = props;

  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);

  // Same geometry inputs as the static render (pure → identical numbers),
  // including the label gutters, so overlay marks line up exactly.
  const geo = useMemo(() => {
    const last = lastFinite(data);
    const labelText = label === "last" && last !== undefined ? fmt(last) : undefined;
    const gutterRight = labelText !== undefined ? labelMetrics(labelText, width, height).gutter : 0;
    const mmSize = Math.max(5, Math.min(Math.round(height * 0.22), 9));
    const gutterY = label === "minmax" && height >= (mmSize + 1) * 2 + 12 ? mmSize + 1 : 0;
    return sparkGeometry(data, {
      width,
      height,
      domain,
      zero: fill,
      band,
      gutterRight,
      gutterTop: gutterY,
      gutterBottom: gutterY,
      maxPoints: props.maxPoints,
    });
  }, [data, width, height, domain, fill, band, label, fmt, props.maxPoints]);

  // Indices with a finite value — the only navigable stops.
  const stops = useMemo(
    () => data.map((v, i) => (isFiniteValue(v) ? i : -1)).filter((i) => i >= 0),
    [data],
  );
  const [active, setActive] = useState<number | null>(null);

  const move = useCallback(
    (next: number | null) => {
      setActive(next);
      onPointFocus?.(next);
    },
    [onPointFocus],
  );

  // ONE listener; nearest finite stop by x distance in viewBox space.
  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (stops.length === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const x = ((e.clientX - r.left) / r.width) * width;
      let best = stops[0]!;
      let bestDist = Infinity;
      for (const i of stops) {
        const p = geo.points[i];
        if (!p) continue;
        const d = Math.abs(p[0] - x);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      }
      if (best !== active) move(best);
    },
    [stops, geo, width, active, move],
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
  const activePos = active !== null ? stops.indexOf(active) + 1 : 0;

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
      onPointerMove={onPointerMove}
      onPointerLeave={() => move(null)}
      onBlur={() => move(null)}
    >
      <StaticSparkline
        {...rest}
        data={data}
        domain={domain}
        width={width}
        height={height}
        fill={fill}
        band={band}
        label={label}
        format={format}
        locale={locale}
        summary={false}
        /* Fill the focusable wrapper exactly so pointer math + overlay marks
           map 1:1 (the wrapper box === the SVG box) and the chart is fluid. */
        style={FILL}
      >
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
        {activePoint ? (
          <circle cx={activePoint[0]} cy={activePoint[1]} r={2.6} data-mc-ink="accent" />
        ) : null}
        {rest.children}
      </StaticSparkline>
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
        {activeValue !== null ? strings.point(activePos, stops.length, fmt(activeValue)) : ""}
      </span>
      {activePoint &&
      activeValue !== null &&
      /* At the endpoint the persistent `label="last"` already shows this value —
         a floating readout there just collides with it. Skip it; every other
         point still gets the readout. */
      !(label === "last" && active === stops[stops.length - 1]) ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${(activePoint[0] / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {fmt(activeValue)}
        </span>
      ) : null}
    </span>
  );
}
