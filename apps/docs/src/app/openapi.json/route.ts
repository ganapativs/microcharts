import { buildOpenApi } from "@/lib/openapi";

export const revalidate = false;
export const dynamic = "force-static";

/** OpenAPI 3.1 description of this site's machine surface. See `lib/openapi.ts`. */
export function GET() {
  return new Response(`${JSON.stringify(buildOpenApi(), null, 2)}\n`, {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
