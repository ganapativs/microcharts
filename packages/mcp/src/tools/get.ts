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
  /** Grammar / layout / i18n props every chart accepts, in addition to `props`. */
  sharedProps: ChartProp[];
  /** Copy-runnable example: sample-data defs prepended to the snippet. */
  example: { title: string; code: string };
  /**
   * The same example as a JSON prop bag — exactly what `render_microchart`
   * takes. `example.code` is JSX for a human to paste; this is for a model to
   * adapt. Absent only if the example is not fully serializable.
   */
  sample?: Record<string, unknown>;
}

/**
 * Full wiring detail for one chart: import paths, its own props + the shared
 * props, dataShape, best/avoid, and a copy-runnable example. Pure over the
 * snapshot. Returns undefined for an unknown slug.
 */
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
