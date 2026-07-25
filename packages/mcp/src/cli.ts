#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server";

/**
 * The stdio entry point (`npx @microcharts/mcp`). A client (Claude Desktop,
 * Cursor, …) spawns this process and speaks MCP over stdin/stdout. Nothing is
 * hosted; it runs on the user's machine.
 */
async function main(): Promise<void> {
  const server = createServer();
  await server.connect(new StdioServerTransport());
}

main().catch((err: unknown) => {
  // stderr only — stdout is the JSON-RPC channel and must stay clean.
  process.stderr.write(`microcharts-mcp: ${(err as Error).message}\n`);
  process.exit(1);
});
