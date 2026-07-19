"use client";
// Interactive <MiniBar>. useActivePicker owns interaction: one pointer listener
// + bar-by-band lookup, ←/→ rove bars ("East: 940 — 1st of 4."), click / Enter /
// Space selects (onSelect). Composes the static component (canon) — the SVG is
// never re-implemented.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { EN_CATEGORY, type CategoryStrings } from "../../core/strings-category.js";
import { isFiniteValue } from "../../core/types.js";
import { FILL, useActivePicker, wrap, type PickerProps } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { miniBarGeometry } from "./geometry.js";
import { MiniBar as StaticMiniBar, miniBarSummary, sortData, type MiniBarProps } from "./index.js";

// Bars carry valence tokens (bar/accent/positive/negative), not just "bar" —
// the default archetype selectors only match "bar", so every ink role is listed.
const BAR_SELECTOR =
  'rect[data-mc-ink="bar"], rect[data-mc-ink="accent"], rect[data-mc-ink="positive"], rect[data-mc-ink="negative"]';

export interface InteractiveMiniBarProps extends MiniBarProps, PickerProps {
  strings?: CategoryStrings;
  /**
   * Opt-in entrance motion (default `false`): bars rise from the baseline
   * (vertical) or sweep in from the left (horizontal) when the chart first
   * mounts client-side. Inert on the server and on hydrated server HTML;
   * `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function MiniBar(props: InteractiveMiniBarProps): React.ReactNode {
  const {
    data,
    sort = "none",
    orientation = "vertical",
    domain,
    width = 50,
    height = 16,
    format,
    locale,
    strings = EN_CATEGORY,
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
  // Horizontal bars grow rightward (sweep, scaleX); vertical bars rise from the
  // baseline (scaleY) — the archetype tracks the chart's own orientation prop.
  // Each bar carries its own `data-mc-origin` (from true geometric sign) in the
  // static markup, so below-zero bars grow the honest way; the archetype default
  // (bottom/left) covers the common all-positive case.
  useEntrance(hostRef, orientation === "horizontal" ? "sweep" : "rise", animate, {
    selector: BAR_SELECTOR,
  });

  const sorted = useMemo(() => sortData(data, sort), [data, sort]);
  const geo = useMemo(
    () =>
      miniBarGeometry({
        width,
        height,
        values: sorted.map((d) => d.value),
        domain,
        orientation,
      }),
    [width, height, sorted, domain, orientation],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);

  // ranks over finite values (1 = highest), for "1st of 4" wording
  const ranks = useMemo(() => {
    const finite = sorted
      .map((d, i) => ({ i, v: d.value }))
      .filter((e): e is { i: number; v: number } => isFiniteValue(e.v));
    finite.sort((a, b) => b.v - a.v);
    const map = new Map<number, { rank: number; of: number }>();
    finite.forEach((e, r) => map.set(e.i, { rank: r + 1, of: finite.length }));
    return map;
  }, [sorted]);

  // Pointer (viewBox space) → bar index by category-band division. Vertical bars
  // band along x, horizontal along y.
  const locate = useCallback(
    (x: number, y: number) => {
      if (geo.bars.length === 0 || geo.band === 0) return null;
      const pos = orientation === "vertical" ? x : y;
      const i = Math.floor(pos / geo.band);
      return i >= 0 && i < geo.bars.length ? i : null;
    },
    [geo, orientation],
  );

  // index = bar position (the data index when unsorted; the visual slot when
  // `sort` reorders) — the unit `selectedIndex`/overlays also address.
  const datum = useCallback(
    (i: number) => {
      const d = sorted[i];
      return {
        index: i,
        value: isFiniteValue(d?.value) ? (d!.value as number) : null,
        label: d?.label,
      };
    },
    [sorted],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo.bars.length,
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
        : miniBarSummary(data, fmt, strings);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  // focus ring hugs the bar's category band, full value extent
  const outline = (i: number, pinned: boolean) => {
    const b = geo.bars[i];
    if (!b || b.empty) return null;
    const ring =
      orientation === "vertical"
        ? { x: b.x - 0.5, y: -0.5, width: b.w + 1, height: height + 1 }
        : { x: -0.5, y: b.y - 0.5, width: width + 1, height: b.h + 1 };
    return (
      <rect
        {...ring}
        fill="none"
        stroke="var(--mc-accent)"
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const shownBar = shown !== null ? geo.bars[shown] : undefined;
  const shownDatum = shown !== null ? sorted[shown] : undefined;
  const announced =
    shownDatum === undefined
      ? ""
      : isFiniteValue(shownDatum.value)
        ? strings.category(
            shownDatum.label,
            fmt(shownDatum.value),
            ranks.get(shown!)?.rank ?? 0,
            ranks.get(shown!)?.of ?? 0,
          )
        : `${shownDatum.label}: ${strings.noData}`;

  return (
    <span
      ref={hostRef}
      {...wrap("mc-minibar-live", className, style)}
      tabIndex={0}
      role="img"
      aria-label={label}
      {...bind}
    >
      <StaticMiniBar
        {...rest}
        style={FILL}
        data={data}
        sort={sort}
        orientation={orientation}
        domain={domain}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {/* Pinned selection persists through pointer-leave; focus ring is transient. */}
        {selected !== null && selected !== active ? outline(selected, true) : null}
        {active !== null ? outline(active, false) : null}
        {rest.children}
      </StaticMiniBar>
      <LiveRegion>{announced}</LiveRegion>
      {shownBar && shownDatum && isFiniteValue(shownDatum.value) ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${((orientation === "vertical" ? shownBar.x + shownBar.w / 2 : width / 2) / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {fmt(shownDatum.value)}
        </span>
      ) : null}
    </span>
  );
}
