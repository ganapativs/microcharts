"use client";
// Interactive <Slope> (plan/22 #13). One pointer listener; nearest line by
// vertical distance at the pointer's interpolated x (pure point-to-segment
// math over ≤ 7 lines). ↑/↓ rove categories ordered by their `to` value.
// Composes the static component (canon).
import { useCallback, useMemo, useRef, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { EN_PAIRED, type PairedStrings } from "../../core/strings-paired.js";
import { pairChange } from "../dumbbell/index.js";
import { slopeGeometry } from "./geometry.js";
import { Slope as StaticSlope, slopeSummary, type SlopeProps } from "./index.js";

export interface InteractiveSlopeProps extends SlopeProps {
  strings?: PairedStrings;
  /**
   * Opt-in entrance motion (default `false`): the lines draw on when the
   * chart first mounts client-side. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function Slope(props: InteractiveSlopeProps): React.ReactNode {
  const {
    data,
    label = "none",
    domain,
    width = 40,
    height = 40,
    format,
    locale,
    strings = EN_PAIRED,
    title,
    summary,
    animate = false,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "draw", animate, { selector: "line" });

  const fontSize = 6;
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  // interactive overlay works on the label-free frame (labels only shift
  // gutters; recompute with the same rule as the static entry)
  const geo = useMemo(
    () =>
      slopeGeometry({
        width,
        height,
        pairs: data.map((d) => ({ from: d.from, to: d.to })),
        domain,
        gutterLeftCh: 0,
        gutterRightCh: 0,
        fontSize,
      }),
    [width, height, data, domain],
  );
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : slopeSummary(data, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  /** Rows ordered by `to` (descending) for ↑/↓ roving. */
  const order = useMemo(() => {
    const idx = data.map((d, i) => ({ i, to: Number.isFinite(d.to) ? d.to : -Infinity }));
    idx.sort((a, b) => b.to - a.to);
    return idx.map((e) => e.i);
  }, [data]);

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (geo.lines.length === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const x = ((e.clientX - r.left) / r.width) * width;
      const y = ((e.clientY - r.top) / r.height) * height;
      const t = Math.min(1, Math.max(0, (x - geo.colX0) / Math.max(1, geo.colX1 - geo.colX0)));
      let best: number | null = null;
      let bestDist = Infinity;
      for (const line of geo.lines) {
        if (line.y0 === null || line.y1 === null) continue;
        const yAt = line.y0 + (line.y1 - line.y0) * t;
        const dist = Math.abs(yAt - y);
        if (dist < bestDist) {
          bestDist = dist;
          best = line.index;
        }
      }
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
        case "ArrowDown":
          next = Math.min(order.length - 1, pos + 1);
          break;
        case "ArrowUp":
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

  const activeDatum = active !== null ? data[active] : undefined;
  const activeLine = active !== null ? geo.lines.find((l) => l.index === active) : undefined;
  const announced = (() => {
    if (!activeDatum) return "";
    const okFrom = Number.isFinite(activeDatum.from);
    const okTo = Number.isFinite(activeDatum.to);
    if (okFrom && okTo) {
      const c = pairChange(activeDatum.from, activeDatum.to);
      return c
        ? strings.slopeAt(
            activeDatum.label,
            fmt(activeDatum.from),
            fmt(activeDatum.to),
            c.dir,
            c.pct,
          )
        : strings.flatPair(fmt(activeDatum.from));
    }
    if (okFrom || okTo) {
      return strings.slopeIncomplete(
        activeDatum.label,
        fmt(okFrom ? activeDatum.from : activeDatum.to),
      );
    }
    return `${activeDatum.label}: ${strings.noData}`;
  })();

  return (
    <span
      ref={hostRef}
      className="mc-slope-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticSlope
        {...rest}
        data={data}
        label={label}
        domain={domain}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        highlight={active ?? rest.highlight}
      />
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
      {activeDatum && activeLine ? (
        <span className="mc-spark-readout" style={{ left: "50%", transform: "translateX(-50%)" }}>
          {Number.isFinite(activeDatum.from) && Number.isFinite(activeDatum.to)
            ? `${activeDatum.label}: ${fmt(activeDatum.from)} → ${fmt(activeDatum.to)}`
            : activeDatum.label}
        </span>
      ) : null}
    </span>
  );
}
