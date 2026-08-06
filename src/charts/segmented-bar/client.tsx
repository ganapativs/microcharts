"use client";
// Interactive <SegmentedBar>. useActivePicker owns interaction: one pointer
// listener + segment-by-x lookup, ←/→ rove segments incl. "Other" (which
// announces its member count). click / Enter / Space selects (onSelect).
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter, makePercentFormatter } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import {
  CHIP,
  named,
  fillFor,
  useActivePicker,
  wrap,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_COMPOSITION, type CompositionStrings } from "../../core/strings-composition.js";
import { chartSide } from "../../core/types.js";
import {
  largestRemainderPercents,
  MAX_SEGMENTS,
  rollup,
  segmentedBarGeometry,
} from "./geometry.js";
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
    maxSegments = MAX_SEGMENTS,
    order = "data",
    width: widthProp = 60,
    height: heightProp = 10,
    format,
    locale,
    strings = EN_COMPOSITION,
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

  // Same clamp the static entry applies, for the same reason: the hit box, the
  // focus outline and the readout anchor are all measured in these units, so a
  // NaN width would put the picker on a scale the frame never had.
  const width = chartSide(widthProp, 60);
  const height = chartSide(heightProp, 10);

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

  const fontSize = labelFont(height, 0.6);
  const geo = useMemo(
    () => segmentedBarGeometry({ width, height, values: rolled.map((d) => d.value), fontSize }),
    [width, height, rolled, fontSize],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  // Percents off the rolled VALUES, matching the painted labels and the summary
  // to the point. Indexed by rolled position too: a share can underflow to zero
  // and drop its segment, and a positional lookup would then read the next
  // category's share into this one's readout.
  const pcts = useMemo(() => largestRemainderPercents(rolled.map((d) => d.value)), [rolled]);
  // Largest-remainder integers (they must still sum to 100) rendered through a
  // real percent formatter — `${n}%` hardcoded the sign and its spacing, which
  // fr-FR writes as "12 %".
  const pctFmt = useMemo(() => makePercentFormatter(locale), [locale]);
  const pctAt = useCallback(
    (i: number) => pctFmt((pcts[geo.segments[i]?.index ?? -1] ?? 0) / 100),
    [pctFmt, pcts, geo],
  );

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
      return {
        index: i,
        value: d?.value ?? null,
        label: d?.label,
        formatted: d ? `${d.label} ${pctAt(i)} (${fmt(d.value)})` : "",
      };
    },
    [geo, rolled, fmt, pctAt],
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
        : sharesSummary(rolled, strings, pctFmt);
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
        data-mc-active=""
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
        ? strings.shareOther(
            shownDatum.label,
            pctAt(shown!),
            shownDatum.members,
            fmt(shownDatum.value),
          )
        : strings.shareAt(shownDatum.label, pctAt(shown!), fmt(shownDatum.value))
      : "";

  return (
    <span ref={hostRef} {...wrap("mc-segbar-live", className, style)} {...named(label)} {...bind}>
      <StaticSegmentedBar
        {...rest}
        style={fillFor(style)}
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
        {selected !== null && selected !== active ? outline(selected, true) : null}
        {active !== null ? outline(active, false) : null}
        {rest.children}
      </StaticSegmentedBar>
      <LiveRegion>{announced}</LiveRegion>
      {readout && shownSeg && shownDatum ? (
        <span className="mc-spark-readout" {...CHIP}>
          {/* The rolled-up branch used to spend its parenthesis on a category
              COUNT and drop the value entirely — and it hardcoded English
              ("categories") in a visible chip, which the i18n canon forbids and
              which `strings.shareOther` was already carrying for the
              announcement. Every segment now reads label · share · value; how
              many categories were folded into "Other" stays in the
              announcement, where a longer sentence is free. */}
          {`${shownDatum.label} ${pctAt(shown!)} (${fmt(shownDatum.value)})`}
        </span>
      ) : null}
    </span>
  );
}
