import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guard against SWC's JSX whitespace bug gluing words together in SSR prose.
 *
 * Trigger (verified 2026-07-25 with a probe page, dev AND `next build`): a JSX
 * text node that (a) directly follows an `{expression}`, (b) contains an HTML
 * entity (`&nbsp;`, `&rsquo;`, …), and (c) spans a source newline loses its
 * LEADING SPACE — the homepage shipped "106 kB gzip and 11dependencies".
 * Babel keeps that space; SWC doesn't. All three conditions are required:
 * same content on one line is fine, an entity in a *later* sibling text node
 * is fine, the literal character (’) instead of the entity is fine.
 *
 * oxfmt can't be blamed and can't be fought — it freely rewraps prose JSX into
 * the trigger shape. The durable fix at a hit site is a template literal,
 * which neither tool touches: `{` ${value} dependencies `}`.
 *
 * Detection: React separates adjacent SSR text nodes with `<!-- -->`, so a
 * dropped space shows up as wordchar<!-- -->wordchar in the built HTML. Scans
 * every exported page. Skips (as passing) until a build exists, like
 * metadata.test.ts; CI runs it after `next build`.
 */

const outDir = resolve(process.cwd(), "out");
const hasBuild = existsSync(outDir);

const GLUED = /[A-Za-z0-9]<!-- -->[A-Za-z]/g;

/** Intentional adjacencies (none today). Add the exact glued snippet here if a
 *  page ever legitimately butts an expression against a word character. */
const ALLOWED = new Set<string>();

function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return e.name === "_next" ? [] : htmlFiles(p);
    return e.name.endsWith(".html") ? [p] : [];
  });
}

describe.skipIf(!hasBuild)("SSR output has no SWC-glued word boundaries", () => {
  it("no page renders wordchar<!-- -->wordchar", () => {
    const failures: string[] = [];
    for (const file of htmlFiles(outDir)) {
      const html = readFileSync(file, "utf8");
      for (const m of html.match(GLUED) ?? []) {
        if (!ALLOWED.has(m)) failures.push(`${file.slice(outDir.length + 1)}: ${m}`);
      }
    }
    expect(failures).toEqual([]);
  });
});
