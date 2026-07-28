import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildCatalog } from "./catalog-json";

/**
 * Docs-as-tests for the MCP surfaces.
 *
 * `@microcharts/mcp` is a sibling workspace, not a dependency of this site, so
 * these read its source as TEXT rather than importing it — no build-order
 * coupling, and no `zod` / MCP-SDK resolution inside the docs test run. What
 * they buy: rename a tool, drop a resource, or change the bin name in the
 * package, and every place this site advertises it fails in the same PR.
 */
const MCP = resolve(process.cwd(), "../../packages/mcp");
const read = (p: string) => readFileSync(resolve(MCP, p), "utf8");

const serverSrc = read("src/server.ts");
const pkg = JSON.parse(read("package.json")) as {
  name: string;
  bin: Record<string, string>;
  engines: { node: string };
  peerDependenciesMeta?: Record<string, { optional?: boolean }>;
};

/** Tool + resource names as the server actually registers them. */
const TOOLS = [...serverSrc.matchAll(/registerTool\(\s*"([^"]+)"/g)].map((m) => m[1]!);
const RESOURCES = [...serverSrc.matchAll(/registerResource\(\s*"[^"]+",\s*"([^"]+)"/g)].map(
  (m) => m[1]!,
);

const docs = {
  mcp: readFileSync(resolve(process.cwd(), "content/docs/mcp.mdx"), "utf8"),
  ai: readFileSync(resolve(process.cwd(), "content/docs/ai.mdx"), "utf8"),
  quickstart: readFileSync(resolve(process.cwd(), "content/docs/quickstart.mdx"), "utf8"),
  index: readFileSync(resolve(process.cwd(), "content/docs/index.mdx"), "utf8"),
  home: readFileSync(resolve(process.cwd(), "src/components/home/fence-beat.tsx"), "utf8"),
  llms: readFileSync(resolve(process.cwd(), "src/app/llms.txt/route.ts"), "utf8"),
};

describe("the MCP page matches the server it documents", () => {
  it("the server really registers three tools and two resources", () => {
    expect(TOOLS).toHaveLength(3);
    expect(RESOURCES).toHaveLength(2);
  });

  it("every registered tool is documented on /docs/mcp", () => {
    for (const t of TOOLS) expect(docs.mcp, `tool "${t}" is undocumented`).toContain(t);
  });

  it("every registered resource is documented on /docs/mcp", () => {
    for (const r of RESOURCES) expect(docs.mcp, `resource "${r}" is undocumented`).toContain(r);
  });

  it("the documented npx command matches the published package name", () => {
    expect(docs.mcp).toContain(`npx -y ${pkg.name}`);
    expect(Object.keys(pkg.bin)).toHaveLength(1);
  });

  it("the stated Node floor matches the package's engines field", () => {
    const floor = /(\d+)/.exec(pkg.engines.node)?.[1];
    expect(floor, "packages/mcp engines.node has no numeric floor").toBeTruthy();
    expect(docs.mcp, `page should state Node ${floor}`).toContain(`Node ${floor}`);
  });

  it("`ai` stays an optional peer — the page says the stdio server never pulls it in", () => {
    expect(pkg.peerDependenciesMeta?.ai?.optional).toBe(true);
    expect(docs.mcp).toMatch(/optional peer/i);
  });
});

describe("every MCP entry point on the site points at the canonical page", () => {
  it("the AI-native guide carries the call-it pillar", () => {
    expect(docs.ai).toContain("/docs/mcp");
    expect(docs.ai).toMatch(/## Call it/);
  });

  it("the Quickstart offers the server beside the agent prompt", () => {
    expect(docs.quickstart).toContain("/docs/mcp");
  });

  it("the introduction links it", () => {
    expect(docs.index).toContain("/docs/mcp");
  });

  it("the homepage prints the install line under the server's real name", () => {
    // The page carries no tool register — it hands over the one command and
    // /docs/mcp owns the detail. A package rename must still break this.
    expect(docs.home).toContain(`npx -y ${pkg.name}`);
  });

  it("/llms.txt advertises the server with its real tools and resources", () => {
    for (const n of [...TOOLS, ...RESOURCES, pkg.name])
      expect(docs.llms, `llms.txt omits "${n}"`).toContain(n);
  });

  it("/catalog.json's mcp pointer names the real package and tools", () => {
    const { mcp } = buildCatalog();
    expect(mcp.package).toBe(pkg.name);
    expect([...mcp.tools].sort()).toEqual([...TOOLS].sort());
  });

  it("the page is in the sidebar under its own section", () => {
    const meta = JSON.parse(
      readFileSync(resolve(process.cwd(), "content/docs/meta.json"), "utf8"),
    ) as { pages: string[] };
    expect(meta.pages).toContain("mcp");
    expect(meta.pages[meta.pages.indexOf("mcp") - 1]).toBe("---MCP---");
  });

  it("the server.json registry manifest agrees with package.json", () => {
    const server = JSON.parse(read("server.json")) as {
      name: string;
      description: string;
      version: string;
      websiteUrl: string;
      packages: { identifier: string; version: string }[];
    };
    const full = JSON.parse(read("package.json")) as { version: string; mcpName: string };
    expect(server.name).toBe(full.mcpName);
    expect(server.version).toBe(full.version);
    expect(server.packages[0]!.identifier).toBe(pkg.name);
    expect(server.packages[0]!.version).toBe(full.version);
    // The registry caps descriptions at 100 characters — over it, publish fails.
    expect(server.description.length).toBeLessThanOrEqual(100);
    // websiteUrl must be a page this site actually builds.
    const path = new URL(server.websiteUrl).pathname.replace(/^\/docs\//, "");
    expect(existsSync(resolve(process.cwd(), `content/docs/${path}.mdx`))).toBe(true);
  });
});
