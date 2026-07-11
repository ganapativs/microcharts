import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { STABLE_CHARTS, getChart } from "@/lib/catalog";
import { getModule } from "@/lib/charts/registry";
import { CATALOG } from "@/lib/docs-facts";

/**
 * A representative slice of the *whole* catalog — not the same five charts the
 * guides use as worked examples. Slugs are sampled evenly across the registry
 * (which is ordered core → decision → expressive → frontier), so the strip spans
 * families and updates itself as the catalog grows. Deterministic: no random, so
 * server and client render the same set. Each mark links to its page.
 */
function sample(count: number): string[] {
  const all = STABLE_CHARTS;
  if (all.length <= count) return all.map((c) => c.slug);
  const step = all.length / count;
  const out: string[] = [];
  for (let i = 0; i < count; i += 1) out.push(all[Math.floor(i * step)].slug);
  return out;
}

export function CatalogStrip({ count = 12 }: { count?: number }) {
  return (
    <div className="not-prose my-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {sample(count).map((slug) => {
          const c = getChart(slug);
          const mod = getModule(slug);
          if (!c || !mod) return null;
          const { Mark } = mod;
          return (
            <Link
              key={slug}
              href={`/docs/charts/${slug}`}
              className="panel group flex items-center gap-3 px-3 py-2.5 no-underline"
            >
              {/* clean word-sized mark — strip the chart's own labels so it reads
                  as an identity glyph at this scale */}
              <span className="flex h-6 w-12 shrink-0 items-center justify-center overflow-hidden opacity-90 [&_text]:hidden">
                <Mark data={c.demo} width={44} height={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-fd-foreground transition-colors group-hover:text-fd-primary">
                  {c.name}
                </span>
                <span className="mono-label block truncate text-[0.6rem] opacity-60">
                  {c.collection}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
      <Link
        href="/docs/charts"
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-fd-primary link-underline"
      >
        All {CATALOG.total} chart types <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
