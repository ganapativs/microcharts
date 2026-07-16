#!/usr/bin/env node
/**
 * Generates the `/docs/<slug>.md` Markdown mirrors as real static files under
 * `public/docs/`, so they resolve in `next dev` AND in the static export with no
 * rewrites, middleware, or runtime (a `public/` file wins over the dynamic
 * `/docs/[[...slug]]` page). Runs at `predev` and `prebuild`.
 *
 * The body is the page's MDX with components expanded to text/code by the shared
 * `expandComponents` transform — the same one `getLLMText` applies — so the `.md`
 * mirror matches `/llms-full.txt` and the copy-page affordance. Run with Node's
 * native TypeScript support (Node ≥ 23.6): `node scripts/gen-md.ts`.
 */
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { expandComponents, type ResolveChart } from "../src/lib/md-transform.ts";

const root = resolve(import.meta.dirname, "..");
const contentDir = join(root, "content", "docs");
const publicDir = join(root, "public");
const outDir = join(publicDir, "docs");

/**
 * Resolve a chart's prop metadata from the committed registry snapshot, read
 * directly as JSON so this stays on Node's native TypeScript (the catalog
 * facade's extensionless / attribute-less imports are bundler-only). Same
 * source the app's `getChart` compiles from, so both surfaces agree.
 */
type ChartRow = { slug: string } & NonNullable<ReturnType<ResolveChart>>;
const chartEntries = JSON.parse(
  readFileSync(join(root, "src", "lib", "charts", "entries.generated.json"), "utf8"),
) as ChartRow[];
const chartBySlug = new Map(chartEntries.map((c) => [c.slug, c]));
const resolveChart: ResolveChart = (slug) => chartBySlug.get(slug);

/** Collect every .mdx under content/docs. */
function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (name.endsWith(".mdx")) acc.push(p);
  }
  return acc;
}

/** Strip frontmatter; return { title, body }. */
function parse(src: string): { title: string; body: string } {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?/);
  const front = m?.[1] ?? "";
  const body = m ? src.slice(m[0].length) : src;
  const title = (front.match(/^title:\s*(.+)$/m)?.[1] ?? "").replace(/^["']|["']$/g, "").trim();
  return { title, body };
}

/**
 * Map a content-relative path (no extension, e.g. `ai`, `charts/sparkline`,
 * `index`, `charts/index`) to its published mirror. Any `…/index` collapses to
 * its parent segment, matching how the Fumadocs source routes it (`charts/index`
 * → slug `["charts"]` → `/docs/charts`); top-level `index` is the docs root.
 * `targetRel` is the mirror path relative to `public/`, so a `public/` static
 * file shadows the dynamic `/docs/[[...slug]]` page at the same URL.
 */
export function mirrorFor(rel: string): { slug: string; url: string; targetRel: string } {
  const slug = rel === "index" ? "" : rel.replace(/\/index$/, "");
  return {
    slug,
    url: slug ? `/docs/${slug}` : "/docs",
    targetRel: slug ? `docs/${slug}.md` : "docs.md",
  };
}

function generate(): number {
  // Clean the output dir so a removed/renamed page never leaves a stale mirror.
  rmSync(outDir, { recursive: true, force: true });

  let count = 0;
  for (const file of walk(contentDir)) {
    const rel = relative(contentDir, file).replace(/\.mdx$/, "");
    const { url, targetRel } = mirrorFor(rel);
    const target = join(publicDir, targetRel);

    const { title, body } = parse(readFileSync(file, "utf8"));
    const md = `# ${title} (${url})\n\n${expandComponents(body, resolveChart)}\n`;

    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, md);
    count += 1;
  }
  return count;
}

// Only write when run as a script; importing (e.g. from the guard test) is pure.
if (import.meta.main) {
  const count = generate();
  console.log(`gen-md: wrote ${count} Markdown mirror${count === 1 ? "" : "s"} to public/docs/.`);
}
