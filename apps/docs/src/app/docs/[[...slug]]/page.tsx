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
import { getGuideMDXComponents } from "@/components/mdx-guide";
import type { Metadata } from "next";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { gitConfig } from "@/lib/shared";
import { docsMeta } from "@/lib/metadata";
import { abs } from "@/lib/site";
import { breadcrumbJsonLd, jsonLdScript, techArticleJsonLd } from "@/lib/jsonld";
import { docLastModified } from "@/lib/doc-dates";
import { RouteTransition } from "@/components/route-transition";

export default async function Page(props: PageProps<"/docs/[[...slug]]">) {
  const params = await props.params;
  // Chart pages (/docs/charts, /docs/charts/*) are served by the dedicated chart
  // route so this guide route never imports the chart registry. Defense in depth:
  // generateStaticParams already excludes them, so this only guards dev requests.
  if (params.slug?.[0] === "charts") notFound();
  const page = source.getPage(params.slug);
  if (!page) notFound();

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
          <MDX components={getGuideMDXComponents({ a: createRelativeLink(source, page) })} />
        </DocsBody>
      </RouteTransition>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  // Exclude chart pages — the chart route owns /docs/charts and /docs/charts/*.
  // Two routes emitting the same static path would collide under `output: export`.
  return source.generateParams().filter((p) => p.slug?.[0] !== "charts");
}

export async function generateMetadata(props: PageProps<"/docs/[[...slug]]">): Promise<Metadata> {
  const params = await props.params;
  if (params.slug?.[0] === "charts") notFound();
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return docsMeta({
    title: page.data.title,
    description: page.data.description ?? "",
    path: page.url as `/${string}`,
    image: getPageImage(page).url as `/${string}`,
    markdown: getPageMarkdownUrl(page).url as `/${string}`,
  });
}
