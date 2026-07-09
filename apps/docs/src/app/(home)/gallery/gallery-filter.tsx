"use client";
import { useEffect, useRef, useState } from "react";
import { LayoutGrid, Rows3, Search } from "lucide-react";

/**
 * Progressive-enhancement controls for the visual catalog. The cards are
 * server-rendered (RSC-safe, zero chart JS) — this only toggles their `hidden`
 * attribute from data-* keywords and flips `data-view` on the container, so with
 * JS off every chart still shows in the default grid. Nothing about the charts
 * ships to the client.
 */
const COLLECTIONS = [
  { key: "all", label: "All" },
  { key: "core", label: "Core" },
  { key: "decision", label: "Decision" },
  { key: "expressive", label: "Expressive" },
  { key: "frontier", label: "Frontier" },
] as const;

type View = "grid" | "sheet";
const VIEW_KEY = "mc-gallery-view";

export function GalleryFilter({ counts }: { counts: Record<string, number> }) {
  const [q, setQ] = useState("");
  const [col, setCol] = useState<string>("all");
  const [view, setView] = useState<View>("grid");
  const [shown, setShown] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // The rows are server-rendered and never added/removed, so query them once
  // and reuse across every keystroke instead of re-scanning the DOM each time.
  const domRef = useRef<{
    cards: HTMLElement[];
    sections: HTMLElement[];
    empty: HTMLElement | null;
  } | null>(null);

  // Restore the last-used view before paint (grid stays the no-JS default).
  useEffect(() => {
    const saved = localStorage.getItem(VIEW_KEY);
    if (saved === "sheet" || saved === "grid") setView(saved);
  }, []);

  // Let the one-time entrance cascade play once, then mark it done so the
  // search filter (which toggles `hidden`) never replays it.
  useEffect(() => {
    const el = document.querySelector<HTMLElement>(".mc-gallery");
    if (!el) return;
    const t = window.setTimeout(() => {
      el.dataset.entered = "true";
    }, 900);
    return () => window.clearTimeout(t);
  }, []);

  // Arrow-key roving navigation across the visible cards — Left/Right step one
  // card, Up/Down jump a row. Mirrors the 2-D keyboard nav the charts ship.
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".mc-gallery");
    if (!root) return;
    const onKey = (e: KeyboardEvent) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
      const links = Array.from(root.querySelectorAll<HTMLElement>(".gcard-link")).filter(
        (l) => l.offsetParent !== null,
      );
      const here = links.indexOf(document.activeElement as HTMLElement);
      if (here === -1) return;
      e.preventDefault();
      // Columns = how many cards share the top row's viewport y. (offsetTop is
      // intra-card here — every card is its own positioning context — so it
      // can't measure the page grid; getBoundingClientRect can.)
      const top0 = Math.round(links[0].getBoundingClientRect().top);
      const cols = Math.max(
        1,
        links.filter((l) => Math.round(l.getBoundingClientRect().top) === top0).length,
      );
      const step =
        e.key === "ArrowRight"
          ? 1
          : e.key === "ArrowLeft"
            ? -1
            : e.key === "ArrowDown"
              ? cols
              : -cols;
      const next = links[Math.min(links.length - 1, Math.max(0, here + step))];
      next?.focus();
    };
    root.addEventListener("keydown", onKey);
    return () => root.removeEventListener("keydown", onKey);
  }, []);

  // Drive the container's data-view + persist the choice.
  useEffect(() => {
    const el = document.querySelector<HTMLElement>(".mc-gallery");
    if (el) el.dataset.view = view;
    localStorage.setItem(VIEW_KEY, view);
  }, [view]);

  useEffect(() => {
    const dom = (domRef.current ??= {
      cards: Array.from(document.querySelectorAll<HTMLElement>("[data-gallery-card]")),
      sections: Array.from(document.querySelectorAll<HTMLElement>("[data-collection-section]")),
      empty: document.querySelector<HTMLElement>("[data-gallery-empty]"),
    });
    const needle = q.trim().toLowerCase();
    let count = 0;
    // Pass 1: write every card's visibility (attribute writes only, no geometry
    // reads between them — never triggers a synchronous reflow).
    for (const card of dom.cards) {
      const okCol = col === "all" || card.dataset.collection === col;
      const okQ = !needle || (card.dataset.keywords ?? "").includes(needle);
      const on = okCol && okQ;
      card.hidden = !on;
      if (on) count++;
    }
    // Pass 2: collapse now-empty collection bands (attribute match, no layout).
    for (const sec of dom.sections) {
      sec.hidden = !sec.querySelector("[data-gallery-card]:not([hidden])");
    }
    if (dom.empty) dom.empty.hidden = count !== 0;
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

        <div className="flex items-center gap-2 sm:ml-auto">
          {/* search */}
          <div className="relative flex-1 sm:w-64 sm:flex-none">
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

          {/* view toggle — grid (default) ⇄ specimen sheet */}
          <div
            role="group"
            aria-label="Layout"
            className="flex shrink-0 items-center gap-0.5 rounded-[var(--radius-control)] border border-hairline p-0.5"
          >
            {(
              [
                { key: "grid", label: "Grid", Icon: LayoutGrid },
                { key: "sheet", label: "Sheet", Icon: Rows3 },
              ] as const
            ).map(({ key, label, Icon }) => {
              const active = view === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setView(key)}
                  aria-pressed={active}
                  title={`${label} view`}
                  className={
                    "flex items-center gap-1.5 rounded-[calc(var(--radius-control)-3px)] px-2.5 py-1.5 text-sm transition-colors " +
                    (active
                      ? "bg-[color-mix(in_oklab,var(--accent)_16%,transparent)] text-fd-primary"
                      : "text-fd-muted-foreground hover:text-fd-foreground")
                  }
                >
                  <Icon className="size-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              );
            })}
          </div>
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
