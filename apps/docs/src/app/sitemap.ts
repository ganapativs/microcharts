import type { MetadataRoute } from "next";
import { source } from "@/lib/source";
import { docLastModified } from "@/lib/doc-dates";
import { abs } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["/", "/gallery", "/brand"].map((path) => ({
    url: abs(path),
    changeFrequency: "weekly" as const,
    priority: path === "/" ? 1 : 0.8,
  }));

  const docRoutes = source.getPages().map((page) => ({
    url: abs(page.url),
    lastModified: docLastModified(page.path),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...docRoutes];
}
