import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

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
