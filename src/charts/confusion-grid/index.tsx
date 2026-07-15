// <ConfusionGrid> — where do the errors go, the one thing accuracy-as-a-number
// hides. Static, hook-free, RSC-safe. A k×k agreement
// matrix (rows = actual, columns = predicted); cell ink = row-normalized share,
// the diagonal accented by SHAPE (an inset stroke), never color-alone. Accuracy
// is off by default and never leaves the grid.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { labelFont } from "../../core/labels.js";
import { devWarn } from "../../core/dev.js";
import type { Format } from "../../core/format.js";
import { EN_CONFUSION, type ConfusionStrings } from "../../core/strings-confusion.js";
import { confusionGridGeometry } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

export interface ConfusionGridDatum {
  labels: readonly string[];
  counts: readonly (readonly number[])[];
}

export interface ConfusionGridProps {
  data: ConfusionGridDatum;
  /** `"row"` = recall view (of the actual X, where did predictions go?). */
  normalize?: "row" | "none" | undefined;
  /** `"errors"` accents the largest off-diagonal cell instead of the diagonal. */
  accent?: "diagonal" | "errors" | undefined;
  /** Overall accuracy % in the gutter — off by default (opt-in). */
  label?: "accuracy" | "none" | undefined;
  /** Cell shape (shared vocabulary). */
  shape?: "square" | "round" | undefined;
  size?: number | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: ConfusionStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

/** Shared summary — accuracy + the worst confusion (row-normalized phrasing).
 *  Clamps to the same k ≤ 4 the visual renders (see the component's `kk`) —
 *  otherwise a k > 4 matrix would announce an accuracy/confusion the grid
 * itself never shows, a real accessible-name/visual mismatch. */
export function confusionSummary(data: ConfusionGridDatum, strings: ConfusionStrings): string {
  const { labels, counts } = data;
  const k = Math.max(2, Math.min(4, labels.length));
  if (labels.length < 2 || counts.length === 0) return strings.noData;
  const geo = confusionGridGeometry({ size: 48, k, counts, normalize: "row", gutterCh: 6 });
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  const acc = pct(geo.accuracy);
  const emptyRows = geo.rowTotals
    .map((t, i) => (t === 0 ? labels[i]! : null))
    .filter((x): x is string => x != null);
  let s: string;
  if (geo.maxErrorCell) {
    const { row, col } = geo.maxErrorCell;
    const cell = geo.cells.find((c) => c.row === row && c.col === col)!;
    s = strings.confusion(acc, labels[row]!, labels[col]!, pct(cell.share ?? 0));
  } else {
    s = strings.confusionPerfect(acc);
  }
  if (emptyRows.length > 0) {
    s += ` ${emptyRows.map((cls) => cap(strings.confusionEmpty(cls))).join(". ")}.`;
  }
  return s;
}

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export function ConfusionGrid(props: ConfusionGridProps): ReactNode {
  const {
    data,
    normalize = "row",
    accent = "diagonal",
    label = "none",
    shape = "square",
    strings = EN_CONFUSION,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const { labels, counts } = data;
  const k = labels.length;
  if (k < 2) devWarn("<ConfusionGrid> needs at least a 2×2 matrix (k ≥ 2).");
  if (k > 4) devWarn("<ConfusionGrid> k > 4 rejected — legibility bar (use a full-size heatmap).");
  if (counts.some((row) => row.length !== k))
    devWarn("<ConfusionGrid> counts must be a square k×k matrix.");
  const kk = Math.max(2, Math.min(4, k));

  const size = props.size ?? 54 + (kk - 2) * 8;
  const fontSize = labelFont(size, 0.16);
  const gutterCh = fontSize + 1;
  const accLabel =
    label === "accuracy" ? `${Math.round(confGeoAccuracy(counts, kk) * 100)}%` : undefined;
  const rightGutter = accLabel ? accLabel.length * fontSize * 0.62 + 2 : 0;

  const geo = confusionGridGeometry({
    size: size - rightGutter,
    k: kk,
    counts,
    normalize,
    gutterCh,
  });
  const accName = resolveSummary(summary, () => confusionSummary(data, strings));

  return (
    <Chart
      width={size}
      height={size}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-confusion ${className}` : "mc-confusion"}
      style={{ ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties}
    >
      {/* flat siblings, plain attributes — the k² cell list + axis labels are
          this chart's SSR hot path (bench floor); no per-cell <g> wrappers */}
      {geo.cells.flatMap((c) => {
        const emphasized =
          accent === "errors"
            ? geo.maxErrorCell?.row === c.row && geo.maxErrorCell?.col === c.col
            : c.diagonal;
        const rx = shape === "round" ? c.w / 2 : 0.5;
        const key = `${c.row}-${c.col}`;
        if (c.share == null) {
          // empty row → hollow "measured nothing here" cell
          return [
            <rect
              key={key}
              x={c.x + 0.4}
              y={c.y + 0.4}
              width={c.w - 0.8}
              height={c.w - 0.8}
              rx={rx}
              data-mc-ink="unit-off"
            />,
          ];
        }
        const nodes = [
          <rect
            key={key}
            x={c.x + 0.4}
            y={c.y + 0.4}
            width={c.w - 0.8}
            height={c.w - 0.8}
            rx={rx}
            data-mc-ink="cell"
            fillOpacity={c.count > 0 ? Math.max(0.08, c.share) : 0}
          />,
        ];
        if (emphasized)
          nodes.push(
            <rect
              key={`ring-${key}`}
              x={c.x + 1}
              y={c.y + 1}
              width={c.w - 2}
              height={c.w - 2}
              rx={shape === "round" ? (c.w - 2) / 2 : 0.5}
              fill="none"
              // rect isn't covered by the accent ink-role's path/line/polyline
              // element-split, so a plain data-mc-ink="accent" would have its
              // fill="none" beaten by the role's `fill: var(--mc-accent)` and
              // paint a solid square instead of the documented inset stroke —
              // stroke directly, keep a role-free marker for the ring's identity
              stroke="var(--mc-accent)"
              data-mc-w="support"
              data-mc-ring="accent"
              vectorEffect="non-scaling-stroke"
            />,
          );
        return nodes;
      })}

      {/* first-character axis labels: columns (predicted) on top, rows (actual) left */}
      {labels.slice(0, kk).flatMap((lab, i) => {
        const cellW = (size - rightGutter - gutterCh - 1) / kk;
        const c = round2(gutterCh + cellW * (i + 0.5));
        return [
          <text
            key={`col-${i}`}
            x={c}
            y={round2(gutterCh * 0.55)}
            dominantBaseline="central"
            textAnchor="middle"
            fontSize={fontSize}
            data-mc-ink="label"
          >
            {lab.charAt(0)}
          </text>,
          <text
            key={`row-${i}`}
            x={round2(gutterCh * 0.5)}
            y={c}
            dominantBaseline="central"
            textAnchor="middle"
            fontSize={fontSize}
            data-mc-ink="label"
          >
            {lab.charAt(0)}
          </text>,
        ];
      })}
      {accLabel ? (
        <text
          x={size - 1}
          y={size / 2}
          dominantBaseline="central"
          textAnchor="end"
          fontSize={fontSize}
          data-mc-ink="label"
        >
          {accLabel}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}

function confGeoAccuracy(counts: readonly (readonly number[])[], k: number): number {
  let trace = 0;
  let total = 0;
  for (let r = 0; r < k; r++)
    for (let c = 0; c < k; c++) {
      const v = counts[r]?.[c] ?? 0;
      const n = Number.isFinite(v) && v > 0 ? v : 0;
      total += n;
      if (r === c) trace += n;
    }
  return total > 0 ? trace / total : 0;
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
