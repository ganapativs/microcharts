// Which marks the data-change transition can reach — counted, not assumed.
//
// The rule in styles.css is keyed on a ROLE attribute (`data-mc-ink`,
// `data-mc-cat`, `data-mc-cone`). A value mark with no role is not a rendering
// bug and not a test failure anywhere else in the suite: it simply never
// travels, and a chart that quietly cuts to its new value looks exactly like a
// chart that was never meant to move. That silence is why this file counts.
//
// It enumerates every `<rect>`, `<circle>`, `<line>` and `<ellipse>` in a static
// entry whose geometry attributes are bound to expressions rather than literals,
// and which carries no role attribute. `BACKLOG` records how many each chart has
// today. The test fails when a chart gains one, and equally when it loses one
// without the number being updated — so the list can only shrink deliberately.
//
// Fixing an entry is never just adding the attribute. A role sets `fill` and
// `stroke`, and a CSS declaration outranks an SVG presentation attribute, so a
// mark painted by `fill="…"` would change color the moment it gains a role. The
// safe shape is the one `control-strip` and `thermometer` now use: move the
// paint to an inline style, which outranks the role rule, then add the role.
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const chartsDir = resolve(import.meta.dirname, "../charts");
const GEOMETRY_ELEMENTS = /^(rect|circle|line|ellipse)$/;
const ANIMATABLE = ["x", "y", "width", "height", "cx", "cy", "r", "x1", "y1", "x2", "y2"];

/**
 * Marks that cannot travel today, per chart. Every one is a real value mark; the
 * reasons they are still here are paint plumbing (an attribute-painted mark that
 * would change color if given a role) or a chart with no interactive wrapper at
 * all (`hourglass`, `status-dot`), where the rule never applies.
 */
const BACKLOG: Record<string, number> = {
  "benchmark-strip": 1,
  "burn-chart": 1,
  "calibration-strip": 1,
  "cohort-triangle": 1,
  constellation: 1,
  "control-strip": 1,
  dumbbell: 1,
  "eta-bar": 1,
  "graded-band": 1,
  hourglass: 1,
  "minimap-strip": 1,
  "net-flow": 1,
  ohlc: 4,
  "partition-strip": 1,
  "rate-volume": 1,
  "shift-histogram": 1,
  "status-dot": 3,
  "tape-gauge": 1,
  "time-in-range": 1,
};

/** Opening tags of geometry elements, brace-aware so JSX expressions survive. */
function geometryTags(src: string): string[] {
  const out: string[] = [];
  for (const m of src.matchAll(/<(rect|circle|line|ellipse)\b/g)) {
    if (!GEOMETRY_ELEMENTS.test(m[1] ?? "")) continue;
    let depth = 0;
    for (let i = m.index; i < src.length; i++) {
      const ch = src[i];
      // A `//` comment inside a tag is prose, and this file's own charts write
      // `<circle>` in one. Reading that as the tag's closing `>` cut the tag
      // short and reported every attribute after the comment as absent —
      // `tree-rings` looked role-less while carrying `data-mc-ink="data"` two
      // lines below the comment that explains it.
      if (ch === "/" && src[i + 1] === "/") {
        const nl = src.indexOf("\n", i);
        if (nl === -1) break;
        i = nl;
        continue;
      }
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
      else if (ch === ">" && depth === 0) {
        out.push(src.slice(m.index, i + 1));
        break;
      }
    }
  }
  return out;
}

function unreachableMarks(src: string): number {
  return geometryTags(src).filter((tag) => {
    if (/data-mc-(ink|cat|cone)=/.test(tag)) return false;
    // A literal coordinate is chrome (a frame, a rule, a fixed tick); only a
    // bound expression can be carrying a datum.
    return ANIMATABLE.some((attr) => {
      const m = tag.match(new RegExp(`\\b${attr}=\\{([^}]*)\\}`));
      return m ? !/^\s*-?[\d.]+\s*$/.test(m[1] ?? "") : false;
    });
  }).length;
}

describe("data-change coverage", () => {
  const counts: Record<string, number> = {};
  for (const d of readdirSync(chartsDir, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    let src: string;
    try {
      src = readFileSync(resolve(chartsDir, d.name, "index.tsx"), "utf8");
    } catch {
      continue;
    }
    const n = unreachableMarks(src);
    if (n > 0) counts[d.name] = n;
  }

  it("no chart gains a value mark the transition cannot reach", () => {
    const gained = Object.entries(counts)
      .filter(([slug, n]) => n > (BACKLOG[slug] ?? 0))
      .map(([slug, n]) => `${slug}: ${n} (backlog allows ${BACKLOG[slug] ?? 0})`);

    expect(gained, gained.join("\n")).toEqual([]);
  });

  it("the backlog is not stale — a fixed mark must be removed from it", () => {
    const stale = Object.entries(BACKLOG)
      .filter(([slug, n]) => (counts[slug] ?? 0) < n)
      .map(([slug, n]) => `${slug}: ${counts[slug] ?? 0} left, backlog still claims ${n}`);

    expect(stale, stale.join("\n")).toEqual([]);
  });
});
