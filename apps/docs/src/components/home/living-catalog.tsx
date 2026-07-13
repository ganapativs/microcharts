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
const COLS = 2;
const ROWS = COUNT / COLS;

type Cell = { slug: string; nonce: number };

function RowGap({ delay }: { delay: string }) {
  return (
    <div aria-hidden className="relative h-2.5 shrink-0 sm:h-3">
      <span
        className="hx-cross-line hx-cross-h absolute top-1/2 right-[5%] left-[5%]"
        style={{ animationDelay: delay }}
      />
      <span className="hx-cross-node absolute top-1/2 left-1/2" />
    </div>
  );
}

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
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <span className="hx-cross-line hx-cross-v" />
        </div>

        <div className="flex flex-col">
          {Array.from({ length: ROWS }, (_, ri) => {
            return (
              <div key={ri}>
                {ri > 0 ? <RowGap delay={ri === 1 ? "0s" : "-2.5s"} /> : null}
                <ul className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  {board.slice(ri * COLS, ri * COLS + COLS).map((cell, ci) => {
                    const i = ri * COLS + ci;
                    const mod = CHART_MODULES[cell.slug];
                    const entry = getChart(cell.slug);
                    if (!mod || !entry) return <li key={i} aria-hidden />;
                    const Preview = live && mod.PreviewLive ? mod.PreviewLive : mod.Preview;
                    return (
                      <li key={i}>
                        <Link
                          href={`/docs/charts/${cell.slug}`}
                          aria-label={`${entry.name}: ${entry.tagline}`}
                          className="hx-tile group flex h-[7.5rem] flex-col items-center justify-between rounded-[14px] px-3 py-3 no-underline"
                        >
                          <span
                            key={cell.nonce}
                            className="hx-slot hx-swap flex h-[4.5rem] w-full shrink-0 items-center justify-center"
                          >
                            <Preview />
                          </span>
                          <span className="hx-slot-name mono-label shrink-0 truncate text-[0.58rem] tracking-[0.12em] opacity-55 group-hover:text-fd-primary group-hover:opacity-100">
                            {entry.name}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2.5 flex justify-center sm:mt-3">
        <Link
          href="/gallery"
          aria-label={`Browse all ${total} chart types in the gallery`}
          className="group inline-flex items-center gap-2 text-fd-muted-foreground transition-colors hover:text-fd-foreground"
        >
          <span
            aria-hidden
            className={`size-1.5 rounded-full bg-fd-primary ${live ? "hx-pulse" : ""}`}
          />
          <span className="mono-label">
            the catalog, live <span className="text-hairline">·</span>{" "}
            <span className="underline decoration-1 underline-offset-[5px] transition-[text-decoration-color] [text-decoration-color:color-mix(in_oklab,var(--accent)_45%,transparent)] group-hover:[text-decoration-color:var(--accent)]">
              browse all {total}
            </span>
          </span>
          <ArrowRight className="size-3.5 text-fd-primary transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
