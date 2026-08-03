import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterAll, describe, expect, it } from "vitest";

/**
 * The published artifact, not the sources. Every other suite imports `src/`, so
 * a build-level regression — a stale bundle, a dropped entry, a dependency that
 * got inlined instead of externalized, a shebang that lost its execute bit —
 * would ship green. This spawns `dist/cli.mjs` exactly as an MCP host does and
 * speaks the protocol to it over stdio.
 *
 * Requires `pnpm build` first (CI builds before it tests); skipped locally when
 * there is no `dist/`, hard-failed in CI so it can never silently vanish.
 */
const here = dirname(fileURLToPath(import.meta.url));
const cli = resolve(here, "../dist/cli.mjs");
const built = existsSync(cli);

if (!built && process.env.CI)
  throw new Error("dist/cli.mjs is missing — run `pnpm build` before `pnpm test`.");

let transport: StdioClientTransport | undefined;
afterAll(async () => {
  await transport?.close();
});

describe.skipIf(!built)("the built stdio server", () => {
  it("boots, handshakes, and renders — spawned the way a host spawns it", async () => {
    transport = new StdioClientTransport({ command: process.execPath, args: [cli] });
    const client = new Client({ name: "dist-smoke", version: "0" });
    await client.connect(transport);

    expect(client.getServerVersion()?.name).toBe("microcharts");
    const { tools } = await client.listTools();
    expect(tools).toHaveLength(3);

    const rendered = await client.callTool({
      name: "render_microchart",
      arguments: { type: "sparkline", data: [3, 5, 4, 8, 6, 9] },
    });
    expect(rendered.isError).toBeFalsy();
    const out = rendered.structuredContent as { svg: string; summary: string; library: string };
    expect(out.svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(out.summary).toMatch(/trending/i);
    // The library stamp is a build-time define (`__LIBRARY_VERSION__`), not a
    // committed field, so only the built artifact can prove it was substituted —
    // a missing define would ship an empty string here, not a build error.
    expect(out.library).toMatch(/^\d+\.\d+\.\d+/);
    // Exact match only in CI, which always builds immediately before testing.
    // Locally a dist/ built before the last release legitimately lags the root.
    if (process.env.CI) {
      const { version } = JSON.parse(
        readFileSync(resolve(here, "../../../package.json"), "utf8"),
      ) as { version: string };
      expect(out.library).toBe(version);
    }

    // stdout is the JSON-RPC channel. The library warns about questionable data
    // (`[microcharts] <StatusDot> unknown status …`) — if any of that ever went
    // to stdout instead of stderr it would corrupt the stream, so provoke a
    // warning and then prove the session still speaks protocol.
    const noisy = await client.callTool({
      name: "render_microchart",
      arguments: { type: "status-dot", props: { status: "not-a-status" } },
    });
    expect(noisy.isError).toBeFalsy();
    expect((await client.listTools()).tools).toHaveLength(3);
  }, 30_000);
});
