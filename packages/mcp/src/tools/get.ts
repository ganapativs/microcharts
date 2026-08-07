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
  /** Authored maximum `width`/`height` in viewBox units; scale with CSS past it. */
  maxWidth?: number;
  maxHeight?: number;
  /** Caps, derived inputs, and sizing knobs no prop description carries. */
  gotchas?: string[];
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
  // Both or neither: a lone side reads as one capped axis and one free one.
  if (c.maxWidth !== undefined && c.maxHeight !== undefined) {
    result.maxWidth = c.maxWidth;
    result.maxHeight = c.maxHeight;
  }
  if (c.gotchas?.length) result.gotchas = c.gotchas;
  if (c.sample !== undefined) result.sample = c.sample;
  return result;
}
