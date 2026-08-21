import { notFound } from "next/navigation";
import { buildChartDocument, chartSlugs } from "@/lib/api-charts";

export const revalidate = false;
export const dynamic = "force-static";

/**
 * One chart's full API surface as JSON: the catalog entry, plus the shared
 * props and reading instructions it has to be combined with.
 *
 * The `.json` suffix rides in the catch-all param — the same trick the OG image
 * and `llms.mdx` routes use — so the export writes `out/api/charts/<slug>.json`
 * beside `out/api/charts.json` instead of colliding with it.
 */
export async function GET(_req: Request, { params }: RouteContext<"/api/charts/[...slug]">) {
  const { slug } = await params;
  const name = slug?.join("/") ?? "";
  const document = name.endsWith(".json")
    ? buildChartDocument(name.slice(0, -".json".length))
    : null;
  if (!document) notFound();

  return new Response(`${JSON.stringify(document, null, 2)}\n`, {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export function generateStaticParams() {
  return chartSlugs().map((slug) => ({ slug: [`${slug}.json`] }));
}
