"use client";
// Interactive <IconArray> (plan/23 #21). One pointer listener + pure grid
// lookup; ←/→/↑/↓ 2-D roving (ActivityGrid keyboard model, row-major here).
// Each unit announces the running count — genuinely useful for a SR user
// counting. Composes the static component (canon); the focus ring is an overlay
// child re-using geometry.
import { useCallback, useMemo, useRef, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { EN_FREQ, type FreqStrings } from "../../core/strings-freq.js";
import { iconArrayGeometry } from "./geometry.js";
import { IconArray as StaticIconArray, iconArraySummary, type IconArrayProps } from "./index.js";

export interface InteractiveIconArrayProps extends IconArrayProps {
  strings?: FreqStrings;
  /**
   * Opt-in entrance motion (default `false`): the unit grid fades in,
   * staggered, when the chart first mounts client-side. Inert on the server
   * and on hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function IconArray(props: InteractiveIconArrayProps): React.ReactNode {
  const {
    value,
    total = 20,
    label = "ratio",
    shape = "square",
    width = 140,
    height = 28,
    locale,
    strings = EN_FREQ,
    title,
    summary,
    animate = false,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  // "reveal" — a fixed-N grid of unit cells is exactly the cell-grid case;
  // the default selector only matches "unit-off" (empty) cells, so a custom
  // selector scoped to unit rects (excludes the label text) catches filled
  // units too.
  useEntrance(hostRef, "reveal", animate, { selector: "rect[data-mc-ink]" });

  const FONT = Math.min(10, Math.max(7, Math.round(height * 0.5)));
  const gutterCh = label === "ratio" ? 9 : label === "percent" ? 5 : 0;
  const geo = useMemo(
    () => iconArrayGeometry({ width, height, value, total, shape, gutterCh, fontSize: FONT }),
    [width, height, value, total, shape, gutterCh, FONT],
  );
  const pctFmt = useMemo(
    () => makeFormatter({ style: "percent", maximumFractionDigits: 0 }, locale),
    [locale],
  );
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : iconArraySummary(geo, pctFmt, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const keys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Home", "End", "Escape"];
      if (!keys.includes(e.key)) return;
      e.preventDefault();
      if (e.key === "Escape") {
        setActive(null);
        return;
      }
      const { cols, rows, n } = geo;
      // functional update — rapid 2-D roving composes without a stale closure
      setActive((prev) => {
        const cur = prev ?? 0;
        const row = Math.floor(cur / cols);
        const col = cur % cols;
        switch (e.key) {
          case "ArrowRight":
            return col < cols - 1 ? cur + 1 : cur;
          case "ArrowLeft":
            return col > 0 ? cur - 1 : cur;
          case "ArrowDown":
            return row < rows - 1 ? Math.min(n - 1, cur + cols) : cur;
          case "ArrowUp":
            return row > 0 ? cur - cols : cur;
          case "Home":
            return 0;
          case "End":
            return n - 1;
          default:
            return prev;
        }
      });
    },
    [geo],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const x = ((e.clientX - r.left) / r.width) * geo.totalWidth;
      const y = ((e.clientY - r.top) / r.height) * height;
      let best: number | null = null;
      let bestDist = Infinity;
      for (const u of geo.units) {
        const cx = u.x + geo.cell / 2;
        const cy = u.y + geo.cell / 2;
        const d = (cx - x) ** 2 + (cy - y) ** 2;
        if (d < bestDist) {
          bestDist = d;
          best = u.index;
        }
      }
      setActive(best);
    },
    [geo, height],
  );

  const unit = active !== null ? geo.units[active] : undefined;
  const announced = unit ? strings.iconArrayUnit(active! + 1, geo.n, unit.filled, geo.k) : "";

  return (
    <span
      ref={hostRef}
      className="mc-icon-array-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onBlur={() => setActive(null)}
    >
      <StaticIconArray
        {...rest}
        value={value}
        total={total}
        label={label}
        shape={shape}
        width={width}
        height={height}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {unit ? (
          <rect
            x={unit.x - 0.75}
            y={unit.y - 0.75}
            width={geo.cell + 1.5}
            height={geo.cell + 1.5}
            rx={geo.rx + 0.75}
            fill="none"
            stroke="var(--mc-accent)"
            data-mc-w="full"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticIconArray>
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
    </span>
  );
}
