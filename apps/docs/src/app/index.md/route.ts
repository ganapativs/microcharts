import { homeMarkdown } from "@/lib/page-mirrors";

export const revalidate = false;
export const dynamic = "force-static";

/** The home page's Markdown twin. Also served from `/` on `Accept: text/markdown`. */
export function GET() {
  return new Response(homeMarkdown(), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
