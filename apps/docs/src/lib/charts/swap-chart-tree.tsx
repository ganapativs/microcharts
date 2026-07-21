import {
  Children,
  cloneElement,
  createElement,
  isValidElement,
  type ElementType,
  type ReactElement,
  type ReactNode,
} from "react";

/**
 * Deep-replace every element of type `from` with `to`, keeping props/children.
 * Used so authored four-homes JSX (static chart) can render the interactive twin
 * at the same size — interaction only, no layout rewrite.
 */
export function swapChartTree(node: ReactNode, from: ElementType, to: ElementType): ReactNode {
  if (node == null || typeof node === "boolean") return node;
  if (typeof node === "string" || typeof node === "number") return node;
  if (Array.isArray(node)) {
    return node.map((child, i) => {
      const next = swapChartTree(child, from, to);
      if (isValidElement(next) && next.key == null) {
        return cloneElement(next, { key: i });
      }
      return next;
    });
  }
  if (!isValidElement(node)) return node;

  const el = node as ReactElement<{ children?: ReactNode }>;
  if (el.type === from) {
    return createElement(to, el.props as Record<string, unknown>);
  }

  if (el.props.children === undefined) return el;
  return cloneElement(
    el,
    undefined,
    Children.map(el.props.children, (c) => swapChartTree(c, from, to)),
  );
}
