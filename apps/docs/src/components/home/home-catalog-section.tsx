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
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <h2 className="display max-w-xl text-[length:var(--text-fluid-h2)]">
            {CATALOG.total} answers, word-sized.
          </h2>
          <div className="flex flex-wrap gap-2">
            {TIERS.map((t) => (
              <span
                key={t.key}
                title={t.blurb}
                className="inline-flex items-center gap-2 rounded-full border border-hairline px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-fd-muted-foreground"
              >
                <span
                  aria-hidden
                  className="size-1.5 rounded-full"
                  style={{ background: `var(--mc-cat-${t.cat})` }}
                />
                {t.key} {CATALOG.collections[t.key]}
              </span>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal delay={80} className="mt-8">
        <CatalogGrid />
      </Reveal>

      <Reveal delay={120}>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <span className="mono-label inline-flex h-8 items-center gap-2 leading-none text-fd-muted-foreground">
            <span aria-hidden className="hx-pulse size-1.5 shrink-0 rounded-full bg-fd-primary" />
            the catalog, live
          </span>
          <Link
            prefetch={false}
            href="/gallery"
            aria-label={`Browse all ${CATALOG.total} chart types in the gallery`}
            className="cta-ghost group inline-flex h-8 items-center gap-2 py-0 pl-3 pr-1.5 text-[0.8rem] font-medium leading-none text-fd-foreground no-underline"
          >
            Browse all {CATALOG.total}
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-fd-primary text-fd-primary-foreground transition-transform group-hover:translate-x-0.5">
              <ArrowRight className="size-3" />
            </span>
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
