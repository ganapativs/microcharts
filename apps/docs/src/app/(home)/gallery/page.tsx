import { Fragment } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { docsMeta } from "@/lib/metadata";
import { getModule, STABLE_CHARTS } from "@/lib/charts/registry";
import type { ChartCollection, ChartEntry } from "@/lib/charts/types";
import { GalleryDock } from "./gallery-dock";
import { GalleryStage } from "./gallery-stage";

export const metadata: Metadata = docsMeta({
  title: "Gallery",
  description:
    "Every shipped microcharts chart at true word-size: searchable, filterable, and browsable as one grid.",
  path: "/gallery",
});

// Collection framing — dock filters, the per-card tag, and the slim wayfinding
// labels that mark each collection while browsing the whole catalog.
const COLLECTIONS: { key: ChartCollection; label: string; blurb: string }[] = [
  { key: "core", label: "Core", blurb: "Everyday charts." },
  { key: "decision", label: "Decision", blurb: "Tuned to one question." },
  { key: "expressive", label: "Expressive", blurb: "Unusual, apt encodings." },
  { key: "frontier", label: "Frontier", blurb: "Newer word-sized forms." },
];

function keywords(c: ChartEntry): string {
  return [c.name, c.tagline, c.dataShape, c.encoding.channel, c.collection].join(" ").toLowerCase();
}

export default function GalleryPage() {
  // One flat, catalog-ordered plane, grouped by collection so the wayfinding
  // labels (and the browse sequence) stay stable.
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
        <header className="g2-head">
          <span className="mono-label text-fd-primary">The catalog</span>
          <h1 className="display mt-3 text-fluid-h2 text-[length:var(--text-fluid-h2)]">
            {STABLE_CHARTS.length} charts, at true size.
          </h1>
          <p className="mt-4 text-fd-muted-foreground">
            Every chart at the size it lives (in a sentence, a table cell, a KPI card), beside the
            decision it answers. Search or filter to the one you need.
          </p>
        </header>

        <div className="g2-grid" data-density="comfortable" data-browse>
          {charts.map((c, i) => {
            const newGroup = i === 0 || charts[i - 1].collection !== c.collection;
            const group = COLLECTIONS.find((g) => g.key === c.collection);
            // Render the static preview on the SERVER (pure SVG, zero client JS)
            // and pass it as children — the client stage upgrades to the live
            // twin lazily, per-chart, only when live mode is on.
            const Preview = getModule(c.slug)?.Preview;
            return (
              <Fragment key={c.slug}>
                {newGroup && group && (
                  <div className="g2-group" data-group-label>
                    <span className="g2-group-name mono-label text-fd-primary">{group.label}</span>
                    <span className="g2-group-blurb">{group.blurb}</span>
                    <span className="g2-group-n mono-label">{counts[c.collection]}</span>
                  </div>
                )}
                <article
                  className="g2-cell"
                  data-gallery-card
                  data-collection={c.collection}
                  data-name={c.name}
                  data-keywords={keywords(c)}
                >
                  <Link prefetch={false} href={`/docs/charts/${c.slug}`} className="g2-card">
                    <span className="g2-spot" aria-hidden />
                    <ArrowUpRight className="g2-arrow size-4" aria-hidden />
                    {/* Previews are decorative on the card — `inert` keeps the live
                        charts animating but out of the tab order and a11y tree, so
                        no interactive control ever nests inside the link. */}
                    <div className="g2-stage" inert>
                      <GalleryStage slug={c.slug}>{Preview ? <Preview /> : null}</GalleryStage>
                    </div>
                    <div className="g2-meta">
                      {/* name owns its own full-width line so it never truncates
                          against the collection tag */}
                      <span className="g2-name">{c.name}</span>
                      <div className="g2-subrow">
                        <p className="g2-tag">{c.tagline}</p>
                        <span className="g2-coll">{c.collection}</span>
                      </div>
                    </div>
                  </Link>
                </article>
              </Fragment>
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
            yet. Try another term, or clear the filter.
          </p>
        </div>
      </div>

      <GalleryDock counts={counts} collections={COLLECTIONS} />
    </>
  );
}
