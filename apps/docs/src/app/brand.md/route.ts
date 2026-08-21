import { brandMarkdown } from "@/lib/page-mirrors";

export const revalidate = false;
export const dynamic = "force-static";

/** The brand page's Markdown twin. Also served from `/brand` on `Accept: text/markdown`. */
export function GET() {
  return new Response(brandMarkdown(), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
