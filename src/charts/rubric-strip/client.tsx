"use client";
// Interactive <RubricStrip>. useActivePicker owns interaction: one pointer
// listener + row-by-y lookup, ↑/↓ rove criteria, click / Enter / Space selects
// (onSelect). Composes the static component (canon) — never re-implemented.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { isFiniteValue } from "../../core/types.js";
import { labelFont } from "../../core/labels.js";
import {
  named,
  fillFor,
  useActivePicker,
  wrap,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_RUBRIC } from "../../core/strings-rubric.js";
import { rubricStripGeometry } from "./geometry.js";
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
    domain = [0, 1],
    width = 80,
    height: heightProp,
    format,
    locale,
    strings = EN_RUBRIC,
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
  useEntrance(hostRef, "sweep", animate, {
    selector:
      'rect[data-mc-ink="accent"], rect[data-mc-ink="positive"], rect[data-mc-ink="negative"]',
  });

  const n = Math.max(1, data.length);
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  // Height / font / gutter mirror the static entry EXACTLY (same defaults, same
  // label-fit rule) — both entries must land on identical geometry or the focus
  // box drifts off the rows it is meant to frame.
  const height = heightProp ?? Math.max(14, n * 13);
  const fontSize = labelFont(height / n, 0.6);
  const labelsFit = height / n >= fontSize * 1.15;
  const longestLabel = useMemo(() => {
    let longest = 1;
    for (const d of data) if (d.label.length > longest) longest = d.label.length;
    return longest;
  }, [data]);
  const gutter =
    labels && labelsFit ? Math.min(width * 0.62, longestLabel * fontSize * 0.64 + 4) : 0;
  const geo = useMemo(
    () =>
      rubricStripGeometry({
        data: data.map((d) => ({ label: d.label, score: d.score, weight: d.weight ?? 1 })),
        domain,
        width,
        height,
        gutter,
        gap: 1,
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
      return { index: i, value: row?.score ?? null, label: row?.label };
    },
    [geo],
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
        stroke="var(--mc-accent)"
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const row = shown !== null ? geo.rows[shown] : undefined;
  const weightPct = row ? `${Math.round(row.weightShare * 100)}%` : "";
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
      {row ? (
        <span className="mc-spark-readout" style={{ left: "50%", transform: "translateX(-50%)" }}>
          {`${row.label} ${isFiniteValue(row.score) ? fmt(row.score) : "—"} (${weightPct})`}
        </span>
      ) : null}
    </span>
  );
}
