"use client";
// Interactive <PairedBars>. useActivePicker owns interaction: one pointer
// listener + pair-by-category-band lookup — ←/→ (or ↑/↓) rove pairs, announcing
// each ("East: 940 vs 1,200."); click / Enter / Space selects a pair (onSelect).
// Composes the static component (canon) — the SVG is never re-implemented.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { EN_PAIRED, type PairedStrings } from "../../core/strings-paired.js";
import { isFiniteValue } from "../../core/types.js";
import {
  named,
  fillFor,
  useActivePicker,
  wrap,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { pairedBarsGeometry } from "./geometry.js";
import {
  PairedBars as StaticPairedBars,
  pairedBarsSummary,
  type PairedBarsProps,
} from "./index.js";

// Only the value bars (bar/positive/negative) animate — the muted "neutral"
// ref ghost stays static, arriving with the base whole-chart fade instead.
const VALUE_SELECTOR =
  'rect[data-mc-ink="bar"], rect[data-mc-ink="positive"], rect[data-mc-ink="negative"]';

export interface InteractivePairedBarsProps extends PairedBarsProps, PickerProps {
  strings?: PairedStrings;
  /**
   * Opt-in entrance motion (default `false`): value bars rise from the
   * baseline (vertical) or sweep in from the left (horizontal) when the chart
   * first mounts client-side. Inert on the server and on hydrated server
   * HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function PairedBars(props: InteractivePairedBarsProps): React.ReactNode {
  const {
    data,
    mode = "grouped",
    orientation = "vertical",
    domain,
    width = 60,
    height = 20,
    format,
    locale,
    strings = EN_PAIRED,
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
  // Paired bars are effectively always zero-anchored positives (the `negative`
  // ink is an under-target valence, not a below-zero sign), so bars grow from
  // the shared baseline: the archetype default (bottom for rise, left for
  // sweep) — never `origin:"signed"`, which would read that valence as sign.
  useEntrance(hostRef, orientation === "horizontal" ? "sweep" : "rise", animate, {
    selector: VALUE_SELECTOR,
  });

  const geo = useMemo(
    () =>
      pairedBarsGeometry({
        width,
        height,
        pairs: data.map((d) => ({ value: d.value, ref: d.ref })),
        domain,
        mode,
        orientation,
      }),
    [width, height, data, domain, mode, orientation],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);

  // Pointer (viewBox space) → pair index by pure category-band math. The
  // category axis is x when vertical, y when horizontal.
  const locate = useCallback(
    (x: number, y: number) => {
      if (geo.pairs.length === 0 || geo.pitch === 0) return null;
      const pos = orientation === "vertical" ? x : y;
      const i = Math.floor(pos / geo.pitch);
      return i >= 0 && i < geo.pairs.length ? i : null;
    },
    [geo, orientation],
  );

  // 1-D roving over pairs; ←/→ and ↑/↓ both map to prev/next. Boundaries consume.
  const step = useCallback(
    (cur: number, key: string) => {
      const n = geo.pairs.length;
      if (n === 0) return null;
      switch (key) {
        case "ArrowRight":
        case "ArrowDown":
          return Math.min(n - 1, cur + 1);
        case "ArrowLeft":
        case "ArrowUp":
          return cur <= 0 ? 0 : cur - 1;
        case "Home":
          return 0;
        case "End":
          return n - 1;
      }
      return null;
    },
    [geo],
  );

  // index = PAIR (category) index; value = the pair's `value` bar (the primary
  // read, vs its muted `ref`), null when missing; label = category.
  const datum = useCallback(
    (i: number) => {
      const d = data[i];
      return {
        index: i,
        value: isFiniteValue(d?.value) ? d!.value : null,
        label: d?.label,
        formatted:
          d && isFiniteValue(d.value)
            ? isFiniteValue(d.ref)
              ? `${d.label}: ${fmt(d.value)} / ${fmt(d.ref)}`
              : `${d.label}: ${fmt(d.value)}`
            : undefined,
      };
    },
    [data, fmt],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo.pairs.length,
    width,
    height,
    locate,
    step,
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
        : pairedBarsSummary(data, fmt, strings);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const bandW = geo.pitch > 0 ? geo.pitch - 1.5 : 0;
  // Accent outline hugging the whole category band. Transient for hover/focus;
  // a distinguishing `data-mc-w="tick"` marks the persistent pinned selection.
  const ring = (i: number, pinned: boolean) => {
    if (geo.pitch === 0) return null;
    const pos = i * geo.pitch;
    return (
      <rect
        x={orientation === "vertical" ? pos - 0.5 : -0.5}
        y={orientation === "vertical" ? -0.5 : pos - 0.5}
        width={orientation === "vertical" ? bandW + 1 : width + 1}
        height={orientation === "vertical" ? height + 1 : bandW + 1}
        fill="none"
        stroke="var(--mc-accent)"
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const shownPair = shown !== null ? geo.pairs[shown] : undefined;
  const shownDatum = shown !== null ? data[shown] : undefined;
  const announced = !shownDatum
    ? ""
    : isFiniteValue(shownDatum.value) && isFiniteValue(shownDatum.ref)
      ? strings.pairAt(shownDatum.label, fmt(shownDatum.value), fmt(shownDatum.ref))
      : isFiniteValue(shownDatum.value)
        ? strings.pairAtNoRef(shownDatum.label, fmt(shownDatum.value))
        : strings.pairAtEmpty(shownDatum.label);

  const shownPos = shown !== null ? shown * geo.pitch : 0;

  return (
    <span ref={hostRef} {...wrap("mc-paired-live", className, style)} {...named(label)} {...bind}>
      <StaticPairedBars
        {...rest}
        style={fillFor(style)}
        data={data}
        mode={mode}
        orientation={orientation}
        domain={domain}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {selected !== null && selected !== active ? ring(selected, true) : null}
        {active !== null ? ring(active, false) : null}
        {rest.children}
      </StaticPairedBars>
      <LiveRegion>{announced}</LiveRegion>
      {readout && shownPair && shownDatum && isFiniteValue(shownDatum.value) ? (
        <span
          className="mc-spark-readout"
          style={{
            // `pitch` is a length on the CATEGORY axis — x when vertical, but y
            // when horizontal. Only the vertical orientation may spend it on
            // `left`; a horizontal chart's rows differ in y, and the chip has no
            // vertical anchor (it sits at `bottom: 100%`), so it centres.
            left: `${((orientation === "vertical" ? shownPos + bandW / 2 : width / 2) / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {isFiniteValue(shownDatum.ref)
            ? `${shownDatum.label}: ${fmt(shownDatum.value)} / ${fmt(shownDatum.ref)}`
            : `${shownDatum.label}: ${fmt(shownDatum.value)}`}
        </span>
      ) : null}
    </span>
  );
}
