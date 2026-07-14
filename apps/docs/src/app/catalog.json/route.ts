import { buildCatalog } from "@/lib/catalog-json";

export const revalidate = false;
export const dynamic = "force-static";

/** Machine catalog generated from the chart registry. See `lib/catalog-json.ts`. */
export function GET() {
  return new Response(JSON.stringify(buildCatalog(), null, 2), {
    headers: { "Content-Type": "application/json" },
  });
}
