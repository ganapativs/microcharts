import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Release history for the Atom feed (`/rss.xml`), parsed from the package
 * `CHANGELOG.md` at build time. Changesets writes version sections but no dates,
 * so each version's date comes from its git tag (`@microcharts/react@<version>`)
 * — the same build-time git approach as `doc-dates.ts`. Memoized per process.
 */

export type Release = {
  version: string;
  /** Raw changelog markdown for the version (notes only, heading stripped). */
  notes: string;
  /** ISO-8601 date of the version's git tag, or a stable fallback. */
  date: string;
};

/** Newest release count to publish. Keeps the feed bounded as history grows. */
const MAX_ENTRIES = 25;

/** Fallback when a tag is missing (unreleased/unpushed version, or shallow clone). */
const FALLBACK_DATE = "2026-07-07";

let cache: Release[] | null = null;

function gitRoot(): string {
  return execSync("git rev-parse --show-toplevel", {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

/** ISO date of the version's release tag, if present. */
function tagDate(root: string, version: string): string {
  try {
    const out = execSync(`git log -1 --format=%aI "@microcharts/react@${version}"`, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return out || FALLBACK_DATE;
  } catch {
    return FALLBACK_DATE;
  }
}

export function releases(): Release[] {
  if (cache) return cache;

  let root: string;
  let changelog: string;
  try {
    root = gitRoot();
    changelog = readFileSync(join(root, "CHANGELOG.md"), "utf8");
  } catch {
    cache = [];
    return cache;
  }

  const out: Release[] = [];
  // Split before each top-level `## <semver>` heading. The leading chunk (the
  // `# @microcharts/react` title, before the first version) fails the match and
  // is skipped; `### …` sub-headings inside a section are untouched.
  for (const section of changelog.split(/\n(?=## \d+\.\d+\.\d+)/)) {
    const m = /^## +(\d+\.\d+\.\d+[^\n]*)\n([\s\S]*)$/.exec(section.trim());
    if (!m) continue;
    const version = m[1].trim();
    out.push({ version, notes: m[2].trim(), date: tagDate(root, version) });
    if (out.length >= MAX_ENTRIES) break;
  }

  cache = out;
  return cache;
}
