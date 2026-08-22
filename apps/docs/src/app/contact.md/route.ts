import { abs } from "@/lib/site";
import { CONTACT_PAGE, trustPageMarkdown } from "@/lib/trust-pages";

export const revalidate = false;
export const dynamic = "force-static";

/** `/contact`'s Markdown twin. Also served from `/contact` on `Accept: text/markdown`. */
export function GET() {
  return new Response(trustPageMarkdown(CONTACT_PAGE, abs("/contact")), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
