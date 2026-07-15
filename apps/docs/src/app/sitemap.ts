import type { MetadataRoute } from "next";
import { source } from "@/lib/source";
import { docLastModified } from "@/lib/doc-dates";
import { abs } from "@/lib/site";

export const dynamic = "force-static";

/** The site exports with `trailingSlash: true` — sitemap URLs must match the
 *  canonical form or every entry 308-redirects on the host. */
function canonical(path: string): string {
  return abs(path.endsWith("/") ? path : `${path}/`);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["/", "/gallery", "/brand"].map((path) => ({
    url: canonical(path),
    changeFrequency: "weekly" as const,
    priority: path === "/" ? 1 : 0.8,
  }));

  const docRoutes = source.getPages().map((page) => ({
    url: canonical(page.url),
    lastModified: docLastModified(page.path),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...docRoutes];
}
