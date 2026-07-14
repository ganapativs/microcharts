/** Deployed site identity. Override origin via `NEXT_PUBLIC_SITE_URL`. */
const RAW_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://microcharts.dev";

export const SITE = {
  /** Absolute origin, no trailing slash. */
  url: RAW_URL.replace(/\/+$/, ""),
  name: "microcharts",
  tagline: "Word-sized charts for React.",
  description:
    "Word-sized charts for React. Zero runtime dependencies, 0.9–3.6 kB gzip each, accessible by default, and server-component safe. Sparklines, bars, deltas, bullets, and activity grids that read at a glance.",
  pkg: "@microcharts/react",
  repo: "https://github.com/ganapativs/microcharts",
  npm: "https://www.npmjs.com/package/@microcharts/react",
  author: "Ganapati V S",
  authorUrl: "https://meetguns.com",
  authorX: "https://x.com/ganapativs",
  authorXHandle: "@ganapativs",
  authorGithub: "https://github.com/ganapativs",
  ogImageAlt: "microcharts — tiny accessible React charts rendered inline",
} as const;

/** Build an absolute URL for a site-relative path. */
export function abs(path: string): string {
  return new URL(path, SITE.url).toString();
}
