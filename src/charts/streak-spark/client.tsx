"use client";
// Interactive <StreakSpark>. useActivePicker owns interaction: ONE pointer
// listener + nearest-run-by-x, ←/→ rove runs, click / Enter / Space selects
// (onSelect). COMPOSES the static entry (component canon): the static renders
// the run bars, triangle tick and count labels; the client only overlays a
// transient focus outline, a persistent pin and a readout — the SVG is never
// re-implemented here.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import {
  named,
  fillFor,
  useActivePicker,
  wrap,
  type PickerProps,
} from "../../shared/interactive.js";
import { EN_STREAK_SPARK } from "../../core/strings-streak-spark.js";
import { streakSparkGeometry, streakSparkRoom } from "./geometry.js";
import {
  StreakSpark as StaticStreakSpark,
  streakSparkSummary,
  type StreakSparkProps,
} from "./index.js";

export interface InteractiveStreakSparkProps extends StreakSparkProps, PickerProps {
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
    animate = false,
    className,
    style,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
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
  // `labelRoom` is NOT optional here: it moves the midline the runs centre on,
  // so omitting it placed every run a band too high in this entry's copy of the
  // geometry — the focus outline was drawn off its bar. Same input as the
  // static (`streakSparkRoom`), so both entries place runs identically.
  const geo = useMemo(
    () =>
      streakSparkGeometry(data, {
        width,
        height,
        threshold,
        positive,
        labelRoom: streakSparkRoom(height, label),
      }),
    [data, width, height, threshold, positive, label],
  );

  // nearest run by x-distance to its centre in viewBox space — never a DOM node
  // per run. The navigable unit is the RUN; its index is the run position.
  const locate = useCallback(
    (x: number) => {
      if (geo.runs.length === 0) return null;
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i < geo.runs.length; i++) {
        const run = geo.runs[i]!;
        const d = Math.abs(run.x + run.width / 2 - x);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      }
      return best;
    },
    [geo],
  );

  // datum index = RUN index; value = run length; label = the run's outcome word.
  const datum = useCallback(
    (i: number) => {
      const run = geo.runs[i];
      return {
        index: i,
        value: run?.len ?? null,
        label: run ? (run.on ? strings.streakWords[0] : strings.streakWords[1]) : undefined,
      };
    },
    [geo, strings],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo.runs.length,
    width,
    height,
    locate,
    datum,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
  });

  const accName =
    summary === false ? undefined : (summary ?? streakSparkSummary(geo, strings, fmt));

  // Focus outline over the roved run — the static keeps the run's own valence
  // colour; this reads as "measuring", not a recolor.
  const outline = (i: number, pinned: boolean) => {
    const run = geo.runs[i];
    if (!run) return null;
    return (
      <rect
        x={run.x}
        y={run.y}
        width={run.width}
        height={run.height}
        fill="none"
        stroke="var(--mc-accent)"
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
        shapeRendering="crispEdges"
      />
    );
  };

  const shown = active ?? selected;
  const shownRun = shown !== null ? geo.runs[shown] : undefined;
  const word = shownRun ? (shownRun.on ? strings.streakWords[0] : strings.streakWords[1]) : "";
  const announced = shownRun
    ? strings.streakAt(
        shownRun.index + 1,
        geo.runs.length,
        fmt(shownRun.len),
        word,
        shownRun.record ? strings.streakRecord : "",
      )
    : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-streak-interactive", className, style)}
      {...named([title, accName].filter(Boolean).join(". ") || undefined)}
      {...bind}
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
        style={fillFor(style)}
      >
        {children}
        {selected !== null && selected !== active ? outline(selected, true) : null}
        {active !== null ? outline(active, false) : null}
      </StaticStreakSpark>
      <LiveRegion>{announced}</LiveRegion>
      {shownRun ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${((shownRun.x + shownRun.width / 2) / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {`${fmt(shownRun.len)} ${word}${shownRun.record ? strings.streakRecord : ""}`}
        </span>
      ) : null}
    </span>
  );
}
