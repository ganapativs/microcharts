"use client";
// Interactive <Slope>. useActivePicker owns interaction: one pointer listener +
// nearest-line hit-test (point-to-segment math over ≤ 7 lines) — ↑/↓ (or ←/→)
// rove categories ordered by their `to` value, announcing each slope; click /
// Enter / Space selects a line (onSelect).
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter, makePercentFormatter } from "../../core/format.js";
import {
  named,
  fillFor,
  navOrder,
  useActivePicker,
  wrap,
  rowReadoutStyle,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_PAIRED, type PairedStrings } from "../../core/strings-paired.js";
import { pairChange } from "../dumbbell/index.js";
import { slopeFitFrame } from "./geometry.js";
import { Slope as StaticSlope, slopeSummary, type SlopeProps } from "./index.js";

export interface InteractiveSlopeProps extends SlopeProps, PickerProps {
  strings?: PairedStrings;
  /**
   * Opt-in entrance motion (default `false`): the lines draw on when the
   * chart first mounts client-side. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function Slope(props: InteractiveSlopeProps): React.ReactNode {
  const {
    data,
    label = "none",
    domain,
    width = 40,
    height = 40,
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
  useEntrance(hostRef, "draw", animate, { selector: "line" });

  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  // Relative change — takes `locale`, never the value `format` (its units).
  const pctFmt = useMemo(() => makePercentFormatter(locale), [locale]);
  // The overlay + hit-test must resolve against the SAME frame the composed
  // static renders — label gutters included (shared rule, never re-derived).
  const geo = useMemo(
    () => slopeFitFrame({ width, height, data, domain, label, fmt }).geo,
    [width, height, data, domain, label, fmt],
  );

  /** Rows ordered by `to` (descending) for ↑/↓ roving. */
  const order = useMemo(() => {
    const idx = data.map((d, i) => ({ i, to: Number.isFinite(d.to) ? d.to : -Infinity }));
    idx.sort((a, b) => b.to - a.to);
    return idx.map((e) => e.i);
  }, [data]);

  // Nearest line by vertical distance at the pointer's interpolated x.
  const locate = useCallback(
    (x: number, y: number) => {
      if (geo.lines.length === 0) return null;
      const t = Math.min(1, Math.max(0, (x - geo.colX0) / Math.max(1, geo.colX1 - geo.colX0)));
      let best: number | null = null;
      let bestDist = Infinity;
      for (const line of geo.lines) {
        if (line.y0 === null || line.y1 === null) continue;
        const yAt = line.y0 + (line.y1 - line.y0) * t;
        const dist = Math.abs(yAt - y);
        if (dist < bestDist) {
          bestDist = dist;
          best = line.index;
        }
      }
      return best;
    },
    [geo],
  );

  // Roving walks the `to`-ordered sequence; ↑/↓ and ←/→ both map to prev/next.
  // `cur` is a DATA index (or -1); translate through `order`. Boundaries consume.
  const step = useCallback((cur: number, key: string) => navOrder(order, cur, key), [order]);

  // index = ROW (category) index; value = the row's `to` (the "after" endpoint,
  // the ordering key + primary read), null when missing; label = category.
  const datum = useCallback(
    (i: number) => {
      const d = data[i];
      return {
        index: i,
        value: d && Number.isFinite(d.to) ? d.to : null,
        label: d?.label,
        formatted: d
          ? Number.isFinite(d.from) && Number.isFinite(d.to)
            ? `${d.label}: ${fmt(d.from)} → ${fmt(d.to)}`
            : d.label
          : undefined,
      };
    },
    [data, fmt],
  );

  const { active, selected, bind } = useActivePicker({
    count: data.length,
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
        : slopeSummary(data, strings, fmt, pctFmt);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  // Accent line over the whole row's slope. Transient for hover/focus; a
  // distinguishing `data-mc-w="tick"` marks the persistent pinned selection.
  const accentLine = (i: number, pinned: boolean) => {
    const l = geo.lines.find((x) => x.index === i);
    if (!l || l.y0 === null || l.y1 === null) return null;
    return (
      <line
        x1={l.x0}
        y1={l.y0}
        x2={l.x1}
        y2={l.y1}
        stroke="var(--mc-accent)"
        data-mc-w={pinned ? "tick" : "support"}
        style={{ strokeWidth: "calc(var(--mc-sw) * 1.5)" }}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const shownDatum = shown !== null ? data[shown] : undefined;
  const shownLine = shown !== null ? geo.lines.find((l) => l.index === shown) : undefined;
  const announced = (() => {
    if (!shownDatum) return "";
    const okFrom = Number.isFinite(shownDatum.from);
    const okTo = Number.isFinite(shownDatum.to);
    if (okFrom && okTo) {
      const c = pairChange(shownDatum.from, shownDatum.to, pctFmt);
      return c
        ? strings.slopeAt(shownDatum.label, fmt(shownDatum.from), fmt(shownDatum.to), c.dir, c.pct)
        : strings.flatPair(fmt(shownDatum.from));
    }
    if (okFrom || okTo) {
      return strings.slopeIncomplete(
        shownDatum.label,
        fmt(okFrom ? shownDatum.from : shownDatum.to),
      );
    }
    return `${shownDatum.label}: ${strings.noData}`;
  })();

  return (
    <span
      ref={hostRef}
      {...wrap("mc-slope-live", className, style)}
      {...named(ariaLabel)}
      {...bind}
    >
      <StaticSlope
        {...rest}
        style={fillFor(style)}
        data={data}
        label={label}
        domain={domain}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {selected !== null && selected !== active ? accentLine(selected, true) : null}
        {active !== null ? accentLine(active, false) : null}
        {rest.children}
      </StaticSlope>
      <LiveRegion>{announced}</LiveRegion>
      {readout && shownDatum && shownLine ? (
        <span
          className="mc-spark-readout"
          style={
            shownLine.y0 != null && shownLine.y1 != null
              ? rowReadoutStyle(width / 2, (shownLine.y0 + shownLine.y1) / 2, width, height)
              : { left: "50%", transform: "translateX(-50%)" }
          }
        >
          {Number.isFinite(shownDatum.from) && Number.isFinite(shownDatum.to)
            ? `${shownDatum.label}: ${fmt(shownDatum.from)} → ${fmt(shownDatum.to)}`
            : shownDatum.label}
        </span>
      ) : null}
    </span>
  );
}
