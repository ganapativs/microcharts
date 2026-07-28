import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// A multiline plain-scalar `description:` whose continuation line contains
// ": " is not a string to YAML — it's an implicit map, and fumadocs-mdx fails
// the whole page at build with "Implicit map keys need to be followed by map
// values". Five pages shipped that way during the 2026-07 voice pass (the dev
// server 500s, so it never reaches CI's static checks). The fix is block
// style: `description: >-`. This test pins the rule for every content page.
const roots = ["content/docs", "content/docs/charts"].map((d) => resolve(process.cwd(), d));

const pages = roots.flatMap((dir) =>
  readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => ({ file: join(dir, f), src: readFileSync(join(dir, f), "utf8") })),
);

/** The frontmatter block's inner lines, or null when a page has none. */
function frontmatter(src: string): string[] | null {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(src);
  return m ? m[1].split("\n") : null;
}

describe("frontmatter survives YAML plain-scalar folding", () => {
  it("finds every content page", () => {
    expect(pages.length).toBeGreaterThan(120);
  });

  for (const { file, src } of pages) {
    it(file.replace(/^.*content\//, ""), () => {
      const lines = frontmatter(src);
      expect(lines, "page has no frontmatter").not.toBeNull();
      for (let i = 0; i < lines!.length; i++) {
        const line = lines![i];
        // A key with no inline value opens a plain multiline scalar unless it
        // declares block style (>- / > / |- / |) or quotes.
        const bare = /^(\w[\w-]*):\s*$/.exec(line);
        if (!bare) continue;
        for (let j = i + 1; j < lines!.length; j++) {
          const cont = lines![j];
          if (!/^\s+\S/.test(cont)) break; // scalar ended
          expect(
            /: /.test(cont),
            `${bare[1]} is a plain multiline scalar but its continuation contains ": " — ` +
              `YAML reads that as a nested map and the page 500s. Use \`${bare[1]}: >-\`.`,
          ).toBe(false);
        }
      }
    });
  }
});
