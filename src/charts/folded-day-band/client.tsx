"use client";
// Interactive <FoldedDayBand> (plan/25 §15). One pointer listener; nearest fold
// bin by x. ←/→ rove bins. Composes the static component (canon).
import { useCallback, useMemo, useState, type CSSProperties, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { EN_FOLDED_BAND } from "../../core/strings-folded-band.js";
import { foldedBandGeometry } from "./geometry.js";
import {
  FoldedDayBand as StaticFoldedDayBand,
  binPosition,
  foldedBandSummary,
  type FoldedDayBandProps,
} from "./index.js";

const FILL: CSSProperties = { width: "100%", height: "auto" };

export function FoldedDayBand(props: FoldedDayBandProps): React.ReactNode {
  const {
    data,
    period = 24,
    today,
    bands = [
      [25, 75],
      [5, 95],
    ],
    bins = 24,
    width = 120,
    height = 32,
    format,
    locale,
    strings = EN_FOLDED_BAND,
    title,
    summary,
    ...rest
  } = props;

  const geo = useMemo(
    () => foldedBandGeometry({ data, today: today ?? null, period, bins, bands, width, height }),
    [data, today, period, bins, bands, width, height],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : foldedBandSummary(geo, period, strings, fmt);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (geo.binStats.length === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const x = ((e.clientX - r.left) / r.width) * width;
      let best = 0;
      let bestD = Infinity;
      geo.binStats.forEach((s, i) => {
        const d = Math.abs(s.x - x);
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
      if (geo.binStats.length === 0) return;
      setActive((prev) => {
        const cur = prev ?? 0;
        if (e.key === "ArrowRight") {
          e.preventDefault();
          return Math.min(geo.binStats.length - 1, cur + 1);
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

  const s = active != null ? geo.binStats[active] : undefined;
  const todayClause =
    geo.todayPercentile == null
      ? ""
      : geo.todayPercentile < 25
        ? strings.foldedToday[0]
        : geo.todayPercentile > 75
          ? strings.foldedToday[2]
          : strings.foldedToday[1];
  const announced = s
    ? strings.foldedAt(
        fmt(binPosition(s.bin, bins, period)),
        fmt(s.median),
        fmt(s.q1),
        fmt(s.q3),
        todayClause,
      )
    : "";

  return (
    <span
      className="mc-folded-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticFoldedDayBand
        {...rest}
        data={data}
        period={period}
        today={today}
        bands={bands}
        bins={bins}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        style={FILL}
      >
        {s ? (
          <line
            x1={s.x}
            x2={s.x}
            y1={0.5}
            y2={height - 0.5}
            data-mc-ink="muted"
            data-mc-w="tick"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
      </StaticFoldedDayBand>
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
      {s ? (
        <span
          className="mc-spark-readout"
          style={{ left: `${(s.x / width) * 100}%`, transform: "translateX(-50%)" }}
        >
          {`${fmt(binPosition(s.bin, bins, period))} · ${fmt(s.median)}`}
        </span>
      ) : null}
    </span>
  );
}
