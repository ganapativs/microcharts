"use client";
// Interactive <HeatStrip>. One pointer listener; cell by x-band
// lookup. ←/→ roving cell focus with the ActivityGrid focus-ring style — the
// 1-D restriction of its 2-D nav, same wording, same overlay. Composes the
// static component (canon).
import { useCallback, useMemo, useRef, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { describeSeries, EN_SERIES, type SeriesStrings } from "../../core/summary.js";
import { EN_SLOTS, type SlotStrings } from "../../core/strings-slots.js";
import { heatStripGeometry } from "./geometry.js";
import { HeatStrip as StaticHeatStrip, type HeatStripProps } from "./index.js";

export interface InteractiveHeatStripProps extends HeatStripProps {
  strings?: SeriesStrings & SlotStrings;
  /**
   * Opt-in entrance motion (default `false`): the strip wipes in left to right
   * on first client-side mount — a time-forward reveal for the 1×N cells (an
   * index cascade over many cells collapses under the stagger cap into a
   * near-simultaneous fade). Inert on the server and on hydrated server HTML;
   * `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

const DEFAULT_STRINGS = { ...EN_SERIES, ...EN_SLOTS };

export function HeatStrip(props: InteractiveHeatStripProps): React.ReactNode {
  const {
    data,
    steps = 5,
    shape = "square",
    domain,
    width = 60,
    height = 10,
    format,
    locale,
    strings = DEFAULT_STRINGS,
    title,
    summary,
    animate = false,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  // Time runs along x: cells light up in turn, oldest→newest. `order:"x"` +
  // `window` spreads the cascade across the strip (it does NOT flatten under
  // the default stagger cap), reading as time advancing cell by cell.
  useEntrance(hostRef, "reveal", animate, {
    selector: 'rect[data-mc-ink="cell"]',
    order: "x",
    window: 400,
  });

  const geo = useMemo(
    () => heatStripGeometry({ width, height, values: data, domain, steps, shape }),
    [width, height, data, domain, steps, shape],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : describeSeries(data, { format: fmt, strings });
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (geo.cells.length === 0 || geo.pitch === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const x = ((e.clientX - r.left) / r.width) * width;
      const i = Math.floor(x / geo.pitch);
      setActive(i >= 0 && i < geo.cells.length ? i : null);
    },
    [geo, width],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (geo.cells.length === 0) return;
      const cur = active ?? 0;
      let next = cur;
      switch (e.key) {
        case "ArrowRight":
          next = Math.min(geo.cells.length - 1, cur + 1);
          break;
        case "ArrowLeft":
          next = Math.max(0, cur - 1);
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = geo.cells.length - 1;
          break;
        case "Escape":
          setActive(null);
          return;
        default:
          return;
      }
      e.preventDefault();
      setActive(next);
    },
    [active, geo],
  );

  const activeCell = active !== null ? geo.cells[active] : undefined;
  const announced = activeCell
    ? activeCell.value === null
      ? strings.pointEmpty(activeCell.index + 1, geo.cells.length)
      : strings.point(activeCell.index + 1, geo.cells.length, fmt(activeCell.value))
    : "";

  return (
    <span
      ref={hostRef}
      className="mc-heat-strip-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticHeatStrip
        {...rest}
        data={data}
        steps={steps}
        shape={shape}
        domain={domain}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {activeCell ? (
          <rect
            x={activeCell.x - 0.5}
            y={activeCell.y - 0.5}
            width={activeCell.w + 1}
            height={activeCell.h + 1}
            rx={activeCell.rx + 0.5}
            fill="none"
            stroke="var(--mc-accent)"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticHeatStrip>
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
      {activeCell ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${((activeCell.x + activeCell.w / 2) / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {activeCell.value === null ? "—" : fmt(activeCell.value)}
        </span>
      ) : null}
    </span>
  );
}
