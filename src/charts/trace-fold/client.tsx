"use client";
// Interactive <TraceFold>. useActivePicker owns interaction: one pointer
// listener + pure span-by-(row, x) lookup, ←/→ within a depth row and ↑/↓
// between depths (2-D roving). touch tap-to-pin, and the onActive/onSelect
// contract.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter, makePercentFormatter } from "../../core/format.js";
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
import { EN_TRACE_FOLD } from "../../core/strings-trace-fold.js";
import { traceFoldGeometry, traceFoldHeight } from "./geometry.js";
import { TraceFold as StaticTraceFold, traceFoldSummary, type TraceFoldProps } from "./index.js";

export interface InteractiveTraceFoldProps extends TraceFoldProps, PickerProps {
  /**
   * Opt-in entrance motion (default `false`): the flame RISES depth by depth
   * from the root row — each frame scales out of its top edge, where it meets
   * its parent, the way a call stack unwinds. Inert on the server and on
   * hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function TraceFold(props: InteractiveTraceFoldProps): React.ReactNode {
  const {
    data,
    width = 120,
    height: heightProp,
    format,
    locale,
    strings = EN_TRACE_FOLD,
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
  // A flame graph is a tree, not a filmstrip — a flat L→R wipe slices frames
  // mid-shape and hides the nesting. Instead each frame grows down from its
  // top edge (where it meets its parent) and the rows cascade by depth, so the
  // stack visibly unwinds from the root.
  useEntrance(hostRef, "rise", animate, {
    selector: "rect[data-mc-ink]",
    origin: "top",
    order: "y",
    window: 450,
  });

  const depthCount = useMemo(() => {
    const seen = new Set<number>();
    for (let i = 0; i < Math.min(40, data.length); i++) seen.add(data[i]!.depth);
    return Math.max(1, seen.size);
  }, [data]);
  const height = heightProp ?? traceFoldHeight(depthCount);
  const geo = useMemo(
    () => traceFoldGeometry({ data, width, height, rowGap: 1.2 }),
    [data, width, height],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  // A span's SHARE of total time is a percent of its own, so it takes `locale`
  // but never the duration `format` (which carries the time unit). The old
  // `${Math.round(share * 100)}%` was an en-US percent.
  const pctFmt = useMemo(() => makePercentFormatter(locale), [locale]);

  // The navigable unit is a SPAN, and `geo.rects` is 1:1 with the rendered spans
  // (`data` truncated to the first 40), so the reported index IS the data index.
  // Keyboard roving is 2-D over the folded layout, so we index the spans by
  // depth row (sorted top→bottom) and start time (left→right) within the row.
  const rows = useMemo(() => {
    const byY = new Map<number, number[]>();
    geo.rects.forEach((r, i) => {
      const arr = byY.get(r.y) ?? [];
      arr.push(i);
      byY.set(r.y, arr);
    });
    return [...byY.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, arr]) => arr.sort((p, q) => geo.rects[p]!.x - geo.rects[q]!.x));
  }, [geo]);

  const posOf = useMemo(() => {
    const m = new Map<number, [number, number]>();
    rows.forEach((arr, row) => arr.forEach((span, i) => m.set(span, [row, i])));
    return m;
  }, [rows]);

  const locate = useCallback(
    (x: number, y: number) => {
      for (const row of rows) {
        for (const span of row) {
          const s = geo.rects[span]!;
          if (y >= s.y && y <= s.y + s.height && x >= s.x && x <= s.x + s.width) return span;
        }
      }
      return null;
    },
    [rows, geo],
  );

  // 2-D roving over the fold. Boundary keys are consumed (return the current
  // span) rather than ignored; from nothing, a key applies from the first span.
  const step = useCallback(
    (cur: number, key: string) => {
      if (rows.length === 0) return null;
      const c = cur < 0 ? rows[0]![0]! : cur;
      const [row, i] = posOf.get(c) ?? [0, 0];
      const pick = (r: number, idx: number): number => {
        const arr = rows[r];
        if (!arr || arr.length === 0) return c;
        return arr[Math.min(arr.length - 1, Math.max(0, idx))]!;
      };
      switch (key) {
        case "ArrowRight":
          return pick(row, i + 1);
        case "ArrowLeft":
          return pick(row, i - 1);
        case "ArrowDown":
          return pick(Math.min(rows.length - 1, row + 1), i);
        case "ArrowUp":
          return pick(Math.max(0, row - 1), i);
        case "Home":
          return pick(0, 0);
        case "End":
          return pick(rows.length - 1, Infinity);
      }
      return null;
    },
    [rows, posOf],
  );

  // `value` = the span's duration (the width channel — this chart's encoding);
  // `label` = the span name.
  const datum = useCallback(
    (i: number) => {
      const s = geo.rects[i];
      return {
        index: i,
        value: s?.duration ?? null,
        label: s?.label,
        formatted: s
          ? `${s.label} ${fmt(s.duration)}${s.critical ? strings.traceCritical : ""}`
          : undefined,
      };
    },
    [geo, fmt, strings],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo.rects.length,
    width,
    height,
    locate,
    datum,
    step,
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
        : traceFoldSummary(geo, strings, fmt);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const outline = (i: number, pinned: boolean) => {
    const s = geo.rects[i];
    if (!s) return null;
    return (
      <rect
        x={s.x - 0.4}
        y={s.y - 0.4}
        width={s.width + 0.8}
        height={s.height + 0.8}
        fill="none"
        stroke="var(--mc-accent)"
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  // The span shown by the outline + readout: the live hover/keyboard focus,
  // falling back to a pinned selection when the pointer has left.
  const shown = active ?? selected;
  const span = shown !== null ? geo.rects[shown] : undefined;
  const announced = span
    ? strings.traceFoldAt(
        span.label,
        fmt(span.duration),
        pctFmt(span.share),
        span.depth,
        span.critical ? strings.traceCritical : "",
      )
    : "";

  return (
    <span ref={hostRef} {...wrap("mc-trace-live", className, style)} {...named(label)} {...bind}>
      <StaticTraceFold
        {...rest}
        data={data}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        style={fillFor(style)}
      >
        {selected !== null && selected !== active ? outline(selected, true) : null}
        {active !== null ? outline(active, false) : null}
        {rest.children}
      </StaticTraceFold>
      <LiveRegion>{announced}</LiveRegion>
      {readout && span ? (
        <span
          className="mc-spark-readout"
          style={crosshairReadoutStyle(span.x + span.width / 2, width)}
        >
          {/* Depth is the span's own y-row and share is its own width — both are
              already on screen, so repeating them cost 31px past the cap to say
              nothing new. `, critical` was hardcoded English while
              `strings.traceCritical` was already used for the announcement. */}
          {`${span.label} ${fmt(span.duration)}${span.critical ? strings.traceCritical : ""}`}
        </span>
      ) : null}
    </span>
  );
}
