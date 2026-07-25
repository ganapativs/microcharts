import { z } from "zod";

/**
 * The `data` parameter of `render_microchart`, shared by the MCP tool and its
 * AI-SDK twin so the two advertise one contract.
 *
 * Every chart takes its own data shape, so this parameter is genuinely
 * polymorphic — but `z.any()` is the wrong way to say that: it emits `{}` with
 * no `type` at all, which reads as "unknown field type" to a client building a
 * form (or a prompt) from the schema, and tells a model nothing.
 *
 * The honest description is the union the catalog actually uses: a series
 * (`number[]`, `(number | null)[]`, `{ label, value }[]`, …) or, for the handful
 * of charts whose data is keyed rather than ordered (`{ plan, actual }`, …), an
 * object. Scalar charts omit it and pass their value through `props`. Element
 * types stay open on purpose — the per-chart shape is validated in
 * `render-core`, which can name the chart and point at `get_microchart`.
 */
export const dataParam = z
  .union([z.array(z.unknown()), z.record(z.string(), z.unknown())])
  .optional()
  .describe(
    "Primary series (array), or a keyed object for charts that take one; omit for scalar charts.",
  );
