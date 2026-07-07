/**
 * Single source of truth for the deployed site identity.
 *
 * The docs domain is not registered yet (plan/20 hardcodes `microcharts.dev`).
 * We thread it through this one constant so it is swappable via
 * `NEXT_PUBLIC_SITE_URL` at build time — never scatter the literal (handoff ⚠).
 */
const RAW_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://microcharts.dev";

export const SITE = {
  /** Absolute origin, no trailing slash. */
  url: RAW_URL.replace(/\/+$/, ""),
  name: "microcharts",
  /** One-sentence thesis (plan/00, plan/20 home intent). */
  tagline: "Word-sized charts for React.",
  description:
    "Word-sized charts for React. Zero runtime dependencies, ~1 kB each, accessible by default, and server-component safe. Sparklines, bars, deltas, bullets, and activity grids that read at a glance.",
  pkg: "@microcharts/react",
  repo: "https://github.com/ganapativs/microcharts",
  npm: "https://www.npmjs.com/package/@microcharts/react",
  author: "Ganapati V S",
  authorUrl: "https://meetguns.com",
  authorX: "https://x.com/ganapativs",
  authorXHandle: "@ganapativs",
  ogImageAlt: "microcharts — tiny accessible React charts rendered inline",
} as const;

/** Build an absolute URL for a site-relative path. */
export function abs(path: string): string {
  return new URL(path, SITE.url).toString();
}
