import { CATALOG } from "./docs-facts";
import { SITE } from "./site";

/** High-intent phrases for `<meta name="keywords">` (Bing/others; Google ignores). */
export const SEO_KEYWORDS = [
  "react charts",
  "react sparkline",
  "sparkline react",
  "react sparklines",
  "sparkline chart",
  "microcharts",
  "microchart",
  "micro charts",
  "micro charts react",
  "tiny charts",
  "tiny charts react",
  "small charts react",
  "inline charts",
  "inline charts react",
  "inline sparkline",
  "kpi charts react",
  "tiny svg charts",
  "accessible charts",
  "rsc charts",
  "server component charts",
  "zero dependency chart library",
  "svg charts react",
  "word-sized charts",
  "dataviz react",
] as const;

export function chartSeoTitle(name: string): string {
  return `${name} React Chart`;
}

export function chartSeoDescription(name: string, pageDesc: string, tagline?: string): string {
  const base =
    pageDesc.trim() || tagline?.trim() || `${name} — tiny accessible SVG chart for React.`;
  const suffix = " Zero-dependency React microchart.";
  if (base.length >= 140) return base;
  return `${base}${suffix}`;
}

export function chartsIndexDescription(): string {
  return `Browse all ${CATALOG.total} micro charts for React — tiny sparklines, bars, bullets, heat strips, and more. Small accessible SVG charts from ${SITE.pkg}, searchable by collection.`;
}
