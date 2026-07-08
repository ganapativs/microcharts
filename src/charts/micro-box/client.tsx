"use client";
// Interactive <MicroBox> (plan/22 #16). Pointer → nearest of the five stat
// positions by x; ←/→ steps the fixed 5-stop roving model min → q1 → median →
// q3 → max ("Median: 42."). Composes the static component (canon).
import { useCallback, useMemo, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { EN_DIST, type DistStrings } from "../../core/strings-dist.js";
import { computeFive, microBoxGeometry } from "./geometry.js";
import { MicroBox as StaticMicroBox, microBoxSummary, type MicroBoxProps } from "./index.js";

const STOPS = ["min", "q1", "median", "q3", "max"] as const;
type Stop = (typeof STOPS)[number];

export interface InteractiveMicroBoxProps extends MicroBoxProps {
  strings?: DistStrings;
}

export function MicroBox(props: InteractiveMicroBoxProps): React.ReactNode {
  const {
    data,
    stats,
    whiskers = "minmax",
    domain,
    width = 40,
    height = 14,
    format,
    locale,
    strings = EN_DIST,
    title,
    summary,
    ...rest
  } = props;

  const resolved = useMemo(() => computeFive(data, stats), [data, stats]);
  const geo = useMemo(
    () =>
      resolved
        ? microBoxGeometry({
            width,
            height,
            five: resolved.five,
            raw: resolved.raw,
            whiskers,
            domain,
          })
        : null,
    [resolved, width, height, whiskers, domain],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const [active, setActive] = useState<Stop | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : resolved
          ? microBoxSummary(resolved.five, fmt, strings)
          : strings.noData;
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (!geo) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const x = ((e.clientX - r.left) / r.width) * width;
      let best: Stop = "median";
      let bestDist = Infinity;
      for (const stop of STOPS) {
        const dist = Math.abs(geo.statX[stop] - x);
        if (dist < bestDist) {
          bestDist = dist;
          best = stop;
        }
      }
      setActive(best);
    },
    [geo, width],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!geo) return;
      const pos = active === null ? -1 : STOPS.indexOf(active);
      let next = pos;
      switch (e.key) {
        case "ArrowRight":
          next = Math.min(STOPS.length - 1, pos + 1);
          break;
        case "ArrowLeft":
          next = Math.max(0, pos <= 0 ? 0 : pos - 1);
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = STOPS.length - 1;
          break;
        case "Escape":
          setActive(null);
          return;
        default:
          return;
      }
      e.preventDefault();
      setActive(STOPS[next]!);
    },
    [active, geo],
  );

  const announced = active && resolved ? strings.boxStat(active, fmt(resolved.five[active])) : "";

  return (
    <span
      className="mc-box-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticMicroBox
        {...rest}
        data={data}
        stats={stats}
        whiskers={whiskers}
        domain={domain}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {active && geo ? (
          <line
            x1={geo.statX[active]}
            y1={0.5}
            x2={geo.statX[active]}
            y2={height - 0.5}
            stroke="var(--mc-accent)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticMicroBox>
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
      {active && geo && resolved ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${(geo.statX[active] / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {fmt(resolved.five[active])}
        </span>
      ) : null}
    </span>
  );
}
