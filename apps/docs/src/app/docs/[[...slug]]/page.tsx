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
import { getMDXComponents } from "@/components/mdx";
import type { Metadata } from "next";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { gitConfig } from "@/lib/shared";
import { docsMeta } from "@/lib/metadata";
import { abs } from "@/lib/site";
import { breadcrumbJsonLd, jsonLdScript, techArticleJsonLd } from "@/lib/jsonld";

export default async function Page(props: PageProps<"/docs/[[...slug]]">) {
  const params = await props.params;
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
    <DocsPage toc={page.data.toc} full={page.data.full} breadcrumb={{ enabled: false }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd(crumbs)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            techArticleJsonLd({
              url,
              headline: page.data.title,
              description: page.data.description ?? "",
              dateModified: "2026-07-07",
              image: abs(getPageImage(page).url),
            }),
          ),
        }}
      />
      <DocsTitle className="font-display text-[2.15em] font-medium tracking-[-0.025em]">
        {page.data.title}
      </DocsTitle>
      <DocsDescription className="mb-0 text-base">{page.data.description}</DocsDescription>
      <div className="flex flex-row items-center gap-1.5 border-b border-fd-border pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover
          markdownUrl={markdownUrl}
          githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/apps/docs/content/docs/${page.path}`}
        />
      </div>
      <DocsBody>
        <MDX components={getMDXComponents({ a: createRelativeLink(source, page) })} />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps<"/docs/[[...slug]]">): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return docsMeta({
    title: page.data.title,
    description: page.data.description ?? "",
    path: page.url as `/${string}`,
    image: getPageImage(page).url as `/${string}`,
  });
}
