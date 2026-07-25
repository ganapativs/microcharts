import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { AI_SNIPPETS } from "./ai-snippets";
import { AI_LOGOS } from "./ai-logos";

// Snippets are shared by the model-facing pages — the AI-native guide and the
// MCP page — so both sides of the used/orphan check span the same set.
const PAGES = ["ai.mdx", "mcp.mdx"] as const;
const sources = PAGES.map((f) => ({
  f,
  src: readFileSync(resolve(process.cwd(), "content/docs", f), "utf8"),
}));
const allSrc = sources.map((s) => s.src).join("\n");

describe("AI-native page wiring", () => {
  for (const { f, src } of sources) {
    it(`every <Snippet id=…> in ${f} resolves to a real snippet`, () => {
      const used = [...src.matchAll(/<Snippet id="([^"]+)"/g)].map((m) => m[1]);
      expect(used.length).toBeGreaterThan(0);
      for (const id of used) expect(AI_SNIPPETS, `unknown snippet "${id}"`).toHaveProperty(id);
    });
  }

  it("no orphan snippets — every snippet is used on one of the model-facing pages", () => {
    for (const id of Object.keys(AI_SNIPPETS))
      expect(allSrc, `snippet "${id}" is defined but never rendered`).toContain(`id="${id}"`);
  });

  it("snippets carry non-empty code and a language", () => {
    for (const [id, s] of Object.entries(AI_SNIPPETS)) {
      expect(s.lang, id).toBeTruthy();
      expect(s.code.trim().length, id).toBeGreaterThan(0);
    }
  });

  it("logos are well-formed and theme via currentColor (no baked hex fills)", () => {
    for (const [key, l] of Object.entries(AI_LOGOS)) {
      expect(l.viewBox, key).toMatch(/^[\d.\s-]+$/);
      expect(l.body, key).toMatch(/<(path|g|circle|rect|polygon)/);
      expect(l.body, `${key} has a baked hex fill`).not.toMatch(/fill="#/);
    }
  });
});
