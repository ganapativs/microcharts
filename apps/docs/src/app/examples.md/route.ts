import { examplesMarkdown } from "@/lib/page-mirrors";

export const revalidate = false;
export const dynamic = "force-static";

/** The examples page's Markdown twin. Also served from `/examples` on `Accept: text/markdown`. */
export function GET() {
  return new Response(examplesMarkdown(), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
