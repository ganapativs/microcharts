"use client";
// Interactive <GradedBand> (plan/23 #4). One pointer listener + pure nearest-
// edge math. ←/→ step levels outward/inward from the median; each announces its
// interval ("80% interval: 17 to 26."). Composes the static component (canon);
// the edge ticks are overlay children re-using geometry.
import { useCallback, useMemo, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { EN_QUANTILE, type QuantileStrings } from "../../core/strings-quantile.js";
import { gradedBandGeometry } from "./geometry.js";
import {
  GradedBand as StaticGradedBand,
  gradedBandSummary,
  type GradedBandProps,
} from "./index.js";

export interface InteractiveGradedBandProps extends GradedBandProps {
  strings?: QuantileStrings;
}

const FONT = 6;

export function GradedBand(props: InteractiveGradedBandProps): React.ReactNode {
  const {
    data,
    levels,
    value,
    label = "none",
    width = 80,
    height = 12,
    format,
    locale,
    strings = EN_QUANTILE,
    title,
    summary,
    ...rest
  } = props;

  const geo = useMemo(
    () =>
      gradedBandGeometry({
        width,
        height,
        data,
        levels,
        value,
        domain: props.domain,
        gutterCh: label === "median" ? 4 : 0,
        fontSize: FONT,
      }),
    [width, height, data, levels, value, props.domain, label],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const [active, setActive] = useState<number | null>(null);

  // ascending by level → ←/→ steps from the most-certain (innermost) outward
  const stops = useMemo(() => (geo ? [...geo.bands].sort((a, b) => a.p - b.p) : []), [geo]);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : geo === null
          ? strings.noData
          : gradedBandSummary(geo, fmt, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (stops.length === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const x = ((e.clientX - r.left) / r.width) * geo!.totalWidth;
      let best = 0;
      let bestDist = Infinity;
      stops.forEach((b, i) => {
        const d = Math.min(Math.abs(b.x - x), Math.abs(b.x + b.width - x));
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setActive(best);
    },
    [stops, geo],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (stops.length === 0) return;
      const pos = active ?? -1;
      let next = pos;
      switch (e.key) {
        case "ArrowRight":
          next = Math.min(stops.length - 1, pos + 1);
          break;
        case "ArrowLeft":
          next = pos <= 0 ? 0 : pos - 1;
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = stops.length - 1;
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
    [active, stops],
  );

  const band = active !== null ? stops[active] : undefined;
  const announced = band ? strings.bandEdge(band.p, fmt(band.lo), fmt(band.hi)) : "";

  return (
    <span
      className="mc-graded-band-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticGradedBand
        {...rest}
        data={data}
        levels={levels}
        value={value}
        label={label}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {band ? (
          <>
            <line
              x1={band.x}
              y1={0.5}
              x2={band.x}
              y2={height - 0.5}
              stroke="var(--mc-accent)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={band.x + band.width}
              y1={0.5}
              x2={band.x + band.width}
              y2={height - 0.5}
              stroke="var(--mc-accent)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          </>
        ) : null}
        {rest.children}
      </StaticGradedBand>
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
