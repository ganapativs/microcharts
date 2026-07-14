"use client";
// oxlint-disable react/no-array-index-key -- tiles are positional; the inner span keys on `nonce` to remount on swap
import "@microcharts/react/motion"; // enables `animate` entrance on the live hero cluster
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CHART_MODULES, getChart } from "@/lib/charts/registry";

/** Hero chart cluster: gallery Previews, shuffle on load, one-tile crossfade. */

/** Types whose gallery Preview reads well at cluster scale. */
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
] as const;

const COUNT = 6;

type Cell = { slug: string; nonce: number };

/** Deterministic first board — first COUNT slugs, so the server and first client
 *  render agree (no flash) and there is a stable set to crawl. */
function initialBoard(): Cell[] {
  return POOL.slice(0, COUNT).map((slug, i) => ({ slug, nonce: i }));
}

function pickSlug(exclude: Set<string>): string {
  const choices = POOL.filter((s) => !exclude.has(s));
  return choices[Math.floor(Math.random() * choices.length)] ?? POOL[0];
}

export function LivingCatalog({ total }: { total: number }) {
  const [board, setBoard] = useState<Cell[]>(initialBoard);
  const [live, setLive] = useState(false);
  const nonce = useRef(COUNT);
  const paused = useRef(false); // held while hovered / focus-within

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // one-time shuffle so every reload deals a fresh hand (even under reduced motion)
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
      timer = window.setTimeout(tick, 1800 + Math.random() * 1000);
    };
    timer = window.setTimeout(tick, 1700);
    return () => window.clearTimeout(timer);
  }, []);

  const hold = () => {
    paused.current = true;
  };
  const release = () => {
    paused.current = false;
  };

  return (
    <div
      className="relative"
      onMouseEnter={hold}
      onMouseLeave={release}
      onFocusCapture={hold}
      onBlurCapture={release}
    >
      <div className="relative">
        <div aria-hidden className="pointer-events-none absolute -inset-2.5 -z-10 sm:-inset-3">
          <span className="hx-cross-line hx-cross-v" />
          <span
            className="hx-cross-line hx-cross-h"
            style={{ top: "33.33%", animationDelay: "0s" }}
          />
          <span
            className="hx-cross-line hx-cross-h"
            style={{ top: "66.66%", animationDelay: "-2.5s" }}
          />
          <span
            className="hx-cross-line hx-cross-h"
            style={{ top: "99%", animationDelay: "-5s" }}
          />
          <span className="hx-cross-node" style={{ top: "33.33%" }} />
          <span className="hx-cross-node" style={{ top: "66.66%" }} />
        </div>

        <ul className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {board.map((cell, i) => {
            const mod = CHART_MODULES[cell.slug];
            const entry = getChart(cell.slug);
            if (!mod || !entry) return <li key={i} aria-hidden />;
            // Once live (mounted, motion allowed) render the interactive
            // twin so the entrance animates on load + on each swap; reduced-motion
            // visitors never flip `live` on, so they keep the static Preview.
            const Preview = live && mod.PreviewLive ? mod.PreviewLive : mod.Preview;
            return (
              <li key={i}>
                <Link
                  href={`/docs/charts/${cell.slug}`}
                  aria-label={`${entry.name}: ${entry.tagline}`}
                  className="hx-tile group flex flex-col items-center justify-center gap-2 rounded-[14px] px-3 py-4 no-underline"
                >
                  <span
                    key={cell.nonce}
                    className="hx-slot hx-swap flex min-h-[4.75rem] w-full items-center justify-center"
                  >
                    <Preview />
                  </span>
                  <span className="hx-slot-name mono-label truncate text-[0.58rem] tracking-[0.12em] opacity-55 group-hover:text-fd-primary group-hover:opacity-100">
                    {entry.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-5 flex justify-center">
        <div className="inline-flex items-center gap-2.5">
          <span className="mono-label inline-flex h-8 items-center gap-2 leading-none text-fd-muted-foreground">
            <span
              aria-hidden
              className={`size-1.5 shrink-0 rounded-full bg-fd-primary ${live ? "hx-pulse" : ""}`}
            />
            the catalog, live
          </span>
          <Link
            href="/gallery"
            aria-label={`Browse all ${total} chart types in the gallery`}
            className="cta-ghost group inline-flex h-8 items-center gap-1.5 px-3 text-[0.8rem] font-medium leading-none text-fd-foreground no-underline"
          >
            Browse all {total}
            <ArrowRight className="size-3.5 shrink-0 text-fd-primary transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
