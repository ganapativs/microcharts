import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { AI_LOGOS } from "./ai-logos";
import { MCP_CLIENTS, MCP_CLIENT_GROUPS, NAME, PKG } from "./mcp-clients";
import { expandComponents } from "./md-transform";

/**
 * The setup list is the page's load-bearing content: a stale block sends a
 * reader to a client that silently fails to start the server. These assert the
 * things a human review misses — that every block names the published package,
 * that the JSON parses, that a logo key resolves, and that the one-click links
 * decode back to the same command as the config blocks.
 */

const pkg = JSON.parse(
  readFileSync(resolve(process.cwd(), "../../packages/mcp/package.json"), "utf8"),
) as { name: string };

describe("the MCP client list", () => {
  it("names the package the workspace actually publishes", () => {
    expect(PKG).toBe(pkg.name);
  });

  it("carries clients in every group, with unique ids", () => {
    for (const g of MCP_CLIENT_GROUPS) expect(g.clients.length).toBeGreaterThan(0);
    const ids = MCP_CLIENTS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every client at least one block that names the package", () => {
    for (const c of MCP_CLIENTS)
      expect(
        c.setups.some((s) => s.code.includes(PKG)),
        `"${c.name}" has no setup naming ${PKG}`,
      ).toBe(true);
  });

  it("names the package in every config block — the UI walkthroughs are the only prose", () => {
    for (const c of MCP_CLIENTS)
      for (const s of c.setups) {
        if (s.lang === "text") continue;
        expect(s.code, `"${c.name}" / ${s.label}`).toContain(PKG);
        expect(s.code, `"${c.name}" / ${s.label}`).toContain(NAME);
      }
  });

  it("emits valid JSON, so a reader can paste a block whole", () => {
    for (const c of MCP_CLIENTS)
      for (const s of c.setups) {
        if (s.lang !== "json") continue;
        expect(() => JSON.parse(s.code), `"${c.name}" / ${s.label}`).not.toThrow();
      }
  });

  it("resolves every logo key against the shared registry", () => {
    for (const c of MCP_CLIENTS) {
      if (!c.logo) continue;
      expect(AI_LOGOS[c.logo], `"${c.name}" points at a missing logo`).toBeTruthy();
    }
  });

  it("links each setup to the vendor page it was read from", () => {
    for (const c of MCP_CLIENTS) expect(c.docs, c.name).toMatch(/^https:\/\//);
  });

  it("one-click links carry the same command as the config blocks", () => {
    const cursor = MCP_CLIENTS.find((c) => c.id === "cursor")!;
    const config = new URL(cursor.install!.href.replace("cursor://", "https://")).searchParams.get(
      "config",
    )!;
    expect(JSON.parse(Buffer.from(config, "base64").toString("utf8"))).toEqual({
      command: "npx",
      args: ["-y", PKG],
    });

    const vscode = MCP_CLIENTS.find((c) => c.id === "vscode")!;
    const payload = vscode.install!.href.slice("vscode:mcp/install?".length);
    expect(JSON.parse(decodeURIComponent(payload))).toEqual({
      name: NAME,
      command: "npx",
      args: ["-y", PKG],
    });
  });
});

describe("the Markdown mirror carries the list", () => {
  const md = expandComponents("<McpClients />");

  it("expands the component instead of leaving the tag", () => {
    expect(md).not.toContain("<McpClients");
    for (const c of MCP_CLIENTS) expect(md, `mirror omits "${c.name}"`).toContain(`#### ${c.name}`);
  });

  it("keeps each block fenced with its language", () => {
    expect(md).toContain("```toml");
    expect(md).toContain("```yaml");
    expect(md).toContain(`\`\`\`bash\nclaude mcp add ${NAME} -- npx -y ${PKG}\n\`\`\``);
  });
});
