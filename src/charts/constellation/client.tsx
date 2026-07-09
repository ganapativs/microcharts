"use client";
// Interactive <Constellation> (plan/24 #16). One pointer listener; nearest event
// by squared 2-D distance over the precomputed stars. ←/→ step chronologically.
// Focus ring on the active event; readout names the time, value, and magnitude.
// Composes the static component (canon). Vertical jitter (value-less data) stays
// layout-only — the readout never presents it as data.
import { useCallback, useMemo, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { EN_CONSTELLATION, type ConstellationStrings } from "../../core/strings-constellation.js";
import { constellationGeometry } from "./geometry.js";
import {
  Constellation as StaticConstellation,
  constellationSummary,
  type ConstellationProps,
} from "./index.js";

export interface InteractiveConstellationProps extends ConstellationProps {
  strings?: ConstellationStrings;
}

export function Constellation(props: InteractiveConstellationProps): React.ReactNode {
  const {
    data,
    connect = true,
    domain,
    xDomain,
    xFormat,
    width = 60,
    height = 20,
    rBase = 1.6,
    format,
    locale,
    strings = EN_CONSTELLATION,
    title,
    summary,
    ...rest
  } = props;

  const geo = useMemo(
    () =>
      constellationGeometry({
        points: data,
        width,
        height,
        domain,
        xDomain,
        connect,
        rBase,
        pad: 1,
      }),
    [data, width, height, domain, xDomain, connect, rBase],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const xFmt = useCallback((x: number) => (xFormat ? xFormat(x) : fmt(x)), [xFormat, fmt]);
  const [active, setActive] = useState<number | null>(null); // index into geo.stars

  /** Stars ordered by time for ←/→ stepping. */
  const order = useMemo(() => {
    const idx = geo.stars.map((s, i) => ({ i, x: s.x }));
    idx.sort((a, b) => a.x - b.x);
    return idx.map((e) => e.i);
  }, [geo]);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : constellationSummary(data, { xFormat, strings, format, locale });
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (geo.stars.length === 0) return;
      const rct = e.currentTarget.getBoundingClientRect();
      if (rct.width === 0 || rct.height === 0) return;
      const x = ((e.clientX - rct.left) / rct.width) * width;
      const y = ((e.clientY - rct.top) / rct.height) * height;
      let best = 0;
      let bestDist = Infinity;
      geo.stars.forEach((s, i) => {
        const dist = (s.cx - x) ** 2 + (s.cy - y) ** 2;
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
          next = pos <= 0 ? 0 : pos - 1;
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

  const activeStar = active !== null ? geo.stars[active] : undefined;
  // Detail = value and/or magnitude; never the jittered vertical position.
  const detail = activeStar
    ? [
        Number.isFinite(activeStar.value) ? fmt(activeStar.value) : null,
        Number.isFinite(activeStar.m) ? `magnitude ${fmt(activeStar.m)}` : null,
      ]
        .filter(Boolean)
        .join(", ") || "event"
    : "";
  const readout = activeStar ? `${xFmt(activeStar.x)}: ${detail}` : "";
  const announced = activeStar ? strings.constellationAt(xFmt(activeStar.x), detail) : "";

  return (
    <span
      className="mc-constellation-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticConstellation
        {...rest}
        data={data}
        connect={connect}
        domain={domain}
        xDomain={xDomain}
        xFormat={xFormat}
        width={width}
        height={height}
        rBase={rBase}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {activeStar ? (
          <circle
            cx={activeStar.cx}
            cy={activeStar.cy}
            r={activeStar.r + 1.5}
            fill="none"
            stroke="var(--mc-accent)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticConstellation>
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
      {activeStar ? (
        <span
          className="mc-spark-readout"
          style={{ left: `${(activeStar.cx / width) * 100}%`, transform: "translateX(-50%)" }}
        >
          {readout}
        </span>
      ) : null}
    </span>
  );
}
