import { Fragment } from "react";
import Link from "next/link";
import { getModule, STABLE_CHARTS } from "@/lib/charts/registry";
import type { ChartCollection, ChartEntry } from "@/lib/charts/types";
import { chartCatalogJsonLd, jsonLdScript } from "@/lib/jsonld";
import { GalleryStage } from "./gallery-stage";
import { GalleryCard } from "./gallery-card";
import { ChartQuestions } from "./chart-questions";
import { WildStrip } from "./wild-strip";
import { COLLECTIONS, COLLECTION_ORDER, getCollection, type CollectionDef } from "./collections";

function keywords(c: ChartEntry): string {
  // Includes `bestFor` — the decisions each chart answers ("rank shuffles",
  // "progress to goal", "distribution beside a stat") — so the filter matches
  // the QUESTION a reader has, not just the chart's name. `avoidFor` is left
  // out on purpose: it would surface a chart for the very use it's wrong for.
  return [c.name, c.tagline, c.dataShape, c.encoding.channel, c.collection, ...c.bestFor]
    .join(" ")
    .toLowerCase();
}

function catalogCounts() {
  const counts: Record<string, number> = { all: STABLE_CHARTS.length };
  for (const c of STABLE_CHARTS) counts[c.collection] = (counts[c.collection] ?? 0) + 1;
  return counts;
}

export function GalleryView({
  collection = null,
}: {
  /** `null` = full catalog. Otherwise SSR-filter to one shelf. */
  collection?: ChartCollection | null;
}) {
  const hub: CollectionDef | null = collection ? (getCollection(collection) ?? null) : null;
  const charts = [...STABLE_CHARTS]
    .filter((c) => !collection || c.collection === collection)
    .sort((a, b) => COLLECTION_ORDER[a.collection] - COLLECTION_ORDER[b.collection]);

  const counts = catalogCounts();
  const active = collection ?? "all";
  const showGroupLabels = !collection;

  return (
    <>
      <script type="application/ld+json">
        {jsonLdScript(
          chartCatalogJsonLd(
            charts.map((c) => ({ name: c.name, slug: c.slug, tagline: c.tagline })),
          ),
        )}
      </script>
      <div className="g2">
        <header className="g2-head">
          <span className="mono-label text-fd-primary">
            {hub ? (
              <>
                <Link prefetch={false} href="/charts" className="hover:text-fd-foreground">
                  The catalog
                </Link>
                <span className="text-hairline"> / </span>
                {hub.label}
              </>
            ) : (
              "The catalog"
            )}
          </span>
          <h1 className="display mt-3 text-fluid-h2 text-[length:var(--text-fluid-h2)]">
            {hub ? hub.title : `${STABLE_CHARTS.length} React microcharts, at true size.`}
          </h1>
          <p className="mt-3 max-w-3xl text-fd-muted-foreground">
            {hub ? (
              hub.intro
            ) : (
              <>
                Every chart at the size it lives (in a sentence, a table cell, a KPI card), beside
                the decision it answers. Browse by collection or search. Live by default — hover a
                mark to scrub; switch to Static in the dock if you want stillness.
              </>
            )}
          </p>
          {/* Glanceable "these are alive" signal — the page's one live pulse.
              Hidden in static mode; the prose above carries it for a reader. */}
          {!hub && (
            <p className="g2-live-chip mt-3" aria-hidden>
              <span className="g2-live-chip-dot" />
              live · hover any mark to scrub
            </p>
          )}
          {hub ? (
            <p className="mt-3 max-w-3xl text-sm text-fd-muted-foreground">
              <span className="text-fd-foreground">Good for.</span> {hub.goodFor}{" "}
              <span className="text-fd-foreground">Not for.</span> {hub.notFor}
            </p>
          ) : null}
          <nav
            className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
            aria-label="Chart collections"
          >
            <Link
              prefetch={false}
              href="/charts"
              className={
                active === "all"
                  ? "font-medium text-fd-foreground"
                  : "text-fd-muted-foreground hover:text-fd-foreground"
              }
            >
              All <span className="tabular-nums opacity-70">{counts.all}</span>
            </Link>
            {COLLECTIONS.map((c) => (
              <Link
                key={c.key}
                prefetch={false}
                href={`/charts/${c.key}`}
                className={
                  active === c.key
                    ? "font-medium text-fd-foreground"
                    : "text-fd-muted-foreground hover:text-fd-foreground"
                }
              >
                {c.label} <span className="tabular-nums opacity-70">{counts[c.key] ?? 0}</span>
              </Link>
            ))}
          </nav>
          <ChartQuestions />
        </header>

        <div
          className="g2-grid"
          data-density="comfortable"
          data-browse={showGroupLabels ? "true" : undefined}
          data-collection-filter={active}
        >
          {charts.map((c, i) => {
            const newGroup =
              showGroupLabels && (i === 0 || charts[i - 1]!.collection !== c.collection);
            const group = COLLECTIONS.find((g) => g.key === c.collection);
            const Preview = getModule(c.slug)?.Preview;
            return (
              <Fragment key={c.slug}>
                {newGroup && group && (
                  <div className="g2-group" data-group-label>
                    <Link
                      prefetch={false}
                      href={`/charts/${group.key}`}
                      className="g2-group-name mono-label text-fd-primary hover:underline"
                    >
                      {group.label}
                    </Link>
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
                  <GalleryCard
                    href={`/docs/charts/${c.slug}`}
                    name={c.name}
                    collection={c.collection}
                    tagline={c.tagline}
                  >
                    <GalleryStage slug={c.slug}>{Preview ? <Preview /> : null}</GalleryStage>
                  </GalleryCard>
                </article>
              </Fragment>
            );
          })}
        </div>

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

      <WildStrip />
    </>
  );
}
