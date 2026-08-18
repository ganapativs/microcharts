// `/llms.txt` is the file an agent reads before it writes a chart, so a false
// sentence there is worse than a false sentence in prose: every agent that
// reads it acts on the claim. Most of the file is derived — the guide list from
// the page tree, the chart list from the catalog — but the "Does Not Support"
// block is a hand-typed template literal, and `pnpm gen:check` cannot see it
// because the route is not a generated artifact.
//
// It has drifted before. A line naming WindBarb as static-only outlived the
// commit that gave WindBarb an interactive entry, and two source comments
// carried the same stale claim for longer. These assertions pin the claims that
// can rot: every chart the prose names, and every statement it makes about
// which charts are interactive.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { STABLE_CHARTS } from "@/lib/catalog";

// Read the route as TEXT rather than importing it: the module pulls fumadocs'
// server entry, which does not resolve under vitest. The prose we are pinning
// is a literal in this file, so the source is the honest thing to assert on.
const body = readFileSync(resolve(import.meta.dirname, "../app/llms.txt/route.ts"), "utf8");

describe("llms.txt factual claims resolve against the catalog", () => {
  it("every chart it links exists in the catalog", () => {
    const linked = [...body.matchAll(/mdUrl\(\["charts", "([a-z0-9-]+)"\]\)/g)].map((m) => m[1]);
    expect(linked.length).toBeGreaterThan(0);
    const known = new Set(STABLE_CHARTS.map((c) => c.slug));
    expect([...new Set(linked)].filter((s) => !known.has(s))).toEqual([]);
  });

  it("names no chart as static-only, because none is", () => {
    // Every one of the catalog's charts ships an `/interactive` entry. If that
    // ever stops being true, this test should fail and the prose should gain
    // the exception — not the other way round.
    const staticOnly = STABLE_CHARTS.filter((c) => !c.interactiveImport).map((c) => c.slug);
    expect(staticOnly).toEqual([]);
    expect(body).not.toMatch(/static[- ]only/i);
  });

  it("the charts it singles out as non-picker really are non-picker", () => {
    // The file tells agents MinimapStrip and TokenConfidence break the picker
    // contract. If either became an ordinary picker the advice would misfire.
    for (const slug of ["minimap-strip", "token-confidence"]) {
      const entry = STABLE_CHARTS.find((c) => c.slug === slug);
      expect(entry, `${slug} left the catalog`).toBeDefined();
      expect(body).toContain(`mdUrl(["charts", "${slug}"])`);
      expect(entry?.picker, `${slug} is now a picker — the llms.txt note is stale`).not.toBe(true);
    }
  });

  it("claims no removed prop is still current", () => {
    // `onPointFocus` / `onRunFocus` are named as REMOVED. If either reappeared
    // in the catalog the sentence would be telling agents to avoid a live prop.
    const props = new Set(STABLE_CHARTS.flatMap((c) => c.sharedInteractive ?? []));
    for (const gone of ["onPointFocus", "onRunFocus"]) {
      expect(body).toContain(gone);
      expect(props.has(gone), `${gone} is back in the catalog`).toBe(false);
    }
  });
});
