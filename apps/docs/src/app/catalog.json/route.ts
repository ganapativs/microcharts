import { CHARTS } from "@/lib/catalog";
import { SITE, abs } from "@/lib/site";

export const revalidate = false;
export const dynamic = "force-static";

/**
 * Machine catalog (plan/20 §5.3), generated from the chart registry — the same
 * source that drives docs nav and the gallery. Import paths are validated
 * against `@microcharts/react`'s exports by a docs test.
 */
export function GET() {
  const catalog = {
    $schema: abs("/catalog.schema.json"),
    package: SITE.pkg,
    homepage: SITE.url,
    charts: CHARTS.map((c) => ({
      name: c.name,
      slug: c.slug,
      status: c.status === "stable" ? "stable" : "planned",
      docs: abs(`/docs/charts/${c.slug}`),
      staticImport: c.staticImport,
      interactiveImport: c.interactiveImport,
      dataShape: c.dataShape,
      primaryEncoding: c.primaryEncoding,
      bestFor: c.bestFor,
      avoidFor: c.avoidFor,
      props: c.props.map((p) => ({ name: p.name, type: p.type, required: p.required })),
      examples: [{ title: c.example.title, code: c.example.code }],
    })),
  };

  return new Response(JSON.stringify(catalog, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
}
