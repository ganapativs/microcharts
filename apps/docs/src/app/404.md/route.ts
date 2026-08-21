import { notFoundMarkdown } from "@/lib/page-mirrors";

export const revalidate = false;
export const dynamic = "force-static";

/**
 * The 404 recovery note as a static file.
 *
 * The Worker renders this same body, with the missing path and closest-match
 * URLs filled in, for any 404 a non-browser asks for. This file is the
 * host-agnostic version: on a plain CDN with no Worker, an agent that gets the
 * HTML 404 page still has a documented URL to read instead.
 */
export function GET() {
  return new Response(notFoundMarkdown(), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
