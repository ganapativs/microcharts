"use client";
// Interactive <PartitionStrip>. useActivePicker owns interaction: one pointer
// listener + segment lookup by row (y) then x, a custom 2-D `step` (←/→ within
// a row, ↑/↓ between a parent and its first child — ActivityGrid model), click /
// Enter / Space selects (onSelect). Composes the static component (canon).
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter, makePercentFormatter } from "../../core/format.js";
import {
  named,
  fillFor,
  nav1d,
  useActivePicker,
  wrap,
  crosshairReadoutStyle,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_PARTITION } from "../../core/strings-partition.js";
import { partitionStripGeometry } from "./geometry.js";
import {
  PartitionStrip as StaticPartitionStrip,
  partitionStripSummary,
  type PartitionStripProps,
} from "./index.js";

// Mirrors the static entry's palette cycle so a chip swatch can never disagree
// with the segment it points at.
const CAT_N = 6;

export interface InteractivePartitionStripProps extends PartitionStripProps, PickerProps {
  /**
   * Opt-in entrance motion (default `false`): both rows of segments fade in,
   * staggered, on first client-side mount. Inert on the server and on
   * hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function PartitionStrip(props: InteractivePartitionStripProps): React.ReactNode {
  const {
    data,
    labels = true,
    width = 120,
    height = 24,
    format,
    locale,
    strings = EN_PARTITION,
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
  // reveal by x (`order:"x"`) — DOM order interleaves the two rows, so a plain
  // index cascade breaks the vertical alignment channel; ordering by real x
  // makes both rows fade in L→R in lockstep, preserving parent↔child alignment.
  useEntrance(hostRef, "reveal", animate, {
    selector: 'rect[data-mc-cat], rect[data-mc-ink="accent"], rect[data-mc-ink="neutral"]',
    order: "x",
  });

  const geo = useMemo(
    () => partitionStripGeometry({ data, width, height, gap: 1 }),
    [data, width, height],
  );
  const segs = geo.segments;
  const inset = 0.5;
  const rowH = (height - inset * 2 - 1) / 2;
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  // Shares through a real percent formatter, not `${Math.round(x*100)}%` — the
  // hand-rolled form hardcodes the sign and its spacing (fr-FR writes "12 %"),
  // which is the same visible-chip i18n leak fixed on SegmentedBar.
  const pctFmt = useMemo(() => makePercentFormatter(locale), [locale]);

  const locate = useCallback(
    (x: number, y: number) => {
      const row = y < inset + rowH + 0.5 ? 0 : 1;
      const i = segs.findIndex((s) => s.row === row && x >= s.x && x <= s.x + s.width);
      return i >= 0 ? i : null;
    },
    [segs, rowH],
  );
  // Unit = flat index into `geo.segments` (parents and children interleaved in
  // layout order) — the strip rolls a two-level tree into one segment list, so
  // the unit is the SEGMENT position, not an index into `data`.
  const datum = useCallback(
    (i: number) => {
      const s = segs[i];
      if (!s) return { index: i, value: null };
      const parent =
        s.parent && s.parentShare != null
          ? strings.partitionParent(pctFmt(s.parentShare), s.parent)
          : "";
      return {
        index: i,
        value: s.share,
        label: s.label,
        formatted: `${s.label} ${fmt(s.value)} (${pctFmt(s.share)})${parent}`,
      };
    },
    [segs, strings, fmt, pctFmt],
  );
  // 2-D nav: ←/→ stay inside the current row (the comparison channel is
  // alignment, so crossing rows sideways would be a lie); ↑/↓ walk the
  // parent↔first-child link. Home/End fall back to the 1-D default.
  const step = useCallback(
    (cur: number, key: string) => {
      if (key !== "ArrowLeft" && key !== "ArrowRight" && key !== "ArrowUp" && key !== "ArrowDown") {
        return nav1d(cur, segs.length, key);
      }
      if (cur < 0) return 0; // first arrow lands on unit 0
      const s = segs[cur];
      if (!s) return null;
      if (key === "ArrowLeft" || key === "ArrowRight") {
        const dir = key === "ArrowRight" ? 1 : -1;
        for (let i = cur + dir; i >= 0 && i < segs.length; i += dir) {
          if (segs[i]!.row === s.row) return i;
        }
        return cur; // row boundary: consume the key without moving
      }
      if (key === "ArrowDown") {
        if (s.row === 1) return cur;
        const i = segs.findIndex((t) => t.row === 1 && t.parent === s.label);
        return i >= 0 ? i : cur;
      }
      if (s.row === 0) return cur;
      const i = segs.findIndex((t) => t.row === 0 && t.label === s.parent);
      return i >= 0 ? i : cur;
    },
    [segs],
  );

  const { active, selected, bind } = useActivePicker({
    count: segs.length,
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
        : partitionStripSummary(data, strings, pctFmt);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const outline = (i: number, pinned: boolean) => {
    const s = segs[i];
    if (!s) return null;
    const y = s.row === 0 ? inset : inset + rowH + 1;
    return (
      <rect
        x={s.x - 0.5}
        y={y - 0.5}
        width={s.width + 1}
        height={rowH + 1}
        fill="none"
        stroke="var(--mc-accent)"
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const seg = shown !== null ? segs[shown] : undefined;
  // The chip swatch must repaint EXACTLY what the mark paints, or it points at
  // the wrong rectangle. Under `emphasis` the static swaps roles: the
  // emphasised node is accent, out-of-lineage nodes are neutral, and only the
  // lineage keeps its category colour — same branch, same emphGroup lookup.
  const emphasis = rest.emphasis;
  const emphGroup = emphasis ? segs.find((s) => s.label === emphasis)?.group : undefined;
  const swatch = (s: (typeof segs)[number]): string => {
    if (emphasis) {
      if (s.label === emphasis) return "var(--mc-accent)";
      if (s.group !== emphGroup) return "var(--mc-neutral)";
    }
    return rest.colors
      ? (rest.colors[s.group % rest.colors.length] as string)
      : `var(--mc-cat-${(s.group % CAT_N) + 1})`;
  };
  const parentClause =
    seg?.parent && seg.parentShare != null
      ? strings.partitionParent(pctFmt(seg.parentShare), seg.parent)
      : "";
  // The node's own value leads, its share follows. A share is derived; the
  // value is what the caller handed us, and nothing else on screen carries it.
  const announced = seg
    ? strings.partitionAt(seg.label, pctFmt(seg.share), parentClause, fmt(seg.value))
    : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-partition-live", className, style)}
      {...named(label)}
      {...bind}
    >
      <StaticPartitionStrip
        {...rest}
        data={data}
        labels={labels}
        width={width}
        height={height}
        strings={strings}
        summary={false}
        style={fillFor(style)}
      >
        {selected !== null && selected !== active ? outline(selected, true) : null}
        {active !== null ? outline(active, false) : null}
        {rest.children}
      </StaticPartitionStrip>
      <LiveRegion>{announced}</LiveRegion>
      {readout && seg ? (
        // Rows, not one line: the node's own value + share and — for a child —
        // its parent's share of it. As a single nowrap line that ran 28
        // characters and ellipsized at the chart's own width (the containment
        // suite measured 7px of overflow); stacked, the chip is only as wide as
        // its widest row. The parent row sits under the child exactly as the
        // parent BAR sits over it in the strip.
        <span
          className="mc-spark-readout mc-readout-rows"
          style={crosshairReadoutStyle(seg.x + seg.width / 2, width)}
        >
          <span
            className="mc-readout-key"
            data-mc-cat={(seg.group % CAT_N) + 1}
            style={{ background: swatch(seg) }}
          />
          <span className="mc-readout-name">{seg.label}</span>
          <span className="mc-readout-val">{`${fmt(seg.value)} (${pctFmt(seg.share)})`}</span>
          {seg.parent !== null && seg.parentShare !== null ? (
            <>
              <span />
              <span className="mc-readout-name">{seg.parent}</span>
              <span className="mc-readout-val">{pctFmt(seg.parentShare)}</span>
            </>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
