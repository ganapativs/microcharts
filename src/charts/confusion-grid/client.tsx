"use client";
// Interactive <ConfusionGrid> (plan/25 §21). One pointer listener; cell by grid
// lookup. 2-D arrow roving (ActivityGrid model); Home/End jump the diagonal. The
// live region reuses the FULL row/column labels — this entry is the full-label
// read-back path. Composes the static component (canon).
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { useEntrance } from "../../shared/motion-gate.js";
import { EN_CONFUSION } from "../../core/strings-confusion.js";
import { confusionGridGeometry } from "./geometry.js";
import {
  ConfusionGrid as StaticConfusionGrid,
  confusionSummary,
  type ConfusionGridProps,
} from "./index.js";

const FILL: CSSProperties = { width: "100%", height: "auto" };

export interface InteractiveConfusionGridProps extends ConfusionGridProps {
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
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "reveal", animate);

  const { labels, counts } = data;
  const k = Math.max(2, Math.min(4, labels.length));
  const size = props.size ?? 40 + (k - 2) * 4;
  const fontSize = Math.max(5, Math.min(Math.round(size * 0.16), 7));
  const gutterCh = fontSize + 1;
  const geo = useMemo(
    () => confusionGridGeometry({ size, k, counts, normalize, gutterCh }),
    [size, k, counts, normalize, gutterCh],
  );
  const [active, setActive] = useState<{ row: number; col: number } | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : confusionSummary(data, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const cellOf = (row: number, col: number) =>
    geo.cells.find((c) => c.row === row && c.col === col);

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const x = ((e.clientX - r.left) / r.width) * size;
      const y = ((e.clientY - r.top) / r.height) * size;
      const cell = geo.cells.find((c) => x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.w);
      setActive(cell ? { row: cell.row, col: cell.col } : null);
    },
    [geo, size],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      setActive((prev) => {
        const cur = prev ?? { row: 0, col: 0 };
        switch (e.key) {
          case "ArrowRight":
            e.preventDefault();
            return { row: cur.row, col: Math.min(k - 1, cur.col + 1) };
          case "ArrowLeft":
            e.preventDefault();
            return { row: cur.row, col: Math.max(0, cur.col - 1) };
          case "ArrowDown":
            e.preventDefault();
            return { row: Math.min(k - 1, cur.row + 1), col: cur.col };
          case "ArrowUp":
            e.preventDefault();
            return { row: Math.max(0, cur.row - 1), col: cur.col };
          case "Home":
            e.preventDefault();
            return { row: 0, col: 0 };
          case "End":
            e.preventDefault();
            return { row: k - 1, col: k - 1 };
          case "Escape":
            return null;
          default:
            return prev;
        }
      });
    },
    [k],
  );

  const cell = active ? cellOf(active.row, active.col) : undefined;
  const rowTotal = active ? geo.rowTotals[active.row]! : 0;
  const pct = cell && rowTotal > 0 ? `${Math.round((cell.count / rowTotal) * 100)}%` : "0%";
  const announced =
    cell && active ? strings.confusionAt(labels[active.row]!, labels[active.col]!, pct) : "";

  return (
    <span
      ref={hostRef}
      className="mc-confusion-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticConfusionGrid
        {...rest}
        data={data}
        normalize={normalize}
        label={label}
        strings={strings}
        summary={false}
        style={FILL}
      >
        {cell ? (
          <rect
            x={cell.x + 0.2}
            y={cell.y + 0.2}
            width={cell.w - 0.4}
            height={cell.w - 0.4}
            rx={1}
            fill="none"
            stroke="var(--mc-accent)"
            strokeWidth={1.2}
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
      </StaticConfusionGrid>
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
      {cell ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${((cell.x + cell.w / 2) / size) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {`${labels[active!.row]}→${labels[active!.col]} ${pct}`}
        </span>
      ) : null}
    </span>
  );
}
