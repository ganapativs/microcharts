"use client";
// Interactive <PartitionStrip>. useActivePicker owns interaction: one pointer
// listener + segment lookup by row (y) then x, a custom 2-D `step` (←/→ within
// a row, ↑/↓ between a parent and its first child — ActivityGrid model), click /
// Enter / Space selects (onSelect). Composes the static component (canon).
import { useCallback, useMemo, useRef } from "react";
import {
  named,
  fillFor,
  nav1d,
  useActivePicker,
  wrap,
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
    strings = EN_PARTITION,
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
      return { index: i, value: s ? s.share : null, label: s?.label };
    },
    [segs],
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
        : partitionStripSummary(data, strings);
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
  const pctOf = (s: number) => `${Math.round(s * 100)}%`;
  const parentClause =
    seg?.parent && seg.parentShare != null
      ? strings.partitionParent(pctOf(seg.parentShare), seg.parent)
      : "";
  const announced = seg ? strings.partitionAt(seg.label, pctOf(seg.share), parentClause) : "";

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
        {/* Pinned selection persists through pointer-leave; focus outline is transient. */}
        {selected !== null && selected !== active ? outline(selected, true) : null}
        {active !== null ? outline(active, false) : null}
        {rest.children}
      </StaticPartitionStrip>
      <LiveRegion>{announced}</LiveRegion>
      {seg ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${((seg.x + seg.width / 2) / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {`${seg.label} ${pctOf(seg.share)}${parentClause}`}
        </span>
      ) : null}
    </span>
  );
}
