import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { docsMeta } from "@/lib/metadata";
import { breadcrumbJsonLd, jsonLdScript } from "@/lib/jsonld";
import { abs } from "@/lib/site";
import { SHOWCASE, getShowcase } from "@/lib/showcase";
import { ExampleView } from "./example-view";

export function generateStaticParams() {
  return SHOWCASE.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata(props: PageProps<"/examples/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const app = getShowcase(slug);
  if (!app) return {};
  return docsMeta({
    title: `${app.name} — a microcharts example`,
    description: app.story,
    path: `/examples/${app.slug}`,
    image: `/og/examples/${app.slug}/image.png`,
    imageAlt: `${app.name}: ${app.blurb}`,
    keywords: [`${app.name} microcharts`, "microcharts example", ...app.charts.slice(0, 6)],
  });
}

export default async function ExampleDetailPage(props: PageProps<"/examples/[slug]">) {
  const { slug } = await props.params;
  const app = getShowcase(slug);
  if (!app) notFound();

  const crumbs = [
    { name: "Examples", url: abs("/examples") },
    { name: app.name, url: abs(`/examples/${app.slug}`) },
  ];

  return (
    <>
      <script type="application/ld+json">{jsonLdScript(breadcrumbJsonLd(crumbs))}</script>
      <ExampleView app={app} />
    </>
  );
}
