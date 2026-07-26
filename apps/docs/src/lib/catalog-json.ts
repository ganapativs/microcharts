/**
 * Builds the `/catalog.json` machine catalog. Pure (no Next runtime) so the
 * route handler AND the schema-conformance test build the exact same object —
 * `catalog.schema.json` (served from `/public`) is validated against this
 * output in CI, so the schema can never drift from what the route emits.
 *
 * The `$schema` here and the file in `public/` share one basename, asserted in
 * `catalog-schema.test.ts`.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CHARTS } from "./catalog";
import { SHARED_PROPS } from "./charts/shared-props";
import type { ChartEntry } from "./charts/types";
import { SITE, abs } from "./site";

/** Path (site-relative) of the JSON Schema that describes this document. */
export const CATALOG_SCHEMA_PATH = "/catalog.schema.json";

const CHARTS_DIR = resolve(process.cwd(), "../../src/charts");

interface CatalogProp {
  name: string;
  type: string;
  required: boolean;
  description: string;
  interactive?: true;
}

function toCatalogProp(p: {
  name: string;
  type: string;
  required: boolean;
  description: string;
  interactive?: boolean;
}): CatalogProp {
  return {
    name: p.name,
    type: p.type,
    required: p.required,
    description: p.description,
    ...(p.interactive ? { interactive: true as const } : {}),
  };
}

function clientSource(slug: string): string {
  const file = resolve(CHARTS_DIR, slug, "client.tsx");
  return existsSync(file) ? readFileSync(file, "utf8") : "";
}

/**
 * Which shared interactive props this chart's `/interactive` entry actually
 * accepts — derived from the registry (`picker` / `animates`) plus the client
 * source (`live`, lean `onSelect`). Agents must not assume every name in
 * `sharedProps` applies to every chart.
 */
function sharedInteractiveFor(c: ChartEntry): string[] | undefined {
  if (!c.interactiveImport) return undefined;
  const src = clientSource(c.slug);
  const names: string[] = [];
  if (c.animates !== false) names.push("animate");
  if (/\blive\??\s*:/.test(src)) names.push("live");
  if (c.picker !== false) {
    names.push("onActive", "onSelect", "selectedIndex", "defaultSelectedIndex");
  } else if (/\bonSelect\??\s*:/.test(src)) {
    names.push("onSelect");
  }
  // `readout` applies to any entry that paints the floating value chip. The
  // registry's `readout: false` flag is the authority (6 entries set it, because
  // the value is already on the glyph or the mark is a count you read by
  // counting); every other interactive entry paints a chip, including the
  // chip-carrying scalars (Bullet, Thermometer…) that have no picker.
  if (c.readout !== false) names.push("readout");
  return names;
}

/** The full catalog document, ready to `JSON.stringify`. */
export function buildCatalog() {
  return {
    $schema: abs(CATALOG_SCHEMA_PATH),
    package: SITE.pkg,
    homepage: SITE.url,
    // How to assemble a chart's full prop surface — agents must not guess.
    howToRead:
      "Full API for a chart = sharedProps (grammar, layout, i18n) + charts[n].props (chart-specific). " +
      "Interactive shared callbacks/flags apply ONLY when listed in charts[n].sharedInteractive " +
      "(empty/missing ⇒ no shared interactive props). Chart-specific interactive props stay in charts[n].props " +
      "with interactive:true (e.g. onWindowChange). Prefer docs URL + this file over memorized APIs.",
    // The shared grammar — props whose name means the same thing on every
    // chart, plus layout, i18n, and the shared interactive props (`animate`,
    // `live`, picker callbacks). Listed once here so per-chart `props` carry
    // only chart-specific knobs; use `sharedInteractive` to know which
    // interactive shared names apply to a given chart.
    // The same catalog, callable. An agent that can spawn an MCP server should
    // prefer it over re-reading this file: it answers "which chart" and renders
    // one, instead of handing over the whole API to reason about.
    mcp: {
      package: "@microcharts/mcp",
      command: "npx -y @microcharts/mcp",
      transport: "stdio" as const,
      docs: abs("/docs/mcp"),
      tools: ["find_microchart", "get_microchart", "render_microchart"],
    },
    sharedProps: SHARED_PROPS.map(toCatalogProp),
    charts: CHARTS.map((c) => {
      const sharedInteractive = sharedInteractiveFor(c);
      return {
        name: c.name,
        slug: c.slug,
        status: c.status === "stable" ? ("stable" as const) : ("planned" as const),
        collection: c.collection,
        tagline: c.tagline,
        docs: abs(`/docs/charts/${c.slug}`),
        staticImport: c.staticImport,
        ...(c.interactiveImport ? { interactiveImport: c.interactiveImport } : {}),
        ...(sharedInteractive
          ? {
              picker: c.picker !== false,
              animates: c.animates !== false,
              sharedInteractive,
            }
          : {}),
        dataShape: c.dataShape,
        primaryEncoding: c.encoding.channel,
        precision: c.encoding.precision,
        nodeBudget: c.nodeBudget,
        bestFor: c.bestFor,
        avoidFor: c.avoidFor,
        props: c.props.map(toCatalogProp),
        examples: [{ title: c.example.title, code: c.example.code }],
      };
    }),
  };
}
