// Shared-scale small multiples: one union domain + one size (hook/Context-free → RSC-safe).
// Injects `domain`/`width`/`height` via cloneElement; explicit child props win.
import { Children, cloneElement, isValidElement, type CSSProperties, type ReactNode } from "react";
import { niceDomain } from "../core/scale.js";
import { isFiniteValue, type Value } from "../core/types.js";

export interface SparkGroupProps {
  /** `"shared"` (union of all children, default) or an explicit `[min, max]`. */
  domain?: "shared" | readonly [number, number];
  /** One physical size enforced on every child. */
  width?: number;
  height?: number;
  /** Zero-anchor the shared domain (for bar/area groups). */
  zero?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

interface ChildProps {
  data?: readonly Value[];
  domain?: readonly [number, number];
  width?: number;
  height?: number;
}

export function SparkGroup(props: SparkGroupProps): ReactNode {
  const { domain = "shared", width, height, zero = false, className, style, children } = props;

  const items = Children.toArray(children).filter(isValidElement);

  // Resolve the shared domain from every child's data (unless given explicitly).
  let resolved: readonly [number, number] | undefined;
  if (domain === "shared") {
    const all: number[] = [];
    for (const child of items) {
      const data = (child.props as ChildProps).data;
      if (data) for (const v of data) if (isFiniteValue(v)) all.push(v);
    }
    resolved = all.length ? niceDomain(all, zero) : undefined;
  } else {
    resolved = domain;
  }

  const cloned = items.map((child, i) => {
    const cp = child.props as ChildProps;
    const key = child.key ?? i;
    // Only series children (those with a `data` prop) get scale/size injection —
    // never plain wrappers/labels, which would receive bogus DOM attributes.
    if (cp.data === undefined) return cloneElement(child, { key });
    const inject: ChildProps = {};
    if (cp.domain === undefined && resolved) inject.domain = resolved;
    if (cp.width === undefined && width !== undefined) inject.width = width;
    if (cp.height === undefined && height !== undefined) inject.height = height;
    return cloneElement(child, { key, ...inject });
  });

  return (
    <div className={className ? `mc-group ${className}` : "mc-group"} style={style}>
      {cloned}
    </div>
  );
}
