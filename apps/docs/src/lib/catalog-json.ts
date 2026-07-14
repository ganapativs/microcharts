/**
 * Builds the `/catalog.json` machine catalog. Pure (no Next runtime) so the
 * route handler AND the schema-conformance test build the exact same object —
 * `catalog.schema.json` (served from `/public`) is validated against this
 * output in CI, so the schema can never drift from what the route emits.
 *
 * The `$schema` here and the file in `public/` share one basename, asserted in
 * `catalog-schema.test.ts`.
 */
import { CHARTS } from "./catalog";
import { SHARED_PROPS } from "./charts/shared-props";
import { SITE, abs } from "./site";

/** Path (site-relative) of the JSON Schema that describes this document. */
export const CATALOG_SCHEMA_PATH = "/catalog.schema.json";

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

/** The full catalog document, ready to `JSON.stringify`. */
export function buildCatalog() {
  return {
    $schema: abs(CATALOG_SCHEMA_PATH),
    package: SITE.pkg,
    homepage: SITE.url,
    // The shared grammar — props whose name means the same thing on every
    // chart, plus layout, i18n, and the shared interactive props (`animate`,
    // `live`). Listed once here so per-chart `props` carry only chart-specific
    // knobs; a consumer reads both to know the full surface of any chart.
    sharedProps: SHARED_PROPS.map(toCatalogProp),
    charts: CHARTS.map((c) => ({
      name: c.name,
      slug: c.slug,
      status: c.status === "stable" ? ("stable" as const) : ("planned" as const),
      docs: abs(`/docs/charts/${c.slug}`),
      staticImport: c.staticImport,
      ...(c.interactiveImport ? { interactiveImport: c.interactiveImport } : {}),
      dataShape: c.dataShape,
      primaryEncoding: c.encoding.channel,
      bestFor: c.bestFor,
      avoidFor: c.avoidFor,
      props: c.props.map(toCatalogProp),
      examples: [{ title: c.example.title, code: c.example.code }],
    })),
  };
}
