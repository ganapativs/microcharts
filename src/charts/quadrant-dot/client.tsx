"use client";
// Interactive <QuadrantDot> (plan/23 #17). The focal is announced on focus;
// ←/→ cycle the field ghosts in nearest-first order, each read with its coords
// and quadrant; a pointer picks the nearest dot within a 3-unit hit radius.
// Composes the static component (canon); the focus ring + readout chip are
// overlay children.
import { useCallback, useMemo, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { EN_QUADRANT, type QuadrantStrings } from "../../core/strings-quadrant.js";
import { quadrantDotGeometry } from "./geometry.js";
import {
  QuadrantDot as StaticQuadrantDot,
  quadrantSummary,
  type QuadrantDotProps,
  type QuadrantNames,
} from "./index.js";

export interface InteractiveQuadrantDotProps extends QuadrantDotProps {
  strings?: QuadrantStrings;
}

// derive the quadrant name from a peer's quadrant index (TL0 TR1 BL2 BR3)
const nameOf = (
  q: 0 | 1 | 2 | 3,
  xLabel: string,
  yLabel: string,
  quadrants: QuadrantNames | undefined,
  strings: QuadrantStrings,
): string =>
  quadrants
    ? quadrants[q]
    : strings.quadrantName(q === 0 || q === 1, yLabel, q === 1 || q === 3, xLabel);

export function QuadrantDot(props: InteractiveQuadrantDotProps): React.ReactNode {
  const {
    data,
    field,
    xDomain,
    domain,
    split,
    quadrants,
    xLabel = "x",
    yLabel = "y",
    format,
    locale,
    width = 24,
    height = 24,
    strings = EN_QUADRANT,
    title,
    summary,
    ...rest
  } = props;

  const geo = useMemo(
    () => quadrantDotGeometry({ width, height, data, field, xDomain, domain, split }),
    [width, height, data, field, xDomain, domain, split],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : geo === null
          ? strings.noData
          : quadrantSummary(geo, { xLabel, yLabel, quadrants }, fmt, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const count = geo?.ghosts.length ?? 0;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (!geo || count === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const px = ((e.clientX - r.left) / r.width) * width;
      const py = ((e.clientY - r.top) / r.height) * height;
      let best = -1;
      let bestDist = 9;
      geo.ghosts.forEach((g, i) => {
        const d = (g.x - px) ** 2 + (g.y - py) ** 2;
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setActive(best >= 0 ? best : null);
    },
    [geo, count, width, height],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (count === 0) return;
      switch (e.key) {
        case "ArrowRight":
          setActive((p) => Math.min(count - 1, (p ?? -1) + 1));
          break;
        case "ArrowLeft":
          setActive((p) => (p === null || p <= 0 ? 0 : p - 1));
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

  const g = active !== null && geo ? geo.ghosts[active] : undefined;
  const announced =
    g && active !== null
      ? strings.quadrantAt(
          active + 1,
          count,
          xLabel,
          fmt(g.vx),
          yLabel,
          fmt(g.vy),
          nameOf(g.quadrant, xLabel, yLabel, quadrants, strings),
        )
      : "";

  return (
    <span
      className="mc-quadrant-dot-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticQuadrantDot
        {...rest}
        data={data}
        field={field}
        xDomain={xDomain}
        domain={domain}
        split={split}
        quadrants={quadrants}
        xLabel={xLabel}
        yLabel={yLabel}
        format={format}
        locale={locale}
        width={width}
        height={height}
        strings={strings}
        summary={false}
      >
        {g ? (
          <circle
            cx={g.x}
            cy={g.y}
            r={Math.max(1.6, Math.min(width, height) * 0.1) + 1.4}
            fill="none"
            stroke="var(--mc-accent)"
            data-mc-w="tick"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticQuadrantDot>
      {g && geo ? (
        <span
          className="mc-quadrant-dot-readout mc-spark-readout"
          style={{ left: `${(g.x / width) * 100}%`, transform: "translateX(-50%)" }}
        >
          {`${fmt(g.vx)}, ${fmt(g.vy)}`}
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
