"use client";
// Interactive <PhaseTrace> (plan/25 §17). Hover snaps to the nearest DATA point
// (which carries a definite time index — spatial interpolation would lie at
// crossings); ←/→ step time. Composes the static component (canon).
import { useCallback, useMemo, useState, type CSSProperties, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { EN_PHASE_TRACE } from "../../core/strings-phase-trace.js";
import { phaseTraceGeometry } from "./geometry.js";
import {
  PhaseTrace as StaticPhaseTrace,
  phaseTraceSummary,
  type PhaseTraceProps,
} from "./index.js";
import { isFiniteValue } from "../../core/types.js";

const FILL: CSSProperties = { width: "100%", height: "auto" };

function extent(vals: number[]): readonly [number, number] {
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of vals) {
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  if (!Number.isFinite(lo)) return [0, 1];
  if (lo === hi) return [lo - 1, hi + 1];
  return [lo, hi];
}

export function PhaseTrace(props: PhaseTraceProps): React.ReactNode {
  const {
    data,
    xLabel = "x",
    yLabel = "y",
    xDomain,
    yDomain,
    tail = 0.25,
    width = 40,
    height = 32,
    format,
    locale,
    strings = EN_PHASE_TRACE,
    title,
    summary,
    ...rest
  } = props;

  const finite = useMemo(
    () => data.filter((p) => isFiniteValue(p.x) && isFiniteValue(p.y)),
    [data],
  );
  const xd = useMemo(() => xDomain ?? extent(finite.map((p) => p.x)), [xDomain, finite]);
  const yd = useMemo(() => yDomain ?? extent(finite.map((p) => p.y)), [yDomain, finite]);
  const geo = useMemo(
    () => phaseTraceGeometry({ data, xDomain: xd, yDomain: yd, tail, width, height }),
    [data, xd, yd, tail, width, height],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : phaseTraceSummary(data, xLabel, yLabel, geo.heading, strings, fmt);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (geo.points.length === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const px = ((e.clientX - r.left) / r.width) * width;
      const py = ((e.clientY - r.top) / r.height) * height;
      let best = 0;
      let bestD = Infinity;
      geo.points.forEach((p, i) => {
        const d = (p.x - px) ** 2 + (p.y - py) ** 2;
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      setActive(best);
    },
    [geo, width, height],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (geo.points.length === 0) return;
      setActive((prev) => {
        const cur = prev ?? geo.points.length - 1;
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
    ? strings.phaseAt(active! + 1, geo.points.length, xLabel, fmt(pt.dataX), yLabel, fmt(pt.dataY))
    : "";

  return (
    <span
      className="mc-phase-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticPhaseTrace
        {...rest}
        data={data}
        xLabel={xLabel}
        yLabel={yLabel}
        xDomain={xd}
        yDomain={yd}
        tail={tail}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        style={FILL}
      >
        {pt ? (
          <circle
            cx={pt.x}
            cy={pt.y}
            r={2.4}
            fill="none"
            stroke="var(--mc-accent)"
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
      </StaticPhaseTrace>
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
      {pt ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${(pt.x / width) * 100}%`,
            top: `${(pt.y / height) * 100}%`,
            transform: "translate(-50%, -140%)",
            bottom: "auto",
          }}
        >
          {`${fmt(pt.dataX)}, ${fmt(pt.dataY)}`}
        </span>
      ) : null}
    </span>
  );
}
