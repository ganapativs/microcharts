"use client";
// Interactive <ConfusionGrid>. One pointer listener; cell by grid
// lookup. 2-D arrow roving (ActivityGrid model); Home/End jump the diagonal;
// click / Enter / Space selects a cell (onSelect). The live region reuses
// FULL row/column labels — this entry is the full-label read-back path.
// useActivePicker owns interaction; the composed static component.
import { useCallback, useMemo, useRef } from "react";
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
import { labelFont } from "../../core/labels.js";
import { makeFormatter } from "../../core/format.js";
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
  // Measure the gutter off the SAME formatter string the static renders, so a
  // locale that widens the percent (fr-FR "50 %") keeps ring and cells aligned.
  const accLabel =
    (props.label ?? "none") === "accuracy"
      ? makeFormatter(props.format, props.locale, { style: "percent", maximumFractionDigits: 0 })(
          confGeoAccuracy(counts, k),
        )
      : undefined;
  const rightGutter = accLabel ? accLabel.length * fontSize * 0.62 + 2 : 0;
  const geo = useMemo(
    () => confusionGridGeometry({ size: size - rightGutter, k, counts, normalize, gutterCh }),
    [size, rightGutter, k, counts, normalize, gutterCh],
  );

  // Same locale-aware percent formatter the static entry renders the accuracy
  // label with — so the chip and announcement don't drift from "50 %" (fr-FR).
  const pctFmt = useMemo(
    () => makeFormatter(props.format, props.locale, { style: "percent", maximumFractionDigits: 0 }),
    [props.format, props.locale],
  );
  // Cell tallies are cardinal integers, not axis values — group them with the
  // locale but never with the value `format`, which is the percent format here.
  const countFmt = useMemo(
    () => makeFormatter(undefined, props.locale, { maximumFractionDigits: 0 }),
    [props.locale],
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
      const rt = c ? (geo.rowTotals[c.row] ?? 0) : 0;
      return {
        index: i,
        value: c?.share ?? null,
        label: c ? `${labels[c.row] ?? ""}→${labels[c.col] ?? ""}` : undefined,
        formatted: c
          ? `${labels[c.row]}→${labels[c.col]} ${pctFmt(rt > 0 ? c.count / rt : 0)} (${countFmt(c.count)})`
          : undefined,
      };
    },
    [geo, labels, pctFmt, countFmt],
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
        : confusionSummary(data, strings, pctFmt);
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
  const pct = pctFmt(cell && rowTotal > 0 ? cell.count / rowTotal : 0);
  // The tally, not just its row share. `counts` IS the data the caller passed,
  // and a row-normalized percentage cannot be inverted back to it without the
  // row total — so "12%" alone dropped the only number the user actually gave
  // us, from the chip AND the announcement.
  const count = cell ? countFmt(cell.count) : "";
  const announced = cell
    ? strings.confusionAt(labels[cell.row]!, labels[cell.col]!, pct, count)
    : "";

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
        {selected !== null && selected !== active ? ring(selected, true) : null}
        {active !== null ? ring(active, false) : null}
        {rest.children}
      </StaticConfusionGrid>
      <LiveRegion>{announced}</LiveRegion>
      {readout && cell ? (
        <span className="mc-spark-readout" style={crosshairReadoutStyle(cell.x + cell.w / 2, size)}>
          {`${labels[cell.row]}→${labels[cell.col]} ${pct} (${count})`}
        </span>
      ) : null}
    </span>
  );
}
