import { abs } from "@/lib/site";
import { PRIVACY_PAGE, trustPageMarkdown } from "@/lib/trust-pages";

export const revalidate = false;
export const dynamic = "force-static";

/** `/privacy`'s Markdown twin. Also served from `/privacy` on `Accept: text/markdown`. */
export function GET() {
  return new Response(trustPageMarkdown(PRIVACY_PAGE, abs("/privacy")), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
