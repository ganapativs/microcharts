"use client";
// Interactive <SparkBar>. Keyboard + pointer bar
// navigation with a polite live readout, roving focus on an HTML overlay.
// COMPOSES the static entry (component canon): the static renders the bars,
// colors, endpoint label AND annotation children — the client only overlays a
// focus outline + readout and owns interaction. Re-implementing the SVG here
// used to mis-color win-loss ties and drop annotations/labels.
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { makeFormatter } from "../../core/format.js";
import { describeSeries } from "../../core/summary.js";
import { isFiniteValue } from "../../core/types.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { labelMetrics, sparkBarGeometry } from "./geometry.js";
import { SparkBar as StaticSparkBar, type SparkBarProps } from "./index.js";

// Bars carry valence tokens (bar/accent/positive/negative), not just "bar" —
// the default `rise` selector only matches "bar", so every ink role is listed.
const BAR_SELECTOR =
  'rect[data-mc-ink="bar"], rect[data-mc-ink="accent"], rect[data-mc-ink="positive"], rect[data-mc-ink="negative"]';

// The SVG fills the focusable wrapper so its box coincides with the wrapper's —
// the %-positioned hit zones + readout map 1:1 and the chart scales fluidly.
const FILL: CSSProperties = { display: "block", width: "100%", height: "auto" };

export interface InteractiveSparkBarProps extends SparkBarProps {
  onPointFocus?: (index: number | null) => void;
  /**
   * Opt-in entrance motion (default `false`): the bars rise from the baseline
   * when the chart first mounts client-side. Inert on the server and on
   * hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function SparkBar(props: InteractiveSparkBarProps): React.ReactNode {
  const {
    data,
    domain,
    width = 80,
    height = 20,
    mode = "bar",
    gap = 0.25,
    label = "none",
    color,
    title,
    summary,
    format,
    locale,
    onPointFocus,
    animate = false,
    className,
    style,
    children,
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "rise", animate, { selector: BAR_SELECTOR, origin: "signed" });

  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);

  // Geometry must match the static entry EXACTLY (same right gutter when
  // label="last" shifts the bars), so the overlay + pointer math never drift.
  const geo = useMemo(() => {
    let labelText: string | undefined;
    if (label === "last" && mode === "bar") {
      for (let i = data.length - 1; i >= 0; i--) {
        const v = data[i];
        if (isFiniteValue(v)) {
          labelText = fmt(v);
          break;
        }
      }
    }
    const metrics = labelText !== undefined ? labelMetrics(labelText, width, height) : undefined;
    return sparkBarGeometry(data, {
      width,
      height,
      mode,
      domain,
      gap,
      gutterRight: metrics?.gutter ?? 0,
    });
  }, [data, width, height, mode, domain, gap, label, fmt]);

  const stops = useMemo(() => geo.bars.map((b) => b.index), [geo]);
  const [active, setActive] = useState<number | null>(null);

  const move = useCallback(
    (next: number | null) => {
      setActive(next);
      onPointFocus?.(next);
    },
    [onPointFocus],
  );

  // ONE listener; nearest bar by x distance to its centre in viewBox space —
  // never a DOM node per bar. Gaps snap to the closest bar.
  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (geo.bars.length === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const x = ((e.clientX - r.left) / r.width) * width;
      let best = geo.bars[0]!.index;
      let bestDist = Infinity;
      for (const b of geo.bars) {
        const d = Math.abs(b.x + b.width / 2 - x);
        if (d < bestDist) {
          bestDist = d;
          best = b.index;
        }
      }
      if (best !== active) move(best);
    },
    [geo, width, active, move],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (stops.length === 0) return;
      const pos = active === null ? -1 : stops.indexOf(active);
      let target = pos;
      switch (e.key) {
        case "ArrowRight":
          target = Math.min(stops.length - 1, pos + 1);
          break;
        case "ArrowLeft":
          target = pos <= 0 ? 0 : pos - 1;
          break;
        case "Home":
          target = 0;
          break;
        case "End":
          target = stops.length - 1;
          break;
        case "Escape":
          move(null);
          return;
        default:
          return;
      }
      e.preventDefault();
      move(stops[target]!);
    },
    [active, stops, move],
  );

  const accName =
    summary === false ? undefined : (summary ?? describeSeries(data, { format, locale }));
  const activeBar = active !== null ? geo.bars.find((b) => b.index === active) : undefined;
  const activeValue = activeBar && isFiniteValue(activeBar.value) ? activeBar.value : null;

  const wrapStyle: CSSProperties = {
    display: "inline-block",
    position: "relative",
    lineHeight: 0,
    ...style,
  };

  return (
    <span
      ref={hostRef}
      className={className ? `mc-sparkbar-interactive ${className}` : "mc-sparkbar-interactive"}
      style={wrapStyle}
      tabIndex={0}
      role="img"
      aria-label={[title, accName].filter(Boolean).join(". ") || undefined}
      onKeyDown={onKeyDown}
      onPointerMove={onPointerMove}
      onPointerLeave={() => move(null)}
      onBlur={() => move(null)}
    >
      <StaticSparkBar
        data={data}
        domain={domain}
        width={width}
        height={height}
        mode={mode}
        gap={gap}
        label={label}
        color={color}
        format={format}
        locale={locale}
        summary={false}
        style={FILL}
      >
        {children}
        {activeBar ? (
          // focus outline over the hovered/roved bar — the static keeps the bar's
          // own valence color; this reads as "measuring", not a recolor.
          <rect
            x={activeBar.x}
            y={activeBar.y}
            width={activeBar.width}
            height={activeBar.height}
            fill="none"
            stroke="var(--mc-accent)"
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
            shapeRendering="crispEdges"
          />
        ) : null}
      </StaticSparkBar>
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
        {activeValue !== null ? `Bar ${active! + 1}: ${fmt(activeValue)}` : ""}
      </span>
      {activeBar && activeValue !== null ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${((activeBar.x + activeBar.width / 2) / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {fmt(activeValue)}
        </span>
      ) : null}
    </span>
  );
}
