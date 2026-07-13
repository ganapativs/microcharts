"use client";
// Interactive <ParetoStrip>. One pointer listener + grid lookup
// (pointer x → bar). ←/→ step bars, T jumps to the threshold-crossing bar. The
// live region states each bar's share + cumulative. Composes the static
// component (canon); the crosshair + readout chip are overlay children.
import { useCallback, useMemo, useRef, useState, type PointerEvent } from "react";
import { EN_PARETO, type ParetoStrings } from "../../core/strings-pareto.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { paretoGeometry } from "./geometry.js";
import { ParetoStrip as StaticParetoStrip, paretoSummary, type ParetoStripProps } from "./index.js";

export interface InteractiveParetoStripProps extends ParetoStripProps {
  strings?: ParetoStrings;
  /**
   * Opt-in entrance motion (default `false`): bars rise from the baseline,
   * left to right, on first client-side mount, and the cumulative-share line
   * fades in once the bars have mostly landed. Inert on the server and on
   * hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

const pct = (frac: number): string => `${Math.round(frac * 100)}%`;

export function ParetoStrip(props: InteractiveParetoStripProps): React.ReactNode {
  const {
    data,
    threshold = 80,
    max = 8,
    unit = "causes",
    metric = "the total",
    width = 80,
    height = 20,
    strings = EN_PARETO,
    title,
    summary,
    animate = false,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  // The cumulative line carries "muted" ink, not data/accent, so it's not a
  // bar-rise candidate — it's excluded from the selector below (rects only)
  // Three acts: the bars cascade left→right (story) and the cumulative line
  // is deferred to the closing act — it arrives as the last bar lands, the
  // conclusion drawn over the evidence.
  useEntrance(hostRef, "rise", animate, {
    selector: 'rect[data-mc-ink="accent"], rect[data-mc-ink="neutral"], rect[data-mc-ink="bar"]',
    order: "x",
    defer: 'path[data-mc-ink="muted"]',
  });

  const geo = useMemo(
    () => paretoGeometry({ width, height, data, threshold, max }),
    [width, height, data, threshold, max],
  );
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : geo === null
          ? strings.noData
          : paretoSummary(geo, { unit, metric }, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const count = geo?.bars.length ?? 0;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (!geo || count === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const px = ((e.clientX - r.left) / r.width) * geo.totalWidth;
      let best = 0;
      let bestDist = Infinity;
      geo.bars.forEach((b, i) => {
        const d = Math.abs(b.x + b.width / 2 - px);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setActive(best);
    },
    [geo, count],
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
        case "t":
        case "T":
          if (geo?.crossing) setActive(geo.crossing.index);
          break;
        case "Escape":
          setActive(null);
          return;
        default:
          return;
      }
      e.preventDefault();
    },
    [count, geo],
  );

  const b = active !== null && geo ? geo.bars[active] : undefined;
  const announced = b ? strings.paretoAt(b.label, pct(b.share), pct(b.cum)) : "";

  return (
    <span
      ref={hostRef}
      className="mc-pareto-strip-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticParetoStrip
        {...rest}
        data={data}
        threshold={threshold}
        max={max}
        unit={unit}
        metric={metric}
        width={width}
        height={height}
        strings={strings}
        summary={false}
      >
        {b ? (
          <rect
            x={b.x - 0.6}
            y={0.5}
            width={b.width + 1.2}
            height={height - 1}
            fill="none"
            stroke="var(--mc-accent)"
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticParetoStrip>
      {b && geo ? (
        <span
          className="mc-pareto-readout mc-spark-readout"
          style={{
            left: `${((b.x + b.width / 2) / geo.totalWidth) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {`${pct(b.share)} · ${pct(b.cum)}`}
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
