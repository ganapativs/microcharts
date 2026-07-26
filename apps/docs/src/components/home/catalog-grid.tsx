"use client";
import "@microcharts/react/motion"; // tiles draw with the library's own entrance
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import type { ChartModule } from "@/lib/charts/types";
import { useClickableCard } from "@/lib/use-clickable-card";

/** Live catalog board. SSR first paint; interactive modules load after mount
 *  and upgrade each tile IN PLACE — same slugs, same order, same keys, so the
 *  swap is invisible. The board itself holds still: a rotating tile was
 *  shipped and cut (readers reported the page "constantly moving"). Breadth
 *  lives in /charts; this board is a taste, not the catalog. */

// 11 charts + the "+N more" tile = a 12-cell board — fills 2/3/4
// columns exactly and keeps the section to three rows on desktop.
const COUNT = 11;

/** The only chart metadata a board cell needs — resolved on the server. */
export interface TileMeta {
  slug: string;
  name: string;
  tagline: string;
  cat: number;
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

  useEffect(() => {
    let cancelled = false;
    // Deferred to after mount: the server already painted a full board, so this
    // chunk never gates first paint. Live modules carry PreviewLive
    // (interactive entries); static hero-modules stay on the SSR path so first
    // paint ships zero interactive chart JS.
    void import("@/components/home/hero-modules-live").then(({ HERO_MODULES_LIVE }) => {
      if (!cancelled) setModules(HERO_MODULES_LIVE);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const board = tiles.slice(0, COUNT);

  return (
    <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
      {/* SSR board keeps layout until client modules land (same slugs/keys, so
          the static→interactive upgrade never re-deals the board). */}
      {modules
        ? board.map((entry) => {
            const mod = modules[entry.slug];
            if (!mod) return <li key={entry.slug} aria-hidden />;
            // Interactive twin whenever it exists — pointer reaches the chart
            // (tile link lives on the name row, not around the mark).
            const Preview = mod.PreviewLive ?? mod.Preview;
            return (
              <CatalogTile key={entry.slug} entry={entry}>
                <Preview />
              </CatalogTile>
            );
          })
        : children}

      <li>
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
 * (hover/scrub on the mark).
 *
 * The link is a real `<a>` overlay (`.hx-tile-link`) — crawlable, shows its URL
 * in the status bar, and supports right-click "Open in new tab" / "Copy link".
 * It covers the name row + dead tile but sits BELOW the raised chart slot
 * (`z-index`), so the interactive mark keeps hover/scrub and the focusable chart
 * is never nested inside the `<a>`. Clicks on the raised slot are handled by
 * `useClickableCard`: a short click navigates, a pointer scrub does not.
 */
export function CatalogTile({ entry, children }: { entry: TileMeta; children: ReactNode }) {
  const href = `/docs/charts/${entry.slug}`;
  const nav = useClickableCard(href);

  return (
    <li>
      <div
        className="hx-tile group relative flex h-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[14px] px-3 pb-3 pt-4"
        {...nav}
      >
        <Link
          prefetch={false}
          href={href}
          className="hx-tile-link"
          aria-label={`${entry.name}: ${entry.tagline}`}
        />
        <div className="hx-slot flex min-h-[4.25rem] w-full items-center justify-center">
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
