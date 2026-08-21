import { buildChartIndex } from "@/lib/api-charts";

export const revalidate = false;
export const dynamic = "force-static";

/** Index of every chart type, with the URL that expands each one. */
export function GET() {
  return new Response(`${JSON.stringify(buildChartIndex(), null, 2)}\n`, {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
