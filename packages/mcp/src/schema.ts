import { z } from "zod";

/**
 * `render_microchart` `data` param — shared MCP + AI-SDK schema.
 * Union (array | record) not `z.any()` so clients get a typed field; per-chart
 * validation stays in `render-core` / `get_microchart`.
 */
export const dataParam = z
  .union([z.array(z.unknown()), z.record(z.string(), z.unknown())])
  .optional()
  .describe(
    "Primary series (array), or a keyed object for charts that take one; omit for scalar charts.",
  );
