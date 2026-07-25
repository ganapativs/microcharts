import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { beforeAll, describe, expect, it } from "vitest";
import { createServer } from "../src/server";
import { MCP_VERSION } from "../src/version";

/**
 * The protocol layer. `tools.test.ts` covers the pure functions; this drives the
 * real `McpServer` through a real client, so tool registration, the declared
 * output schemas, and the error convention are all exercised the way a host
 * exercises them. The SDK validates `structuredContent` against each tool's
 * `outputSchema`, so a drift between what a tool returns and what it advertises
 * fails here.
 */
let client: Client;

beforeAll(async () => {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  client = new Client({ name: "test", version: "0" });
  await Promise.all([client.connect(clientTransport), createServer().connect(serverTransport)]);
});

describe("mcp server", () => {
  it("announces itself with the package version", () => {
    expect(client.getServerVersion()).toMatchObject({ name: "microcharts", version: MCP_VERSION });
  });

  it("registers exactly the three tools, each with an output schema", async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual([
      "find_microchart",
      "get_microchart",
      "render_microchart",
    ]);
    for (const t of tools) {
      expect(t.outputSchema, `${t.name} has no outputSchema`).toBeDefined();
      expect(t.description?.length ?? 0).toBeGreaterThan(40);
    }
  });

  it("serves both resources", async () => {
    const { resources } = await client.listResources();
    expect(resources.map((r) => r.uri).sort()).toEqual([
      "microcharts://agent-setup",
      "microcharts://catalog",
    ]);
    const catalog = await client.readResource({ uri: "microcharts://catalog" });
    const first = catalog.contents[0] as { text?: string } | undefined;
    const parsed = JSON.parse(String(first?.text)) as { charts: unknown[] };
    expect(parsed.charts.length).toBeGreaterThan(100);
  });

  it("find → get → render round-trips with validated structured output", async () => {
    const found = await client.callTool({
      name: "find_microchart",
      arguments: { question: "is it trending?", limit: 3 },
    });
    const results = (found.structuredContent as { results: { slug: string }[] }).results;
    expect(results.length).toBeGreaterThan(0);

    const got = await client.callTool({
      name: "get_microchart",
      arguments: { slug: results[0]?.slug },
    });
    const detail = got.structuredContent as { sample?: Record<string, unknown> };
    expect(detail.sample).toBeDefined();

    const rendered = await client.callTool({
      name: "render_microchart",
      arguments: { type: results[0]?.slug, props: detail.sample },
    });
    const out = rendered.structuredContent as { summary: string; svg: string };
    expect(out.summary.length).toBeGreaterThan(0);
    expect(out.svg).toContain("<style>");
  });

  it("reports tool-level failures as isError, not as a transport fault", async () => {
    const unknown = await client.callTool({
      name: "get_microchart",
      arguments: { slug: "does-not-exist" },
    });
    expect(unknown.isError).toBe(true);

    const unrenderable = await client.callTool({
      name: "render_microchart",
      arguments: { type: "dot-plot" },
    });
    expect(unrenderable.isError).toBe(true);
    expect(String((unrenderable.content as { text: string }[])[0]?.text)).toMatch(/needs `data`/);
  });

  it("rejects input the schema forbids", async () => {
    const bad = await client.callTool({
      name: "find_microchart",
      arguments: { question: "trend", limit: 999 },
    });
    expect(bad.isError).toBe(true);
  });
});
