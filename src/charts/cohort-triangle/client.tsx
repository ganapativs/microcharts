"use client";
// Interactive <CohortTriangle>. The heatmap interaction: hover a
// cell for its retention, or roving-focus the block and walk it in 2-D with the
// arrow keys; click / Enter / Space selects a cell (onSelect). useActivePicker
// owns interaction (one wrapper listener + pure ragged-grid math), composing the
// static component (summary={false}, focus + pin rings as its children).
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { FILL, useActivePicker, wrap, type PickerProps } from "../../shared/interactive.js";
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

export interface InteractiveCohortTriangleProps extends CohortTriangleProps, PickerProps {
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
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
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

  const w = Math.max(geo.width, 1);
  const h = Math.max(geo.height, 1);

  // The triangle is RAGGED: cells are emitted row-major but each cohort row has
  // its own length. One pass gives each row its first cell index + length —
  // enough for both the pointer lookup and clamped 2-D roving, with no per-cell
  // DOM node and no Map allocation per keystroke.
  const rowSpans = useMemo(() => {
    const start = Array.from<number>({ length: geo.rows }).fill(-1);
    const len = Array.from<number>({ length: geo.rows }).fill(0);
    geo.cells.forEach((c, i) => {
      if (start[c.row] === -1) start[c.row] = i;
      len[c.row]!++;
    });
    return { start, len };
  }, [geo]);

  // Pointer (viewBox space) → cell index; `null` on the label gutter or past a
  // ragged row's last observed age.
  const locate = useCallback(
    (x: number, y: number) => {
      const col = Math.floor((x - geo.gutter) / geo.step);
      const row = Math.floor(y / geo.step);
      if (row < 0 || row >= geo.rows || col < 0 || col >= (rowSpans.len[row] ?? 0)) return null;
      return rowSpans.start[row]! + col;
    },
    [geo, rowSpans],
  );

  // 2-D roving over the ragged triangle: ←/→ clamp inside the cohort row,
  // ↑/↓ clamp to the target row's last observed age. A boundary key is consumed
  // (returns the current index) rather than ignored.
  const step = useCallback(
    (cur: number, key: string) => {
      const n = geo.cells.length;
      if (n === 0) return null;
      switch (key) {
        case "Home":
          return 0;
        case "End":
          return n - 1;
        case "ArrowRight":
        case "ArrowLeft":
        case "ArrowDown":
        case "ArrowUp":
          break;
        default:
          return null;
      }
      if (cur < 0) return 0; // first arrow from nothing lands on cell 0
      const c = geo.cells[cur];
      if (!c) return 0;
      if (key === "ArrowRight") return c.col < (rowSpans.len[c.row] ?? 0) - 1 ? cur + 1 : cur;
      if (key === "ArrowLeft") return c.col > 0 ? cur - 1 : cur;
      const row = key === "ArrowDown" ? c.row + 1 : c.row - 1;
      const len = row < 0 || row >= geo.rows ? 0 : (rowSpans.len[row] ?? 0);
      if (len === 0) return cur;
      return rowSpans.start[row]! + Math.min(c.col, len - 1);
    },
    [geo, rowSpans],
  );

  // index = cell index in reading order (row-major over the RAGGED triangle:
  // cohort 0's ages, then cohort 1's, … — not a rectangular row·cols index).
  // `value` is the normalized retention 0–1 (null for a measured-but-missing
  // slot); `label` is the cohort's name.
  const datum = useCallback(
    (i: number) => {
      const c = geo.cells[i];
      return {
        index: i,
        value: c?.value ?? null,
        label: c ? data[c.row]?.label : undefined,
      };
    },
    [geo, data],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo.cells.length,
    width: w,
    height: h,
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
        : cohortTriangleSummary(geo, strings, fmt, unit);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const ring = (i: number, pinned: boolean) => {
    const c = geo.cells[i];
    if (!c) return null;
    return (
      <rect
        x={c.x - 0.5}
        y={c.y - 0.5}
        width={cell + 1}
        height={cell + 1}
        rx={1.5}
        fill="none"
        stroke="var(--mc-accent)"
        strokeWidth={1.5}
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const shownCell = shown !== null ? geo.cells[shown] : undefined;
  const cohortLabel = shownCell ? (data[shownCell.row]?.label ?? "") : "";
  const announced =
    shownCell === undefined
      ? ""
      : shownCell.value === null
        ? strings.cohortTriangleEmpty(cohortLabel, unit, shownCell.col)
        : strings.cohortTriangleAt(cohortLabel, unit, shownCell.col, fmt(shownCell.value));

  return (
    <span
      ref={hostRef}
      {...wrap("mc-cohort-interactive", className, style)}
      tabIndex={0}
      role="img"
      aria-label={label}
      {...bind}
    >
      <StaticCohortTriangle
        {...rest}
        style={FILL}
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
        {/* Pinned selection persists through pointer-leave; focus ring is transient. */}
        {selected !== null && selected !== active ? ring(selected, true) : null}
        {active !== null ? ring(active, false) : null}
        {rest.children}
      </StaticCohortTriangle>
      <LiveRegion>{announced}</LiveRegion>
      {shownCell ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${((shownCell.x + cell / 2) / w) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {shownCell.value === null
            ? `${cohortLabel} cohort, ${unit} ${shownCell.col}: —`
            : `${cohortLabel} cohort, ${unit} ${shownCell.col}: ${fmt(shownCell.value)}`}
        </span>
      ) : null}
    </span>
  );
}
