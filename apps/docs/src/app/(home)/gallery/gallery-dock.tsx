"use client";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  ArrowDownAZ,
  ArrowUp,
  Grid2x2,
  Grid3x3,
  ListOrdered,
  Search,
  Sparkles,
  Square,
} from "lucide-react";
import type { ChartCollection } from "@/lib/charts/types";
import {
  getGalleryMode,
  setGalleryMode,
  subscribeGalleryMode,
  type GalleryMode,
} from "./gallery-mode";

// Layout effect on the client (fires before paint), plain effect on the server
// (no-op, avoids the SSR warning). Used to mark the plane "entered" BEFORE the
// browser paints on a client re-navigation, so the entrance never replays.
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Module-scoped: true once the entrance has played. Survives client-side
// navigations (module isn't re-evaluated), resets only on a full page load — so
// the fade plays on first load, never again when you navigate back to /gallery.
let hasEntered = false;

/**
 * The floating command dock for the gallery. Everything the user drives lives
 * here, at the bottom of the viewport. The plane itself is server-rendered for
 * structure; each card stage hydrates and can flip live ↔ static:
 *   · toggles each card's `hidden` from data-* keywords (RSC-safe, JS-off = grid)
 *   · flips `data-density` on the grid; slides the site nav away on scroll-down
 *   · live mode = interactive entries + entrance animate (default); static = SSR twins
 *   · roves focus across the visible plates with the arrow keys
 *   · runs ONE delegated pointer handler that tilts + lights the hovered plate
 */

type Density = "comfortable" | "compact";
type Sort = "catalog" | "name";
const DENSITY_KEY = "mc-gallery2-density";
const TILT_MAX = 3; // degrees

/**
 * Initial control state, read once from the URL so a filtered view is
 * shareable + survives reload/back. Precedence: URL param > localStorage
 * (density only) > default. SSR-safe (returns defaults with no window).
 */
function initialState(): { q: string; col: string; density: Density; sort: Sort } {
  if (typeof window === "undefined")
    return { q: "", col: "all", density: "comfortable", sort: "catalog" };
  const p = new URLSearchParams(window.location.search);
  const d = p.get("density");
  const stored = localStorage.getItem(DENSITY_KEY);
  const density: Density =
    d === "compact" || d === "comfortable"
      ? d
      : stored === "compact" || stored === "comfortable"
        ? stored
        : "comfortable";
  return {
    q: p.get("q") ?? "",
    col: p.get("collection") ?? "all",
    density,
    sort: p.get("sort") === "name" ? "name" : "catalog",
  };
}

export function GalleryDock({
  counts,
  collections,
}: {
  counts: Record<string, number>;
  collections: { key: ChartCollection; label: string }[];
}) {
  const [q, setQ] = useState(() => initialState().q);
  const [col, setCol] = useState<string>(() => initialState().col);
  const [density, setDensity] = useState<Density>(() => initialState().density);
  const [sort, setSort] = useState<Sort>(() => initialState().sort);
  const [shown, setShown] = useState<number | null>(null);
  const [atTop, setAtTop] = useState(true);
  const [dockHidden, setDockHidden] = useState(false);
  const mode = useSyncExternalStore(
    subscribeGalleryMode,
    getGalleryMode,
    () => "live" as GalleryMode,
  );
  // The dock is fixed to the viewport, but the (home) layout's RouteTransition
  // wrapper is a transformed ancestor — which would trap `position: fixed`
  // against itself. Portal to <body> so the dock anchors to the viewport.
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastCol = useRef<string | null>(null);
  const syncDock = useRef<() => void>(() => {});
  // Server-rendered rows never change, so query the DOM once and reuse it.
  const domRef = useRef<{
    cards: HTMLElement[];
    empty: HTMLElement | null;
    emptyQ: HTMLElement | null;
    grid: HTMLElement | null;
    root: HTMLElement | null;
  } | null>(null);

  // Mark the plane as "mounted" so the scoped nav-hide CSS activates + enable the
  // body portal; clean up on unmount so the shared header behaves everywhere else.
  useEffect(() => {
    setMounted(true);
    const html = document.documentElement;
    html.dataset.g2Mounted = "true";
    return () => {
      delete html.dataset.g2Mounted;
      delete html.dataset.g2Nav;
    };
  }, []);

  // Keep the URL in sync with the controls so the view is shareable + survives
  // reload/back. Only non-default params are written (clean URLs). replaceState
  // (not push) — per-keystroke history entries would be noise. Read back by
  // initialState() on load.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (q) p.set("q", q);
    else p.delete("q");
    if (col !== "all") p.set("collection", col);
    else p.delete("collection");
    if (density !== "comfortable") p.set("density", density);
    else p.delete("density");
    if (sort !== "catalog") p.set("sort", sort);
    else p.delete("sort");
    const qs = p.toString();
    window.history.replaceState(
      null,
      "",
      window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash,
    );
  }, [q, col, density, sort]);

  // Sort by CSS `order` (no DOM churn, node identity preserved). Catalog =
  // source order (blank). Name = alphabetical rank across the whole set — which
  // crosses collections, so the wayfinding labels are suppressed (browse below).
  useEffect(() => {
    const grid = document.querySelector<HTMLElement>(".g2-grid");
    if (!grid) return;
    const cells = Array.from(grid.querySelectorAll<HTMLElement>(".g2-cell"));
    if (sort === "name") {
      [...cells]
        .sort((a, b) => (a.dataset.name ?? "").localeCompare(b.dataset.name ?? ""))
        .forEach((c, i) => {
          c.style.order = String(i);
        });
    } else {
      for (const c of cells) c.style.order = "";
    }
  }, [sort]);

  // Entrance runs ONCE per page load. On a client re-navigation to /gallery the
  // module flag is already set, so we stamp [data-entered] before paint (layout
  // effect) — the fade never replays and charts don't flash in twice. On the
  // first load it plays, then locks so filtering never replays it either.
  useIsoLayoutEffect(() => {
    const el = document.querySelector<HTMLElement>(".g2");
    if (!el) return;
    if (hasEntered) {
      el.dataset.entered = "true";
      return;
    }
    const t = window.setTimeout(() => {
      el.dataset.entered = "true";
      hasEntered = true;
    }, 1100);
    return () => window.clearTimeout(t);
  }, []);

  // Drive density onto the grid + persist.
  useEffect(() => {
    const grid = document.querySelector<HTMLElement>(".g2-grid");
    if (grid) grid.dataset.density = density;
    localStorage.setItem(DENSITY_KEY, density);
  }, [density]);

  // Scroll-driven chrome: hide nav on scroll-down, reveal on scroll-up; surface
  // back-to-top. rAF-coalesced so scroll stays cheap.
  useEffect(() => {
    const html = document.documentElement;
    let lastY = window.scrollY;
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      // hysteresis: only hide once meaningfully scrolled, reveal on any up-move
      if (y > 140 && y > lastY + 4) html.dataset.g2Nav = "hidden";
      else if (y < lastY - 4 || y < 140) delete html.dataset.g2Nav;
      setAtTop(y < 600);
      syncDock.current();
      lastY = y;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Slip the dock away only when the footer is actually REACHED by scrolling — a
  // scrollable page whose footer has risen into the dock's zone. When a filter
  // leaves few results the page isn't scrollable, so the (always-visible) footer
  // must NOT hide the dock. Re-checked on scroll, resize, and after every filter.
  useEffect(() => {
    const footer = document.querySelector("footer");
    syncDock.current = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight > 80;
      const reached = footer ? footer.getBoundingClientRect().top < window.innerHeight - 56 : false;
      setDockHidden(scrollable && reached);
    };
    syncDock.current();
    const onResize = () => syncDock.current();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── The single delegated tilt + spotlight handler ────────────────────────
  // One pointermove on the grid updates CSS vars on the hovered plate only —
  // never a listener per card. Gated on a fine pointer + reduced-motion.
  useEffect(() => {
    const grid = document.querySelector<HTMLElement>(".g2-grid");
    if (!grid) return;
    const fine = window.matchMedia("(pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduce.matches) return;

    let active: HTMLElement | null = null;
    let frame = 0;
    let nx = 0.5;
    let ny = 0.5;

    const paint = () => {
      frame = 0;
      if (!active) return;
      active.style.setProperty("--rx", `${(nx - 0.5) * 2 * TILT_MAX}deg`);
      active.style.setProperty("--ry", `${-(ny - 0.5) * 2 * TILT_MAX}deg`);
      active.style.setProperty("--mx", `${nx * 100}%`);
      active.style.setProperty("--my", `${ny * 100}%`);
    };
    const reset = (card: HTMLElement | null) => {
      if (!card) return;
      card.removeAttribute("data-live");
      for (const p of ["--rx", "--ry", "--mx", "--my"]) card.style.removeProperty(p);
    };
    const onMove = (e: PointerEvent) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>(".g2-card");
      if (card !== active) {
        reset(active);
        active = card;
        active?.setAttribute("data-live", "true");
      }
      if (!active) return;
      const r = active.getBoundingClientRect();
      nx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      ny = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const onLeave = () => {
      reset(active);
      active = null;
    };
    grid.addEventListener("pointermove", onMove);
    grid.addEventListener("pointerleave", onLeave);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      reset(active);
      grid.removeEventListener("pointermove", onMove);
      grid.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  // Filter pass — attribute writes only, no interleaved geometry reads.
  useEffect(() => {
    const dom = (domRef.current ??= {
      cards: Array.from(document.querySelectorAll<HTMLElement>("[data-gallery-card]")),
      empty: document.querySelector<HTMLElement>("[data-gallery-empty]"),
      emptyQ: document.querySelector<HTMLElement>("[data-empty-q]"),
      grid: document.querySelector<HTMLElement>(".g2-grid"),
      root: document.querySelector<HTMLElement>(".g2"),
    });
    const trimmed = q.trim();
    const needle = trimmed.toLowerCase();
    let count = 0;
    for (const card of dom.cards) {
      const okCol = col === "all" || card.dataset.collection === col;
      const okQ = !needle || (card.dataset.keywords ?? "").includes(needle);
      const on = okCol && okQ;
      card.hidden = !on;
      if (on) count++;
    }
    if (dom.grid) {
      dom.grid.hidden = count === 0;
      // wayfinding labels show only in the pristine browse state; hide the
      // redundant per-card tag once a single collection is filtered.
      dom.grid.dataset.collectionFilter = col;
      // browse (wayfinding labels) only in the pristine catalog view — not when
      // filtered, searched, or sorted alphabetically (labels would be wrong).
      if (col === "all" && !needle && sort === "catalog") dom.grid.dataset.browse = "true";
      else delete dom.grid.dataset.browse;
    }
    if (dom.empty) dom.empty.hidden = count !== 0;
    // Echo the actual miss back to the reader — the searched term, or the
    // collection name — so the empty state feels answered, not canned.
    if (count === 0 && dom.emptyQ) {
      const label = collections.find((c) => c.key === col)?.label;
      dom.emptyQ.textContent = trimmed ? `“${trimmed}”` : label ? `${label} charts` : "that";
    }
    setShown(count);
    // result count changed the page height — re-decide dock visibility after
    // layout so a small filtered set (short, non-scrollable page) keeps the dock.
    requestAnimationFrame(() => syncDock.current());
  }, [q, col, sort, collections]);

  // Arrow-key roving across the visible plates — Left/Right step one, Up/Down
  // jump a row. Mirrors the 2-D keyboard nav the charts themselves ship, so a
  // keyboard user reads the plane the same way they'd read a single chart.
  useEffect(() => {
    const grid = document.querySelector<HTMLElement>(".g2-grid");
    if (!grid) return;
    const onKey = (e: KeyboardEvent) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
      const cards = Array.from(grid.querySelectorAll<HTMLElement>(".g2-card")).filter(
        (c) => c.offsetParent !== null,
      );
      const here = cards.indexOf(document.activeElement as HTMLElement);
      if (here === -1) return;
      e.preventDefault();
      // Columns = how many cards share the first row's top edge.
      const top0 = Math.round(cards[0].getBoundingClientRect().top);
      const cols = Math.max(
        1,
        cards.filter((c) => Math.round(c.getBoundingClientRect().top) === top0).length,
      );
      const step =
        e.key === "ArrowRight"
          ? 1
          : e.key === "ArrowLeft"
            ? -1
            : e.key === "ArrowDown"
              ? cols
              : -cols;
      cards[Math.min(cards.length - 1, Math.max(0, here + step))]?.focus();
    };
    grid.addEventListener("keydown", onKey);
    return () => grid.removeEventListener("keydown", onKey);
  }, []);

  // Collection switch = a discrete moment worth acknowledging: the plane does a
  // On an ACTUAL collection change, cross-fade the new set (calm, opacity only).
  // Fires only when `col` changes to a new value from a user click — never on
  // mount/re-navigation. Tracking the last value (not a "first render" boolean)
  // is robust to StrictMode's double-invoked effects, which would otherwise let
  // the fade fire on remount and read as "it animated again". Reduced-motion + a
  // no-WAAPI environment both no-op. Search keystrokes don't touch `col`.
  useEffect(() => {
    if (lastCol.current === null || lastCol.current === col) {
      lastCol.current = col;
      return;
    }
    lastCol.current = col;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const grid = document.querySelector<HTMLElement>(".g2-grid");
    grid?.animate?.([{ opacity: 0.5 }, { opacity: 1 }], { duration: 260, easing: "ease-out" });
  }, [col]);

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
  const pills = [{ key: "all", label: "All" }, ...collections] as {
    key: string;
    label: string;
  }[];

  if (!mounted) return null;

  return createPortal(
    <div
      className="g2-dock"
      role="region"
      aria-label="Gallery controls"
      data-hidden={dockHidden || undefined}
    >
      <div className="g2-dock-bar glass glass-strong">
        <div className="flex items-center gap-0.5">
          {pills.map((p) => {
            const n = counts[p.key] ?? 0;
            const empty = p.key !== "all" && n === 0;
            const active = col === p.key;
            return (
              <button
                key={p.key}
                type="button"
                className="g2-pill"
                onClick={() => !empty && setCol(p.key)}
                disabled={empty}
                aria-pressed={active}
                title={empty ? "Coming before launch" : undefined}
              >
                {p.label}
                <span className="g2-pill-n">{empty ? "soon" : n}</span>
              </button>
            );
          })}
        </div>

        <span className="g2-dock-div" aria-hidden />
        <div className="g2-dock-search">
          <Search className="size-4" aria-hidden />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="search"
            placeholder="Search…"
            aria-label="Search charts"
          />
        </div>
        <div className="g2-seg" role="group" aria-label="Render mode">
          {(
            [
              { key: "live" as const, Icon: Sparkles, label: "Live — interactive, animated" },
              { key: "static" as const, Icon: Square, label: "Static — no motion" },
            ] as const
          ).map(({ key, Icon, label }) => (
            <button
              key={key}
              type="button"
              className="g2-icon-btn"
              onClick={() => setGalleryMode(key)}
              aria-pressed={mode === key}
              title={label}
              aria-label={label}
            >
              <Icon className="size-4" aria-hidden />
            </button>
          ))}
        </div>
        <div className="g2-seg" role="group" aria-label="Density">
          {(
            [
              { key: "comfortable", Icon: Grid2x2, label: "Comfortable" },
              { key: "compact", Icon: Grid3x3, label: "Compact" },
            ] as const
          ).map(({ key, Icon, label }) => (
            <button
              key={key}
              type="button"
              className="g2-icon-btn"
              onClick={() => setDensity(key)}
              aria-pressed={density === key}
              title={`${label} density`}
              aria-label={`${label} density`}
            >
              <Icon className="size-4" aria-hidden />
            </button>
          ))}
        </div>
        <div className="g2-seg" role="group" aria-label="Sort">
          {(
            [
              { key: "catalog", Icon: ListOrdered, label: "Catalog order" },
              { key: "name", Icon: ArrowDownAZ, label: "A–Z by name" },
            ] as const
          ).map(({ key, Icon, label }) => (
            <button
              key={key}
              type="button"
              className="g2-icon-btn"
              onClick={() => setSort(key)}
              aria-pressed={sort === key}
              title={label}
              aria-label={label}
            >
              <Icon className="size-4" aria-hidden />
            </button>
          ))}
        </div>

        <span className="g2-dock-div" aria-hidden />
        <span className="g2-dock-count" role="status" aria-live="polite">
          {shown !== null && shown !== total ? shown : total}
        </span>
        <button
          type="button"
          className="g2-icon-btn g2-top"
          data-show={atTop ? undefined : "true"}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
          title="Back to top"
        >
          <ArrowUp className="size-4" aria-hidden />
        </button>
      </div>
    </div>,
    document.body,
  );
}
