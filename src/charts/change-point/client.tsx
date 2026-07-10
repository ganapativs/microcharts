"use client";
// Interactive <ChangePoint> (plan/23 #19). ←/→ step points (value + regime);
// Tab cycles the breaks as first-class stops, each announcing the mean shift.
// A pointer picks the nearest x. Composes the static component (canon); the
// crosshair + readout chip are overlay children.
import { useCallback, useMemo, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { EN_CHANGE_POINT, type ChangePointStrings } from "../../core/strings-change-point.js";
import { changePointGeometry } from "./geometry.js";
import {
  ChangePoint as StaticChangePoint,
  changePointSummary,
  type ChangePointProps,
} from "./index.js";

export interface InteractiveChangePointProps extends ChangePointProps {
  strings?: ChangePointStrings;
}

const pct = (frac: number): string =>
  `${frac > 0 ? "+" : frac < 0 ? "−" : ""}${Math.round(Math.abs(frac) * 100)}%`;

export function ChangePoint(props: InteractiveChangePointProps): React.ReactNode {
  const {
    data,
    breaks = "auto",
    max = 2,
    domain,
    format,
    locale,
    width = 80,
    height = 16,
    strings = EN_CHANGE_POINT,
    title,
    summary,
    ...rest
  } = props;

  const geo = useMemo(
    () => changePointGeometry({ width, height, data, breaks, max, domain }),
    [width, height, data, breaks, max, domain],
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
          : changePointSummary(geo, fmt, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  // regime index for a given point (0-based), plus its mean
  const regimeOf = (i: number): { regime: number; mean: number } => {
    const seg = geo
      ? geo.segments.findIndex((_, s) => {
          const lo = s === 0 ? 0 : geo.breaks[s - 1]!.index;
          const hi = s === geo.segments.length - 1 ? geo.n : geo.breaks[s]!.index;
          return i >= lo && i < hi;
        })
      : -1;
    return { regime: seg + 1, mean: geo && seg >= 0 ? geo.segments[seg]!.mean : NaN };
  };

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (!geo || data.length === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const px = ((e.clientX - r.left) / r.width) * (width + 0);
      const i = Math.round(((px - 2) / (width - 4)) * (data.length - 1));
      setActive(Math.max(0, Math.min(data.length - 1, i)));
    },
    [geo, data.length, width],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!geo || data.length === 0) return;
      switch (e.key) {
        case "ArrowRight":
          setActive((p) => Math.min(data.length - 1, (p ?? -1) + 1));
          break;
        case "ArrowLeft":
          setActive((p) => (p === null || p <= 0 ? 0 : p - 1));
          break;
        case "Tab": {
          // Tab / Shift+Tab cycle the breaks as first-class stops
          if (geo.breaks.length === 0) return;
          const idxs = geo.breaks.map((b) => b.index);
          const cur = active;
          const next = e.shiftKey
            ? [...idxs].reverse().find((x) => cur === null || x < cur)
            : idxs.find((x) => cur === null || x > cur);
          if (next === undefined) return; // let focus leave at the ends
          setActive(next);
          break;
        }
        case "Home":
          setActive(0);
          break;
        case "End":
          setActive(data.length - 1);
          break;
        case "Escape":
          setActive(null);
          return;
        default:
          return;
      }
      e.preventDefault();
    },
    [geo, data.length, active],
  );

  const atBreak = active !== null && geo ? geo.breaks.find((b) => b.index === active) : undefined;
  let announced = "";
  if (active !== null && geo) {
    if (atBreak) {
      announced = strings.changePointBreak(
        atBreak.index,
        fmt(atBreak.before),
        fmt(atBreak.after),
        pct(atBreak.delta),
      );
    } else {
      const { regime, mean } = regimeOf(active);
      announced = strings.changePointAt(
        active,
        fmt(data[active] as number),
        regime,
        geo.segments.length,
        fmt(mean),
      );
    }
  }

  const px = active !== null && geo ? 2 + ((width - 4) * active) / Math.max(1, data.length - 1) : 0;
  const readout = active !== null ? fmt(data[active] as number) : "";

  return (
    <span
      className="mc-change-point-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticChangePoint
        {...rest}
        data={data}
        breaks={breaks}
        max={max}
        domain={domain}
        format={format}
        locale={locale}
        width={width}
        height={height}
        strings={strings}
        summary={false}
      >
        {active !== null && Number.isFinite(data[active]) ? (
          <line
            x1={px}
            y1={0}
            x2={px}
            y2={height}
            stroke="var(--mc-accent)"
            data-mc-w="tick"
            strokeDasharray="1.5 1.5"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticChangePoint>
      {active !== null && geo ? (
        <span
          className="mc-change-point-readout mc-spark-readout"
          style={{ left: `${(px / (width + 0)) * 100}%`, transform: "translateX(-50%)" }}
        >
          {readout}
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
