"use client";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ChartCollection } from "@/lib/charts/types";
import { getGalleryMode, subscribeGalleryMode, type GalleryMode } from "./gallery-mode";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
let hasEntered = false;

export type GalleryDensity = "comfortable" | "compact";
export type GallerySort = "catalog" | "name";
const DENSITY_KEY = "mc-gallery2-density";
const TILT_MAX = 3;

function initialState(): { q: string; col: string; density: GalleryDensity; sort: GallerySort } {
  if (typeof window === "undefined")
    return { q: "", col: "all", density: "comfortable", sort: "catalog" };
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
    col: p.get("collection") ?? "all",
    density,
    sort: p.get("sort") === "name" ? "name" : "catalog",
  };
}

export function useGalleryDock(collections: { key: ChartCollection; label: string }[]) {
  const [q, setQ] = useState(() => initialState().q);
  const [col, setCol] = useState<string>(() => initialState().col);
  const [density, setDensity] = useState<GalleryDensity>(() => initialState().density);
  const [sort, setSort] = useState<GallerySort>(() => initialState().sort);
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
  const lastCol = useRef<string | null>(null);
  const syncDock = useRef<() => void>(() => {});
  const domRef = useRef<{
    cards: HTMLElement[];
    empty: HTMLElement | null;
    emptyQ: HTMLElement | null;
    grid: HTMLElement | null;
    root: HTMLElement | null;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
    const html = document.documentElement;
    html.dataset.g2Mounted = "true";
    return () => {
      delete html.dataset.g2Mounted;
      delete html.dataset.g2Nav;
    };
  }, []);

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

  useEffect(() => {
    const footer = document.querySelector("footer");
    syncDock.current = () => {
      const overflow = document.documentElement.scrollHeight - window.innerHeight;
      if (overflow <= 80 || window.scrollY < 48) {
        setDockHidden(false);
        return;
      }
      const reached = footer ? footer.getBoundingClientRect().top < window.innerHeight - 56 : false;
      setDockHidden(reached);
    };
    syncDock.current();
    const onResize = () => syncDock.current();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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
      dom.grid.dataset.collectionFilter = col;
      if (col === "all" && !needle && sort === "catalog") dom.grid.dataset.browse = "true";
      else delete dom.grid.dataset.browse;
    }
    if (dom.empty) dom.empty.hidden = count !== 0;
    if (count === 0 && dom.emptyQ) {
      const label = collections.find((c) => c.key === col)?.label;
      dom.emptyQ.textContent = trimmed ? `“${trimmed}”` : label ? `${label} charts` : "that";
    }
    setShown(count);
    requestAnimationFrame(() => requestAnimationFrame(() => syncDock.current()));
  }, [q, col, sort, collections]);

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
    if (lastCol.current === null || lastCol.current === col) {
      lastCol.current = col;
      return;
    }
    lastCol.current = col;
    window.scrollTo(0, 0);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const grid = document.querySelector<HTMLElement>(".g2-grid");
    grid?.animate?.([{ opacity: 0.5 }, { opacity: 1 }], { duration: 260, easing: "ease-out" });
  }, [col]);

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

  return {
    mounted,
    q,
    setQ,
    col,
    setCol,
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
