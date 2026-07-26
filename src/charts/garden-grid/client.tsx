"use client";
// Interactive <GardenGrid>. Same model as ActivityGrid: useActivePicker owns
// interaction (one wrapper listener + pure grid math), 2-D roving keyboard, a
// ring on the focused cell and a pinned ring on the selected one; click / Enter
// / Space selects (onSelect). Announces the ordinal step, not a false-precise
// value. Composes the static component (canon) — the SVG never drifts.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
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
import { gardenGridGeometry } from "./geometry.js";
import { EN_GARDEN, type GardenStrings } from "../../core/strings-garden.js";
import {
  GardenGrid as StaticGardenGrid,
  gardenGridSummary,
  type GardenGridProps,
} from "./index.js";

export interface InteractiveGardenGridProps extends GardenGridProps, PickerProps {
  strings?: GardenStrings;
  /**
   * Opt-in entrance motion (default `false`): the dots pop in one after another,
   * in cell order — the plot plants itself in a wave — on first client-side
   * mount. Inert on the server and on hydrated server HTML;
   * `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

const PAD = 1;

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
  // "trail" (index order) — cells plant in a wave rather than a uniform
  // staggered settle. Selector covers both empty (ink="muted") and filled
  // (ink="point") cells; the default trail selector misses "muted".
  useEntrance(hostRef, "trail", animate, { selector: "circle[data-mc-ink]" });

  const geo = useMemo(
    () => gardenGridGeometry({ values: data, rows, cell, gap, steps, domain, pad: PAD }),
    [data, rows, cell, gap, steps, domain],
  );
  const stepPx = cell + gap;
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);

  // Pointer (viewBox space) → cell index by pure grid math (column-major, the
  // order geometry lays cells out in).
  const locate = useCallback(
    (x: number, y: number) => {
      const col = Math.floor((x - PAD) / stepPx);
      const row = Math.floor((y - PAD) / stepPx);
      const i = col * rows + row;
      return row >= 0 && row < rows && i >= 0 && i < geo.cells.length ? i : null;
    },
    [stepPx, rows, geo],
  );

  // 2-D roving: all four arrows are intercepted (a grid must never fall back to
  // the 1-D default, which would walk ←/→ across a row boundary). Boundary keys
  // are consumed (return the current index) rather than ignored.
  const step = useCallback(
    (cur: number, key: string) => {
      const n = geo.cells.length;
      if (n === 0) return null;
      if (key === "Home") return 0;
      if (key === "End") return n - 1;
      // Nothing active yet: the first arrow lands on cell 0 (kernel contract).
      const first = cur < 0;
      const c = first ? 0 : cur;
      const col = Math.floor(c / rows);
      const row = c % rows;
      const clamp = (i: number) => (i >= 0 && i < n ? i : null);
      let next: number;
      switch (key) {
        case "ArrowDown":
          next = row < rows - 1 ? (clamp(c + 1) ?? c) : c;
          break;
        case "ArrowUp":
          next = row > 0 ? (clamp(c - 1) ?? c) : c;
          break;
        case "ArrowRight":
          next = clamp((col + 1) * rows + row) ?? c;
          break;
        case "ArrowLeft":
          next = clamp((col - 1) * rows + row) ?? c;
          break;
        default:
          return null;
      }
      return first ? 0 : next;
    },
    [rows, geo],
  );

  // index = data index (cells are 1:1 with `data`); value = the cell's number
  // (`null` when the datum is missing/non-finite).
  const datum = useCallback(
    (i: number) => {
      const cell = geo.cells[i];
      return {
        index: i,
        value: cell?.value ?? null,
        formatted:
          cell == null || cell.value === null
            ? "—"
            : `${fmt(cell.value)}, step ${cell.step}/${steps}`,
      };
    },
    [geo, fmt, steps],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo.cells.length,
    width: geo.width,
    height: geo.height,
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
        : gardenGridSummary(data, { unit, strings, format, locale });
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const ring = (i: number, pinned: boolean) => {
    const c = geo.cells[i];
    if (!c) return null;
    return (
      <circle
        cx={c.cx}
        cy={c.cy}
        r={geo.rMax + 1}
        fill="none"
        stroke="var(--mc-accent)"
        strokeWidth={1.25}
        data-mc-w={pinned ? "tick" : undefined}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const c = shown !== null ? geo.cells[shown] : undefined;
  const announced = !c
    ? ""
    : c.value === null
      ? strings.gardenCellEmpty(c.index + 1, geo.cells.length)
      : strings.gardenCell(c.index + 1, geo.cells.length, fmt(c.value), c.step, steps);

  return (
    <span ref={hostRef} {...wrap("mc-garden-live", className, style)} {...named(label)} {...bind}>
      <StaticGardenGrid
        {...rest}
        style={fillFor(style)}
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
        {selected !== null && selected !== active ? ring(selected, true) : null}
        {active !== null ? ring(active, false) : null}
        {rest.children}
      </StaticGardenGrid>
      <LiveRegion>{announced}</LiveRegion>
      {readout && c ? (
        <span className="mc-spark-readout" style={crosshairReadoutStyle(c.cx, geo.width)}>
          {/* The localized sentence minus its full stop — "step" must not be
              hand-composed in a VISIBLE chip (i18n canon). An empty cell keeps
              the dash: the localized "no data" sentence is carried by the live
              region, and a dash reads at chip size where a sentence does not. */}
          {c.value === null ? "—" : announced.replace(/[.。]$/, "")}
        </span>
      ) : null}
    </span>
  );
}
