"use client";
// Interactive <StreakSpark> (plan/26 §2, plan/08 T2). ←/→ roves runs with a
// polite readout; the pointer picks the nearest run by x. COMPOSES the static
// entry (component canon): the static renders the run bars, triangle tick and
// count labels; the client only overlays a focus outline + readout and owns
// interaction — the SVG is never re-implemented here.
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { makeFormatter } from "../../core/format.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { EN_STREAK_SPARK } from "../../core/strings-streak-spark.js";
import { streakSparkGeometry } from "./geometry.js";
import {
  StreakSpark as StaticStreakSpark,
  streakSparkSummary,
  type StreakSparkProps,
} from "./index.js";

// The SVG fills the focusable wrapper so its box coincides with the wrapper's —
// the %-positioned readout maps 1:1 and the chart scales fluidly.
const FILL: CSSProperties = { display: "block", width: "100%", height: "auto" };

export interface InteractiveStreakSparkProps extends StreakSparkProps {
  onRunFocus?: (index: number | null) => void;
  /**
   * Opt-in entrance motion (default `false`): the run segments fade onto the
   * strip on first client-side mount. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function StreakSpark(props: InteractiveStreakSparkProps): React.ReactNode {
  const {
    data,
    threshold,
    positive = "up",
    label = "current",
    width = 96,
    height = 20,
    color,
    title,
    summary,
    format,
    locale,
    strings = EN_STREAK_SPARK,
    onRunFocus,
    className,
    style,
    animate = false,
    children,
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  // Runs are fixed-height typed segments tiled like a cell strip (their
  // height encodes run TYPE, not a baseline-anchored value) — not point
  // markers or value bars, so reveal (fade-only, staggered) matches
  // ActivityGrid's cell-grid archetype better than settle's scale, which
  // would distort the variable-width rects.
  useEntrance(hostRef, "reveal", animate, {
    selector:
      '[data-mc-ink="accent"], [data-mc-ink="positive"], [data-mc-ink="negative"], [data-mc-ink="point"]',
  });

  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const geo = useMemo(
    () => streakSparkGeometry(data, { width, height, threshold, positive }),
    [data, width, height, threshold, positive],
  );

  const [active, setActive] = useState<number | null>(null);
  const move = useCallback(
    (next: number | null) => {
      setActive(next);
      onRunFocus?.(next);
    },
    [onRunFocus],
  );

  // ONE listener; nearest run by x distance to its centre in viewBox space —
  // never a DOM node per run (plan/03 §6).
  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (geo.runs.length === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const x = ((e.clientX - r.left) / r.width) * width;
      let best = geo.runs[0]!.index;
      let bestDist = Infinity;
      for (const run of geo.runs) {
        const d = Math.abs(run.x + run.width / 2 - x);
        if (d < bestDist) {
          bestDist = d;
          best = run.index;
        }
      }
      if (best !== active) move(best);
    },
    [geo, width, active, move],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const n = geo.runs.length;
      if (n === 0) return;
      const pos = active ?? -1;
      let target = pos;
      switch (e.key) {
        case "ArrowRight":
          target = Math.min(n - 1, pos + 1);
          break;
        case "ArrowLeft":
          target = pos <= 0 ? 0 : pos - 1;
          break;
        case "Home":
          target = 0;
          break;
        case "End":
          target = n - 1;
          break;
        case "Escape":
          move(null);
          return;
        default:
          return;
      }
      e.preventDefault();
      move(target);
    },
    [active, geo, move],
  );

  const accName =
    summary === false ? undefined : (summary ?? streakSparkSummary(geo, strings, fmt));
  const activeRun = active !== null ? geo.runs.find((r) => r.index === active) : undefined;
  const word = activeRun ? (activeRun.on ? strings.streakWords[0] : strings.streakWords[1]) : "";
  const announced = activeRun
    ? strings.streakAt(
        activeRun.index + 1,
        geo.runs.length,
        fmt(activeRun.len),
        word,
        activeRun.record ? strings.streakRecord : "",
      )
    : "";

  const wrapStyle: CSSProperties = {
    display: "inline-block",
    position: "relative",
    lineHeight: 0,
    ...style,
  };

  return (
    <span
      ref={hostRef}
      className={className ? `mc-streak-interactive ${className}` : "mc-streak-interactive"}
      style={wrapStyle}
      tabIndex={0}
      role="img"
      aria-label={[title, accName].filter(Boolean).join(". ") || undefined}
      onKeyDown={onKeyDown}
      onPointerMove={onPointerMove}
      onPointerLeave={() => move(null)}
      onBlur={() => move(null)}
    >
      <StaticStreakSpark
        data={data}
        threshold={threshold}
        positive={positive}
        label={label}
        width={width}
        height={height}
        color={color}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        style={FILL}
      >
        {children}
        {activeRun ? (
          // focus outline over the roved run — the static keeps the run's own
          // valence colour; this reads as "measuring", not a recolor.
          <rect
            x={activeRun.x}
            y={activeRun.y}
            width={activeRun.width}
            height={activeRun.height}
            fill="none"
            stroke="var(--mc-accent)"
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
            shapeRendering="crispEdges"
          />
        ) : null}
      </StaticStreakSpark>
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
      {activeRun ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${((activeRun.x + activeRun.width / 2) / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {`${fmt(activeRun.len)} ${word}`}
        </span>
      ) : null}
    </span>
  );
}
