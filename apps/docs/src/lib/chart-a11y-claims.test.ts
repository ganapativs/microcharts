import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { INTERACTIVE_READOUT_CLAIMS } from "./chart-a11y-claims";

// Every chart page's `## Accessibility` section quotes accessible strings in
// bold — **"Trending up 200%. …"**. Those literals are hand-typed, and for a
// long time nothing regenerated them, so they rotted: pages quoted the value
// asserted in the chart's own `index.test.tsx` FIXTURE rather than the string
// its own hero demo produces, and a few were outright fabricated.
//
// This is the guard. A quote must be one of two things:
//
//  1. a STATIC accessible name — then it appears verbatim in the built page,
//     because the static export renders every demo on it. That is checked here
//     against `out/`, so any generator wording change reds this test.
//  2. an INTERACTIVE readout — announced on hover/focus, so it can never be in
//     the static HTML. Those are enumerated in `chart-a11y-claims.ts` with the
//     code path that produces each one. That list is the review surface: a NEW
//     unmatched quote fails here until someone verifies it and adds it.
//
// Tests run with cwd = apps/docs. Skips (as passing) without a build, matching
// `metadata.test.ts`; CI runs it after `next build`.
const outDir = resolve(process.cwd(), "out/docs/charts") + "/";
const hasBuild = existsSync(outDir);
const contentDir = resolve(process.cwd(), "content/docs/charts");

const slugs = readdirSync(contentDir)
  .filter((f) => f.endsWith(".mdx") && f !== "index.mdx")
  .map((f) => f.slice(0, -4));

/** The bold-quoted accessible strings in a page's `## Accessibility` section. */
function quotedClaims(slug: string): string[] {
  const src = readFileSync(resolve(contentDir, `${slug}.mdx`), "utf8");
  const section = src.match(/\n## Accessibility\n([\s\S]*?)(?=\n## |$)/);
  if (!section) return [];
  return [...section[1]!.matchAll(/\*\*"([^"]+)"\*\*/g)].map((m) => m[1]!);
}

/** Collapse entity escapes and prose line wrapping so quotes compare by content. */
function normalize(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&mdash;/g, "—")
    .replace(/&nbsp;/g, " ")
    .replace(/\\/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Every accessible name the built page actually renders. */
function renderedNames(slug: string): string[] {
  const html = readFileSync(resolve(outDir, `${slug}.html`), "utf8");
  return [
    ...[...html.matchAll(/aria-label="([^"]*)"/g)].map((m) => m[1]!),
    ...[...html.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/g)].map((m) => m[1]!),
  ].map(normalize);
}

describe.skipIf(!hasBuild)("chart pages quote accessible strings the code really produces", () => {
  for (const slug of slugs) {
    const claims = quotedClaims(slug);
    if (claims.length === 0) continue;

    it(`${slug}`, () => {
      const names = renderedNames(slug);
      const known = new Set((INTERACTIVE_READOUT_CLAIMS[slug] ?? []).map(normalize));
      const unaccounted = claims.filter((claim) => {
        const q = normalize(claim);
        if (known.has(q)) return false;
        return !names.some((name) => name === q || name.includes(q));
      });
      expect(
        unaccounted,
        `${slug}.mdx quotes accessible strings no demo on the page produces, and which are ` +
          `not registered as interactive readouts in chart-a11y-claims.ts: ` +
          unaccounted.map((c) => `"${c}"`).join(", "),
      ).toEqual([]);
    });
  }
});

describe("the interactive-readout register stays honest", () => {
  it("names only real charts", () => {
    const unknown = Object.keys(INTERACTIVE_READOUT_CLAIMS).filter((s) => !slugs.includes(s));
    expect(unknown, `unknown slugs in the register: ${unknown.join(", ")}`).toEqual([]);
  });

  it("lists only strings the pages still quote", () => {
    // A stale entry would keep a deleted claim "verified" forever, and would let
    // the next drift on that page slip through under its cover.
    const stale: string[] = [];
    for (const [slug, entries] of Object.entries(INTERACTIVE_READOUT_CLAIMS)) {
      if (!slugs.includes(slug)) continue;
      const quoted = new Set(quotedClaims(slug).map(normalize));
      for (const entry of entries) {
        if (!quoted.has(normalize(entry))) stale.push(`${slug}: "${entry}"`);
      }
    }
    expect(stale, `register entries no page quotes any more: ${stale.join("; ")}`).toEqual([]);
  });
});
