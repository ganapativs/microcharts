"use client";
// Interactive <GradeProfile>. useActivePicker owns interaction: one pointer
// listener maps x → the segment under the cursor, ←/→ step segments, click /
// Enter / Space selects (onSelect). Each unit announces the distance, grade,
// and cumulative climb — the readout gives the TRUE grade, not the bin.
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
import { DEFAULT_BINS, gradeLayout, gradeProfileGeometry } from "./geometry.js";
import {
  GradeProfile as StaticGradeProfile,
  gradePercent,
  gradeProfileSummary,
  type GradeProfileProps,
} from "./index.js";

// Segments quantize into 4 grade bins; bin 1 ("moderate") carries no ink
// attribute at all (only data-mc-cat="1"), so every bin needs a term. The
// ridge line (ink="data") is excluded — scaling a winding profile line via
// scaleY would squash it; it simply fades in with the base svg opacity.
const SEGMENT_SELECTOR =
  'path[data-mc-ink="band"], path[data-mc-ink="negative"], path[data-mc-ink="bar"], path[data-mc-cat="1"]';

/** Chip/callback form of an announcement: the localized sentence, minus its
 *  full stop. Never hand-compose English for either — "gained" and its word
 *  order live in `strings.gradeProfileAt`. */
const chipText = (s: string | undefined): string | undefined => s?.replace(/[.。]$/, "");

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
  // One localized sentence per segment, used three ways: announced whole,
  // painted in the chip minus its stop, and handed to `onActive` as
  // `datum.formatted`. It used to be hand-composed a second time for the
  // callback, which both drifted from the chip and pinned English ("gained")
  // into a consumer's KPI card while the chip itself stayed translated.
  const sentence = useCallback(
    (i: number): string | undefined => {
      const s = geo.segments[i];
      return s ? strings.gradeProfileAt(fmt(s.dEnd), pct(s.grade), fmt(s.cumGain)) : undefined;
    },
    [geo, strings, fmt, pct],
  );
  const datum = useCallback(
    (i: number) => ({
      index: i,
      value: geo.segments[i]?.grade ?? null,
      formatted: chipText(sentence(i)),
    }),
    [geo, sentence],
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
          data-mc-active=""
          data-mc-ui=""
          data-mc-w={pinned ? "tick" : "full"}
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={s.x1} cy={s.y1} r={1.75} data-mc-ink="accent" data-mc-ui="" />
      </>
    );
  };

  const shown = active ?? selected;
  const seg = shown !== null ? geo.segments[shown] : undefined;
  const announced = shown !== null ? (sentence(shown) ?? "") : "";
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
          {chipText(announced)}
        </span>
      ) : null}
    </span>
  );
}
