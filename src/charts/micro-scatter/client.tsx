"use client";
// Interactive <MicroScatter> (plan/22 #29). One pointer listener; nearest
// point by squared Euclidean distance over the precomputed dots. ←/→ step
// points ordered by x, announcing the formatted pair. Focus ring on the
// active dot. Composes the static component (canon).
import { useCallback, useMemo, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { EN_SERIES, type SeriesStrings } from "../../core/summary.js";
import { EN_SCATTER, type ScatterStrings } from "../../core/strings-scatter.js";
import { microScatterGeometry } from "./geometry.js";
import {
  MicroScatter as StaticMicroScatter,
  microScatterSummary,
  type MicroScatterProps,
} from "./index.js";

export interface InteractiveMicroScatterProps extends MicroScatterProps {
  strings?: ScatterStrings;
  /** Point announcement templates (shared point wording). */
  seriesStrings?: SeriesStrings;
}

export function MicroScatter(props: InteractiveMicroScatterProps): React.ReactNode {
  const {
    data,
    trend = false,
    xDomain,
    domain,
    width = 40,
    height = 24,
    format,
    locale,
    strings = EN_SCATTER,
    seriesStrings = EN_SERIES,
    title,
    summary,
    ...rest
  } = props;
  const rad = Math.min(3, Math.max(1, props.r ?? 1.5));

  const geo = useMemo(
    () =>
      microScatterGeometry({
        width,
        height,
        points: data,
        xDomain,
        yDomain: domain,
        trend,
        r: rad,
      }),
    [width, height, data, xDomain, domain, trend, rad],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const [active, setActive] = useState<number | null>(null); // index into geo.dots

  /** Dots ordered by x for ←/→ stepping. */
  const order = useMemo(() => {
    const idx = geo.dots.map((d, i) => ({ i, x: d.x }));
    idx.sort((a, b) => a.x - b.x);
    return idx.map((e) => e.i);
  }, [geo]);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : microScatterSummary(geo.dots.length, geo.r, strings);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (geo.dots.length === 0) return;
      const rct = e.currentTarget.getBoundingClientRect();
      if (rct.width === 0 || rct.height === 0) return;
      const x = ((e.clientX - rct.left) / rct.width) * width;
      const y = ((e.clientY - rct.top) / rct.height) * height;
      let best = 0;
      let bestDist = Infinity;
      geo.dots.forEach((d, i) => {
        const dist = (d.x - x) ** 2 + (d.y - y) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setActive(best);
    },
    [geo, width, height],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (order.length === 0) return;
      const pos = active === null ? -1 : order.indexOf(active);
      let next = pos;
      switch (e.key) {
        case "ArrowRight":
          next = Math.min(order.length - 1, pos + 1);
          break;
        case "ArrowLeft":
          next = Math.max(0, pos <= 0 ? 0 : pos - 1);
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = order.length - 1;
          break;
        case "Escape":
          setActive(null);
          return;
        default:
          return;
      }
      e.preventDefault();
      setActive(order[next]!);
    },
    [active, order],
  );

  const activeDot = active !== null ? geo.dots[active] : undefined;
  const activePoint = activeDot ? data[activeDot.index] : undefined;
  const announced =
    activeDot && activePoint
      ? seriesStrings.point(
          (order.indexOf(active!) ?? 0) + 1,
          geo.dots.length,
          `${fmt(activePoint.x)}, ${fmt(activePoint.y)}`,
        )
      : "";

  return (
    <span
      className="mc-scatter-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticMicroScatter
        {...rest}
        data={data}
        trend={trend}
        xDomain={xDomain}
        domain={domain}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {activeDot ? (
          <circle
            cx={activeDot.x}
            cy={activeDot.y}
            r={rad + 1.25}
            fill="none"
            stroke="var(--mc-accent)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticMicroScatter>
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
      {activeDot && activePoint ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${(activeDot.x / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {`${fmt(activePoint.x)}, ${fmt(activePoint.y)}`}
        </span>
      ) : null}
    </span>
  );
}
