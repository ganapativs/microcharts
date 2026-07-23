import Link from "next/link";
import { relatedCharts } from "@/lib/charts/related";
import { getModule } from "@/lib/charts/registry";

/**
 * Systematic "Related charts" block under every /docs/charts/<slug> page —
 * deterministic metadata-scored siblings (see `lib/charts/related.ts`), each a
 * real link with the chart's tagline. Concentrates topical internal linking
 * beyond the prev/next footer without hand-authoring MDX link lists.
 *
 * Server-static. Uses `registry.getModule` for the Mark glyphs — safe here
 * because this renders only on the chart route, which already carries the full
 * static registry (Playground/FourContexts/ChartChooser); never move this into
 * a guide-route map.
 */
export function RelatedCharts({ slug }: { slug: string }) {
  const related = relatedCharts(slug);
  if (related.length === 0) return null;

  return (
    <section aria-label="Related charts" className="border-t border-hairline pt-6">
      <h2 className="mono-label mb-3">Related charts</h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {related.map((c) => {
          const Mark = getModule(c.slug)?.Mark;
          return (
            <Link
              prefetch={false}
              key={c.slug}
              href={`/docs/charts/${c.slug}`}
              className="panel group flex items-center gap-3 px-3.5 py-3 no-underline"
            >
              {Mark ? (
                <span
                  aria-hidden
                  className="flex h-7 w-14 shrink-0 items-center justify-center overflow-hidden text-[0.6rem] opacity-90 [&_text]:hidden"
                >
                  <Mark data={c.demo} width={52} height={22} />
                </span>
              ) : null}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-fd-foreground transition-colors group-hover:text-fd-primary">
                  {c.name}
                </span>
                <span className="mt-0.5 line-clamp-2 block text-[0.78rem] leading-snug opacity-70">
                  {c.tagline}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
