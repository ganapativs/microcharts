"use client";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

/**
 * Progressive-enhancement filter for the specimen index. The rows themselves
 * are server-rendered (RSC-safe, zero chart JS) — this only toggles their
 * `hidden` attribute from data-* keywords, so with JS off every chart still
 * shows. Nothing about the charts ships to the client.
 */
const COLLECTIONS = [
  { key: "all", label: "All" },
  { key: "core", label: "Core" },
  { key: "decision", label: "Decision" },
  { key: "expressive", label: "Expressive" },
  { key: "frontier", label: "Frontier" },
] as const;

export function GalleryFilter({ counts }: { counts: Record<string, number> }) {
  const [q, setQ] = useState("");
  const [col, setCol] = useState<string>("all");
  const [shown, setShown] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const rows = Array.from(document.querySelectorAll<HTMLElement>("[data-gallery-row]"));
    const needle = q.trim().toLowerCase();
    let count = 0;
    for (const row of rows) {
      const okCol = col === "all" || row.dataset.collection === col;
      const okQ = !needle || (row.dataset.keywords ?? "").includes(needle);
      const on = okCol && okQ;
      row.hidden = !on;
      if (on) count++;
    }
    for (const sec of Array.from(
      document.querySelectorAll<HTMLElement>("[data-collection-section]"),
    )) {
      sec.hidden = !sec.querySelector("[data-gallery-row]:not([hidden])");
    }
    const empty = document.querySelector<HTMLElement>("[data-gallery-empty]");
    if (empty) empty.hidden = count !== 0;
    setShown(count);
  }, [q, col]);

  // "/" or ⌘K focuses search, Esc clears.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = inputRef.current;
      if (!el) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        el.focus();
      } else if (e.key === "/" && document.activeElement !== el) {
        e.preventDefault();
        el.focus();
      } else if (e.key === "Escape" && document.activeElement === el) {
        setQ("");
        el.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const total = counts.all ?? 0;

  return (
    <div className="sticky top-[60px] z-20 mt-10">
      <div className="glass glass-strong flex flex-col gap-3 rounded-[var(--radius-panel)] px-3 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-4">
        {/* collection pills */}
        <div className="flex flex-wrap items-center gap-1">
          {COLLECTIONS.map((c) => {
            const n = counts[c.key] ?? 0;
            const active = col === c.key;
            // Nothing shipped yet (Decision/Expressive/Frontier) → a roadmap
            // marker, not a dead-end filter.
            const empty = c.key !== "all" && n === 0;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => !empty && setCol(c.key)}
                disabled={empty}
                aria-pressed={active}
                title={empty ? "Coming before launch" : undefined}
                className={
                  "rounded-[var(--radius-control)] px-2.5 py-1.5 text-sm transition-colors " +
                  (empty
                    ? "cursor-default text-fd-muted-foreground/50"
                    : active
                      ? "bg-[color-mix(in_oklab,var(--accent)_16%,transparent)] text-fd-primary"
                      : "text-fd-muted-foreground hover:text-fd-foreground")
                }
              >
                {c.label}
                <span className="mono-label ml-1.5 opacity-50">{empty ? "soon" : n}</span>
              </button>
            );
          })}
        </div>

        {/* search */}
        <div className="relative sm:ml-auto sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fd-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="search"
            placeholder="Search charts…"
            aria-label="Search charts"
            className="w-full rounded-[var(--radius-control)] border border-hairline bg-transparent py-1.5 pl-9 pr-9 text-sm outline-none placeholder:text-fd-muted-foreground focus:border-[color-mix(in_oklab,var(--accent)_45%,var(--hairline))]"
          />
          <kbd className="mono-label pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-40">
            /
          </kbd>
        </div>
      </div>

      {/* live result count — only when a filter narrows the set */}
      {shown !== null && shown !== total && (
        <p className="mono-label mt-2 px-1 opacity-60" role="status" aria-live="polite">
          {shown} of {total}
        </p>
      )}
    </div>
  );
}
