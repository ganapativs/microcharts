"use client";
// Interactive <GradeProfile>. One pointer listener maps x → the
// segment under the cursor; ←/→ step segments. Each announces the distance,
// grade, and cumulative climb — the readout gives the TRUE grade, not the bin.
// Composes the static component (canon).
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
import { EN_GRADE_PROFILE } from "../../core/strings-grade-profile.js";
import { gradeLayout, gradeProfileGeometry } from "./geometry.js";
import {
  GradeProfile as StaticGradeProfile,
  gradePercent,
  gradeProfileSummary,
  type GradeProfileProps,
} from "./index.js";

const FILL: CSSProperties = { width: "100%", height: "auto" };
const DEFAULT_BINS = [3, 6, 10] as const;

// Segments quantize into 4 grade bins; bin 1 ("moderate") carries no ink
// attribute at all (only data-mc-cat="1"), so every bin needs a term. The
// ridge line (ink="data") is excluded — scaling a winding profile line via
// scaleY would squash it; it simply fades in with the base svg opacity.
const SEGMENT_SELECTOR =
  'path[data-mc-ink="band"], path[data-mc-ink="negative"], path[data-mc-ink="bar"], path[data-mc-cat="1"]';

export interface InteractiveGradeProfileProps extends GradeProfileProps {
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
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : gradeProfileSummary(geo, strings, fmt, pct);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      const segs = geo.segments;
      if (segs.length === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const x = ((e.clientX - r.left) / r.width) * width;
      let i = segs.findIndex((s) => x >= s.x0 && x <= s.x1);
      if (i < 0) i = x <= segs[0]!.x0 ? 0 : segs.length - 1;
      setActive(i);
    },
    [geo, width],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const total = geo.segments.length;
      if (total === 0) return;
      const cur = active ?? 0;
      let next = cur;
      switch (e.key) {
        case "ArrowRight":
          next = Math.min(total - 1, cur + 1);
          break;
        case "ArrowLeft":
          next = Math.max(0, cur - 1);
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = total - 1;
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

  const seg = active !== null ? geo.segments[active] : undefined;
  const announced = seg
    ? strings.gradeProfileAt(fmt(seg.dEnd), pct(seg.grade), fmt(seg.cumGain))
    : "";
  const midX = seg ? (seg.x0 + seg.x1) / 2 : 0;

  return (
    <span
      ref={hostRef}
      className="mc-grade-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
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
        style={FILL}
      >
        {seg ? (
          <>
            <line
              x1={seg.x0}
              y1={seg.y0}
              x2={seg.x1}
              y2={seg.y1}
              data-mc-ink="accent"
              data-mc-w="full"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={seg.x1} cy={seg.y1} r={1.75} data-mc-ink="accent" />
          </>
        ) : null}
        {rest.children}
      </StaticGradeProfile>
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
      {seg ? (
        <span
          className="mc-spark-readout"
          style={{ left: `${(midX / width) * 100}%`, transform: "translateX(-50%)" }}
        >
          {pct(seg.grade)}
        </span>
      ) : null}
    </span>
  );
}
