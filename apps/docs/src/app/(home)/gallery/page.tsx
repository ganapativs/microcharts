import Link from "next/link";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { ArrowUpRight, Copy } from "lucide-react";
import { docsMeta } from "@/lib/metadata";
import { CATALOG_TARGET, CHART_MODULES, STABLE_CHARTS } from "@/lib/charts/registry";
import type { ChartCollection, ChartEntry } from "@/lib/charts/types";
import { GalleryFilter } from "./gallery-filter";

export const metadata: Metadata = docsMeta({
  title: "All charts",
  description:
    "Every shipped microchart, shown at its true word-size beside the data shape it answers — the full visual catalog, searchable, in a card grid or a dense specimen sheet.",
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

// Precision is documented as e.g. "high" or "low — use Delta when it matters".
// The card badge shows only the leading grade; the full nuance is on the doc
// page. Normalize the handful of shapes to a short, honest label.
function precisionGrade(precision: string): string {
  const p = precision.trim().toLowerCase();
  if (p.startsWith("n/a")) return "N/A";
  if (p.startsWith("medium-high")) return "MED-HIGH";
  if (p.startsWith("high")) return "HIGH";
  if (p.startsWith("medium")) return "MEDIUM";
  if (p.startsWith("low")) return "LOW";
  return (p.split(/[^a-z]/i)[0] || p).toUpperCase();
}

// The exact line a developer copies. Mirrors the import shown on the doc page.
function importLine(c: ChartEntry): string {
  return `import { ${c.name} } from "${c.staticImport}";`;
}

export default function GalleryPage() {
  const byCollection = COLLECTIONS.map((group) => ({
    ...group,
    charts: STABLE_CHARTS.filter((c) => c.collection === group.key),
  })).filter((g) => g.charts.length > 0);

  const counts: Record<string, number> = { all: STABLE_CHARTS.length };
  for (const g of byCollection) counts[g.key] = g.charts.length;

  // A stable catalog index number (01…) across the whole catalog.
  let n = 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      {/* ── Masthead ─────────────────────────────────────────────────────── */}
      <header className="max-w-2xl">
        <span className="mono-label text-fd-primary">The catalog</span>
        <h1 className="display mt-3 text-fluid-h2 text-[length:var(--text-fluid-h2)]">
          {STABLE_CHARTS.length} of {CATALOG_TARGET} shipped.
        </h1>
        <p className="mt-4 text-fd-muted-foreground">
          The full catalog, visual — every chart at the size it lives in your interface, beside the
          data it answers. Browse the cards, or switch to the specimen sheet for a dense scan. Each
          earns its place: a unique story, an honest encoding, a read that needs no training.
        </p>
      </header>

      <GalleryFilter counts={counts} />

      {/* ── The catalog ──────────────────────────────────────────────────────
          One container, two layouts: `data-view="grid"` (cards, default) and
          `data-view="sheet"` (dense rows). The client filter owns data-view and
          restores the last choice — with JS off you get the grid, fully SSR. */}
      <div className="mc-gallery mt-8 flex flex-col gap-12" data-view="grid">
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

            {/* The band: a CSS grid of instrument cards, or one seamed plate. */}
            <div className="gband">
              {group.charts.map((c) => {
                const Preview = CHART_MODULES[c.slug]!.Preview;
                const idx = String(++n).padStart(2, "0");
                return (
                  <div
                    key={c.slug}
                    data-gallery-card
                    data-collection={c.collection}
                    data-keywords={keywords(c)}
                    className="gcard group"
                    style={{ "--i": n } as CSSProperties}
                  >
                    {/* the specimen: the chart at true word-size on graph paper,
                        with a spec panel that rises on hover / focus. */}
                    <div className="gcard-stage">
                      <Preview />
                      <div className="gcard-spec" aria-hidden>
                        <p className="gcard-spec-tag">{c.tagline}</p>
                        <div className="gcard-spec-meta mono-label">
                          <span className="gcard-spec-channel">{c.encoding.channel}</span>
                          <span className="gcard-spec-grade">
                            {precisionGrade(c.encoding.precision)}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="gcard-copy mono-label"
                          data-import={importLine(c)}
                          aria-label={`Copy import statement for ${c.name}`}
                        >
                          <Copy className="size-3" aria-hidden />
                          <span className="gcard-copy-label">import</span>
                        </button>
                      </div>
                    </div>
                    <span className="gcard-idx mono-label tabular-nums opacity-40">{idx}</span>
                    {/* the name is the navigation target; its ::after stretches
                        over the whole card so the card is one big click target. */}
                    <Link
                      href={`/docs/charts/${c.slug}`}
                      className="gcard-name gcard-link display text-lg leading-tight text-fd-foreground transition-colors group-hover:text-fd-primary"
                    >
                      {c.name}
                    </Link>
                    <span className="gcard-tag truncate text-sm text-fd-muted-foreground">
                      {c.tagline}
                    </span>
                    <ArrowUpRight className="gcard-arrow size-4 shrink-0 text-fd-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </div>
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
