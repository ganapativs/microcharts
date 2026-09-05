"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import type { ChartCollection } from "@/lib/charts/types";
import { getGalleryMode, subscribeGalleryMode, type GalleryMode } from "./gallery-mode";

export type GalleryDensity = "comfortable" | "compact";
export type GallerySort = "catalog" | "name";
const DENSITY_KEY = "mc-gallery2-density";

function initialState(): {
  q: string;
  density: GalleryDensity;
  sort: GallerySort;
} {
  if (typeof window === "undefined") return { q: "", density: "comfortable", sort: "catalog" };
  const p = new URLSearchParams(window.location.search);
  const d = p.get("density");
  const stored = localStorage.getItem(DENSITY_KEY);
  const density: GalleryDensity =
    d === "compact" || d === "comfortable"
      ? d
      : stored === "compact" || stored === "comfortable"
        ? stored
        : "comfortable";
  return {
    q: p.get("q") ?? "",
    density,
    sort: p.get("sort") === "name" ? "name" : "catalog",
  };
}

export function useGalleryDock(
  collections: readonly { key: ChartCollection; label: string }[],
  activeCollection: ChartCollection | "all",
) {
  const router = useRouter();
  const col = activeCollection;
  const goCollection = (key: string) => {
    router.push(key === "all" ? "/charts" : `/charts/${key}`);
  };

  // Read the URL + localStorage ONCE, not once per state initializer — a lazy
  // initializer runs exactly once, which is what the read-once ref was for.
  const [init] = useState(initialState);
  const [q, setQ] = useState(init.q);
  const [density, setDensity] = useState<GalleryDensity>(init.density);
  const [sort, setSort] = useState<GallerySort>(init.sort);
  const [shown, setShown] = useState<number | null>(null);
  const [atTop, setAtTop] = useState(true);
  const [dockHidden, setDockHidden] = useState(false);
  const mode = useSyncExternalStore(
    subscribeGalleryMode,
    getGalleryMode,
    () => "live" as GalleryMode,
  );
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const syncDock = useRef<() => void>(() => {});
  const remeasure = useRef<() => void>(() => {});

  useEffect(() => {
    // A hydration latch: "are we past the server render" is not knowable during
    // one, so it cannot be derived.
    // oxlint-disable-next-line react/set-state-in-effect
    setMounted(true);
    const html = document.documentElement;
    html.dataset.g2Mounted = "true";
    return () => {
      delete html.dataset.g2Mounted;
      delete html.dataset.g2Nav;
      delete html.dataset.g2Mode;
    };
  }, []);

  // Expose the live/static mode to CSS so the per-card "live" affordance can
  // hide itself in static mode without threading state through 106 cards.
  useEffect(() => {
    document.documentElement.dataset.g2Mode = mode;
  }, [mode]);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (q) p.set("q", q);
    else p.delete("q");
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
  }, [q, density, sort]);

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

  useEffect(() => {
    const grid = document.querySelector<HTMLElement>(".g2-grid");
    if (grid) grid.dataset.density = density;
    localStorage.setItem(DENSITY_KEY, density);
  }, [density]);

  useEffect(() => {
    const html = document.documentElement;
    let lastY = window.scrollY;
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
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

  // The dock retracts once the footer has risen into the viewport. Both inputs
  // are kept OFF the scroll path: `scrollHeight` and the footer's rect each force
  // a full document layout, and this used to read both on every scroll frame.
  // The footer's position becomes an IntersectionObserver (the -56px bottom
  // margin is exactly the old `top < innerHeight - 56` test), and the overflow
  // check is re-measured only when the layout can actually have changed.
  useEffect(() => {
    const footer = document.querySelector("footer");
    let footerIn = false;
    let hasOverflow = true;

    const measure = () => {
      hasOverflow = document.documentElement.scrollHeight - window.innerHeight > 80;
    };
    syncDock.current = () => {
      // scrollY is a cheap read — it never forces layout.
      setDockHidden(hasOverflow && window.scrollY >= 48 && footerIn);
    };
    remeasure.current = () => {
      measure();
      syncDock.current();
    };

    const io = footer
      ? new IntersectionObserver(
          ([e]) => {
            footerIn = e.isIntersecting;
            syncDock.current();
          },
          { rootMargin: "0px 0px -56px 0px" },
        )
      : null;
    io?.observe(footer!);

    measure();
    syncDock.current();
    const onResize = () => remeasure.current();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      io?.disconnect();
    };
  }, []);

  /* There is no pointer tilt and no cursor spotlight. Both were removed with the
     rest of the plane's elevation: nothing on this surface lifts, glows or
     rotates, and a hundred cards each running a rAF loop under the cursor is the
     one place that cost was also measurable. Hover is a step up the surface
     ladder, and that is all. */

  useEffect(() => {
    // Re-query every run: hub navigations swap the SSR grid without remounting the dock.
    const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-gallery-card]"));
    const empty = document.querySelector<HTMLElement>("[data-gallery-empty]");
    const emptyQ = document.querySelector<HTMLElement>("[data-empty-q]");
    const grid = document.querySelector<HTMLElement>(".g2-grid");
    const trimmed = q.trim();
    const needle = trimmed.toLowerCase();
    let count = 0;
    for (const card of cards) {
      const on = !needle || (card.dataset.keywords ?? "").includes(needle);
      card.hidden = !on;
      if (on) count++;
    }
    if (grid) {
      grid.hidden = count === 0;
      if (col === "all" && !needle && sort === "catalog") grid.dataset.browse = "true";
      else delete grid.dataset.browse;
    }
    if (empty) empty.hidden = count !== 0;
    if (count === 0 && emptyQ) {
      const label = collections.find((c) => c.key === col)?.label;
      emptyQ.textContent = trimmed ? `“${trimmed}”` : label ? `${label} charts` : "that";
    }
    // Counted off the live DOM after the filter ran — an external measurement,
    // which is what an effect is for; there is nothing to derive it from.
    // oxlint-disable-next-line react/set-state-in-effect
    setShown(count);
    // Filtering changes the document height, so the overflow test has to be
    // re-measured here — this is the one place it can actually have changed
    // without a resize.
    requestAnimationFrame(() => requestAnimationFrame(() => remeasure.current()));
  }, [q, col, sort, collections]);

  useEffect(() => {
    const grid = document.querySelector<HTMLElement>(".g2-grid");
    if (!grid) return;
    const onKey = (e: KeyboardEvent) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
      // The focusable element per card is now the `.g2-cover` anchor (the card
      // itself is no longer a tab stop), so rove across those.
      const cards = Array.from(grid.querySelectorAll<HTMLElement>(".g2-cover")).filter(
        (c) => c.offsetParent !== null,
      );
      const here = cards.indexOf(document.activeElement as HTMLElement);
      if (here === -1) return;
      e.preventDefault();
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = inputRef.current;
      if (!el) return;
      // `/` focuses the gallery filter. ⌘K is intentionally NOT bound here — it
      // is owned site-wide by Fumadocs' global doc search; binding it too fired
      // both listeners and opened the search dialog over the focused filter.
      if (e.key === "/" && document.activeElement !== el) {
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

  return {
    mounted,
    q,
    setQ,
    col,
    goCollection,
    density,
    setDensity,
    sort,
    setSort,
    shown,
    atTop,
    dockHidden,
    mode,
    inputRef,
  };
}
