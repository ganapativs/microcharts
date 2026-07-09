import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { docsMeta } from "@/lib/metadata";
import { CATALOG_TARGET, CHART_MODULES, STABLE_CHARTS } from "@/lib/charts/registry";
import type { ChartCollection, ChartEntry } from "@/lib/charts/types";
import { GalleryFilter } from "./gallery-filter";

export const metadata: Metadata = docsMeta({
  title: "Gallery",
  description:
    "Every shipped microchart, shown at its true word-size beside the data shape it answers — a specimen sheet for the catalog.",
  path: "/gallery",
});

// Collection order + editorial framing. Only groups with shipped charts render.
const COLLECTIONS: { key: ChartCollection; label: string; blurb: string }[] = [
  { key: "core", label: "Core", blurb: "The everyday instruments — trend, magnitude, change." },
  { key: "decision", label: "Decision", blurb: "Charts tuned to answer one question and move on." },
  {
    key: "expressive",
    label: "Expressive",
    blurb: "Unusual encodings, earned by an unusually apt fit.",
  },
  {
    key: "frontier",
    label: "Frontier",
    blurb: "Newer forms pushing what a word-sized chart can say.",
  },
];

function keywords(c: ChartEntry): string {
  return [c.name, c.tagline, c.dataShape, c.encoding.channel, c.collection].join(" ").toLowerCase();
}

export default function GalleryPage() {
  const byCollection = COLLECTIONS.map((group) => ({
    ...group,
    charts: STABLE_CHARTS.filter((c) => c.collection === group.key),
  })).filter((g) => g.charts.length > 0);

  const counts: Record<string, number> = { all: STABLE_CHARTS.length };
  for (const g of byCollection) counts[g.key] = g.charts.length;

  // A stable catalog index number (01…) across the whole sheet.
  let n = 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      {/* ── Masthead ─────────────────────────────────────────────────────── */}
      <header className="max-w-2xl">
        <span className="mono-label text-fd-primary">The catalog</span>
        <h1 className="display mt-3 text-fluid-h2 text-[length:var(--text-fluid-h2)]">
          {STABLE_CHARTS.length} of {CATALOG_TARGET} shipped.
        </h1>
        <p className="mt-4 text-fd-muted-foreground">
          A specimen sheet — every chart at the size it lives in your interface, beside the data it
          answers. Each earns its place: a unique story, an honest encoding, a read that needs no
          training.
        </p>
      </header>

      <GalleryFilter counts={counts} />

      {/* ── The specimen sheet ───────────────────────────────────────────── */}
      <div className="mt-8 flex flex-col gap-12">
        {byCollection.map((group) => (
          <section key={group.key} data-collection-section>
            <div className="mb-3 flex items-baseline justify-between gap-4 px-1">
              <div className="flex items-baseline gap-3">
                <h2 className="mono-label text-fd-primary">{group.label}</h2>
                <p className="hidden text-sm text-fd-muted-foreground sm:block">{group.blurb}</p>
              </div>
              <span className="mono-label whitespace-nowrap opacity-50">
                {group.charts.length} shipped
              </span>
            </div>

            {/* One glass plate per collection; rows seamed by hairlines. */}
            <div className="glass divide-y divide-hairline overflow-hidden">
              {group.charts.map((c) => {
                const Preview = CHART_MODULES[c.slug]!.Preview;
                const idx = String(++n).padStart(2, "0");
                return (
                  <Link
                    key={c.slug}
                    href={`/docs/charts/${c.slug}`}
                    data-gallery-row
                    data-collection={c.collection}
                    data-keywords={keywords(c)}
                    className="specimen-row group flex items-center gap-4 px-4 py-4 sm:gap-5 sm:px-5"
                  >
                    <span className="mono-label hidden w-6 shrink-0 tabular-nums opacity-40 sm:block">
                      {idx}
                    </span>

                    <div className="min-w-0 flex-1">
                      <span className="display text-lg leading-tight text-fd-foreground transition-colors group-hover:text-fd-primary">
                        {c.name}
                      </span>
                      {/* Truncated on a phone the tagline is noise — the name +
                          the live chart carry the row; full text at sm+. */}
                      <p className="mt-0.5 hidden truncate text-sm text-fd-muted-foreground sm:block">
                        {c.tagline}
                      </p>
                    </div>

                    {/* the specimen: the chart at true word-size. Previews set
                        fixed px widths, so cap them to the plate (viewBox scales
                        down cleanly) — otherwise wide charts spill on mobile. */}
                    <div className="flex h-14 w-40 shrink-0 items-center justify-center [&_svg]:h-auto [&_svg]:max-w-full sm:h-16 sm:w-48">
                      <Preview />
                    </div>

                    <ArrowUpRight className="hidden size-4 shrink-0 text-fd-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 sm:block" />
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* empty state — toggled by the filter when nothing matches */}
      <div data-gallery-empty hidden className="mt-8 px-1 text-fd-muted-foreground">
        <p className="text-sm">No charts match. Try another term or clear the filter.</p>
      </div>

      {/* honest tail: the rest of the catalog is on the way */}
      <p className="mono-label mt-12 border-t border-hairline pt-6 opacity-60">
        +{CATALOG_TARGET - STABLE_CHARTS.length} more — core, decision, expressive, and frontier
        charts, all before launch.
      </p>
    </div>
  );
}
