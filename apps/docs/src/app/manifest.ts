import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

// Web app manifest — Next auto-links it as <link rel="manifest">. Rounds out the
// install/SEO surface; colours match the themeColor in layout.tsx.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — ${SITE.tagline}`,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0a0b0f",
    theme_color: "#0a0b0f",
    icons: [
      { src: "/brand/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon", type: "image/png", sizes: "180x180" },
    ],
  };
}
