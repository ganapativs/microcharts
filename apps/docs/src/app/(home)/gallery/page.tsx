import Link from "next/link";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { docsMeta } from "@/lib/metadata";
import { CHART_MODULES, STABLE_CHARTS } from "@/lib/charts/registry";
import type { ChartCollection, ChartEntry } from "@/lib/charts/types";
import { GalleryDock } from "./gallery-dock";

export const metadata: Metadata = docsMeta({
  title: "Gallery",
  description:
    "The full microcharts catalog as one immersive plane — every shipped chart at true word-size, searchable, filterable, and tilting to your cursor. A contact sheet for word-sized instruments.",
  path: "/gallery",
});

// Collection framing — used for the dock filters + the per-card tag. This is a
// continuous plane, so collections are metadata, never section walls.
const COLLECTIONS: { key: ChartCollection; label: string }[] = [
  { key: "core", label: "Core" },
  { key: "decision", label: "Decision" },
  { key: "expressive", label: "Expressive" },
  { key: "frontier", label: "Frontier" },
];

function keywords(c: ChartEntry): string {
  return [c.name, c.tagline, c.dataShape, c.encoding.channel, c.collection].join(" ").toLowerCase();
}

export default function GalleryPage() {
  // One flat, catalog-ordered plane. Collection order first, then registry order
  // within — so the sequence is stable and the corner index reads left-to-right.
  const order: Record<ChartCollection, number> = {
    core: 0,
    decision: 1,
    expressive: 2,
    frontier: 3,
  };
  const charts = [...STABLE_CHARTS].sort((a, b) => order[a.collection] - order[b.collection]);

  const counts: Record<string, number> = { all: charts.length };
  for (const c of charts) counts[c.collection] = (counts[c.collection] ?? 0) + 1;

  return (
    <>
      <div className="g2">
        {/* ── masthead — just scrolls away with the content ─────────────────── */}
        <header className="g2-head">
          <span className="mono-label text-fd-primary">The catalog</span>
          <h1 className="display mt-3 text-fluid-h2 text-[length:var(--text-fluid-h2)]">
            {STABLE_CHARTS.length} charts, at true size.
          </h1>
          <p className="mt-4 text-fd-muted-foreground">
            Every shipped microchart on one plane — at the size it lives in your interface, beside
            the data it answers. Filter, search, and scan; each plate lights and tilts to your
            cursor. The controls float at the bottom, where your hands already are.
          </p>
        </header>

        {/* ── the plane ─────────────────────────────────────────────────────
            One flat grid of instrument plates. The dock (client) toggles each
            [data-gallery-card]'s `hidden` from data-* keywords — with JS off,
            every chart still renders in the default grid, fully SSR. */}
        <div className="g2-grid" data-density="comfortable">
          {charts.map((c, i) => {
            const Preview = CHART_MODULES[c.slug]!.Preview;
            const idx = String(i + 1).padStart(2, "0");
            return (
              <article
                key={c.slug}
                className="g2-cell"
                data-gallery-card
                data-collection={c.collection}
                data-keywords={keywords(c)}
                style={{ "--i": i } as CSSProperties}
              >
                <Link
                  href={`/docs/charts/${c.slug}`}
                  className="g2-card"
                  aria-label={`${c.name} — ${c.tagline}`}
                >
                  <span className="g2-spot" aria-hidden />
                  <ArrowUpRight className="g2-arrow size-4" aria-hidden />
                  <div className="g2-stage">
                    <Preview />
                    <span className="g2-idx" aria-hidden>
                      {idx}
                    </span>
                  </div>
                  <div className="g2-meta">
                    <div className="g2-meta-head">
                      <span className="g2-name">{c.name}</span>
                      <span className="g2-coll">{c.collection}</span>
                    </div>
                    <p className="g2-tag">{c.tagline}</p>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>

        {/* empty state — toggled by the dock when nothing matches; the dock
            writes the searched term into [data-empty-q] so the miss feels
            answered, not generic. */}
        <div className="g2-empty" data-gallery-empty hidden>
          <p className="text-sm">
            Nothing in the catalog answers{" "}
            <span data-empty-q className="text-fd-foreground">
              that
            </span>{" "}
            yet — try another term, or clear the filter.
          </p>
        </div>
      </div>

      <GalleryDock counts={counts} collections={COLLECTIONS} />
    </>
  );
}
