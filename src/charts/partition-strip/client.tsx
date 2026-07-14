"use client";
// Interactive <PartitionStrip>. One pointer listener; segment by
// row (y) + x lookup. ←/→ within a row, ↑/↓ between a parent and its first child
// (2-D keyboard, ActivityGrid model). Composes the static component (canon).
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { useEntrance } from "../../shared/motion-gate.js";
import { EN_PARTITION } from "../../core/strings-partition.js";
import { partitionStripGeometry, type PartitionSegment } from "./geometry.js";
import {
  PartitionStrip as StaticPartitionStrip,
  partitionStripSummary,
  type PartitionStripProps,
} from "./index.js";

const FILL: CSSProperties = { width: "100%", height: "auto" };

export interface InteractivePartitionStripProps extends PartitionStripProps {
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
  const rows = useMemo<[PartitionSegment[], PartitionSegment[]]>(
    () => [geo.segments.filter((s) => s.row === 0), geo.segments.filter((s) => s.row === 1)],
    [geo],
  );
  const inset = 0.5;
  const rowH = (height - inset * 2 - 1) / 2;
  const [active, setActive] = useState<{ row: 0 | 1; i: number } | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : partitionStripSummary(data, strings);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const x = ((e.clientX - r.left) / r.width) * width;
      const y = ((e.clientY - r.top) / r.height) * height;
      const row: 0 | 1 = y < inset + rowH + 0.5 ? 0 : 1;
      const seg = rows[row].findIndex((s) => x >= s.x && x <= s.x + s.width);
      if (seg >= 0) setActive({ row, i: seg });
      else setActive(null);
    },
    [width, height, rowH, rows],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      setActive((prev) => {
        const cur = prev ?? { row: 0 as 0 | 1, i: 0 };
        const seg = rows[cur.row][cur.i];
        switch (e.key) {
          case "ArrowRight":
            e.preventDefault();
            return { row: cur.row, i: Math.min(rows[cur.row].length - 1, cur.i + 1) };
          case "ArrowLeft":
            e.preventDefault();
            return { row: cur.row, i: Math.max(0, cur.i - 1) };
          case "ArrowDown": {
            e.preventDefault();
            if (cur.row === 1 || !seg) return prev;
            const firstChild = rows[1].findIndex((s) => s.parent === seg.label);
            return firstChild >= 0 ? { row: 1, i: firstChild } : prev;
          }
          case "ArrowUp": {
            e.preventDefault();
            if (cur.row === 0 || !seg) return prev;
            const parentIdx = rows[0].findIndex((s) => s.label === seg.parent);
            return parentIdx >= 0 ? { row: 0, i: parentIdx } : prev;
          }
          case "Escape":
            return null;
          default:
            return prev;
        }
      });
    },
    [rows],
  );

  const seg = active ? rows[active.row][active.i] : undefined;
  const pctOf = (s: number) => `${Math.round(s * 100)}%`;
  const parentClause =
    seg?.parent && seg.parentShare != null
      ? strings.partitionParent(pctOf(seg.parentShare), seg.parent)
      : "";
  const announced = seg ? strings.partitionAt(seg.label, pctOf(seg.share), parentClause) : "";
  const y = seg ? (seg.row === 0 ? inset : inset + rowH + 1) : 0;

  return (
    <span
      ref={hostRef}
      className="mc-partition-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticPartitionStrip
        {...rest}
        data={data}
        labels={labels}
        width={width}
        height={height}
        strings={strings}
        summary={false}
        style={FILL}
      >
        {seg ? (
          <rect
            x={seg.x - 0.5}
            y={y - 0.5}
            width={seg.width + 1}
            height={rowH + 1}
            fill="none"
            stroke="var(--mc-accent)"
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
      </StaticPartitionStrip>
      <span
        aria-live="polite"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
        }}
      >
        {announced}
      </span>
      {seg ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${((seg.x + seg.width / 2) / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {`${seg.label} ${pctOf(seg.share)}`}
        </span>
      ) : null}
    </span>
  );
}
