"use client";
import "@microcharts/react/motion"; // tiles draw with the library's own entrance
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CHART_MODULES, getChart } from "@/lib/charts/registry";

/**
 * 03 · the catalog, live — a grid of real gallery Previews (the same
 * components `/gallery` renders). Shuffles per reload, one tile cross-fades
 * to a new type every couple of seconds (paused on hover/focus and in hidden
 * tabs). Hover reveals the tagline (space reserved — nothing shifts); the
 * final cell is the "+N more" door to the gallery. Reduced motion: a still,
 * shuffled board.
 */

/** Tier → categorical token index; must match the section chips. */
const CAT: Record<string, number> = { core: 1, decision: 2, expressive: 3, frontier: 4 };

const POOL = [
  "sparkline",
  "sparkbar",
  "mini-bar",
  "histogram-strip",
  "heat-strip",
  "rug-strip",
  "horizon",
  "seismogram",
  "waveform",
  "comet-trail",
  "bump-strip",
  "dual-sparkline",
  "city-skyline",
  "constellation",
  "tree-rings",
  "spiral-year",
  "moon-phase",
  "honeycomb",
  "thermometer",
  "heartbeat-blip",
  "micro-scatter",
  "stacked-area",
  "bubble-row",
  "bullet",
  "delta",
  "segmented-bar",
  "waterfall",
  "slope",
  "dumbbell",
  "micro-box",
  "streak-spark",
  "win-prob-worm",
] as const;

const COUNT = 23; // 23 charts + the "+N more" gallery tile = a 24-cell board

type Cell = { slug: string; nonce: number };

/** Deterministic first board so SSR and hydration agree. */
function initialBoard(): Cell[] {
  return POOL.slice(0, COUNT).map((slug, i) => ({ slug, nonce: i }));
}

function pickSlug(exclude: Set<string>): string {
  const choices = POOL.filter((s) => !exclude.has(s));
  return choices[Math.floor(Math.random() * choices.length)] ?? POOL[0];
}

export function CatalogGrid({ total }: { total: number }) {
  const [board, setBoard] = useState<Cell[]>(initialBoard);
  const [live, setLive] = useState(false);
  const nonce = useRef(COUNT);
  const paused = useRef(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setBoard(() => {
      const used = new Set<string>();
      return Array.from({ length: COUNT }, () => {
        const slug = pickSlug(used);
        used.add(slug);
        return { slug, nonce: (nonce.current += 1) };
      });
    });
    if (reduce) return;
    setLive(true);

    let timer = 0;
    const tick = () => {
      if (document.visibilityState === "visible" && !paused.current) {
        setBoard((prev) => {
          const used = new Set(prev.map((c) => c.slug));
          const i = Math.floor(Math.random() * prev.length);
          used.delete(prev[i]!.slug);
          const next = prev.slice();
          next[i] = { slug: pickSlug(used), nonce: (nonce.current += 1) };
          return next;
        });
      }
      timer = window.setTimeout(tick, 2100 + Math.random() * 1200);
    };
    timer = window.setTimeout(tick, 2000);
    return () => window.clearTimeout(timer);
  }, []);

  const hold = () => {
    paused.current = true;
  };
  const release = () => {
    paused.current = false;
  };

  return (
    <ul
      className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4"
      onMouseEnter={hold}
      onMouseLeave={release}
      onFocusCapture={hold}
      onBlurCapture={release}
    >
      {board.map((cell, i) => {
        const mod = CHART_MODULES[cell.slug];
        const entry = getChart(cell.slug);
        if (!mod || !entry) return <li key={cell.nonce} aria-hidden />;
        const Preview = live && mod.PreviewLive ? mod.PreviewLive : mod.Preview;
        return (
          <li
            key={cell.nonce}
            className={`hx-stagger ${i >= 11 ? "hidden sm:block" : ""}`}
            style={{ "--i": i % 12 } as React.CSSProperties}
          >
            <Link
              prefetch={false}
              href={`/docs/charts/${cell.slug}`}
              aria-label={`${entry.name}: ${entry.tagline}`}
              className="hx-tile group flex h-full flex-col items-center justify-center gap-1.5 rounded-[14px] px-3 pb-3 pt-4 no-underline"
            >
              <span
                inert
                className="hx-slot hx-swap flex min-h-[4.25rem] w-full items-center justify-center"
              >
                <Preview />
              </span>
              <span className="flex max-w-full items-center gap-1.5">
                <span
                  aria-hidden
                  className="size-1 shrink-0 rounded-full opacity-70"
                  style={{ background: `var(--mc-cat-${CAT[entry.collection] ?? 1})` }}
                />
                <span className="hx-slot-name mono-label truncate text-[0.58rem] tracking-[0.12em] opacity-55 group-hover:text-fd-primary group-hover:opacity-100">
                  {entry.name}
                </span>
              </span>
              {/* tagline — one reserved line, fades in on hover, never shifts */}
              <span className="hv-tile-tag" aria-hidden>
                {entry.tagline}
              </span>
            </Link>
          </li>
        );
      })}
      <li className="hx-stagger" style={{ "--i": 11 } as React.CSSProperties}>
        <Link
          prefetch={false}
          href="/gallery"
          aria-label={`Browse all ${total} chart types in the gallery`}
          className="hx-tile group flex h-full flex-col items-center justify-center gap-1.5 rounded-[14px] border border-dashed border-hairline px-3 pb-3 pt-4 no-underline"
        >
          <span className="display text-[1.6rem] leading-none text-fd-foreground transition-colors group-hover:text-fd-primary">
            +{total - COUNT}
          </span>
          <span className="mono-label text-[0.58rem] tracking-[0.12em] opacity-55 transition-opacity group-hover:text-fd-primary group-hover:opacity-100">
            more in the gallery
          </span>
          <span className="hv-tile-tag" aria-hidden>
            every type, live, with its props
          </span>
        </Link>
      </li>
    </ul>
  );
}
