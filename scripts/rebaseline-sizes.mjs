#!/usr/bin/env node
/**
 * Re-baseline `scripts/size-budgets.json` from MEASURED sizes.
 *
 *   node scripts/rebaseline-sizes.mjs --dry    # report, write nothing
 *   node scripts/rebaseline-sizes.mjs          # rewrite the budgets
 *
 * Requires a fresh `pnpm build`. Regenerate `.size-limit.json` with
 * `pnpm size:gen` afterwards, then `pnpm size:sync` for the docs numbers.
 *
 * Headroom policy: `max(50 B, 2%)` above the measured size, rounded up to 2 dp.
 * The previous baseline was set to ~10 B above actual, which made the gate fire
 * on noise: a 75 B change in one shared helper (`fillFor`) put all ~106
 * interactive subpaths over at once, so the signal was "something moved",
 * never "something regressed". 2% still catches a real regression — the
 * smallest chart is ~1 kB, so the allowance is ~20-50 B — while absorbing the
 * byte-level churn of a shared-kernel edit.
 *
 * Budgets only ever RISE here when the measurement says so; a subpath that got
 * smaller is tightened to its new size, so wins are locked in.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dry = process.argv.includes("--dry");

// size-limit exits non-zero when anything is over budget — which is the normal
// state when re-baselining. Read its stdout either way.
let raw;
try {
  raw = execFileSync("pnpm", ["exec", "size-limit", "--json"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
} catch (e) {
  raw = e.stdout;
  if (!raw) throw e;
}
const report = JSON.parse(raw.slice(raw.indexOf("[")));

const budgetsPath = resolve(root, "scripts/size-budgets.json");
const budgets = JSON.parse(readFileSync(budgetsPath, "utf8"));

/**
 * The catalog ceilings from `$ceilings`. The headroom formula is a FLOOR on a
 * budget, never a licence to raise one through these: `sparkline.interactive`
 * measures 6982 B, so `measured + 2%` asks for 7.13 kB and this script would
 * have written it — silently moving a wall that CLAUDE.md says no sign-off
 * raises, and that the README, the docs and the package description all quote
 * as "~2–7 kB interactive". A budget is clamped here instead, and the clamp is
 * reported: the entry has no room left, which is the fact worth acting on.
 */
const CEILINGS = { static: 4350, interactive: 7000 };

/** measured bytes → budget string, with headroom, never above the ceiling. */
const budgetFor = (bytes, kind) => {
  const withRoom = Math.min(bytes + Math.max(50, bytes * 0.02), CEILINGS[kind]);
  return `${(Math.ceil(withRoom / 10) / 100).toFixed(2)} kB`;
};

const parseKb = (s) => Number.parseFloat(String(s)) * 1000;

// size-limit names each check after its subpath, e.g. "./charts/sparkline" and
// "./charts/sparkline/interactive"; map those back onto the budgets shape.
const changes = [];
for (const entry of report) {
  // "@microcharts/react/<slug> (static)" | "@microcharts/react/<slug>/interactive"
  const m = /^@microcharts\/react\/([a-z0-9-]+)(?:\/(interactive)| \(static\))$/.exec(
    entry.name ?? "",
  );
  if (!m) continue;
  const [, slug, live] = m;
  const kind = live ? "interactive" : "static";
  const chart = budgets.charts?.[slug];
  if (!chart || chart[kind] === undefined) continue;
  const next = budgetFor(entry.size, kind);
  if (next !== chart[kind]) {
    changes.push({
      slug,
      kind,
      from: chart[kind],
      to: next,
      bytes: entry.size,
      delta: entry.size - parseKb(chart[kind]),
      clamped: parseKb(next) >= CEILINGS[kind],
    });
    if (!dry) chart[kind] = next;
  }
}

changes.sort((a, b) => b.delta - a.delta);
const over = changes.filter((c) => c.delta > 0);
const under = changes.filter((c) => c.delta <= 0);
console.log(
  `${changes.length} budgets change (${over.length} raised, ${under.length} tightened) of ${report.length} checks`,
);
for (const c of changes.slice(0, 20)) {
  console.log(
    `  ${c.slug}.${c.kind}: ${c.from} → ${c.to} (measured ${c.bytes} B, ${c.delta > 0 ? "+" : ""}${Math.round(c.delta)} B vs old budget)${c.clamped ? "  ⚠ AT CEILING" : ""}`,
  );
}
if (changes.length > 20) console.log(`  … ${changes.length - 20} more`);

// Surfaced separately from the list above, which truncates at 20: an entry
// pinned at its ceiling has spent its headroom, so the next byte fails the gate.
const pinned = changes.filter((c) => c.clamped);
if (pinned.length) {
  console.log(
    `\n⚠ ${pinned.length} budget(s) clamped to the catalog ceiling — no headroom left, buy room by shrinking the entry:\n${pinned
      .map((c) => `    ${c.slug}.${c.kind}: ${c.to} (measured ${c.bytes} B)`)
      .join("\n")}`,
  );
}

if (!dry) {
  writeFileSync(budgetsPath, `${JSON.stringify(budgets, null, 2)}\n`);
  console.log("\nwrote scripts/size-budgets.json — now run `pnpm size:gen` and `pnpm size:sync`");
}
