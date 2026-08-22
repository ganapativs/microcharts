import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const revalidate = false;
export const dynamic = "force-static";

/**
 * The MCP server card, at the well-known path agents probe for it.
 *
 * The bytes are `packages/mcp/server.json` verbatim — the same registry
 * manifest `scripts/sync-server-json.mjs` generates and the release workflow
 * publishes, read at build time rather than copied, so the version here is
 * always the version that shipped.
 *
 * It advertises a stdio server: a client spawns `npx -y @microcharts/mcp`
 * locally. There is no HTTP endpoint to hand out, and this card does not claim
 * one.
 */
export function GET() {
  const card = readFileSync(resolve(process.cwd(), "../../packages/mcp/server.json"), "utf8");
  return new Response(card, {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
