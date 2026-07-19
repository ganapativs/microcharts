"use client";
// Interactive <SegmentedBar>. useActivePicker owns interaction: one pointer
// listener + segment-by-x lookup, ←/→ rove segments incl. "Other" (which
// announces its member count), click / Enter / Space selects (onSelect).
// Composes the static component (canon) — the SVG is never re-implemented.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { FILL, useActivePicker, wrap, type PickerProps } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_COMPOSITION, type CompositionStrings } from "../../core/strings-composition.js";
import { largestRemainderPercents, rollup, segmentedBarGeometry } from "./geometry.js";
import {
  SegmentedBar as StaticSegmentedBar,
  sharesSummary,
  type SegmentedBarProps,
} from "./index.js";

export interface InteractiveSegmentedBarProps extends SegmentedBarProps, PickerProps {
  strings?: CompositionStrings;
  /**
   * Opt-in entrance motion (default `false`): segments sweep in left to right,
   * assembling into the whole bar on first client-side mount. Inert on the
   * server and on hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function SegmentedBar(props: InteractiveSegmentedBarProps): React.ReactNode {
  const {
    data,
    maxSegments = 5,
    order = "data",
    width = 60,
    height = 10,
    format,
    locale,
    strings = EN_COMPOSITION,
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

  const hostRef = useRef<HTMLSpanElement>(null);
  // "sweep" from the left — a part-to-whole bar reads best assembling left→right
  // (each segment grows from its own left edge) rather than fading in place.
  useEntrance(hostRef, "sweep", animate, {
    selector: 'rect[data-mc-cat], rect[data-mc-ink="neutral"]',
  });

  const rolled = useMemo(() => {
    let r = rollup(data, maxSegments, strings.otherLabel);
    if (order === "desc") {
      r = [...r].sort((a, b) =>
        a.label === strings.otherLabel
          ? 1
          : b.label === strings.otherLabel
            ? -1
            : b.value - a.value,
      );
    }
    return r;
  }, [data, maxSegments, order, strings]);

  const fontSize = Math.max(5, Math.min(Math.round(height * 0.6), 7));
  const geo = useMemo(
    () => segmentedBarGeometry({ width, height, values: rolled.map((d) => d.value), fontSize }),
    [width, height, rolled, fontSize],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const pcts = useMemo(() => largestRemainderPercents(geo.segments.map((s) => s.share)), [geo]);

  const locate = useCallback(
    (x: number) => {
      const i = geo.segments.findIndex((s) => x >= s.x && x <= s.x + s.w + 0.5);
      return i >= 0 ? i : null;
    },
    [geo],
  );
  const datum = useCallback(
    (i: number) => {
      const d = rolled[geo.segments[i]!.index];
      return { index: i, value: d?.value ?? null, label: d?.label };
    },
    [geo, rolled],
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
        : sharesSummary(rolled, strings);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const outline = (i: number, pinned: boolean) => {
    const s = geo.segments[i];
    if (!s) return null;
    return (
      <rect
        x={s.x - 0.5}
        y={0.5}
        width={s.w + 1}
        height={height - 1}
        fill="none"
        stroke="var(--mc-accent)"
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const shownSeg = shown !== null ? geo.segments[shown] : undefined;
  const shownDatum = shownSeg ? rolled[shownSeg.index] : undefined;
  const announced =
    shownSeg && shownDatum
      ? shownDatum.members > 1
        ? strings.shareOther(shownDatum.label, `${pcts[shown!]}%`, shownDatum.members)
        : strings.shareAt(shownDatum.label, `${pcts[shown!]}%`, fmt(shownDatum.value))
      : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-segbar-live", className, style)}
      tabIndex={0}
      role="img"
      aria-label={label}
      {...bind}
    >
      <StaticSegmentedBar
        {...rest}
        style={FILL}
        data={data}
        maxSegments={maxSegments}
        order={order}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {/* Pinned selection persists through pointer-leave; focus outline is transient. */}
        {selected !== null && selected !== active ? outline(selected, true) : null}
        {active !== null ? outline(active, false) : null}
        {rest.children}
      </StaticSegmentedBar>
      <LiveRegion>{announced}</LiveRegion>
      {shownSeg && shownDatum ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${((shownSeg.x + shownSeg.w / 2) / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {`${shownDatum.label} ${pcts[shown!]}%`}
        </span>
      ) : null}
    </span>
  );
}
