"use client";
import Link from "next/link";
import { useCallback, useRef, useState, type ReactNode } from "react";

/**
 * The 106-cell specimen lattice and its sticky readout.
 *
 * The cells are the library's own static `Mark` glyphs, rendered on the SERVER —
 * 106 interactive charts on one page is a promise the page cannot keep, and a
 * specimen sheet is a sheet of glyphs by definition. The reading above the sheet
 * is the only thing this component costs the client graph.
 *
 * **Every cell is a link to that chart's reference page** — `/docs/charts/<slug>`,
 * which is the per-chart page; `/charts` is the visual gallery and `/charts/<x>` is
 * a COLLECTION route, so linking a slug there 500s on a missing static param.
 *
 * It used to be a button that
 * copied the chart's import line, with a second copy of that line in the readout
 * above — which made the sheet a dead end, and the readout's copy was clipped at
 * half its length anyway. A specimen sheet's job is to send you somewhere. The
 * import is on the page it sends you to.
 *
 * Keyboard: the sheet is one tab stop with a roving cursor. Arrow keys move by one
 * and by a row (the column count is read from the live grid, so it follows the
 * breakpoint), Home/End jump to the ends, Enter opens the page.
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
      {/* A floating panel over the sheet, not a second rail. Fixed height, tagline
          clamped: it sits above 106 cells and its text changes on every one the
          pointer crosses, so a self-sizing band moves the lattice under the
          cursor. Full rationale on `.readout` in v3.css. */}
      <div
        className="readout sticky z-20 flex flex-col justify-center"
        // 1px BEHIND the rail's bottom edge, not flush under it: see the note on
        // `.readout` in v3.css. Two adjacent backdrop-filters clamp at their own
        // boxes and composite to two different tones, so the only way to lose the
        // seam is to overlap them and let the rail's own edge be the only one.
        style={{ top: "calc(var(--hdr, 56px) - 1px)" }}
      >
        <div className="min-w-0">
          <div
            className="font-mono text-[13px] font-medium leading-[1.3] tracking-[-0.03em]"
            style={{ color: "var(--ink)" }}
          >
            {/* The size lives HERE, and only here. It used to print in all 106
                cells, which put a second line of mono under every mark and made
                the sheet three elements deep per cell — the numbers read as a
                column of their own and the marks had to compete with it. One
                reading, on the band that is already following the cursor. */}
            {active.name}{" "}
            <span className="font-normal" style={{ color: "var(--ink-3)" }}>
              {active.kb}
            </span>
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
          <Link
            key={item.slug}
            prefetch={false}
            href={`/docs/charts/${item.slug}`}
            data-cell
            data-on={i === cursor ? "" : undefined}
            tabIndex={i === cursor ? 0 : -1}
            onMouseEnter={() => setCursor(i)}
            onFocus={() => setCursor(i)}
            className="cell"
            // 106 links in one list: the name and the size are the label, and the
            // tagline is the description, so a screen reader gets "SparkBar,
            // 5.67 kB" while moving and the sentence only on request.
            aria-label={`${item.name}, ${item.kb}`}
            aria-describedby={`${DESC}-${item.slug}`}
          >
            {/* No `[&_text]:hidden` here, unlike the smaller mark slots
                elsewhere in the docs: a handful of types (FillWord, FatDigits,
                TokenConfidence, Delta) ARE text, and hiding `<text>` renders
                them as empty cells. The 26px box clips instead. */}
            <span aria-hidden className="cell-mark">
              {marks[i]}
            </span>
            <span aria-hidden className="cell-name">
              {item.slug}
            </span>
            <span id={`${DESC}-${item.slug}`} hidden>
              {item.tagline}
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
