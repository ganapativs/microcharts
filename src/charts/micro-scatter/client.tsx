"use client";
// Interactive <MicroScatter>. useActivePicker owns interaction: one pointer
// listener + nearest-point-by-squared-Euclidean-distance math, ←/→ (and ↑/↓)
// stepping points ordered by x, click / Enter / Space selects (onSelect).
// Composes the static component (canon) — the SVG is never re-implemented.
//
// Unit = a plotted dot, so `datum.index` is the DOT POSITION in the projected
// cloud — identical to the data index whenever every pair is finite (non-finite
// pairs are dropped by the geometry). `value` is the y channel; the x reading
// travels as `label`.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter, type Format } from "../../core/format.js";
import {
  named,
  fillFor,
  navOrder,
  useActivePicker,
  wrap,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_SERIES, type SeriesStrings } from "../../core/summary.js";
import { EN_SCATTER, type ScatterStrings } from "../../core/strings-scatter.js";
import { microScatterGeometry } from "./geometry.js";
import {
  MicroScatter as StaticMicroScatter,
  microScatterSummary,
  type MicroScatterProps,
} from "./index.js";

export interface InteractiveMicroScatterProps extends MicroScatterProps, PickerProps {
  strings?: ScatterStrings;
  /** Point announcement templates (shared point wording). */
  seriesStrings?: SeriesStrings;
  /**
   * Number format/locale for the hover/focus readout. Interactive-only: the
   * static entry renders dots and a trend line, never a number.
   */
  format?: Format;
  locale?: string | string[];
  /**
   * Opt-in entrance motion (default `false`): the dots settle onto the plot
   * on first client-side mount. Inert on the server and on hydrated server
   * HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
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
    animate = false,
    className,
    style,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
    ...rest
  } = props;
  const rad = Math.min(3, Math.max(1, props.r ?? 1.5));

  const hostRef = useRef<HTMLSpanElement>(null);
  // Dots settle onto the plot (the story). With `trend`, the least-squares line
  // is a summary OF those dots, so it should arrive AFTER them, not ride the
  // quiet stage ahead: `defer` casts it into the closing act. (No-op when trend
  // is off — its default — since no trend line exists.)
  // The cloud draws itself across the x-axis (dots settle left→right), then the
  // least-squares line DRAWS through it — the trend emerges from the points.
  useEntrance(hostRef, "settle", animate, {
    selector: "circle",
    order: "x",
    link: '[data-mc-ink="muted"]',
  });

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

  /** Dots ordered by x for ←/→ stepping. */
  const order = useMemo(() => {
    const idx = geo.dots.map((d, i) => ({ i, x: d.x }));
    idx.sort((a, b) => a.x - b.x);
    return idx.map((e) => e.i);
  }, [geo]);

  const locate = useCallback(
    (x: number, y: number) => {
      if (geo.dots.length === 0) return null;
      let best = 0;
      let bestDist = Infinity;
      geo.dots.forEach((d, i) => {
        const dist = (d.x - x) ** 2 + (d.y - y) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      return best;
    },
    [geo],
  );

  // 1-D roving in x-order (not dot order): step in position space, then map back.
  const step = useCallback((cur: number, key: string) => navOrder(order, cur, key), [order]);

  const datum = useCallback(
    (i: number) => {
      const p = geo.dots[i] ? data[geo.dots[i]!.index] : undefined;
      return { index: i, value: p?.y ?? null, label: p ? fmt(p.x) : undefined };
    },
    [geo, data, fmt],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo.dots.length,
    width,
    height,
    locate,
    datum,
    step,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
  });

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : microScatterSummary(geo.dots.length, geo.r, strings);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const ring = (i: number, pinned: boolean) => {
    const d = geo.dots[i];
    if (!d) return null;
    return (
      <circle
        cx={d.x}
        cy={d.y}
        r={rad + 1.25}
        fill="none"
        stroke="var(--mc-accent)"
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const shownDot = shown !== null ? geo.dots[shown] : undefined;
  const shownPoint = shownDot ? data[shownDot.index] : undefined;
  const announced =
    shownDot && shownPoint
      ? seriesStrings.point(
          order.indexOf(shown!) + 1,
          geo.dots.length,
          `${fmt(shownPoint.x)}, ${fmt(shownPoint.y)}`,
        )
      : "";

  return (
    <span ref={hostRef} {...wrap("mc-scatter-live", className, style)} {...named(label)} {...bind}>
      <StaticMicroScatter
        {...rest}
        style={fillFor(style)}
        data={data}
        trend={trend}
        xDomain={xDomain}
        domain={domain}
        width={width}
        height={height}
        strings={strings}
        summary={false}
      >
        {/* Pinned selection persists through pointer-leave; focus ring is transient. */}
        {selected !== null && selected !== active ? ring(selected, true) : null}
        {active !== null ? ring(active, false) : null}
        {rest.children}
      </StaticMicroScatter>
      <LiveRegion>{announced}</LiveRegion>
      {shownDot && shownPoint ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${(shownDot.x / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {`${fmt(shownPoint.x)}, ${fmt(shownPoint.y)}`}
        </span>
      ) : null}
    </span>
  );
}
