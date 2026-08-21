/**
 * The OpenAPI description served at `/openapi.json`.
 *
 * microcharts.dev is a static site, so its "API" is the set of documents it
 * publishes for machines: the chart catalog, the per-chart slices of it, the
 * search index, the `llms.txt` pair, and the Markdown twin every page carries.
 * They were always fetchable; without a description an agent had to be told
 * they exist. This is that description, and it is built from the same registry
 * the endpoints are built from — the chart slugs below are the shipped ones, so
 * the spec cannot describe a chart the site does not serve.
 *
 * Read-only by construction: every operation is a GET, there is no auth, and
 * `openapi.test.ts` asserts as much alongside the structural rules (unique
 * operation ids, a description everywhere, a schema on every response).
 */
import { CATALOG_SCHEMA_PATH } from "./catalog-json";
import { STABLE_CHARTS } from "./catalog";
import { SITE, abs } from "./site";

/** The published catalog schema, and JSON-pointer refs into its subschemas. */
const CATALOG_SCHEMA = abs(CATALOG_SCHEMA_PATH);
const CHART_ENTRY_REF = `${CATALOG_SCHEMA}#/properties/charts/items`;
const SHARED_PROPS_REF = `${CATALOG_SCHEMA}#/properties/sharedProps`;

const PROBLEM_CONTENT = {
  "application/problem+json": { schema: { $ref: "#/components/schemas/Problem" } },
  "text/markdown": {
    schema: { type: "string", description: "The same error as a short Markdown note." },
  },
} as const;

/** A GET that answers with one media type and one schema. */
function ok(description: string, mediaType: string, schema: unknown) {
  return { "200": { description, content: { [mediaType]: { schema } } } };
}

export function buildOpenApi() {
  const slugs = STABLE_CHARTS.map((c) => c.slug).sort();
  const exampleSlug = slugs.includes("sparkline") ? "sparkline" : slugs[0];

  return {
    openapi: "3.1.1",
    info: {
      title: "microcharts.dev",
      version: "1.0.0",
      summary: "Read-only endpoints describing the microcharts chart catalog and documentation.",
      description: [
        `Every endpoint here is a static document served from a CDN. All of them are GET, none of them need a key, and none of them rate-limit.`,
        "",
        "Two conventions apply site-wide and are worth knowing before you read the paths:",
        "",
        `- **Markdown twins.** Every page has one. Add \`.md\` to the URL, or send \`Accept: text/markdown\` to the page URL itself, and you get the same content as Markdown. Responses carry \`Vary: Accept, Accept-Encoding\`.`,
        `- **Errors you can parse.** A 404, 405 or 406 answers with RFC 9457 problem details on this API surface, and with a short Markdown note anywhere else. Each one names where to look next.`,
        "",
        `To install the library itself, see ${abs("/docs/quickstart")}. To let a model call microcharts directly, run the MCP server: \`npx -y @microcharts/mcp\`.`,
      ].join("\n"),
      contact: {
        name: `${SITE.name} issues`,
        url: `${SITE.repo}/issues`,
        email: SITE.email,
      },
      license: { name: "MIT", identifier: "MIT" },
    },
    externalDocs: { description: "Documentation", url: abs("/docs") },
    servers: [{ url: SITE.url, description: "Production" }],
    tags: [
      { name: "Catalog", description: "The chart types, their props, and their data shapes." },
      { name: "Documentation", description: "Pages and their Markdown twins." },
      { name: "Discovery", description: "Files that map the site for agents and crawlers." },
    ],
    paths: {
      "/api/charts.json": {
        get: {
          operationId: "listCharts",
          tags: ["Catalog"],
          summary: "List every chart type",
          description:
            "One line per chart — name, slug, collection, tagline — plus the URLs that expand it. Fetch this to choose a chart, then fetch that chart's document for its props.",
          responses: ok("Every chart type the package ships.", "application/json", {
            $ref: "#/components/schemas/ChartIndex",
          }),
        },
      },
      "/api/charts/{slug}.json": {
        get: {
          operationId: "getChart",
          tags: ["Catalog"],
          summary: "Get one chart's full API surface",
          description:
            "The chart's catalog entry, its shared props, and the instructions for combining the two. Self-contained: this is everything needed to write a correct chart, in about 8 kB rather than the 290 kB of the full catalog.",
          parameters: [{ $ref: "#/components/parameters/ChartSlug" }],
          responses: {
            ...ok("The chart's props, imports, data shape, and caveats.", "application/json", {
              $ref: "#/components/schemas/ChartDocument",
            }),
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
      },
      "/catalog.json": {
        get: {
          operationId: "getCatalog",
          tags: ["Catalog"],
          summary: "Get the whole catalog in one document",
          description: `All ${slugs.length} charts with their props, imports, data shapes and caveats, plus the shared prop grammar. Prefer the per-chart endpoint unless you need the whole set.`,
          responses: ok("The full catalog.", "application/json", { $ref: CATALOG_SCHEMA }),
        },
      },
      "/catalog.schema.json": {
        get: {
          operationId: "getCatalogSchema",
          tags: ["Catalog"],
          summary: "Get the catalog's JSON Schema",
          description: "The contract `/catalog.json` validates against, in CI. Draft 2020-12.",
          responses: ok("JSON Schema for the catalog.", "application/schema+json", {
            type: "object",
          }),
        },
      },
      "/api/search": {
        get: {
          operationId: "getSearchIndex",
          tags: ["Discovery"],
          summary: "Get the documentation search index",
          description:
            "The prebuilt full-text index the docs site searches in the browser. It is a whole index, not a query endpoint: fetch it once and search it locally. For a one-off lookup, `llms.txt` is smaller.",
          responses: ok("Serialized search index.", "application/json", { type: "object" }),
        },
      },
      "/llms.txt": {
        get: {
          operationId: "getLlmsTxt",
          tags: ["Discovery"],
          summary: "Get the agent index of this site",
          description:
            "The llmstxt.org index: what the package is, every guide and chart page as a Markdown link, and the things the library deliberately does not do. Start here when mapping the site.",
          responses: ok("Markdown index.", "text/plain", { type: "string" }),
        },
      },
      "/llms-full.txt": {
        get: {
          operationId: "getLlmsFull",
          tags: ["Discovery"],
          summary: "Get the entire documentation as one file",
          description:
            "Every documentation page concatenated as Markdown, around 880 kB. Use it to load the whole corpus at once; use `llms.txt` to navigate.",
          responses: ok("The full documentation text.", "text/plain", { type: "string" }),
        },
      },
      "/agent-setup.md": {
        get: {
          operationId: "getAgentSetup",
          tags: ["Discovery"],
          summary: "Get the setup prompt for a coding agent",
          description:
            "A paste-and-run prompt that installs the package, wires the stylesheet, and records the conventions an agent needs to write charts that compile.",
          responses: ok("Setup instructions.", "text/markdown", { type: "string" }),
        },
      },
      "/openapi.json": {
        get: {
          operationId: "getOpenApiDocument",
          tags: ["Discovery"],
          summary: "Get this description",
          description:
            "This document. Linked from every HTML and JSON response through the RFC 8631 `service-desc` link relation.",
          responses: ok("This OpenAPI document.", "application/json", { type: "object" }),
        },
      },
      "/.well-known/mcp/server-card.json": {
        get: {
          operationId: "getMcpServerCard",
          tags: ["Discovery"],
          summary: "Get the MCP server card",
          description:
            "How to run the microcharts MCP server, as the MCP registry's `server.json` manifest. Served at the path MCP's draft server-card proposal uses, which is where agents look; the document itself follows the released registry schema. The server is stdio, so a client spawns `npx -y @microcharts/mcp` rather than connecting over HTTP.",
          responses: ok("MCP server card.", "application/json", {
            $ref: "#/components/schemas/McpServerCard",
          }),
        },
      },
      "/": {
        get: {
          operationId: "getHomePage",
          tags: ["Documentation"],
          summary: "Get the home page, as HTML or Markdown",
          description:
            "Sends `Accept: text/markdown` and you get the Markdown twin from this same URL, which is also fetchable directly at `/index.md`. Every page route on this site behaves this way.",
          parameters: [{ $ref: "#/components/parameters/Accept" }],
          responses: {
            "200": {
              description: "The page, in the representation you asked for.",
              headers: {
                Vary: {
                  description: "Always includes `Accept`, so caches key on it.",
                  schema: { type: "string", examples: ["Accept, Accept-Encoding"] },
                },
              },
              content: {
                "text/html": { schema: { type: "string" } },
                "text/markdown": { schema: { type: "string" } },
              },
            },
          },
        },
      },
      "/docs/charts/{slug}": {
        get: {
          operationId: "getChartPage",
          tags: ["Documentation"],
          summary: "Get a chart's documentation page",
          description:
            "The human page for one chart. Send `Accept: text/markdown` for the Markdown twin, or fetch `/docs/charts/{slug}.md` directly.",
          parameters: [
            { $ref: "#/components/parameters/ChartSlug" },
            { $ref: "#/components/parameters/Accept" },
          ],
          responses: {
            "200": {
              description: "The page, in the representation you asked for.",
              content: {
                "text/html": { schema: { type: "string" } },
                "text/markdown": { schema: { type: "string" } },
              },
            },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
      },
      "/docs/charts/{slug}.md": {
        get: {
          operationId: "getChartMarkdown",
          tags: ["Documentation"],
          summary: "Get a chart's documentation as Markdown",
          description:
            "The Markdown twin at its own URL, for clients that would rather not negotiate. Same bytes as `Accept: text/markdown` on the page.",
          parameters: [{ $ref: "#/components/parameters/ChartSlug" }],
          responses: {
            ...ok("The page as Markdown.", "text/markdown", { type: "string" }),
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
      },
      "/sitemap.xml": {
        get: {
          operationId: "getSitemap",
          tags: ["Discovery"],
          summary: "Get every indexable URL",
          description:
            "An XML sitemap with a real `lastmod` per URL, taken from the source file's last commit rather than build time.",
          responses: ok("XML sitemap.", "application/xml", { type: "string" }),
        },
      },
      "/rss.xml": {
        get: {
          operationId: "getFeed",
          tags: ["Discovery"],
          summary: "Get the release feed",
          description:
            "Every published version of the package as an Atom feed, newest first, with the changelog entry for each one. Poll this to notice a release without watching the repository.",
          responses: ok("Atom feed.", "application/atom+xml", { type: "string" }),
        },
      },
    },
    components: {
      parameters: {
        ChartSlug: {
          name: "slug",
          in: "path",
          required: true,
          description: "The chart's slug, as listed by `listCharts`.",
          schema: { type: "string", enum: slugs, examples: [exampleSlug] },
        },
        Accept: {
          name: "Accept",
          in: "header",
          required: false,
          description:
            "`text/markdown` returns the Markdown twin; anything else, including `*/*`, returns HTML.",
          schema: {
            type: "string",
            enum: ["text/html", "text/markdown"],
            default: "text/html",
            examples: ["text/markdown"],
          },
        },
      },
      responses: {
        NotFound: {
          description:
            "Nothing is published at this URL. The body names the closest matching URLs and the site's entry points.",
          content: PROBLEM_CONTENT,
        },
        MethodNotAllowed: {
          description: "This site is read-only. The `Allow` header lists what it answers to.",
          headers: {
            Allow: { description: "Supported methods.", schema: { type: "string" } },
          },
          content: PROBLEM_CONTENT,
        },
      },
      schemas: {
        Problem: {
          type: "object",
          title: "Problem",
          description:
            "RFC 9457 problem details, extended with the members an agent acts on: a stable `code`, ordered `hints`, entry-point `links`, and `suggestions` — real URLs on this site that resemble the one requested.",
          required: ["type", "title", "status", "detail", "code", "hints", "links"],
          properties: {
            type: { type: "string", format: "uri", description: "Where this error is documented." },
            title: { type: "string", description: "Short, human-readable summary." },
            status: { type: "integer", examples: [404] },
            detail: { type: "string", description: "What happened, in one or two sentences." },
            instance: { type: "string", description: "The path that produced this error." },
            code: {
              type: "string",
              enum: ["not_found", "method_not_allowed", "not_acceptable"],
              description: "Stable, matchable error code.",
            },
            error: {
              type: "object",
              description: "The same code and message, under the keys most SDKs reach for first.",
              required: ["code", "message"],
              properties: { code: { type: "string" }, message: { type: "string" } },
            },
            hints: {
              type: "array",
              description: "What to do next, most useful first.",
              items: { type: "string" },
            },
            suggestions: {
              type: "array",
              description: "Real URLs on this site that look like the one requested.",
              items: { type: "string", format: "uri" },
            },
            links: {
              type: "array",
              description: "Entry points that cover the rest of the site.",
              items: {
                type: "object",
                required: ["rel", "title", "href"],
                properties: {
                  rel: { type: "string" },
                  title: { type: "string" },
                  href: { type: "string", format: "uri" },
                },
              },
            },
          },
        },
        ChartIndex: {
          type: "object",
          title: "ChartIndex",
          description: "Every chart type in one line each.",
          required: ["package", "count", "charts"],
          properties: {
            package: { type: "string", examples: [SITE.pkg] },
            homepage: { type: "string", format: "uri" },
            catalog: { type: "string", format: "uri", description: "The full catalog document." },
            count: { type: "integer", description: "How many chart types ship." },
            charts: {
              type: "array",
              items: {
                type: "object",
                required: ["name", "slug", "collection", "tagline", "api", "docs", "markdown"],
                properties: {
                  name: { type: "string", examples: ["Sparkline"] },
                  slug: { type: "string", enum: slugs },
                  status: { type: "string", enum: ["stable", "planned"] },
                  collection: { type: "string" },
                  tagline: { type: "string" },
                  api: { type: "string", format: "uri", description: "This chart as JSON." },
                  docs: { type: "string", format: "uri", description: "This chart's page." },
                  markdown: {
                    type: "string",
                    format: "uri",
                    description: "That page as Markdown.",
                  },
                },
              },
            },
          },
        },
        ChartDocument: {
          type: "object",
          title: "ChartDocument",
          description:
            "One chart's full API surface. A chart's props are `sharedProps` plus `chart.props`; `howToRead` states how they combine.",
          required: ["package", "howToRead", "sharedProps", "chart"],
          properties: {
            package: { type: "string", examples: [SITE.pkg] },
            homepage: { type: "string", format: "uri" },
            howToRead: { type: "string" },
            api: { type: "string", format: "uri" },
            docs: { type: "string", format: "uri" },
            markdown: { type: "string", format: "uri" },
            sharedProps: { $ref: SHARED_PROPS_REF },
            chart: { $ref: CHART_ENTRY_REF },
          },
        },
        McpServerCard: {
          type: "object",
          title: "McpServerCard",
          description: "An MCP registry `server.json` document.",
          required: ["name", "version", "packages"],
          properties: {
            $schema: { type: "string", format: "uri" },
            name: { type: "string", examples: ["io.github.ganapativs/microcharts"] },
            description: { type: "string" },
            version: { type: "string" },
            websiteUrl: { type: "string", format: "uri" },
            repository: { type: "object" },
            packages: {
              type: "array",
              description: "How to run the server. One npm package, over stdio.",
              items: { type: "object" },
            },
          },
        },
      },
    },
  };
}
