"use client";
// Interactive <StreakSpark>. ←/→ roves runs with a
// polite readout; the pointer picks the nearest run by x. COMPOSES the static
// entry (component canon): the static renders the run bars, triangle tick and
// count labels; the client only overlays a focus outline + readout and owns
// interaction — the SVG is never re-implemented here.
import { useCallback, useMemo, useRef, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { FILL, wrap } from "../../shared/interactive.js";
import { EN_STREAK_SPARK } from "../../core/strings-streak-spark.js";
import { streakSparkGeometry } from "./geometry.js";
import {
  StreakSpark as StaticStreakSpark,
  streakSparkSummary,
  type StreakSparkProps,
} from "./index.js";

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
  // Runs are individual fixed-height typed segments (height encodes run TYPE,
  // not a value), so settle's scale would distort the variable-width rects and
  // a wipe would slice a run mid-width. An opacity `reveal` ordered by x lights
  // each whole run in turn, oldest→current, ending on the accent bar — the
  // streak visibly plays out along the time axis.
  useEntrance(hostRef, "reveal", animate, { selector: "rect", order: "x" });

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
  // never a DOM node per run.
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

  return (
    <span
      ref={hostRef}
      {...wrap("mc-streak-interactive", className, style)}
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
      <LiveRegion>{announced}</LiveRegion>
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
