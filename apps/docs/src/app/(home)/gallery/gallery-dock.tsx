"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUp, Grid2x2, Grid3x3, Search } from "lucide-react";
import type { ChartCollection } from "@/lib/charts/types";

/**
 * The floating command dock for the gallery. Everything the user drives lives
 * here, at the bottom of the viewport. The plane itself is server-rendered and
 * never re-created — this only:
 *   · toggles each card's `hidden` from data-* keywords (RSC-safe, JS-off = grid)
 *   · flips `data-density` on the grid; slides the site nav away on scroll-down
 *   · roves focus across the visible plates with the arrow keys
 *   · runs ONE delegated pointer handler that tilts + lights the hovered plate
 * No chart JS ships; nothing here re-renders the catalog.
 */

type Density = "comfortable" | "compact";
const DENSITY_KEY = "mc-gallery2-density";
const TILT_MAX = 3; // degrees

export function GalleryDock({
  counts,
  collections,
}: {
  counts: Record<string, number>;
  collections: { key: ChartCollection; label: string }[];
}) {
  const [q, setQ] = useState("");
  const [col, setCol] = useState<string>("all");
  const [density, setDensity] = useState<Density>("comfortable");
  const [shown, setShown] = useState<number | null>(null);
  const [atTop, setAtTop] = useState(true);
  const [dockHidden, setDockHidden] = useState(false);
  // The dock is fixed to the viewport, but the (home) layout's RouteTransition
  // wrapper is a transformed ancestor — which would trap `position: fixed`
  // against itself. Portal to <body> so the dock anchors to the viewport.
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const firstFilter = useRef(true);
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

  // Restore density before the first filter pass.
  useEffect(() => {
    const saved = localStorage.getItem(DENSITY_KEY);
    if (saved === "comfortable" || saved === "compact") setDensity(saved);
  }, []);

  // Let the entrance ripple play once, then freeze it so filtering never replays.
  useEffect(() => {
    const el = document.querySelector<HTMLElement>(".g2");
    if (!el) return;
    const t = window.setTimeout(() => {
      el.dataset.entered = "true";
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

  // Slip the dock away once the footer scrolls into view — it's fixed to the
  // viewport, so without this it would float over the footer at the page bottom.
  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) return;
    const io = new IntersectionObserver(([e]) => setDockHidden(e.isIntersecting));
    io.observe(footer);
    return () => io.disconnect();
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
    if (dom.grid) dom.grid.hidden = count === 0;
    if (dom.empty) dom.empty.hidden = count !== 0;
    // Echo the actual miss back to the reader — the searched term, or the
    // collection name — so the empty state feels answered, not canned.
    if (count === 0 && dom.emptyQ) {
      const label = collections.find((c) => c.key === col)?.label;
      dom.emptyQ.textContent = trimmed ? `“${trimmed}”` : label ? `${label} charts` : "that";
    }
    setShown(count);
  }, [q, col, collections]);

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
  // quick fade + rise so the new set reads as a fresh deal, not a silent swap.
  // WAAPI (not CSS) so it restarts cleanly on every switch; skipped on the first
  // render and under reduced-motion. Not fired on search keystrokes — that would
  // strobe. transform+opacity only, one element, 60fps.
  useEffect(() => {
    if (firstFilter.current) {
      firstFilter.current = false;
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const grid = document.querySelector<HTMLElement>(".g2-grid");
    grid?.animate?.(
      [
        { opacity: 0.55, transform: "translateY(5px)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: 280, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
    );
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
        {/* collection filters */}
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

        {/* search */}
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

        {/* density */}
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

        <span className="g2-dock-div" aria-hidden />

        {/* live count */}
        <span className="g2-dock-count" role="status" aria-live="polite">
          {shown !== null && shown !== total ? `${shown} / ${total}` : total}
        </span>

        {/* back to top — appears once scrolled */}
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
