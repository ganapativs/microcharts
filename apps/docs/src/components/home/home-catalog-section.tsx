import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionMark } from "@/components/home/section-mark";
import { CatalogGrid } from "@/components/home/catalog-grid";
import { Reveal } from "@/components/ui/reveal";
import { CATALOG } from "@/lib/docs-facts";

/** 03 · The catalog — {total} answers, word-sized. Tier chips use the
 *  library's own categorical tokens: the tiers are categories, so the
 *  category palette is the honest ink. */

const TIERS = [
  { key: "core", blurb: "the everyday answers", cat: 1 },
  { key: "decision", blurb: "calls you have to make", cat: 2 },
  { key: "expressive", blurb: "shapes with a voice", cat: 3 },
  { key: "frontier", blurb: "questions few libraries ask", cat: 4 },
] as const;

export function HomeCatalogSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <SectionMark n="03">the catalog</SectionMark>
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
            live — every tile is the shipped component
          </span>
        </div>
      </Reveal>

      <Reveal delay={80} className="mt-8">
        <CatalogGrid total={CATALOG.total} />
      </Reveal>

      <Reveal delay={120}>
        <div className="mt-8 flex justify-center">
          <Link
            prefetch={false}
            href="/gallery"
            aria-label={`Browse all ${CATALOG.total} chart types in the gallery`}
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
