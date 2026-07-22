"use client";
// Interactive <GradeProfile>. useActivePicker owns interaction: one pointer
// listener maps x → the segment under the cursor, ←/→ step segments, click /
// Enter / Space selects (onSelect). Each unit announces the distance, grade,
// and cumulative climb — the readout gives the TRUE grade, not the bin.
// Composes the static component (canon) — the SVG is never re-implemented.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import {
  named,
  fillFor,
  useActivePicker,
  wrap,
  crosshairReadoutStyle,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_GRADE_PROFILE } from "../../core/strings-grade-profile.js";
import { gradeLayout, gradeProfileGeometry } from "./geometry.js";
import {
  GradeProfile as StaticGradeProfile,
  gradePercent,
  gradeProfileSummary,
  type GradeProfileProps,
} from "./index.js";

const DEFAULT_BINS = [3, 6, 10] as const;

// Segments quantize into 4 grade bins; bin 1 ("moderate") carries no ink
// attribute at all (only data-mc-cat="1"), so every bin needs a term. The
// ridge line (ink="data") is excluded — scaling a winding profile line via
// scaleY would squash it; it simply fades in with the base svg opacity.
const SEGMENT_SELECTOR =
  'path[data-mc-ink="band"], path[data-mc-ink="negative"], path[data-mc-ink="bar"], path[data-mc-cat="1"]';

export interface InteractiveGradeProfileProps extends GradeProfileProps, PickerProps {
  /**
   * Opt-in entrance motion (default `false`): the baseline-anchored terrain
   * segments rise into place when the chart first mounts client-side. Inert
   * on the server and on hydrated server HTML; `prefers-reduced-motion`
   * always wins.
   */
  animate?: boolean;
}

export function GradeProfile(props: InteractiveGradeProfileProps): React.ReactNode {
  const {
    data,
    bins = DEFAULT_BINS,
    label = "max",
    width = 120,
    height = 40,
    format,
    locale,
    strings = EN_GRADE_PROFILE,
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
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  // The terrain builds along the route, left→right, re-enacting the traverse
  // rather than rising all at once. (The ridge line stays context; a single
  // entrance can't both rise the terrain and draw the ridge.)
  useEntrance(hostRef, "rise", animate, {
    selector: SEGMENT_SELECTOR,
    order: "x",
    window: 450,
  });

  const { topPad } = gradeLayout(height, label);
  const geo = useMemo(
    () => gradeProfileGeometry({ data, width, height, bins, topPad }),
    [data, width, height, bins, topPad],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const pct = useMemo(() => gradePercent(locale), [locale]);

  // index = SEGMENT index (the span between two consecutive plotted points);
  // non-finite / non-monotone pairs drop out as gaps, so this is a unit
  // position, not an index into `data`.
  const locate = useCallback(
    (x: number) => {
      const segs = geo.segments;
      if (segs.length === 0) return null;
      // Nearest by gap, not by containment: the segments do NOT tile the width —
      // a non-finite or non-monotone pair leaves a real hole — so a containment
      // miss must resolve to the closest neighbour, never to the last segment.
      let best = 0;
      let bestD = Infinity;
      segs.forEach((s, i) => {
        const d = x < s.x0 ? s.x0 - x : x > s.x1 ? x - s.x1 : 0;
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      return best;
    },
    [geo],
  );
  const datum = useCallback(
    (i: number) => {
      const s = geo.segments[i];
      return {
        index: i,
        value: s?.grade ?? null,
        formatted: s ? `${fmt(s.dEnd)}: ${pct(s.grade)}, ${fmt(s.cumGain)} gained` : undefined,
      };
    },
    [geo, fmt, pct],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo.segments.length,
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
        : gradeProfileSummary(geo, strings, fmt, pct);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const chord = (i: number, pinned: boolean) => {
    const s = geo.segments[i];
    if (!s) return null;
    return (
      <>
        <line
          x1={s.x0}
          y1={s.y0}
          x2={s.x1}
          y2={s.y1}
          data-mc-ink="accent"
          data-mc-w={pinned ? "tick" : "full"}
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={s.x1} cy={s.y1} r={1.75} data-mc-ink="accent" />
      </>
    );
  };

  const shown = active ?? selected;
  const seg = shown !== null ? geo.segments[shown] : undefined;
  const announced = seg
    ? strings.gradeProfileAt(fmt(seg.dEnd), pct(seg.grade), fmt(seg.cumGain))
    : "";
  const midX = seg ? (seg.x0 + seg.x1) / 2 : 0;

  return (
    <span
      ref={hostRef}
      {...wrap("mc-grade-live", className, style)}
      {...named(ariaLabel)}
      {...bind}
    >
      <StaticGradeProfile
        {...rest}
        data={data}
        bins={bins}
        label={label}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        style={fillFor(style)}
      >
        {selected !== null && selected !== active ? chord(selected, true) : null}
        {active !== null ? chord(active, false) : null}
        {rest.children}
      </StaticGradeProfile>
      <LiveRegion>{announced}</LiveRegion>
      {readout && seg ? (
        <span className="mc-spark-readout" style={crosshairReadoutStyle(midX, width)}>
          {/* The localized sentence minus its full stop — never hand-compose
              English in a VISIBLE chip (i18n canon); "gained" lives in
              `strings.gradeProfileAt`. */}
          {announced.replace(/[.。]$/, "")}
        </span>
      ) : null}
    </span>
  );
}
