import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { jitter } from "./jitter";

/**
 * Props that carry the numbers a chart PLOTS, as opposed to the ones that
 * describe its scale or its presentation. Only these are perturbed by a
 * shuffle: a jittered `domain` or `target` would rescale the plot and hide the
 * very movement the shuffle exists to show, and a jittered `total` would make a
 * part-of-whole chart lie about its denominator.
 *
 * The list is deliberately a closed allowlist rather than "everything numeric".
 * A prop this file has not been taught about is left alone, which fails to
 * animate rather than failing to tell the truth.
 */
const MEASUREMENT_PROPS = new Set([
  "data",
  "value",
  "values",
  "compare",
  "history",
  "forecast",
  "plan",
  "actual",
  "before",
  "after",
  "demand",
  "supply",
  "counts",
  "events",
  "series",
  "samples",
  "observations",
  "progress",
  "elapsed",
  "rate",
  "latency",
]);

/** The chart element inside a preview tree — the node `injectChartProps` writes to. */
function findChart(node: ReactNode): ReactElement<Record<string, unknown>> | null {
  if (!isValidElement(node)) return null;
  const el = node as ReactElement<{ children?: ReactNode }>;
  if (typeof el.type !== "string") return el as ReactElement<Record<string, unknown>>;
  for (const child of Children.toArray(el.props.children)) {
    const hit = findChart(child);
    if (hit) return hit;
  }
  return null;
}

/**
 * The chart's own `data` prop, as the playground rendered it.
 *
 * This is the series a shuffle should re-read. `entry.demo` is the inline
 * sample and is often a different (much shorter) array.
 */
export function chartSeries(node: ReactNode): unknown {
  return findChart(node)?.props["data"];
}

/** Measurement props actually present on this preview's chart. */
export function measurementProps(node: ReactNode): string[] {
  const chart = findChart(node);
  if (!chart) return [];
  return Object.keys(chart.props).filter(
    (k) => MEASUREMENT_PROPS.has(k) && chart.props[k] !== undefined,
  );
}

/**
 * A new reading for any chart, whatever its data shape: read the measurement
 * props off the rendered element and perturb them in place. This is what lets a
 * shuffle reach the ~70 charts whose data is not a plain numeric series — an
 * OHLC bar, a labelled row, a station observation — without the playground
 * having to know what any of those shapes mean.
 */
export function shuffleChartProps(node: ReactNode, seed: number): ReactNode {
  if (!seed) return node;
  const chart = findChart(node);
  if (!chart) return node;
  const next: Record<string, unknown> = {};
  let n = 0;
  for (const key of Object.keys(chart.props)) {
    if (!MEASUREMENT_PROPS.has(key)) continue;
    const value = chart.props[key];
    if (value === undefined) continue;
    // A distinct seed per prop, so two series on one chart do not move in step.
    next[key] = jitter(value, seed + n++);
  }
  return n ? injectChartProps(node, next) : node;
}

/**
 * Clone `props` onto the chart element inside a playground preview.
 *
 * Most `renderInteractive` trees are the chart itself. A few (Delta) wrap it in
 * a host `<span>` for type size — shallow `cloneElement` would hang callbacks on
 * that wrapper and the chart would never see them. Walk host nodes and inject
 * into the first composite child.
 */
export function injectChartProps(node: ReactNode, props: Record<string, unknown>): ReactNode {
  if (!isValidElement(node)) return node;
  const el = node as ReactElement<{ children?: ReactNode }>;
  if (typeof el.type !== "string") return cloneElement(el, props);

  let done = false;
  const next = Children.toArray(el.props.children).map((child) => {
    if (done || !isValidElement(child)) return child;
    if (typeof child.type === "string") {
      const deeper = injectChartProps(child, props);
      if (deeper !== child) done = true;
      return deeper;
    }
    done = true;
    return cloneElement(child, props);
  });
  return done ? cloneElement(el, { children: next.length === 1 ? next[0] : next }) : el;
}
