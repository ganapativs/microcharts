"use client";
import "@microcharts/react/motion"; // tiles draw with the library's own entrance
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import type { ChartModule } from "@/lib/charts/types";

/**
 * 03 · the catalog, live — a grid of real chart Previews (the same
 * components `/charts` renders). Shuffles per reload, one tile cross-fades
 * to a new type every couple of seconds (paused on hover/focus and in hidden
 * tabs). Hover reveals the tagline (space reserved — nothing shifts); the
 * final cell is the "+N more" door to the Charts index. Reduced motion: a
 * still, shuffled board.
 *
 * PERF: the homepage pays ZERO chart JS up front. The first board renders on the
 * SERVER and arrives as `children`; the pool's chart modules (~99 kB gzip — each
 * module carries its chart's interactive twin as well as the static one) are
 * imported only AFTER mount, off the critical path, at which point the client
 * board takes over and starts dealing. `tiles` carries just the name/tagline/tier
 * the board needs, so the 44 kB-gzip catalog metadata stays off the client too.
 */

// 11 charts + the "+N more" tile = a 12-cell board — fills 2/3/4
// columns exactly and keeps the section to three rows on desktop (breadth
// lives in /charts; this board is a taste, not the catalog).
const COUNT = 11;

/** The only chart metadata a board cell needs — resolved on the server. */
export interface TileMeta {
  slug: string;
  name: string;
  tagline: string;
  cat: number;
}

type Cell = { slug: string; nonce: number };

function pickSlug(pool: string[], exclude: Set<string>): string {
  const choices = pool.filter((s) => !exclude.has(s));
  return choices[Math.floor(Math.random() * choices.length)] ?? pool[0]!;
}

export function CatalogGrid({
  total,
  tiles,
  children,
}: {
  total: number;
  tiles: TileMeta[];
  children: ReactNode;
}) {
  const [modules, setModules] = useState<Record<string, ChartModule> | null>(null);
  const [board, setBoard] = useState<Cell[] | null>(null);
  const [live, setLive] = useState(false);
  const nonce = useRef(COUNT);
  const paused = useRef(false);

  useEffect(() => {
    const pool = tiles.map((t) => t.slug);
    let cancelled = false;
    let timer = 0;

    // Deferred to after mount: the server already painted a full board, so this
    // chunk only has to land before the first deal — never before first paint.
    void import("@/components/home/hero-modules").then(({ HERO_MODULES }) => {
      if (cancelled) return;
      setModules(HERO_MODULES);
      setBoard(() => {
        const used = new Set<string>();
        return Array.from({ length: COUNT }, () => {
          const slug = pickSlug(pool, used);
          used.add(slug);
          return { slug, nonce: (nonce.current += 1) };
        });
      });

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      setLive(true);

      const tick = () => {
        if (document.visibilityState === "visible" && !paused.current) {
          setBoard((prev) => {
            if (!prev) return prev;
            const used = new Set(prev.map((c) => c.slug));
            const i = Math.floor(Math.random() * prev.length);
            used.delete(prev[i]!.slug);
            const next = prev.slice();
            next[i] = { slug: pickSlug(pool, used), nonce: (nonce.current += 1) };
            return next;
          });
        }
        timer = window.setTimeout(tick, 2100 + Math.random() * 1200);
      };
      timer = window.setTimeout(tick, 2000);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [tiles]);

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
      {/* The server's board holds the space until the pool's modules land —
          identical markup and box, so the handover shifts nothing. */}
      {board && modules
        ? board.map((cell, i) => {
            const mod = modules[cell.slug];
            const entry = tiles.find((t) => t.slug === cell.slug);
            if (!mod || !entry) return <li key={cell.nonce} aria-hidden />;
            const Preview = live && mod.PreviewLive ? mod.PreviewLive : mod.Preview;
            return (
              <CatalogTile key={cell.nonce} i={i} entry={entry}>
                <Preview />
              </CatalogTile>
            );
          })
        : children}

      <li className="hx-stagger" style={{ "--i": 11 } as React.CSSProperties}>
        <Link
          prefetch={false}
          href="/charts"
          aria-label={`Browse all ${total} chart types`}
          className="hx-tile group flex h-full flex-col items-center justify-center gap-1.5 rounded-[14px] border border-dashed border-hairline px-3 pb-3 pt-4 no-underline"
        >
          <span className="display text-[1.6rem] leading-none text-fd-foreground transition-colors group-hover:text-fd-primary">
            +{total - COUNT}
          </span>
          <span className="mono-label text-[0.58rem] tracking-[0.12em] opacity-55 transition-opacity group-hover:text-fd-primary group-hover:opacity-100">
            more in Charts
          </span>
          <span className="hv-tile-tag" aria-hidden>
            every type, live, with its props
          </span>
        </Link>
      </li>
    </ul>
  );
}

/**
 * One board cell. Shared by the server's first board and the client's dealt
 * board so the two are identical and the handover is invisible.
 */
export function CatalogTile({
  i,
  entry,
  children,
}: {
  i: number;
  entry: TileMeta;
  children: ReactNode;
}) {
  return (
    <li className="hx-stagger" style={{ "--i": i % 12 } as React.CSSProperties}>
      <Link
        prefetch={false}
        href={`/docs/charts/${entry.slug}`}
        aria-label={`${entry.name}: ${entry.tagline}`}
        className="hx-tile group flex h-full flex-col items-center justify-center gap-1.5 rounded-[14px] px-3 pb-3 pt-4 no-underline"
      >
        <span
          inert
          className="hx-slot hx-swap flex min-h-[4.25rem] w-full items-center justify-center"
        >
          {children}
        </span>
        <span className="flex max-w-full items-center gap-1.5">
          <span
            aria-hidden
            className="size-1 shrink-0 rounded-full opacity-70"
            style={{ background: `var(--mc-cat-${entry.cat})` }}
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
}
