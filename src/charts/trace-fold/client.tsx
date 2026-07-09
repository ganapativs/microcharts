"use client";
// Interactive <TraceFold> (plan/25 §18). One pointer listener; span by row (y) +
// x lookup. ←/→ within a depth row, ↑/↓ between depths (2-D keyboard). Composes
// the static component (canon).
import { useCallback, useMemo, useState, type CSSProperties, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { EN_TRACE_FOLD } from "../../core/strings-trace-fold.js";
import { traceFoldGeometry, type SpanRect } from "./geometry.js";
import { TraceFold as StaticTraceFold, traceFoldSummary, type TraceFoldProps } from "./index.js";

const FILL: CSSProperties = { width: "100%", height: "auto" };

export function TraceFold(props: TraceFoldProps): React.ReactNode {
  const {
    data,
    width = 120,
    height: heightProp,
    format,
    locale,
    strings = EN_TRACE_FOLD,
    title,
    summary,
    ...rest
  } = props;

  const depthCount = Math.max(1, new Set(data.slice(0, 40).map((s) => s.depth)).size);
  const height = heightProp ?? Math.min(48, Math.max(16, depthCount * 10));
  const geo = useMemo(
    () => traceFoldGeometry({ data, width, height, rowGap: 1.2 }),
    [data, width, height],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);

  // group rects into depth rows, each sorted by start (x)
  const rows = useMemo(() => {
    const byY = new Map<number, SpanRect[]>();
    for (const r of geo.rects) {
      const arr = byY.get(r.y) ?? [];
      arr.push(r);
      byY.set(r.y, arr);
    }
    return [...byY.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, arr]) => arr.sort((p, q) => p.x - q.x));
  }, [geo]);

  const [pos, setPos] = useState<{ row: number; i: number } | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : traceFoldSummary(geo, strings, fmt);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const x = ((e.clientX - r.left) / r.width) * width;
      const y = ((e.clientY - r.top) / r.height) * height;
      for (let row = 0; row < rows.length; row++) {
        const i = rows[row]!.findIndex(
          (s) => y >= s.y && y <= s.y + s.height && x >= s.x && x <= s.x + s.width,
        );
        if (i >= 0) {
          setPos({ row, i });
          return;
        }
      }
      setPos(null);
    },
    [rows, width, height],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (rows.length === 0) return;
      setPos((prev) => {
        const cur = prev ?? { row: 0, i: 0 };
        switch (e.key) {
          case "ArrowRight":
            e.preventDefault();
            return { row: cur.row, i: Math.min(rows[cur.row]!.length - 1, cur.i + 1) };
          case "ArrowLeft":
            e.preventDefault();
            return { row: cur.row, i: Math.max(0, cur.i - 1) };
          case "ArrowDown": {
            e.preventDefault();
            const row = Math.min(rows.length - 1, cur.row + 1);
            return { row, i: Math.min(rows[row]!.length - 1, cur.i) };
          }
          case "ArrowUp": {
            e.preventDefault();
            const row = Math.max(0, cur.row - 1);
            return { row, i: Math.min(rows[row]!.length - 1, cur.i) };
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

  const span = pos ? rows[pos.row]?.[pos.i] : undefined;
  const announced = span
    ? strings.traceFoldAt(
        span.label,
        fmt(span.duration),
        `${Math.round(span.share * 100)}%`,
        span.depth,
        span.critical ? strings.traceCritical : "",
      )
    : "";

  return (
    <span
      className="mc-trace-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setPos(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setPos(null)}
    >
      <StaticTraceFold
        {...rest}
        data={data}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        style={FILL}
      >
        {span ? (
          <rect
            x={span.x - 0.4}
            y={span.y - 0.4}
            width={span.width + 0.8}
            height={span.height + 0.8}
            fill="none"
            stroke="var(--mc-accent)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
      </StaticTraceFold>
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
      {span ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${((span.x + span.width / 2) / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {`${span.label} ${fmt(span.duration)}`}
        </span>
      ) : null}
    </span>
  );
}
