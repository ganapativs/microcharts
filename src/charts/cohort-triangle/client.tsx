"use client";
// Interactive <CohortTriangle>. The heatmap interaction: hover a
// cell for its retention, or roving-focus the block and walk it in 2-D with the
// arrow keys. Composes the static component (summary={false}, focus ring as its
// child), one pointer listener on the wrapper, announcements via CohortTriangleStrings.
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { makeFormatter } from "../../core/format.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import {
  EN_COHORT_TRIANGLE,
  type CohortTriangleStrings,
} from "../../core/strings-cohort-triangle.js";
import { cohortTriangleGeometry, PCT_FORMAT } from "./geometry.js";
import {
  CohortTriangle as StaticCohortTriangle,
  cohortTriangleSummary,
  type CohortTriangleProps,
} from "./index.js";

// 2-D roving deltas keyed by arrow — [Δrow, Δcol] (ActivityGrid nav pattern).
const ARROWS: Record<string, [number, number]> = {
  ArrowRight: [0, 1],
  ArrowLeft: [0, -1],
  ArrowDown: [1, 0],
  ArrowUp: [-1, 0],
};

export interface InteractiveCohortTriangleProps extends CohortTriangleProps {
  /** Swappable announcement strings (defaults to EN). */
  strings?: CohortTriangleStrings;
  /**
   * Opt-in entrance motion (default `false`): the cells reveal on when the
   * chart first mounts client-side. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function CohortTriangle(props: InteractiveCohortTriangleProps): React.ReactNode {
  const {
    data,
    cell = 9,
    gap = 2,
    labels = true,
    highlight,
    unit = "period",
    format = PCT_FORMAT,
    locale,
    strings = EN_COHORT_TRIANGLE,
    title,
    summary,
    className,
    style,
    animate = false,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  // reveal by age COLUMN (`order:"x"`) — the maturity/age axis is the
  // comparison, so cells should cascade left→right across ages, not in DOM
  // row-major order (which would sweep cohort-by-cohort and fight the axis).
  useEntrance(hostRef, "reveal", animate, { selector: 'rect[data-mc-ink="cell"]', order: "x" });

  const geo = useMemo(
    () => cohortTriangleGeometry(data, { cell, gap, labels, highlight }),
    [data, cell, gap, labels, highlight],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const [active, setActive] = useState<number | null>(null);

  const w = Math.max(geo.width, 1);
  const h = Math.max(geo.height, 1);

  // (row,col) → cell index — ragged lookup for 2-D keyboard + pointer nav.
  const cellAt = useMemo(() => {
    const m = new Map<string, number>();
    geo.cells.forEach((c, i) => m.set(`${c.row},${c.col}`, i));
    return m;
  }, [geo]);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : cohortTriangleSummary(geo, strings, fmt, unit);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (geo.cells.length === 0) return;
      if (e.key === "Escape") return setActive(null);
      if (e.key === "Home") {
        e.preventDefault();
        return setActive(0);
      }
      if (e.key === "End") {
        e.preventDefault();
        return setActive(geo.cells.length - 1);
      }
      const d = ARROWS[e.key];
      if (!d) return;
      e.preventDefault();
      if (active === null) return setActive(0);
      const cur = geo.cells[active]!;
      const next = cellAt.get(`${cur.row + d[0]},${cur.col + d[1]}`);
      if (next !== undefined) setActive(next);
    },
    [active, geo, cellAt],
  );

  // ONE listener on the wrapper; cell lookup is pure grid math.
  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = ((e.clientX - rect.left) / rect.width) * w;
      const y = ((e.clientY - rect.top) / rect.height) * h;
      const col = Math.floor((x - geo.gutter) / geo.step);
      const row = Math.floor(y / geo.step);
      const idx = cellAt.get(`${row},${col}`);
      setActive(idx ?? null);
    },
    [w, h, geo, cellAt],
  );

  const activeCell = active !== null ? geo.cells[active] : undefined;
  const cohortLabel = activeCell ? (data[activeCell.row]?.label ?? "") : "";
  const announced =
    activeCell === undefined
      ? ""
      : activeCell.value === null
        ? strings.cohortTriangleEmpty(cohortLabel, unit, activeCell.col)
        : strings.cohortTriangleAt(cohortLabel, unit, activeCell.col, fmt(activeCell.value));

  const wrapStyle: CSSProperties = {
    display: "inline-block",
    position: "relative",
    lineHeight: 0,
    ...style,
  };

  return (
    <span
      ref={hostRef}
      className={className ? `mc-cohort-interactive ${className}` : "mc-cohort-interactive"}
      style={wrapStyle}
      tabIndex={0}
      role="img"
      aria-label={label}
      onKeyDown={onKeyDown}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onBlur={() => setActive(null)}
    >
      <StaticCohortTriangle
        {...rest}
        data={data}
        cell={cell}
        gap={gap}
        labels={labels}
        highlight={highlight}
        unit={unit}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {activeCell ? (
          <rect
            x={activeCell.x - 0.5}
            y={activeCell.y - 0.5}
            width={cell + 1}
            height={cell + 1}
            rx={1.5}
            fill="none"
            stroke="var(--mc-accent)"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticCohortTriangle>
      <LiveRegion>{announced}</LiveRegion>
      {activeCell ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${((activeCell.x + cell / 2) / w) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {activeCell.value === null ? "—" : fmt(activeCell.value)}
        </span>
      ) : null}
    </span>
  );
}
