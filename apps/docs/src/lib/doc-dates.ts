import { execSync } from "node:child_process";

/**
 * Honest last-modified dates for docs pages, read from git history at build time.
 *
 * Both the sitemap (`<lastmod>`) and the per-page `TechArticle` JSON-LD
 * (`dateModified`) need a real modification date — a frozen constant is a
 * staleness signal to crawlers and drifts from reality. Static export runs on
 * Node, so we resolve dates from `git log` once per process and memoize.
 *
 * Keyed by Fumadocs `page.path` (relative to the content dir, e.g. `ai.mdx` or
 * `charts/sparkline.mdx`) — the same value used to build the "edit on GitHub"
 * link in the docs page.
 */

const CONTENT_DIR = "apps/docs/content/docs";

/** Fallback when git history is unavailable (not a repo, or a shallow CI clone
 *  with no history for the file). A fixed date avoids per-build sitemap churn. */
const FALLBACK = "2026-07-07";

let cache: Map<string, string> | null = null;

function buildMap(): Map<string, string> {
  const map = new Map<string, string>();
  try {
    const root = execSync("git rev-parse --show-toplevel", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();

    // One walk of the docs subtree: each commit prints its ISO date, then the
    // files it touched (repo-root-relative). The first (newest) date seen for a
    // file wins, since `git log` lists commits newest-first.
    const out = execSync(`git log --format=%cI --name-only -- ${CONTENT_DIR}`, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      maxBuffer: 64 * 1024 * 1024,
    });

    let date = "";
    for (const line of out.split("\n")) {
      if (!line) continue;
      if (/^\d{4}-\d{2}-\d{2}T/.test(line)) {
        date = line.trim();
      } else if (line.startsWith(`${CONTENT_DIR}/`)) {
        const rel = line.slice(CONTENT_DIR.length + 1);
        if (!map.has(rel)) map.set(rel, date);
      }
    }
  } catch {
    // Leave the map empty; callers fall back to FALLBACK.
  }
  return map;
}

/** ISO-8601 datetime of a docs page's last git commit, or a stable fallback. */
export function docLastModified(pagePath: string): string {
  cache ??= buildMap();
  return cache.get(pagePath) ?? FALLBACK;
}

const fileCache = new Map<string, string>();

/**
 * Last git-commit date of any repo file (repo-root-relative), for routes that
 * aren't docs pages (home, gallery, brand). Using the source file's real commit
 * date instead of a build-time `new Date()` keeps `<lastmod>` from churning on
 * every unchanged rebuild — a frozen build date trains crawlers to distrust it.
 */
export function fileLastModified(repoRelPath: string): string {
  const hit = fileCache.get(repoRelPath);
  if (hit) return hit;
  let date = FALLBACK;
  try {
    const out = execSync(`git log -1 --format=%cI -- ${repoRelPath}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      // Route source paths contain `[...]` (Next dynamic segments) which git
      // would treat as pathspec glob magic; force literal matching.
      env: { ...process.env, GIT_LITERAL_PATHSPECS: "1" },
    }).trim();
    if (/^\d{4}-\d{2}-\d{2}T/.test(out)) date = out;
  } catch {
    // Leave FALLBACK.
  }
  fileCache.set(repoRelPath, date);
  return date;
}
