import { gitConfig } from "@/lib/shared";

/**
 * Where a chart's implementation lives in the repo — one folder per slug
 * (`geometry.ts` + `index.tsx` + `client.tsx` + tests), the layout CLAUDE.md
 * fixes for every chart. Repo-relative so the path can also be shown as text.
 */
export function chartSourcePath(slug: string): string {
  return `src/charts/${slug}`;
}

/** The same folder on GitHub, on the default branch. */
export function chartSourceUrl(slug: string): string {
  return `https://github.com/${gitConfig.user}/${gitConfig.repo}/tree/${gitConfig.branch}/${chartSourcePath(slug)}`;
}
