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

/** True when a JSON Schema node says what it accepts — directly, or through
 *  every branch of a union. `z.any()` emits `{}`, which says nothing. */
const typed = (schema: unknown): boolean => {
  const node = schema as { type?: unknown; anyOf?: unknown[]; oneOf?: unknown[] };
  const branches = node.anyOf ?? node.oneOf;
  if (branches) return branches.length > 0 && branches.every(typed);
  return node.type !== undefined;
};

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

  /**
   * A parameter declared as `z.any()` emits `{}` — no `type` — which a client
   * building a form or a prompt from the schema reads as "unknown field type"
   * (Glama's inspector says exactly that). Polymorphic parameters must still say
   * what they accept, so assert every declared property carries a type, either
   * directly or through the branches of a union.
   */
  it("declares a usable type for every input property", async () => {
    const { tools } = await client.listTools();
    for (const t of tools) {
      const props = (t.inputSchema as { properties?: Record<string, unknown> }).properties ?? {};
      for (const [name, schema] of Object.entries(props)) {
        expect(typed(schema), `${t.name}.${name} has no JSON Schema type`).toBe(true);
      }
    }
  });

  it("accepts both data shapes the catalog uses, and refuses a scalar", async () => {
    const series = await client.callTool({
      name: "render_microchart",
      arguments: { type: "sparkline", data: [3, 5, 4, 8, 6, 9] },
    });
    expect(series.isError).toBeFalsy();

    // A handful of charts key their data instead of ordering it.
    const keyed = await client.callTool({
      name: "render_microchart",
      arguments: { type: "burn-chart", data: { plan: [10, 7, 4, 0], actual: [10, 8, 6, 3] } },
    });
    expect(keyed.isError).toBeFalsy();

    // `data` is never a bare scalar — those charts take a `value` prop instead.
    const scalar = await client.callTool({
      name: "render_microchart",
      arguments: { type: "sparkline", data: 42 },
    });
    expect(scalar.isError).toBe(true);
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
