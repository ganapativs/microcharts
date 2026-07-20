import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { GET } from "@/app/agent-setup.md/route";
import { extractAgentSetupPrompt, getAgentSetupPrompt } from "./agent-setup";
import { SHARED_PROP_NAMES } from "./charts/shared-props";
import { SITE } from "./site";

const prompt = getAgentSetupPrompt();

describe("agent-setup prompt (single source → /agent-setup.md)", () => {
  it("extracts a non-empty prompt that opens with the setup instruction", () => {
    expect(prompt.length).toBeGreaterThan(500);
    expect(prompt).toMatch(/^Set up \*\*@microcharts\/react\*\*/);
  });

  it("throws (never serves empty) when the fence is missing", () => {
    expect(() => extractAgentSetupPrompt("# no fence here")).toThrow();
  });

  it("/agent-setup.md serves the prompt verbatim as markdown", async () => {
    const res = GET();
    expect(res.headers.get("Content-Type")).toContain("text/markdown");
    expect((await res.text()).trimEnd()).toBe(prompt);
  });

  it("every microcharts.dev URL it names is a real, current surface", () => {
    const urls = [...prompt.matchAll(/https:\/\/microcharts\.dev(\/\S+)/g)]
      .map((m) => m[1].replace(/[.,)]+$/, ""))
      .filter((p) => !p.includes("<")); // skip the `<slug>` template line

    expect(urls.length).toBeGreaterThan(0);
    for (const path of urls) {
      const target =
        path.startsWith("/docs/") && path.endsWith(".md")
          ? // a docs page → its MDX source must exist
            `content/docs/${path.slice("/docs/".length, -".md".length)}.mdx`
          : // a machine route → its handler must exist
            `src/app${path}/route.ts`;
      expect(existsSync(resolve(process.cwd(), target)), `${path} → ${target}`).toBe(true);
    }
  });

  it("names only real shared-grammar props", () => {
    // The grammar list is hard-wrapped across lines in the MDX source — span it.
    const line = prompt.match(/same thing on every chart:([\s\S]*?)Chart-specific/)?.[1] ?? "";
    const named = [...line.matchAll(/`([a-zA-Z]+)`/g)].map((m) => m[1]);
    expect(named.length).toBeGreaterThanOrEqual(8);
    for (const name of named)
      expect(SHARED_PROP_NAMES.has(name), `prompt names unknown shared prop \`${name}\``).toBe(
        true,
      );
  });

  it("references the package and the llms.txt index", () => {
    expect(prompt).toContain(SITE.pkg);
    expect(prompt).toContain(`${SITE.url}/llms.txt`);
  });
});
