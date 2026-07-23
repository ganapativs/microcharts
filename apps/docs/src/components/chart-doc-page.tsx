import { getPageImage, getPageMarkdownUrl, source } from "@/lib/source";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from "fumadocs-ui/layouts/docs/page";
import { notFound } from "next/navigation";
import { getChartMDXComponents } from "@/components/mdx-charts";
import type { Metadata } from "next";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { gitConfig } from "@/lib/shared";
import { docsMeta } from "@/lib/metadata";
import { abs } from "@/lib/site";
import { breadcrumbJsonLd, jsonLdScript, techArticleJsonLd } from "@/lib/jsonld";
import { docLastModified } from "@/lib/doc-dates";
import { RouteTransition } from "@/components/route-transition";
import { ChartSlugProvider } from "@/components/charts/chart-slug-context";
import { RelatedCharts } from "@/components/charts/related-charts";
import { getChart } from "@/lib/charts/entries";
import { chartSeoDescription, chartSeoTitle } from "@/lib/seo";
import { SITE } from "@/lib/site";

/**
 * Render a docs page from the **chart route** — the /docs/charts index and every
 * /docs/charts/<slug> page. Byte-for-byte the same machinery as the guide
 * catch-all (`app/docs/[[...slug]]/page.tsx`), only the MDX component map differs
 * (`getChartMDXComponents`, which carries the registry shells). `slug` is the
 * full source slug relative to content/docs, e.g. `["charts"]` or
 * `["charts", "sparkline"]`.
 */
export async function ChartDocPage({ slug }: { slug: string[] }) {
  const page = source.getPage(slug);
  if (!page || page.slugs[0] !== "charts") notFound();

  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page).url;
  const url = abs(page.url);
  // Per-chart pages only — LiveDemo variants swap static → interactive via this.
  const chartSlug = page.slugs.length >= 2 ? page.slugs[1] : undefined;

  const crumbs = [
    { name: "Docs", url: abs("/docs") },
    ...page.slugs.map((_, i) => {
      const p = source.getPage(page.slugs.slice(0, i + 1));
      return { name: p?.data.title ?? page.slugs[i], url: abs(p?.url ?? page.url) };
    }),
  ];

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      breadcrumb={{ includeSeparator: true, includePage: true }}
      // prev/next in sidebar-tree order — 106 chart pages are a reference you
      // page through; without this every hop reopens the sidebar (worst on
      // mobile, where the tree hides behind the hamburger).
      footer={{ enabled: true }}
    >
      <script type="application/ld+json">{jsonLdScript(breadcrumbJsonLd(crumbs))}</script>
      <script type="application/ld+json">
        {jsonLdScript(
          techArticleJsonLd({
            url,
            headline: page.data.title,
            description: page.data.description ?? "",
            dateModified: docLastModified(page.path),
            image: abs(getPageImage(page).url),
          }),
        )}
      </script>
      {/* Transition on article only — toc/sidebar must stay layout grid kids. */}
      <RouteTransition className="flex flex-1 flex-col gap-4">
        <DocsTitle className="font-display text-[2.15em] font-medium tracking-[-0.025em]">
          {page.data.title}
        </DocsTitle>
        <DocsDescription className="mb-0 text-base">{page.data.description}</DocsDescription>
        <div className="flex flex-row items-center gap-1.5 border-b border-hairline pb-6">
          {/* Fumadocs actions use cta-ghost like the rest of the site. */}
          <MarkdownCopyButton markdownUrl={markdownUrl} className="cta-ghost" />
          <ViewOptionsPopover
            markdownUrl={markdownUrl}
            githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/apps/docs/content/docs/${page.path}`}
            className="cta-ghost"
          />
        </div>
        <DocsBody>
          <ChartSlugProvider slug={chartSlug}>
            <MDX components={getChartMDXComponents({ a: createRelativeLink(source, page) })} />
          </ChartSlugProvider>
        </DocsBody>
        {/* Per-chart pages only — deterministic cross-links (SEO + discovery);
            the index page is the catalog itself. */}
        {chartSlug ? <RelatedCharts slug={chartSlug} /> : null}
      </RouteTransition>
    </DocsPage>
  );
}

/** Shared metadata builder for chart-route pages. */
export async function chartDocMetadata(slug: string[]): Promise<Metadata> {
  const page = source.getPage(slug);
  if (!page || page.slugs[0] !== "charts") notFound();

  const entry = page.slugs[1] ? getChart(page.slugs[1]) : undefined;
  const title = entry ? chartSeoTitle(entry.name) : page.data.title;
  const description = entry
    ? chartSeoDescription(entry.name, page.data.description ?? "", entry.tagline)
    : (page.data.description ?? "");

  return docsMeta({
    title,
    description,
    path: page.url as `/${string}`,
    image: getPageImage(page).url as `/${string}`,
    imageAlt: entry
      ? `${entry.name} React chart — word-sized SVG from ${SITE.name}`
      : SITE.ogImageAlt,
    markdown: getPageMarkdownUrl(page).url as `/${string}`,
    type: "article",
    keywords: entry
      ? [entry.name, "react chart", "sparkline", "microcharts", "svg chart", entry.collection]
      : undefined,
  });
}
