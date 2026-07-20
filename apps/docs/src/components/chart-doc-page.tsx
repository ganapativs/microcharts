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
      breadcrumb={{ enabled: false }}
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
      {/* Calm fade + lift on navigation. Wraps only the article content — never
          the DocsPage grid-area siblings (toc/sidebar), which must stay direct
          grid children of the layout. Keyed on pathname; reduced-motion gated. */}
      <RouteTransition className="flex flex-1 flex-col gap-4">
        <DocsTitle className="font-display text-[2.15em] font-medium tracking-[-0.025em]">
          {page.data.title}
        </DocsTitle>
        <DocsDescription className="mb-0 text-base">{page.data.description}</DocsDescription>
        <div className="flex flex-row items-center gap-1.5 border-b border-hairline pb-6">
          {/* Route the Fumadocs built-ins through the canon secondary button so the
              title row matches every other text action on the site. */}
          <MarkdownCopyButton markdownUrl={markdownUrl} className="cta-ghost" />
          <ViewOptionsPopover
            markdownUrl={markdownUrl}
            githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/apps/docs/content/docs/${page.path}`}
            className="cta-ghost"
          />
        </div>
        <DocsBody>
          <MDX components={getChartMDXComponents({ a: createRelativeLink(source, page) })} />
        </DocsBody>
      </RouteTransition>
    </DocsPage>
  );
}

/** Shared metadata builder for chart-route pages. */
export async function chartDocMetadata(slug: string[]): Promise<Metadata> {
  const page = source.getPage(slug);
  if (!page || page.slugs[0] !== "charts") notFound();

  return docsMeta({
    title: page.data.title,
    description: page.data.description ?? "",
    path: page.url as `/${string}`,
    image: getPageImage(page).url as `/${string}`,
    markdown: getPageMarkdownUrl(page).url as `/${string}`,
  });
}
