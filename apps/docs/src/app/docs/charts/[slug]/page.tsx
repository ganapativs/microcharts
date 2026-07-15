import { source } from "@/lib/source";
import type { Metadata } from "next";
import { ChartDocPage, chartDocMetadata } from "@/components/chart-doc-page";

// Every individual chart page (/docs/charts/<slug>). Split out of the top-level
// docs catch-all so text guides no longer ship the 106-chart component graph:
// only this route imports the MDX map that pulls the chart registry.
export default async function Page(props: PageProps<"/docs/charts/[slug]">) {
  const { slug } = await props.params;
  return <ChartDocPage slug={["charts", slug]} />;
}

export async function generateStaticParams() {
  return source
    .generateParams()
    .filter((p) => p.slug?.[0] === "charts" && p.slug.length === 2)
    .map((p) => ({ slug: p.slug[1]! }));
}

export async function generateMetadata(props: PageProps<"/docs/charts/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  return chartDocMetadata(["charts", slug]);
}
