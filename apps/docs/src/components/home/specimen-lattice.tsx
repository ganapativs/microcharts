"use client";
import Link from "next/link";
import { memo, useCallback, useRef, useState, type ReactNode } from "react";

/**
 * The 106-cell specimen lattice and its sticky readout.
 *
 * The cells are the library's own static `Mark` glyphs, rendered on the SERVER.
 * The reading above the sheet is the only thing this component costs the client
 * graph.
 *
 * Every cell links to `/docs/charts/<slug>`, the per-chart reference page —
 * `/charts/<x>` is a COLLECTION route, so a slug there 500s on a missing static
 * param.
 *
 * Keyboard: one tab stop with a roving cursor. Arrows move by one and by a row
 * (the column count is read from the live grid, so it follows the breakpoint),
 * Home/End jump to the ends.
 */

export type SpecimenItem = {
  slug: string;
  name: string;
  tagline: string;
  kb: string;
  channel: string;
  precision: string;
};

/** One id prefix for the 106 cell descriptions — stable, never generated here. */
const DESC = "mc-cell-desc";

/**
 * One specimen, memoized because the cursor moves: crossing a cell boundary
 * changes `data-on` and `tabIndex` on exactly two of 106 cells, and re-rendering
 * all of them cost ~46ms per crossing at a 6× CPU throttle.
 *
 * That needs every prop referentially stable — hence the index as a number and
 * one shared `useCallback` rather than a fresh closure per cell. `mark` is a
 * server-rendered element passed down, so React never reconciles into the 106
 * SVG subtrees at all.
 */
const Cell = memo(function Cell({
  item,
  mark,
  index,
  on,
  onEnter,
}: {
  item: SpecimenItem;
  mark: ReactNode;
  index: number;
  on: boolean;
  onEnter: (i: number) => void;
}) {
  return (
    <Link
      prefetch={false}
      href={`/docs/charts/${item.slug}`}
      data-cell
      data-on={on ? "" : undefined}
      tabIndex={on ? 0 : -1}
      onMouseEnter={() => onEnter(index)}
      onFocus={() => onEnter(index)}
      className="cell"
      // 106 links in one list: the name and the size are the label, and the
      // tagline is the description, so a screen reader gets "SparkBar,
      // 5.67 kB" while moving and the sentence only on request.
      aria-label={`${item.name}, ${item.kb}`}
      aria-describedby={`${DESC}-${item.slug}`}
    >
      {/* No `[&_text]:hidden` here, unlike the smaller mark slots elsewhere: a
          few types (FillWord, FatDigits, TokenConfidence, Delta) ARE text, and
          hiding `<text>` renders them as empty cells. The 26px box clips. */}
      <span aria-hidden className="cell-mark">
        {mark}
      </span>
      <span aria-hidden className="cell-name">
        {item.slug}
      </span>
      {/* The size belongs to the specimen, not to the cursor: it is a fixed
          property of the type, so it reads in the cell at every width rather
          than only in the band a pointer happens to be dragging. `aria-hidden` —
          the cell's own label already reads "SparkBar, 5.67 kB". */}
      <span aria-hidden className="cell-kb">
        {item.kb}
      </span>
      <span id={`${DESC}-${item.slug}`} hidden>
        {item.tagline}
      </span>
    </Link>
  );
});

export function SpecimenLattice({
  items,
  marks,
}: {
  items: readonly SpecimenItem[];
  marks: readonly ReactNode[];
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState(0);
  const active = items[cursor] ?? items[0]!;

  /** The ONE handler all 106 cells share, so `Cell`'s memo actually holds. */
  const enter = useCallback((i: number) => setCursor(i), []);

  const cells = useCallback(
    () => Array.from(gridRef.current?.querySelectorAll<HTMLAnchorElement>("[data-cell]") ?? []),
    [],
  );

  /** Live column count — the lattice is `auto-fill`, so this is the only honest
   *  source for what "one row down" means at the current width. */
  const columns = useCallback(() => {
    const grid = gridRef.current;
    if (!grid) return 1;
    const t = getComputedStyle(grid).gridTemplateColumns;
    return t ? t.split(" ").filter(Boolean).length : 1;
  }, []);

  function onKeyDown(e: React.KeyboardEvent) {
    const list = cells();
    if (!list.length) return;
    const cols = columns();
    const at = Math.max(0, list.indexOf(document.activeElement as HTMLAnchorElement));
    let next: number | null = null;
    if (e.key === "ArrowRight") next = at + 1;
    else if (e.key === "ArrowLeft") next = at - 1;
    else if (e.key === "ArrowDown") next = at + cols;
    else if (e.key === "ArrowUp") next = at - cols;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = list.length - 1;
    if (next === null) return;
    e.preventDefault();
    list[Math.max(0, Math.min(list.length - 1, next))]?.focus();
  }

  return (
    <>
      {/* Fixed height and a clamped tagline: the text changes on every cell the
          pointer crosses, so a self-sizing band would move the lattice under the
          cursor. `top` lives in home.css, never inline — an inline offset cannot
          be answered by the small-screen media query.

          No size here: it is printed in the cell instead (`.cell-kb`), at every
          width. The band's job is the readings a cell has no room for — the
          sentence, the channel, the precision — and the component's PascalCase
          name against the cell's slug. */}
      <div className="readout sticky z-20 flex flex-col justify-center">
        <div className="min-w-0">
          <div
            className="font-mono text-[13px] font-medium leading-[1.3] tracking-[-0.03em]"
            style={{ color: "var(--ink)" }}
          >
            {active.name}
          </div>
          {/* One polite region for the whole sheet. Roving focus changes the
              reading, so the announcement follows the cursor rather than
              firing 106 times on mount. */}
          <div
            aria-live="polite"
            className="readout-tag mt-1.5 text-[14.5px] leading-[1.45]"
            style={{ color: "var(--ink-2)" }}
          >
            {active.tagline}{" "}
            <span style={{ color: "var(--ink-3)" }}>
              {active.channel}, {active.precision} precision.
            </span>
          </div>
        </div>
      </div>

      <div
        ref={gridRef}
        role="group"
        aria-label={`All ${items.length} chart types`}
        className="cells"
        onKeyDown={onKeyDown}
      >
        {items.map((item, i) => (
          <Cell
            key={item.slug}
            item={item}
            mark={marks[i]}
            index={i}
            on={i === cursor}
            onEnter={enter}
          />
        ))}
      </div>
    </>
  );
}
