import type { MetadataRoute } from "next";
import { source } from "@/lib/source";
import { docLastModified, fileLastModified } from "@/lib/doc-dates";
import { abs } from "@/lib/site";
import { SHOWCASE } from "@/lib/showcase";

const HOME = "apps/docs/src/app/(home)";
const LANDING = "apps/docs/src/app/(landing)";

export const dynamic = "force-static";

/** Match `trailingSlash: false` and per-page `<link rel="canonical">`. Trailing
 *  slashes here would disagree with canonicals and dilute crawl signals. */
function loc(path: string): string {
  if (path === "/") return abs("/");
  return abs(path.endsWith("/") ? path.slice(0, -1) : path);
}

export default function sitemap(): MetadataRoute.Sitemap {
  // Per-route lastmod from the source file's real git-commit date, so an
  // unchanged rebuild/redeploy doesn't bump `<lastmod>` (build-time `now` did).
  const staticRoutes = [
    { path: "/", priority: 1, changeFrequency: "weekly" as const, src: `${LANDING}/page.tsx` },
    {
      path: "/charts",
      priority: 0.9,
      changeFrequency: "weekly" as const,
      src: `${HOME}/charts/page.tsx`,
    },
    {
      path: "/charts/core",
      priority: 0.85,
      changeFrequency: "weekly" as const,
      src: `${HOME}/charts/collections.ts`,
    },
    {
      path: "/charts/decision",
      priority: 0.85,
      changeFrequency: "weekly" as const,
      src: `${HOME}/charts/collections.ts`,
    },
    {
      path: "/charts/expressive",
      priority: 0.85,
      changeFrequency: "weekly" as const,
      src: `${HOME}/charts/collections.ts`,
    },
    {
      path: "/charts/frontier",
      priority: 0.85,
      changeFrequency: "weekly" as const,
      src: `${HOME}/charts/collections.ts`,
    },
    {
      path: "/docs",
      priority: 0.9,
      changeFrequency: "weekly" as const,
      src: "apps/docs/src/app/docs/[[...slug]]/page.tsx",
    },
    {
      path: "/examples",
      priority: 0.8,
      changeFrequency: "weekly" as const,
      src: `${HOME}/examples/page.tsx`,
    },
    ...SHOWCASE.map((a) => ({
      path: `/examples/${a.slug}`,
      priority: 0.7,
      changeFrequency: "monthly" as const,
      src: "apps/docs/src/lib/showcase.ts",
    })),
    {
      path: "/brand",
      priority: 0.5,
      changeFrequency: "monthly" as const,
      src: `${HOME}/brand/page.tsx`,
    },
  ].map((r) => ({
    url: loc(r.path),
    lastModified: fileLastModified(r.src),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const seen = new Set(staticRoutes.map((r) => r.url));
  const docRoutes = source
    .getPages()
    .map((page) => ({
      url: loc(page.url),
      lastModified: docLastModified(page.path),
      changeFrequency: "weekly" as const,
      priority: page.url.startsWith("/docs/charts/") ? 0.8 : 0.7,
    }))
    .filter((r) => !seen.has(r.url));

  return [...staticRoutes, ...docRoutes];
}
