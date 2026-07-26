import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SegmentedBar } from "@microcharts/react/segmented-bar";
import { Bullet } from "@microcharts/react/bullet";
import { MicroBox } from "@microcharts/react/micro-box";
import { Progress } from "@microcharts/react/progress";
import { IconArray } from "@microcharts/react/icon-array";
import { SectionMark } from "@/components/home/section-mark";
import { CatalogGrid, CatalogTile, type TileMeta } from "@/components/home/catalog-grid";
import { HERO_MODULES, POOL } from "@/components/home/hero-modules";
import { Reveal } from "@/components/ui/reveal";
import { CATALOG } from "@/lib/docs-facts";

/** Catalog grid + refusals strip (live replacement charts). */

const REFUSALS = [
  {
    name: "pie",
    why: "at word size you can still compare lengths, not angles",
    fix: "SegmentedBar",
    node: (
      <SegmentedBar
        data={[
          { label: "a", value: 62 },
          { label: "b", value: 24 },
          { label: "c", value: 14 },
        ]}
        width={96}
        height={10}
        summary={false}
      />
    ),
  },
  {
    name: "needle gauge",
    why: "the dial spends pixels the data could be using",
    fix: "Bullet",
    node: <Bullet value={72} target={80} bands={[50, 90]} width={96} height={12} summary={false} />,
  },
  {
    name: "violin",
    why: "a box plot keeps its meaning at twenty pixels; a density curve loses it",
    fix: "MicroBox",
    node: (
      <MicroBox data={[2, 4, 5, 5, 6, 7, 7, 8, 9, 12]} width={96} height={14} summary={false} />
    ),
  },
  {
    name: "battery",
    why: "reads as a value instead of an icon",
    fix: "Progress",
    node: <Progress value={0.68} width={96} height={10} summary={false} />,
  },
  {
    name: "waffle",
    why: "ten icons say 7-in-10 more clearly than a hundred squares",
    fix: "IconArray",
    node: <IconArray value={0.7} total={10} width={96} height={14} summary={false} />,
  },
] as const;

/** Tier → categorical token index; must match the section chips above. */
const CAT: Record<string, number> = { core: 1, decision: 2, expressive: 3, frontier: 4 };

/** The board's metadata, resolved on the server — name/tagline/tier only, so the
 *  client never receives the full catalog just to label twelve tiles. */
const TILES = POOL.map((slug) => {
  const { name, tagline, collection } = HERO_MODULES[slug]!.entry;
  return { slug, name, tagline, cat: CAT[collection] ?? 1 } satisfies TileMeta;
});

/** The first board, server-rendered as pure SVG. Deterministic (the pool's own
 *  order) so SSR and hydration agree; the client upgrades the same tiles to
 *  their interactive twins after mount — nothing re-deals. */
const FIRST_BOARD = TILES.slice(0, 11).map((entry) => {
  const { Preview } = HERO_MODULES[entry.slug]!;
  return (
    <CatalogTile key={entry.slug} entry={entry}>
      <Preview />
    </CatalogTile>
  );
});

export function HomeCatalogSection() {
  return (
    <section className="mx-auto max-w-shell px-4 py-16 sm:px-6">
      <SectionMark>the catalog</SectionMark>
      <Reveal>
        <h2 className="display max-w-xl text-[length:var(--text-fluid-h2)]">
          {CATALOG.total} chart types, each the size of a word
        </h2>
        <p className="mono-label mt-4 flex items-center gap-2 leading-none">
          <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-fd-primary opacity-80" />
          hover a tile, they&rsquo;re live
        </p>
      </Reveal>

      <Reveal delay={80} className="mt-6">
        {/* SSR board; client grid takes over after modules load. */}
        <CatalogGrid total={CATALOG.total} tiles={TILES}>
          {FIRST_BOARD}
        </CatalogGrid>
      </Reveal>

      <Reveal delay={120} className="hv-refusal mt-5 p-5">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h3 className="font-medium text-fd-foreground">What we left out</h3>
          <p className="text-sm text-fd-muted-foreground">
            Pie, gauges and a few other familiar shapes don&rsquo;t survive at word size. Each one
            has a replacement here that answers the same question and stays legible.
          </p>
        </div>
        <ul className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-5">
          {REFUSALS.map((r) => (
            <li key={r.name} className="flex flex-col gap-2" title={r.why}>
              <span className="flex items-baseline gap-2 font-mono text-[0.8rem] leading-none">
                <s className="hv-refusal-name text-fd-muted-foreground">{r.name}</s>
                <span aria-hidden className="text-hairline">
                  →
                </span>
                <span className="font-medium text-fd-primary">{r.fix}</span>
              </span>
              <span aria-hidden className="flex h-7 items-center">
                {r.node}
              </span>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal delay={160}>
        <div className="mt-6 flex justify-center">
          <Link
            prefetch={false}
            href="/charts"
            aria-label={`Browse all ${CATALOG.total} chart types`}
            className="cta-accent group inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-transform hover:-translate-y-0.5"
          >
            Browse all {CATALOG.total} types
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
