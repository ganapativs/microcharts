"use client";
// Interactive <RugStrip>. One pointer listener; nearest tick by
// binary search over the sorted positions. ←/→ step through the SORTED
// observations ("5.2 — 19th of 38."). Composes the static component (canon).
import { useCallback, useMemo, useRef, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { EN_DIST, type DistStrings } from "../../core/strings-dist.js";
import { rugGeometry } from "./geometry.js";
import { RugStrip as StaticRugStrip, rugSummary, type RugStripProps } from "./index.js";

export interface InteractiveRugStripProps extends RugStripProps {
  strings?: DistStrings;
  /**
   * Opt-in entrance motion (default `false`): the tiers of ticks fade onto the
   * strip on first client-side mount. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

/** Index of the tick nearest to `pos` (ticks sorted by value ⇒ by pos). */
function nearestTick(ticks: readonly { pos: number }[], pos: number): number {
  let lo = 0;
  let hi = ticks.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (ticks[mid]!.pos < pos) lo = mid + 1;
    else hi = mid;
  }
  if (lo > 0 && Math.abs(ticks[lo - 1]!.pos - pos) <= Math.abs(ticks[lo]!.pos - pos)) return lo - 1;
  return lo;
}

export function RugStrip(props: InteractiveRugStripProps): React.ReactNode {
  const {
    data,
    markValue,
    orientation = "horizontal",
    domain,
    format,
    locale,
    strings = EN_DIST,
    title,
    summary,
    animate = false,
    ...rest
  } = props;
  const width = props.width ?? (orientation === "horizontal" ? 60 : 10);
  const height = props.height ?? (orientation === "horizontal" ? 10 : 60);
  const length = orientation === "horizontal" ? width : height;

  const hostRef = useRef<HTMLSpanElement>(null);
  // Ticks are merged per-opacity-tier paths, not discrete per-observation
  // elements — settle's scale would shift tick x-positions non-uniformly
  // within a tier, so reveal (fade-only) is used instead.
  useEntrance(hostRef, "wipe", animate);

  const geo = useMemo(
    () =>
      rugGeometry({
        length,
        thickness: orientation === "horizontal" ? height : width,
        values: data,
        domain,
        markValue,
        orientation,
      }),
    [length, width, height, data, domain, markValue, orientation],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const [active, setActive] = useState<number | null>(null);

  const auto = rugSummary(geo.ticks, fmt, strings);
  const accName = summary === false ? undefined : typeof summary === "string" ? summary : auto;
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (geo.ticks.length === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const pos =
        orientation === "horizontal"
          ? ((e.clientX - r.left) / r.width) * length
          : ((e.clientY - r.top) / r.height) * length;
      setActive(nearestTick(geo.ticks, pos));
    },
    [geo, orientation, length],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (geo.ticks.length === 0) return;
      const cur = active ?? 0;
      let next = cur;
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          next = Math.min(geo.ticks.length - 1, cur + 1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          next = Math.max(0, cur - 1);
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = geo.ticks.length - 1;
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

  const activeTick = active !== null ? geo.ticks[active] : undefined;
  const announced = activeTick
    ? strings.observation(fmt(activeTick.value), (active ?? 0) + 1, geo.ticks.length)
    : "";

  return (
    <span
      ref={hostRef}
      className="mc-rug-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticRugStrip
        {...rest}
        data={data}
        markValue={markValue}
        orientation={orientation}
        domain={domain}
        format={format}
        locale={locale}
        strings={strings}
        width={width}
        height={height}
        summary={false}
      >
        {activeTick ? (
          orientation === "horizontal" ? (
            <line
              x1={activeTick.pos}
              y1={0}
              x2={activeTick.pos}
              y2={height}
              data-mc-ink="accent"
              data-mc-w="full"
              vectorEffect="non-scaling-stroke"
            />
          ) : (
            <line
              x1={0}
              y1={activeTick.pos}
              x2={width}
              y2={activeTick.pos}
              data-mc-ink="accent"
              data-mc-w="full"
              vectorEffect="non-scaling-stroke"
            />
          )
        ) : null}
        {rest.children}
      </StaticRugStrip>
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
      {activeTick ? (
        <span
          className="mc-spark-readout"
          style={
            orientation === "horizontal"
              ? { left: `${(activeTick.pos / width) * 100}%`, transform: "translateX(-50%)" }
              : {
                  left: "100%",
                  top: `${(activeTick.pos / height) * 100}%`,
                  bottom: "auto",
                  transform: "translateY(-50%)",
                  marginLeft: "0.3em",
                }
          }
        >
          {fmt(activeTick.value)}
        </span>
      ) : null}
    </span>
  );
}
