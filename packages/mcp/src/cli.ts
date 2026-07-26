#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server";

/** stdout is JSON-RPC only — no logging on stdout. */
async function main(): Promise<void> {
  const server = createServer();
  await server.connect(new StdioServerTransport());
}

main().catch((err: unknown) => {
  // stderr only — stdout is the JSON-RPC channel and must stay clean.
  process.stderr.write(`microcharts-mcp: ${(err as Error).message}\n`);
  process.exit(1);
});
