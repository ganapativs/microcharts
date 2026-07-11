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
import { expandComponents } from "../src/lib/md-transform.ts";

const root = resolve(import.meta.dirname, "..");
const contentDir = join(root, "content", "docs");
const outDir = join(root, "public", "docs");

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

// Clean the output dir so a removed/renamed page never leaves a stale mirror.
rmSync(outDir, { recursive: true, force: true });

let count = 0;
for (const file of walk(contentDir)) {
  const rel = relative(contentDir, file).replace(/\.mdx$/, ""); // e.g. "ai" | "charts/sparkline" | "index"
  const isIndex = rel === "index";
  const slug = isIndex ? "" : rel;
  const url = slug ? `/docs/${slug}` : "/docs";
  const target = slug ? join(outDir, `${slug}.md`) : join(root, "public", "docs.md");

  const { title, body } = parse(readFileSync(file, "utf8"));
  const md = `# ${title} (${url})\n\n${expandComponents(body)}\n`;

  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, md);
  count += 1;
}

console.log(`gen-md: wrote ${count} Markdown mirror${count === 1 ? "" : "s"} to public/docs/.`);
