import { tool, type ToolSet } from "ai";
import { z } from "zod";
import { findChart } from "./tools/find";
import { getChart } from "./tools/get";
import { renderChart } from "./render-core";
import { dataParam } from "./schema";

/**
 * The same three capabilities as the MCP server, packaged as Vercel AI-SDK
 * tools for apps built with the `ai` package: `import { microchartsTools }` and
 * spread them into `streamText`/`generateText`. One core, two front doors.
 */
export const microchartsTools: ToolSet = {
  find_microchart: tool({
    description:
      "Find which microcharts chart type best answers a question about data " +
      '(e.g. "is it trending?", "error budget", "part to whole"). Returns ranked ' +
      "candidates with the reason each matched. Call this first when you know the " +
      "question but not the chart.",
    inputSchema: z.object({
      question: z.string().describe("What the data needs to show, in plain language."),
      dataShape: z
        .string()
        .optional()
        .describe('Optional filter, e.g. "number[]" or "{label,value}[]".'),
      limit: z.number().int().min(1).max(20).optional().describe("Max results (default 6)."),
    }),
    execute: async ({ question, dataShape, limit }) =>
      findChart(question, { ...(dataShape ? { dataShape } : {}), ...(limit ? { limit } : {}) }),
  }),

  get_microchart: tool({
    description:
      "Get the full wiring detail for one chart by slug: import paths, its props " +
      "plus the shared props, the data shape, best/avoid guidance, and a " +
      "copy-runnable example. Call after find_microchart to scaffold the component.",
    inputSchema: z.object({
      slug: z.string().describe('Chart slug, e.g. "sparkline" or "bullet".'),
    }),
    execute: async ({ slug }) => getChart(slug) ?? { error: `Unknown chart "${slug}".` },
  }),

  render_microchart: tool({
    description:
      "Render a chart to a finished, self-contained SVG string (styles embedded) " +
      "plus its generated alt text — usable in any surface that can't run React. " +
      "Pass the series as `data` and any other props (value, target, curve, color, " +
      "width) in `props`; check get_microchart for the exact shape.",
    inputSchema: z.object({
      type: z.string().describe('Chart slug, e.g. "sparkline".'),
      data: dataParam,
      props: z
        .record(z.string(), z.any())
        .optional()
        .describe("Other props (value, target, color, …)."),
      format: z
        .enum(["svg", "bare"])
        .optional()
        .describe("`svg` (default, self-contained) or `bare` (no embedded CSS)."),
    }),
    execute: async (input) => {
      try {
        return await renderChart(input);
      } catch (err) {
        return { error: (err as Error).message };
      }
    },
  }),
};
