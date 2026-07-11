import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { AI_SNIPPETS } from "./ai-snippets";
import { AI_LOGOS } from "./ai-logos";

const aiMdx = readFileSync(resolve(process.cwd(), "content/docs/ai.mdx"), "utf8");

describe("AI-native page wiring", () => {
  it("every <Snippet id=…> in ai.mdx resolves to a real snippet", () => {
    const used = [...aiMdx.matchAll(/<Snippet id="([^"]+)"/g)].map((m) => m[1]);
    expect(used.length).toBeGreaterThan(0);
    for (const id of used) expect(AI_SNIPPETS, `unknown snippet "${id}"`).toHaveProperty(id);
  });

  it("no orphan snippets — every snippet is used on the page", () => {
    for (const id of Object.keys(AI_SNIPPETS))
      expect(aiMdx, `snippet "${id}" is defined but never rendered`).toContain(`id="${id}"`);
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
