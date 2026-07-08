"use client";
// Interactive <BumpStrip> (plan/22 #21). Nearest-x pointer lookup; ←/→ step
// periods ("Week 4 of 12: #3."). Composes the static component (canon).
import { useCallback, useMemo, useState, type PointerEvent } from "react";
import { EN_FLOW, type FlowStrings } from "../../core/strings-flow.js";
import { isFiniteValue } from "../../core/types.js";
import { bumpGeometry } from "./geometry.js";
import { BumpStrip as StaticBumpStrip, bumpSummary, type BumpStripProps } from "./index.js";

export interface InteractiveBumpStripProps extends BumpStripProps {
  strings?: FlowStrings;
}

export function BumpStrip(props: InteractiveBumpStripProps): React.ReactNode {
  const {
    data,
    maxRank,
    label = "ends",
    width = 60,
    height = 16,
    strings = EN_FLOW,
    title,
    summary,
    ...rest
  } = props;

  const fontSize = Math.max(5, Math.min(Math.round(height * 0.4), 7));
  const maxLabelChars =
    label === "none"
      ? 0
      : 1 +
        String(Math.max(1, ...data.filter((r): r is number => isFiniteValue(r)).map(Math.round)))
          .length;
  const geo = useMemo(
    () =>
      bumpGeometry({
        width,
        height,
        ranks: data,
        maxRank,
        gutterLeftCh: label === "ends" ? maxLabelChars : 0,
        gutterRightCh: label !== "none" ? maxLabelChars : 0,
        fontSize,
      }),
    [width, height, data, maxRank, label, maxLabelChars, fontSize],
  );
  const [active, setActive] = useState<number | null>(null); // index into geo.points

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : bumpSummary(data, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (geo.points.length === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const x = ((e.clientX - r.left) / r.width) * width;
      let best = 0;
      let bestDist = Infinity;
      geo.points.forEach((p, i) => {
        const dist = Math.abs(p.x - x);
        if (dist < bestDist) {
          bestDist = dist;
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
      const cur = active ?? 0;
      let next = cur;
      switch (e.key) {
        case "ArrowRight":
          next = Math.min(geo.points.length - 1, cur + 1);
          break;
        case "ArrowLeft":
          next = Math.max(0, cur - 1);
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = geo.points.length - 1;
          break;
        case "Escape":
          setActive(null);
          return;
        default:
          return;
      }
      e.preventDefault();
      setActive(next);
    },
    [active, geo],
  );

  const point = active !== null ? geo.points[active] : undefined;
  const announced = point ? strings.rankAt(point.index + 1, data.length, point.rank) : "";

  return (
    <span
      className="mc-bump-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticBumpStrip
        {...rest}
        data={data}
        maxRank={maxRank}
        label={label}
        width={width}
        height={height}
        strings={strings}
        summary={false}
      >
        {point ? (
          <circle
            cx={point.x}
            cy={point.y}
            r={2.5}
            fill="none"
            stroke="var(--mc-accent)"
            strokeWidth={1.25}
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticBumpStrip>
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
      {point ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${(point.x / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {`#${point.rank}`}
        </span>
      ) : null}
    </span>
  );
}
