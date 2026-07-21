"use client";
// Interactive <Hypnogram>. useActivePicker owns interaction: one pointer
// listener + run-by-x lookup, ←/→ rove runs, Home/End jump, click / Enter /
// Space selects (onSelect). Composes the static component (canon) — the SVG is
// never re-implemented.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import {
  named,
  fillFor,
  useActivePicker,
  wrap,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_HYPNOGRAM } from "../../core/strings-hypnogram.js";
import { firstAppearance, hypnogramGeometry, hypnogramLabels } from "./geometry.js";
import {
  Hypnogram as StaticHypnogram,
  hypnogramSummary,
  resolveDomain,
  type HypnogramProps,
} from "./index.js";

export interface InteractiveHypnogramProps extends HypnogramProps, PickerProps {
  /**
   * Opt-in entrance motion (default `false`): the state trace wipes on when
   * the chart first mounts client-side. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function Hypnogram(props: InteractiveHypnogramProps): React.ReactNode {
  const {
    data,
    states: statesProp,
    mode = "steps",
    domain: domainProp,
    width = 140,
    height: heightProp,
    labels: labelsProp,
    strings = EN_HYPNOGRAM,
    format,
    locale,
    title,
    summary,
    animate = false,
    readout = true,
    className,
    style,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
    ...rest
  } = props as InteractiveHypnogramProps & {
    format?: Intl.NumberFormatOptions | ((n: number) => string);
    locale?: string | string[];
  };

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "wipe", animate);

  const appearance = useMemo(() => firstAppearance(data), [data]);
  const rowStates = useMemo(() => {
    if (!statesProp) return appearance;
    const extra = appearance.filter((s) => !statesProp.includes(s));
    return [...statesProp, ...extra];
  }, [statesProp, appearance]);
  const domain = useMemo(() => domainProp ?? resolveDomain(data), [domainProp, data]);
  // Mirror the static's layout EXACTLY (row-count-driven height + the row-label
  // gutter it reserves). Deriving either independently shifts every run's x by
  // the gutter, so the hit-test and the outlines drift off the rendered marks.
  const rowsN = Math.max(1, rowStates.length);
  const height = heightProp ?? Math.max(36, rowsN * 13);
  // Widest row label, in chars. Memoised away from the render path (a scrub
  // re-renders per unit crossed); the gutter itself is cheap arithmetic on top.
  const labelCh = useMemo(() => {
    let max = 1;
    for (const s of rowStates) max = Math.max(max, s.length);
    return max;
  }, [rowStates]);
  // Same drop rule as static — a mismatch would offset every run x.
  const { gutter } = hypnogramLabels({
    labels: labelsProp ?? width >= 96,
    width,
    height,
    rows: rowsN,
    maxChars: labelCh,
  });
  const geo = useMemo(
    () =>
      hypnogramGeometry({ data, states: rowStates, domain, width, height, style: mode, gutter }),
    [data, rowStates, domain, width, height, mode, gutter],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);

  const locate = useCallback(
    (x: number) => {
      const i = geo.runs.findIndex((run) => x >= run.x0 && x <= run.x1);
      return i >= 0 ? i : null;
    },
    [geo],
  );
  // Unit = RUN, not time sample: the chart merges consecutive same-state entries
  // into one span (geometry.mergeRuns), and both the pointer lookup and the
  // ←/→ keyboard nav have always addressed runs. `value` is the run's duration
  // (t1 − t0) — the only number a run encodes; `label` is its state.
  const datum = useCallback(
    (i: number) => {
      const run = geo.runs[i];
      return {
        index: i,
        value: run ? run.t1 - run.t0 : null,
        label: run?.state,
        formatted: run ? `${run.state} ${fmt(run.t0)}–${fmt(run.t1)}` : undefined,
      };
    },
    [geo, fmt],
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
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : hypnogramSummary(data, rowStates, domain, strings);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const outline = (i: number, pinned: boolean) => {
    const run = geo.runs[i];
    if (!run) return null;
    return (
      <rect
        x={run.x0 - 0.5}
        y={0.5}
        width={Math.max(1, run.x1 - run.x0) + 1}
        height={height - 1}
        fill="none"
        stroke="var(--mc-accent)"
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const run = shown !== null ? geo.runs[shown] : undefined;
  const announced = run ? strings.hypnogramRun(run.state, fmt(run.t0), fmt(run.t1)) : "";

  return (
    <span ref={hostRef} {...wrap("mc-hypno-live", className, style)} {...named(label)} {...bind}>
      <StaticHypnogram
        {...rest}
        data={data}
        states={statesProp}
        mode={mode}
        style={fillFor(style)}
        width={width}
        height={heightProp}
        labels={labelsProp}
        domain={domain}
        strings={strings}
        summary={false}
      >
        {selected !== null && selected !== active ? outline(selected, true) : null}
        {active !== null ? outline(active, false) : null}
        {rest.children}
      </StaticHypnogram>
      <LiveRegion>{announced}</LiveRegion>
      {readout && run ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${((run.x0 + run.x1) / 2 / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {`${run.state} ${fmt(run.t0)}–${fmt(run.t1)}`}
        </span>
      ) : null}
    </span>
  );
}
