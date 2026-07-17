"use client";
// Interactive <GardenGrid>. Same model as ActivityGrid: one
// pointer listener + pure grid lookup, 2-D roving keyboard, a ring on the
// focused cell. Announces the ordinal step, not a false-precise value.
import { useCallback, useMemo, useRef, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { FILL, wrap } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { gardenGridGeometry } from "./geometry.js";
import { EN_GARDEN, type GardenStrings } from "../../core/strings-garden.js";
import {
  GardenGrid as StaticGardenGrid,
  gardenGridSummary,
  type GardenGridProps,
} from "./index.js";

export interface InteractiveGardenGridProps extends GardenGridProps {
  strings?: GardenStrings;
  /**
   * Opt-in entrance motion (default `false`): dots settle into place on first
   * client-side mount. Inert on the server and on hydrated server HTML;
   * `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function GardenGrid(props: InteractiveGardenGridProps): React.ReactNode {
  const {
    data,
    rows = 7,
    steps = 5,
    cell = 10,
    gap = 2,
    domain,
    unit = "periods",
    format,
    locale,
    title,
    summary,
    strings = EN_GARDEN,
    animate = false,
    className,
    style,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  // "trail" (index order) — cells plant in a wave rather than a uniform
  // staggered settle. Selector covers both empty (ink="muted") and filled
  // (ink="point") cells; the default trail selector misses "muted".
  useEntrance(hostRef, "trail", animate, { selector: "circle[data-mc-ink]" });

  const geo = useMemo(
    () => gardenGridGeometry({ values: data, rows, cell, gap, steps, domain, pad: 1 }),
    [data, rows, cell, gap, steps, domain],
  );
  const stepPx = cell + gap;
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : gardenGridSummary(data, { unit, strings, format, locale });
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const clamp = useCallback((i: number) => (i >= 0 && i < geo.cells.length ? i : null), [geo]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (geo.cells.length === 0) return;
    const cur = active ?? 0;
    const col = Math.floor(cur / rows);
    const row = cur % rows;
    let next: number | null = cur;
    switch (e.key) {
      case "ArrowDown":
        next = row < rows - 1 ? (clamp(cur + 1) ?? cur) : cur;
        break;
      case "ArrowUp":
        next = row > 0 ? (clamp(cur - 1) ?? cur) : cur;
        break;
      case "ArrowRight":
        next = clamp((col + 1) * rows + row) ?? cur;
        break;
      case "ArrowLeft":
        next = clamp((col - 1) * rows + row) ?? cur;
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
  };

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const x = ((e.clientX - r.left) / r.width) * geo.width;
      const y = ((e.clientY - r.top) / r.height) * geo.height;
      const col = Math.floor((x - 1) / stepPx);
      const row = Math.floor((y - 1) / stepPx);
      const i = col * rows + row;
      setActive(row >= 0 && row < rows && i >= 0 && i < geo.cells.length ? i : null);
    },
    [geo, stepPx, rows],
  );

  const c = active !== null ? geo.cells[active] : undefined;
  const announced = !c
    ? ""
    : c.value === null
      ? strings.gardenCellEmpty(c.index + 1, geo.cells.length)
      : strings.gardenCell(c.index + 1, geo.cells.length, fmt(c.value), c.step, steps);

  return (
    <span
      ref={hostRef}
      {...wrap("mc-garden-live", className, style)}
      tabIndex={0}
      role="img"
      aria-label={label}
      onKeyDown={onKeyDown}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onBlur={() => setActive(null)}
    >
      <StaticGardenGrid
        {...rest}
        style={FILL}
        data={data}
        rows={rows}
        steps={steps}
        cell={cell}
        gap={gap}
        domain={domain}
        unit={unit}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {c ? (
          <circle
            cx={c.cx}
            cy={c.cy}
            r={geo.rMax + 1}
            fill="none"
            stroke="var(--mc-accent)"
            strokeWidth={1.25}
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticGardenGrid>
      <LiveRegion>{announced}</LiveRegion>
      {c ? (
        <span
          className="mc-spark-readout"
          style={{ left: `${(c.cx / geo.width) * 100}%`, transform: "translateX(-50%)" }}
        >
          {c.value === null ? "—" : fmt(c.value)}
        </span>
      ) : null}
    </span>
  );
}
