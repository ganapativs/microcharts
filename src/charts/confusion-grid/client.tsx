"use client";
// Interactive <ConfusionGrid>. One pointer listener; cell by grid
// lookup. 2-D arrow roving (ActivityGrid model); Home/End jump the diagonal;
// click / Enter / Space selects a cell (onSelect). The live region reuses the
// FULL row/column labels — this entry is the full-label read-back path.
// useActivePicker owns interaction; the SVG is the composed static component.
import { useCallback, useMemo, useRef } from "react";
import {
  named,
  fillFor,
  useActivePicker,
  wrap,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { labelFont } from "../../core/labels.js";
import { EN_CONFUSION } from "../../core/strings-confusion.js";
import { confusionGridGeometry } from "./geometry.js";
import {
  ConfusionGrid as StaticConfusionGrid,
  confGeoAccuracy,
  confusionSummary,
  type ConfusionGridProps,
} from "./index.js";

export interface InteractiveConfusionGridProps extends ConfusionGridProps, PickerProps {
  /**
   * Opt-in entrance motion (default `false`): cells fade in on first
   * client-side mount. Inert on the server and on hydrated server HTML;
   * `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function ConfusionGrid(props: InteractiveConfusionGridProps): React.ReactNode {
  const {
    data,
    normalize = "row",
    label = "none",
    strings = EN_CONFUSION,
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
  // `defer` the diagonal/error emphasis ring into the closing VOICE act so it
  // pops AFTER the cells, not before. (It can't carry data-mc-ink="accent" —
  // a rect with that role gets a solid accent fill from the stylesheet and
  // loses its inset-stroke identity; the ring is tagged data-mc-ring="accent".)
  useEntrance(hostRef, "reveal", animate, { defer: 'rect[data-mc-ring="accent"]' });

  const { labels, counts } = data;
  // Mirror the static component's sizing EXACTLY (same k clamp, same default
  // size, same label font) — the overlay ring is drawn in the static's viewBox,
  // so any divergence here would park the ring off the cells it rings.
  const k = Math.max(2, Math.min(4, labels.length));
  const size = props.size ?? 54 + (k - 2) * 8;
  const fontSize = labelFont(size, 0.16);
  const gutterCh = fontSize + 1;
  // The accuracy readout takes a right gutter out of the PLOT (the viewBox
  // stays `size`), so the grid is laid out in `size - rightGutter`.
  const accLabel =
    (props.label ?? "none") === "accuracy"
      ? `${Math.round(confGeoAccuracy(counts, k) * 100)}%`
      : undefined;
  const rightGutter = accLabel ? accLabel.length * fontSize * 0.62 + 2 : 0;
  const geo = useMemo(
    () => confusionGridGeometry({ size: size - rightGutter, k, counts, normalize, gutterCh }),
    [size, rightGutter, k, counts, normalize, gutterCh],
  );

  // Pointer (viewBox space) → cell index: the cell whose rect contains the
  // point, `null` on the label gutter or between cells.
  const locate = useCallback(
    (x: number, y: number) => {
      const i = geo.cells.findIndex(
        (c) => x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.w,
      );
      return i < 0 ? null : i;
    },
    [geo],
  );

  // 2-D roving over the k×k matrix in reading order (index = row·k + col).
  // A boundary key is consumed (returns the current index) rather than ignored.
  const step = useCallback(
    (cur: number, key: string) => {
      switch (key) {
        case "Home":
          return 0;
        case "End":
          return k * k - 1;
        case "ArrowRight":
        case "ArrowLeft":
        case "ArrowDown":
        case "ArrowUp":
          break;
        default:
          return null;
      }
      if (cur < 0) return 0; // first arrow from nothing lands on cell 0
      const row = Math.floor(cur / k);
      const col = cur % k;
      if (key === "ArrowRight") return col < k - 1 ? cur + 1 : cur;
      if (key === "ArrowLeft") return col > 0 ? cur - 1 : cur;
      if (key === "ArrowDown") return row < k - 1 ? cur + k : cur;
      return row > 0 ? cur - k : cur;
    },
    [k],
  );

  // index = cell index in reading order (row·k + col, rows = actual classes).
  // `value` is the encoded number: the row-normalized share (null for an
  // all-zero row); `label` names the actual→predicted pair.
  const datum = useCallback(
    (i: number) => {
      const c = geo.cells[i];
      return {
        index: i,
        value: c?.share ?? null,
        label: c ? `${labels[c.row] ?? ""}→${labels[c.col] ?? ""}` : undefined,
      };
    },
    [geo, labels],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo.cells.length,
    width: size,
    height: size,
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
        : confusionSummary(data, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const ring = (i: number, pinned: boolean) => {
    const c = geo.cells[i];
    if (!c) return null;
    return (
      <rect
        x={c.x + 0.2}
        y={c.y + 0.2}
        width={c.w - 0.4}
        height={c.w - 0.4}
        rx={1}
        fill="none"
        stroke="var(--mc-accent)"
        strokeWidth={1.2}
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const cell = shown !== null ? geo.cells[shown] : undefined;
  const rowTotal = cell ? (geo.rowTotals[cell.row] ?? 0) : 0;
  const pct = cell && rowTotal > 0 ? `${Math.round((cell.count / rowTotal) * 100)}%` : "0%";
  const announced = cell ? strings.confusionAt(labels[cell.row]!, labels[cell.col]!, pct) : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-confusion-live", className, style)}
      {...named(ariaLabel)}
      {...bind}
    >
      <StaticConfusionGrid
        {...rest}
        data={data}
        normalize={normalize}
        label={label}
        strings={strings}
        summary={false}
        style={fillFor(style)}
      >
        {/* Pinned selection persists through pointer-leave; focus ring is transient. */}
        {selected !== null && selected !== active ? ring(selected, true) : null}
        {active !== null ? ring(active, false) : null}
        {rest.children}
      </StaticConfusionGrid>
      <LiveRegion>{announced}</LiveRegion>
      {cell ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${((cell.x + cell.w / 2) / size) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {`${labels[cell.row]}→${labels[cell.col]} ${pct}`}
        </span>
      ) : null}
    </span>
  );
}
