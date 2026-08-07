import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { findChart } from "./tools/find";
import { getChart } from "./tools/get";
import { renderChart } from "./render-core";
import { catalog, LIBRARY_VERSION } from "./catalog";
import { dataParam } from "./schema";
import { AGENT_SETUP } from "./assets.generated";
import { MCP_VERSION } from "./version";

/** Output schemas — SDK validates `structuredContent` against these. */
const chartProp = z.object({
  name: z.string(),
  type: z.string(),
  required: z.boolean(),
  description: z.string(),
  interactive: z.boolean().optional(),
});

const findOutput = {
  results: z.array(
    z.object({
      slug: z.string(),
      name: z.string(),
      tagline: z.string(),
      dataShape: z.string(),
      why: z.string().describe("The bestFor phrase or tagline that matched."),
    }),
  ),
};

const getOutput = {
  slug: z.string(),
  name: z.string(),
  tagline: z.string(),
  status: z.enum(["stable", "planned"]),
  dataShape: z.string(),
  encoding: z.object({ channel: z.string(), precision: z.string() }),
  staticImport: z.string(),
  interactiveImport: z.string().optional(),
  maxWidth: z
    .number()
    .optional()
    .describe(
      "Authored maximum width prop, viewBox units. Past it the geometry stops scaling and the extra box is whitespace — scale with CSS instead. Absent on charts sized by cell, by content, or by CSS.",
    ),
  maxHeight: z.number().optional().describe("Authored maximum height prop, viewBox units."),
  gotchas: z
    .array(z.string())
    .optional()
    .describe(
      "Behavior no prop description carries: documented caps, inputs the component derives, how format meets the chart's own sign or unit, and sizing knobs that are not width/height. Read before writing props.",
    ),
  bestFor: z.array(z.string()),
  avoidFor: z.array(z.string()),
  props: z.array(chartProp),
  sharedProps: z.array(chartProp),
  example: z.object({ title: z.string(), code: z.string() }),
  sample: z
    .record(z.string(), z.unknown())
    .optional()
    .describe("Ready-to-render props — pass straight to render_microchart."),
};

const renderOutput = {
  svg: z.string(),
  mimeType: z.enum(["image/svg+xml", "text/html"]),
  summary: z.string().describe("The chart's generated accessible name — its alt text."),
  width: z.number(),
  height: z.number(),
  library: z.string(),
};

export function createServer(): McpServer {
  const server = new McpServer(
    { name: "microcharts", version: MCP_VERSION },
    {
      instructions:
        "microcharts renders word-sized charts. Use find_microchart to pick a " +
        "chart for a question, get_microchart to see its props and a runnable " +
        "example, and render_microchart to get a finished SVG with alt text. " +
        `This server snapshots @microcharts/react ${LIBRARY_VERSION}.`,
    },
  );

  server.registerTool(
    "find_microchart",
    {
      title: "Find a chart by question",
      description:
        "Rank microcharts chart types against a plain-language question about data " +
        '("is it trending?", "error budget", "part to whole"). Returns candidates ' +
        "with the reason each matched. Start here when you know the question, not the chart.",
      inputSchema: {
        question: z.string().describe("What the data needs to show, in plain language."),
        dataShape: z.string().optional().describe('Optional filter, e.g. "number[]".'),
        limit: z.number().int().min(1).max(20).optional().describe("Max results (default 6)."),
      },
      outputSchema: findOutput,
    },
    ({ question, dataShape, limit }) => {
      const results = findChart(question, {
        ...(dataShape ? { dataShape } : {}),
        ...(limit ? { limit } : {}),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        structuredContent: { results },
      };
    },
  );

  server.registerTool(
    "get_microchart",
    {
      title: "Get a chart's props + example",
      description:
        "Full wiring detail for one chart by slug: import paths, its props plus the " +
        "shared props, data shape, best/avoid guidance, a copy-runnable example, and " +
        "`sample` — the example as JSON props you can pass straight to render_microchart.",
      inputSchema: { slug: z.string().describe('Chart slug, e.g. "sparkline".') },
      outputSchema: getOutput,
    },
    ({ slug }) => {
      const result = getChart(slug);
      if (!result)
        return { content: [{ type: "text", text: `Unknown chart "${slug}".` }], isError: true };
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        structuredContent: result as unknown as Record<string, unknown>,
      };
    },
  );

  server.registerTool(
    "render_microchart",
    {
      title: "Render a chart to SVG",
      description:
        "Render a chart to a finished, self-contained SVG (styles embedded) plus its " +
        "generated alt text — for surfaces that can't run React. Pass the series as " +
        "`data`; put other props (value, target, curve, color, width) in `props`. Each " +
        "chart takes its own data shape — get_microchart returns a valid `sample` to adapt.",
      inputSchema: {
        type: z.string().describe('Chart slug, e.g. "sparkline".'),
        data: dataParam,
        props: z
          .record(z.string(), z.any())
          .optional()
          .describe("Other props (value, target, color, …)."),
        format: z.enum(["svg", "bare"]).optional().describe("`svg` (default) or `bare`."),
      },
      outputSchema: renderOutput,
    },
    async (input) => {
      try {
        const result = await renderChart(input);
        return {
          content: [
            { type: "text", text: result.svg },
            {
              type: "text",
              text: `${result.summary} (${result.mimeType}, ${result.width}×${result.height})`,
            },
          ],
          structuredContent: result as unknown as Record<string, unknown>,
        };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.registerResource(
    "catalog",
    "microcharts://catalog",
    {
      title: "microcharts catalog",
      description: "Every chart type with metadata, props, and the library version stamp.",
      mimeType: "application/json",
    },
    (uri) => ({
      contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(catalog) }],
    }),
  );

  server.registerResource(
    "agent-setup",
    "microcharts://agent-setup",
    {
      title: "microcharts agent setup",
      description: "The canonical prompt for wiring microcharts into a codebase.",
      mimeType: "text/markdown",
    },
    (uri) => ({
      contents: [{ uri: uri.href, mimeType: "text/markdown", text: AGENT_SETUP }],
    }),
  );

  return server;
}
