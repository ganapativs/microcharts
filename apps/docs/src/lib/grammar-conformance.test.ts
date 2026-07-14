import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { STABLE_CHARTS } from "./charts/registry";

// `MicrochartCommonProps` (src/index.ts) is the single source of truth for what
// a shared prop NAME means. Charts declare their props inline (per-file, for
// tree-shaking), so nothing at the type level forces the vocabulary to stay
// consistent — a refactor could give one chart a `summary: string` and no
// compiler would object. This guard reads the canonical types straight from the
// interface and holds every chart's matching prop to them, turning the "one
// meaning per name" convention into an enforced contract.

const root = resolve(process.cwd(), "../..");

/** Normalize a type: collapse whitespace, drop a trailing `| undefined`. */
const norm = (t: string) =>
  t
    .replace(/\s+/g, " ")
    .replace(/\s*\|\s*undefined\b/g, "")
    .trim();

/** name → normalized type for the first interface body matching `pattern`. */
function props(src: string, pattern: RegExp): Record<string, string> {
  const body = src.match(pattern);
  const out: Record<string, string> = {};
  if (!body) return out;
  for (const m of body[1]!.matchAll(/^\s*(?:readonly\s+)?([A-Za-z_]\w*)\??\s*:\s*([^;]+);/gm)) {
    out[m[1]!] = norm(m[2]!);
  }
  return out;
}

const canonical = props(
  readFileSync(resolve(root, "src/index.ts"), "utf8"),
  /interface MicrochartCommonProps\b[^{]*\{([\s\S]*?)\n\}/,
);

// `data` is per-chart-shaped and `domain` has a Date twin on time charts, so
// they're documented but not type-enforced here. The rest are invariant.
const ENFORCED = ["color", "title", "summary", "id", "className", "style"] as const;

describe("shared grammar is a single source of truth", () => {
  it("MicrochartCommonProps declares every enforced prop", () => {
    for (const p of ENFORCED) expect(canonical[p], `${p} missing from the grammar`).toBeTruthy();
  });
});

describe("every chart's shared props carry the canonical type", () => {
  for (const chart of STABLE_CHARTS) {
    it(`${chart.slug}`, () => {
      const file = resolve(root, "src/charts", chart.slug, "index.tsx");
      if (!existsSync(file)) return;
      const declared = props(
        readFileSync(file, "utf8"),
        /(?:export )?interface \w*Props\b[^{]*\{([\s\S]*?)\n\}/,
      );
      const drift = ENFORCED.filter(
        (p) => declared[p] !== undefined && declared[p] !== canonical[p],
      );
      expect(
        drift,
        drift.map((p) => `${p}: "${declared[p]}" ≠ grammar "${canonical[p]}"`).join("; "),
      ).toEqual([]);
    });
  }
});
