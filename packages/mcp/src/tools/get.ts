import { catalog, getEntry } from "../catalog";
import type { ChartProp } from "../types";

export interface GetResult {
  slug: string;
  name: string;
  tagline: string;
  status: "stable" | "planned";
  dataShape: string;
  encoding: { channel: string; precision: string };
  staticImport: string;
  interactiveImport?: string;
  bestFor: string[];
  avoidFor: string[];
  props: ChartProp[];
  sharedProps: ChartProp[];
  example: { title: string; code: string };
  /** Same example as JSON props for `render_microchart` when serializable. */
  sample?: Record<string, unknown>;
}

export function getChart(slug: string): GetResult | undefined {
  const c = getEntry(slug);
  if (!c) return undefined;
  const result: GetResult = {
    slug: c.slug,
    name: c.name,
    tagline: c.tagline,
    status: c.status,
    dataShape: c.dataShape,
    encoding: c.encoding,
    staticImport: c.staticImport,
    bestFor: c.bestFor,
    avoidFor: c.avoidFor,
    props: c.props,
    sharedProps: catalog.sharedProps,
    example: c.example,
  };
  if (c.interactiveImport !== undefined) result.interactiveImport = c.interactiveImport;
  if (c.sample !== undefined) result.sample = c.sample;
  return result;
}
