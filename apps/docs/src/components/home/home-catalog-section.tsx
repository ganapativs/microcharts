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

/** 02 · The catalog — {total} answers, word-sized. Tier chips use the
 *  library's own categorical tokens: the tiers are categories, so the
 *  category palette is the honest ink. The refusals strip closes the section:
 *  what the catalog admits and what it refuses are the same editorial
 *  decision, and each replacement renders live — the argument against the
 *  pie chart is a real SegmentedBar doing the same job better at word size. */

const TIERS = [
  { key: "core", blurb: "the everyday answers", cat: 1 },
  { key: "decision", blurb: "calls you have to make", cat: 2 },
  { key: "expressive", blurb: "shapes with a voice", cat: 3 },
  { key: "frontier", blurb: "questions few libraries ask", cat: 4 },
] as const;

const REFUSALS = [
  {
    name: "pie",
    why: "angles are unreadable at word size",
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
    why: "spends its pixels on chrome, not data",
    fix: "Bullet",
    node: <Bullet value={72} target={80} bands={[50, 90]} width={96} height={12} summary={false} />,
  },
  {
    name: "violin",
    why: "density curves lie at twenty pixels tall",
    fix: "MicroBox",
    node: (
      <MicroBox data={[2, 4, 5, 5, 6, 7, 7, 8, 9, 12]} width={96} height={14} summary={false} />
    ),
  },
  {
    name: "battery",
    why: "reads as an icon before it reads as a value",
    fix: "Progress",
    node: <Progress value={0.68} width={96} height={10} summary={false} />,
  },
  {
    name: "waffle",
    why: "a hundred squares don't fit in a word",
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
 *  order) so SSR and hydration agree; the client reshuffles after mount. */
const FIRST_BOARD = TILES.slice(0, 11).map((entry, i) => {
  const { Preview } = HERO_MODULES[entry.slug]!;
  return (
    <CatalogTile key={entry.slug} i={i} entry={entry}>
      <Preview />
    </CatalogTile>
  );
});

export function HomeCatalogSection() {
  return (
    <section className="mx-auto max-w-shell px-4 py-14 sm:px-6">
      <SectionMark n="02">the catalog</SectionMark>
      <Reveal>
        <h2 className="display max-w-xl text-[length:var(--text-fluid-h2)]">
          {CATALOG.total} answers, word-sized.
        </h2>
        <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-2">
          {TIERS.map((t) => (
            <span
              key={t.key}
              title={t.blurb}
              className="inline-flex items-center gap-2 rounded-full border border-hairline px-3 py-1.5 font-mono text-[0.68rem] uppercase leading-none tracking-[0.12em] text-fd-muted-foreground"
            >
              <span
                aria-hidden
                className="size-1.5 rounded-full"
                style={{ background: `var(--mc-cat-${t.cat})` }}
              />
              {t.key} {CATALOG.collections[t.key]}
            </span>
          ))}
          <span className="mono-label ml-1 inline-flex items-center gap-2 leading-none">
            <span aria-hidden className="hx-pulse size-1.5 shrink-0 rounded-full bg-fd-primary" />
            live: every tile is the shipped component
          </span>
        </div>
      </Reveal>

      <Reveal delay={80} className="mt-6">
        {/* The first board is rendered here, on the server: pure SVG, zero client
            chart JS. The client grid takes over once the pool's modules land. */}
        <CatalogGrid total={CATALOG.total} tiles={TILES}>
          {FIRST_BOARD}
        </CatalogGrid>
      </Reveal>

      <Reveal delay={120} className="hv-refusal mt-5 p-5">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h3 className="font-medium text-fd-foreground">Traded up, on purpose.</h3>
          <p className="text-sm text-fd-muted-foreground">
            Five shapes that fail at word size, and the honest chart each one became. Every type
            keeps one documented encoding channel; lie factor = 1.
          </p>
        </div>
        <ul className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-5">
          {REFUSALS.map((r) => (
            <li key={r.name} className="flex flex-col gap-2">
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
              <span className="text-[0.8rem] leading-snug text-fd-muted-foreground">{r.why}</span>
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
