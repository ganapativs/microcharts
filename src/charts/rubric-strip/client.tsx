"use client";
// Interactive <RubricStrip>. useActivePicker owns interaction: one pointer
// listener + row-by-y lookup, ↑/↓ rove criteria, click / Enter / Space selects
// (onSelect).
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter, makePercentFormatter } from "../../core/format.js";
import { chartSide, isFiniteValue } from "../../core/types.js";
import {
  named,
  fillFor,
  useActivePicker,
  wrap,
  rowReadoutStyle,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_RUBRIC } from "../../core/strings-rubric.js";
import {
  DEFAULT_WIDTH,
  ROW_GAP,
  UNIT_DOMAIN,
  defaultHeight,
  rubricLabels,
  rubricRowBands,
  rubricStripGeometry,
} from "./geometry.js";
import {
  RubricStrip as StaticRubricStrip,
  rubricStripSummary,
  type RubricStripProps,
} from "./index.js";

export interface InteractiveRubricStripProps extends RubricStripProps, PickerProps {
  /**
   * Opt-in entrance motion (default `false`): each criterion's bar sweeps in
   * from the left, staggered row by row, on first client-side mount. Inert on
   * the server and on hydrated server HTML; `prefers-reduced-motion` always
   * wins.
   */
  animate?: boolean;
}

export function RubricStrip(props: InteractiveRubricStripProps): React.ReactNode {
  const {
    data,
    labels = true,
    domain = UNIT_DOMAIN,
    width: widthProp = DEFAULT_WIDTH,
    height: heightProp,
    format,
    locale,
    strings = EN_RUBRIC,
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
  useEntrance(hostRef, "sweep", animate, {
    selector:
      'rect[data-mc-ink="accent"], rect[data-mc-ink="positive"], rect[data-mc-ink="negative"]',
  });

  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  // The weight SHARE is a percent of the rubric, not a score — it takes `locale`
  // but never the score `format`. `${Math.round(x*100)}%` was an en-US percent.
  const weightFmt = useMemo(() => makePercentFormatter(locale), [locale]);
  // Box, bands and gutter come from the same shared functions the static entry
  // calls — both entries must land on identical geometry or the focus box
  // drifts off the rows it is meant to frame (and `chartSide` keeps a hostile
  // side from moving the pointer map off the painted box).
  const auto = defaultHeight(data.length);
  const width = chartSide(widthProp, DEFAULT_WIDTH);
  const height = chartSide(heightProp ?? auto, auto);
  const gutter = useMemo(
    () =>
      rubricLabels({
        names: data.map((d) => d.label),
        bands: rubricRowBands({ weights: data.map((d) => d.weight ?? 1), height, gap: ROW_GAP }),
        width,
        height,
        show: labels,
      }).gutter,
    [data, labels, width, height],
  );
  const geo = useMemo(
    () =>
      rubricStripGeometry({
        data: data.map((d) => ({ label: d.label, score: d.score, weight: d.weight ?? 1 })),
        domain,
        width,
        height,
        gutter,
        gap: ROW_GAP,
      }),
    [data, domain, width, height, gutter],
  );

  // Pointer (viewBox space) → row by y band.
  const locate = useCallback(
    (_x: number, y: number) => {
      const i = geo.rows.findIndex((row) => y >= row.y && y <= row.y + row.height);
      return i >= 0 ? i : null;
    },
    [geo],
  );

  // 1:1 with `data`: unit = criterion, `value` = its score (the bar's length).
  const datum = useCallback(
    (i: number) => {
      const row = geo.rows[i];
      return {
        index: i,
        value: row?.score ?? null,
        label: row?.label,
        formatted: row
          ? `${row.label} ${isFiniteValue(row.score) ? fmt(row.score) : "—"} (${weightFmt(row.weightShare)})`
          : "",
      };
    },
    [geo, fmt, weightFmt],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo.rows.length,
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
        : rubricStripSummary(data, strings, fmt);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const box = (i: number, pinned: boolean) => {
    const row = geo.rows[i];
    if (!row) return null;
    return (
      <rect
        x={gutter - 0.5}
        y={row.y - 0.5}
        width={row.trackWidth + 1}
        height={row.height + 1}
        fill="none"
        data-mc-active=""
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const row = shown !== null ? geo.rows[shown] : undefined;
  const weightPct = row ? weightFmt(row.weightShare) : "";
  const announced = row
    ? isFiniteValue(row.score)
      ? strings.rubricRow(row.label, fmt(row.score), weightPct)
      : strings.rubricRowEmpty(row.label, weightPct)
    : "";

  return (
    <span ref={hostRef} {...wrap("mc-rubric-live", className, style)} {...named(label)} {...bind}>
      <StaticRubricStrip
        {...rest}
        data={data}
        labels={labels}
        domain={domain}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        style={fillFor(style)}
      >
        {selected !== null && selected !== active ? box(selected, true) : null}
        {active !== null ? box(active, false) : null}
        {rest.children}
      </StaticRubricStrip>
      <LiveRegion>{announced}</LiveRegion>
      {readout && row ? (
        <span
          className="mc-spark-readout"
          style={rowReadoutStyle(width / 2, row.y + row.height / 2, width, height)}
        >
          {`${row.label} ${isFiniteValue(row.score) ? fmt(row.score) : "—"} (${weightPct})`}
        </span>
      ) : null}
    </span>
  );
}
