import { chartsMarkdown } from "@/lib/page-mirrors";

export const revalidate = false;
export const dynamic = "force-static";

/** The chart index's Markdown twin. Also served from `/charts` on `Accept: text/markdown`. */
export function GET() {
  return new Response(chartsMarkdown(), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
