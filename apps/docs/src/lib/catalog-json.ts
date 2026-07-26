/**
 * Builds `/catalog.json`. Pure (no Next runtime) — route handler and
 * schema-conformance test share this output; `catalog.schema.json` is gated in CI.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CHARTS } from "./catalog";
import { SHARED_PROPS } from "./charts/shared-props";
import type { ChartEntry } from "./charts/types";
import { SITE, abs } from "./site";

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

/** Which shared interactive props this chart accepts — from registry + client source. */
function sharedInteractiveFor(c: ChartEntry): string[] | undefined {
  if (!c.interactiveImport) return undefined;
  const src = clientSource(c.slug);
  const names: string[] = [];
  if (c.animates !== false) names.push("animate");
  if (/\blive\??\s*:/.test(src)) names.push("live");
  if (c.picker !== false) {
    names.push("onActive", "onSelect", "selectedIndex", "defaultSelectedIndex");
  } else {
    if (/\bonActive\??\s*:/.test(src)) names.push("onActive");
    if (/\bonSelect\??\s*:/.test(src)) names.push("onSelect");
  }
  if (c.readout !== false) names.push("readout");
  return names;
}

export function buildCatalog() {
  return {
    $schema: abs(CATALOG_SCHEMA_PATH),
    package: SITE.pkg,
    homepage: SITE.url,
    howToRead:
      "Full API for a chart = sharedProps (grammar, layout, i18n) + charts[n].props (chart-specific). " +
      "Interactive shared callbacks/flags apply ONLY when listed in charts[n].sharedInteractive " +
      "(empty/missing ⇒ no shared interactive props). Chart-specific interactive props stay in charts[n].props " +
      "with interactive:true (e.g. onWindowChange). Prefer docs URL + this file over memorized APIs.",
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
