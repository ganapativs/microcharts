#!/usr/bin/env node
/**
 * Compares the committed `scripts/size-snapshot.json` against the same file on
 * a base ref, and writes a Markdown report of every per-subpath gzip change.
 *
 *   node scripts/size-diff.mjs origin/main            # report to stdout
 *   node scripts/size-diff.mjs origin/main --out r.md # …and to a file
 *   node scripts/size-diff.mjs --base-file old.json   # diff two local snapshots
 *
 * Exit 1 when any entry grows by more than the tolerance (default 1%, override
 * with SIZE_DIFF_TOLERANCE). SIZE_DIFF_ALLOW=1 reports the regression but exits
 * 0 — the escape hatch for a deliberate, reviewed increase.
 *
 * The snapshot is measured, not declared: CI runs `size-snapshot.mjs --check`
 * against a fresh build in the same run, so a PR cannot understate its own
 * numbers. This script therefore needs no build of its own — two committed
 * JSON files and `git show` are the whole input.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const MARKER = "<!-- microcharts-size-report -->";
const MAX_ROWS = 40;

const root = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? null : args[i + 1];
};
// Positional = the first argument that is neither a flag nor a flag's value.
const baseRef = args.find(
  (a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--")),
);
const outFile = flag("--out");
const baseFile = flag("--base-file");

if (!baseRef && !baseFile) {
  console.error("usage: node scripts/size-diff.mjs <base-ref> [--out <file.md>] [--base-file <f>]");
  process.exit(2);
}

const tolerancePct = Number(process.env.SIZE_DIFF_TOLERANCE ?? "1");
const allowRegression = process.env.SIZE_DIFF_ALLOW === "1";

/** Snapshot at a git ref, or null when the ref predates the snapshot file. */
function snapshotAt(ref) {
  try {
    const raw = execFileSync("git", ["show", `${ref}:scripts/size-snapshot.json`], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    });
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const baseSnapshot = baseFile
  ? JSON.parse(readFileSync(resolve(root, baseFile), "utf8"))
  : snapshotAt(baseRef);
const headSnapshot = JSON.parse(readFileSync(resolve(root, "scripts/size-snapshot.json"), "utf8"));

const base = baseSnapshot ? (baseSnapshot.entries ?? {}) : null;
const head = headSnapshot.entries;

const kb = (b) => `${(b / 1000).toFixed(2)} kB`;
const signed = (b) => `${b > 0 ? "+" : b < 0 ? "−" : ""}${Math.abs(b)} B`;
const pct = (d, b) => `${d > 0 ? "+" : d < 0 ? "−" : ""}${((Math.abs(d) / b) * 100).toFixed(2)}%`;

function emit(body) {
  const md = `${MARKER}\n${body}`;
  if (outFile) writeFileSync(outFile, `${md}\n`);
  console.log(md);
}

if (!base) {
  emit(
    `### 📦 Bundle size\n\nNo size baseline on \`${baseRef}\` — \`scripts/size-snapshot.json\` does not exist there yet, so there is nothing to diff. This PR establishes the baseline.\n`,
  );
  process.exit(0);
}

const keys = [...new Set([...Object.keys(base), ...Object.keys(head)])].sort();
const changed = [];
const added = [];
const removed = [];

for (const key of keys) {
  const b = base[key];
  const h = head[key];
  if (b === undefined) {
    added.push({ key, size: h });
    continue;
  }
  if (h === undefined) {
    removed.push({ key, size: b });
    continue;
  }
  if (h === b) continue;
  const delta = h - b;
  const ratio = (delta / b) * 100;
  changed.push({ key, base: b, head: h, delta, ratio, over: ratio > tolerancePct });
}

changed.sort((a, b) => b.ratio - a.ratio);
const over = changed.filter((c) => c.over);
const grew = changed.filter((c) => c.delta > 0);
const shrank = changed.filter((c) => c.delta < 0);

const totalBase = keys.reduce((n, k) => n + (base[k] ?? 0), 0);
const totalHead = keys.reduce((n, k) => n + (head[k] ?? 0), 0);
const totalDelta = totalHead - totalBase;

const lines = [];

if (!changed.length && !added.length && !removed.length) {
  lines.push("### 📦 Bundle size — no change", "");
  lines.push(`Every measured subpath is byte-identical to \`${baseRef ?? baseFile}\`.`);
  emit(`${lines.join("\n")}\n`);
  process.exit(0);
}

lines.push(over.length ? "### 🚨 Bundle size — regression" : "### 📦 Bundle size — changed", "");

if (over.length) {
  lines.push(
    `**${over.length} subpath${over.length === 1 ? "" : "s"} grew by more than ${tolerancePct}%.** That is over the limit for this repo — shrink the change, or land it with a stated reason and re-baseline the budgets.`,
    "",
  );
}

lines.push(
  `${grew.length} grew · ${shrank.length} shrank · ${added.length} added · ${removed.length} removed. Summed over all ${keys.length} entries: ${kb(totalBase)} → ${kb(totalHead)} (${signed(totalDelta)}) — entries are measured standalone, so shared code is counted once per entry and this sum is a movement signal, not a download size.`,
  "",
);

const table = (rows) => [
  "| Subpath | Base | Head | Δ | Δ% | |",
  "| --- | ---: | ---: | ---: | ---: | :-- |",
  ...rows.map(
    (c) =>
      `| \`${c.key}\` | ${kb(c.base)} | ${kb(c.head)} | ${signed(c.delta)} | ${pct(c.delta, c.base)} | ${c.over ? "🚨" : c.delta > 0 ? "⚠️" : "✅"} |`,
  ),
];

lines.push(...table(changed.slice(0, MAX_ROWS)));
if (changed.length > MAX_ROWS) {
  lines.push("", `… ${changed.length - MAX_ROWS} more changed subpath(s) omitted.`);
}

// Shared kernel: reported, never gated. Kernel bytes are already inside every
// subpath above, so gating them here would fail the same change twice; what
// this adds is the reason a couple hundred rows moved by the same amount.
const baseKernels = baseSnapshot?.kernels ?? {};
const headKernels = headSnapshot.kernels ?? {};
const kernelKeys = [...new Set([...Object.keys(baseKernels), ...Object.keys(headKernels)])].sort();
if (kernelKeys.length) {
  const moved = kernelKeys.filter((k) => baseKernels[k] !== headKernels[k]);
  lines.push("", "**Shared kernel** — tracked, not gated");
  if (moved.length) {
    lines.push(
      "",
      "| Kernel | Base | Head | Δ | Δ% |",
      "| --- | ---: | ---: | ---: | ---: |",
      ...moved.map((k) => {
        const b = baseKernels[k];
        const h = headKernels[k];
        if (b === undefined || h === undefined)
          return `| \`${k}\` | ${b === undefined ? "—" : kb(b)} | ${h === undefined ? "—" : kb(h)} | — | — |`;
        return `| \`${k}\` | ${kb(b)} | ${kb(h)} | ${signed(h - b)} | ${pct(h - b, b)} |`;
      }),
      "",
      "Kernel bytes land in every subpath that imports them, so a move here explains a uniform shift across the table above.",
    );
  } else {
    lines.push(
      "",
      "Byte-identical. Every change above is local to the charts that moved, not the shared core.",
    );
  }
}

if (added.length) {
  lines.push("", "**New subpaths**", "", ...added.map((a) => `- \`${a.key}\` — ${kb(a.size)}`));
}
if (removed.length) {
  lines.push(
    "",
    "**Removed subpaths**",
    "",
    ...removed.map((r) => `- \`${r.key}\` — was ${kb(r.size)}`),
  );
}

lines.push(
  "",
  `<sub>gzip bytes per export subpath, measured by size-limit against a fresh build (\`scripts/size-snapshot.json\`, CI-verified). Gate: >${tolerancePct}% growth on any subpath fails. Regenerate locally with \`pnpm build && pnpm size:snapshot\`.</sub>`,
);

emit(`${lines.join("\n")}\n`);

if (over.length && !allowRegression) {
  console.error(
    `\nsize-diff: ${over.length} subpath(s) over the ${tolerancePct}% growth limit:\n${over
      .map(
        (c) => `  ${c.key}: ${c.base} → ${c.head} B (${signed(c.delta)}, ${pct(c.delta, c.base)})`,
      )
      .join("\n")}`,
  );
  process.exit(1);
}
if (over.length && allowRegression) {
  console.error("size-diff: regression present, but SIZE_DIFF_ALLOW=1 — not failing.");
}
