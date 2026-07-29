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

/**
 * The catalog, in the site's own language: the `.shell` measure the masthead
 * sets, a mono kicker over a display heading, one lede, and then the plane —
 * 106 specimens as fields rather than as cards.
 */
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

      <section className="act-open">
        <div className="shell">
          {/* A breadcrumb on a hub, and NOTHING on the catalog itself. The
              landing page never sets a mono label above a heading — it spends
              `.kicker` on captions and data labels — and "The catalog" over "106
              React microcharts" was a label restating the sentence under it and
              the nav item above it. Here the kicker earns its place because it
              is the way back. */}
          {hub && (
            <p className="kicker">
              <Link prefetch={false} href="/charts" className="ulink tap">
                The catalog
              </Link>
              <span style={{ color: "var(--rule-2)" }}> / </span>
              {hub.label}
            </p>
          )}
          <h1 className={`display-2${hub ? " mt-3" : ""}`} style={{ maxWidth: "var(--m-head)" }}>
            {hub ? hub.title : `${STABLE_CHARTS.length} React microcharts, at true size`}
          </h1>
          <p className="prose u-lede" style={{ maxWidth: "var(--m-prose)" }}>
            {hub ? (
              hub.intro
            ) : (
              <>
                Every chart is drawn at the size it gets used at, with the question it answers
                underneath. Browse the four collections, or search if you already know the shape you
                want.
              </>
            )}
          </p>

          {/* A spec line, not a second paragraph — so it takes the mono step
              rather than a hand-picked size between the two reading sizes. */}
          {hub ? (
            <p className="mono u-lede" style={{ maxWidth: "var(--m-note)", color: "var(--ink-2)" }}>
              <span style={{ color: "var(--ink)" }}>Good for.</span> {hub.goodFor}{" "}
              <span style={{ color: "var(--ink)" }}>Not for.</span> {hub.notFor}
            </p>
          ) : null}

          {/* The one place liveness is claimed, because it is the only one that
              can tell the truth about it: the dock's static mode hides this, and
              a sentence in the paragraph above would go on claiming it. */}
          {!hub && (
            <p className="g2-live kicker mt-5" aria-hidden>
              <span className="g2-live-dot" />
              live · hover a mark to scrub it
            </p>
          )}

          <nav
            className="mt-6 flex flex-wrap items-baseline gap-x-5 gap-y-1"
            aria-label="Chart collections"
          >
            <Link
              prefetch={false}
              href="/charts"
              className="coll-link"
              data-on={active === "all" || undefined}
            >
              All <span className="coll-n">{counts.all}</span>
              {active === "all" && <span className="toggle-rule" data-state="on" />}
            </Link>
            {COLLECTIONS.map((c) => (
              <Link
                key={c.key}
                prefetch={false}
                href={`/charts/${c.key}`}
                className="coll-link"
                data-on={active === c.key || undefined}
              >
                {c.label} <span className="coll-n">{counts[c.key] ?? 0}</span>
                {active === c.key && <span className="toggle-rule" data-state="on" />}
              </Link>
            ))}
          </nav>

          <ChartQuestions />
        </div>
      </section>

      <div className="shell u-block">
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
                    {/* `.tap` and not a padded box: the label is 10px of mono on
                        a baseline-aligned row, so growing it would move the row
                        it names. It has the shelf's own space above and below to
                        borrow, which is exactly what `.tap` is for. */}
                    <Link
                      prefetch={false}
                      href={`/charts/${group.key}`}
                      className="kicker ulink tap"
                    >
                      {group.label}
                    </Link>
                    <span className="g2-group-blurb">{group.blurb}</span>
                    <span className="g2-group-n kicker">{counts[c.collection]}</span>
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
          <p className="prose">
            Nothing in the catalog answers{" "}
            <span data-empty-q style={{ color: "var(--ink)" }}>
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
