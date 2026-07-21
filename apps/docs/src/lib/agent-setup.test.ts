import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { GET } from "@/app/agent-setup.md/route";
import { extractAgentSetupPrompt, getAgentSetupPrompt } from "./agent-setup";
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

  it("points agents at catalog.json for the full prop/callback surface", () => {
    expect(prompt).toContain(`${SITE.url}/catalog.json`);
    expect(prompt).toMatch(/sharedProps/);
    expect(prompt).toMatch(/sharedInteractive/);
    expect(prompt).toMatch(/Do \*\*not\*\* read the whole file|do not read the whole file/i);
  });

  it("covers the install traps that break real apps", () => {
    expect(prompt).toMatch(/"use client"/);
    expect(prompt).toMatch(/pages\/_app\.tsx/);
    expect(prompt).toMatch(/@microcharts\/react\/motion/);
    expect(prompt).toMatch(/styles\.css/);
    expect(prompt).toMatch(/scaffold|React 18\/19 app/);
  });

  it("references the package and the llms.txt index", () => {
    expect(prompt).toContain(SITE.pkg);
    expect(prompt).toContain(`${SITE.url}/llms.txt`);
  });
});
