/**
 * `@microcharts/mcp` public core. The stdio server lives in the `bin`
 * (`microcharts-mcp`); this entry exports the underlying functions. The Vercel
 * AI-SDK tools live on the `@microcharts/mcp/ai-sdk` subpath so importing the
 * core never pulls in the `ai` peer dependency.
 */
export { findChart } from "./tools/find";
export type { FindOptions, FindResult } from "./tools/find";
export { getChart } from "./tools/get";
export type { GetResult } from "./tools/get";
export { renderChart } from "./render-core";
export type { RenderFormat, RenderInput, RenderResult } from "./render-core";
export { createServer } from "./server";
export { catalog, CHARTS, STABLE_CHARTS, LIBRARY_VERSION, getEntry } from "./catalog";
export { AGENT_SETUP } from "./assets.generated";
export { MCP_VERSION } from "./version";
export type { Catalog, ChartEntry, ChartProp } from "./types";
