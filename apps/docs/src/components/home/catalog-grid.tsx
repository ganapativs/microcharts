"use client";
import "@microcharts/react/motion"; // tiles draw with the library's own entrance
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import type { ChartModule } from "@/lib/charts/types";
import { useClickableCard } from "@/lib/use-clickable-card";

/** Live catalog board. SSR first paint; interactive modules load after mount.
 *  Shuffles; one tile rotates (paused on hover/hidden). `tiles` = name/tagline
 *  only so the full catalog stays off the client. */

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
  const nonce = useRef(COUNT);
  const paused = useRef(false);

  useEffect(() => {
    const pool = tiles.map((t) => t.slug);
    let cancelled = false;
    let timer = 0;

    // Deferred to after mount: the server already painted a full board, so this
    // chunk only has to land before the first deal — never before first paint.
    // Live modules carry PreviewLive (interactive entries); static hero-modules
    // stay on the SSR path so first paint ships zero interactive chart JS.
    void import("@/components/home/hero-modules-live").then(({ HERO_MODULES_LIVE }) => {
      if (cancelled) return;
      setModules(HERO_MODULES_LIVE);
      setBoard(() => {
        const used = new Set<string>();
        return Array.from({ length: COUNT }, () => {
          const slug = pickSlug(pool, used);
          used.add(slug);
          return { slug, nonce: (nonce.current += 1) };
        });
      });

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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
      {/* SSR board keeps layout until client modules hydrate (same box). */}
      {board && modules
        ? board.map((cell, i) => {
            const mod = modules[cell.slug];
            const entry = tiles.find((t) => t.slug === cell.slug);
            if (!mod || !entry) return <li key={cell.nonce} aria-hidden />;
            // Interactive twin whenever it exists — pointer reaches the chart
            // (tile link lives on the name row, not around the mark).
            const Preview = mod.PreviewLive ?? mod.Preview;
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
 * One board cell. Fully clickable (opens the chart docs) and interactive
 * (hover/scrub on the mark). A short click navigates; a pointer scrub does not.
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
  const href = `/docs/charts/${entry.slug}`;
  const nav = useClickableCard(href);

  return (
    <li className="hx-stagger" style={{ "--i": i % 12 } as React.CSSProperties}>
      <div
        className="hx-tile group flex h-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[14px] px-3 pb-3 pt-4"
        aria-label={`${entry.name}: ${entry.tagline}`}
        {...nav}
      >
        <div className="hx-slot hx-swap flex min-h-[4.25rem] w-full items-center justify-center">
          {children}
        </div>
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
        <span className="hv-tile-tag" aria-hidden>
          {entry.tagline}
        </span>
      </div>
    </li>
  );
}
