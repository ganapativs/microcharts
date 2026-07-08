// Host-side annotation resolver — deliberately TINY. The mark-rendering code
// lives as a static field ON each annotation component (shared/annotations.tsx),
// which ships in the `@microcharts/react/annotations` entry the CONSUMER
// imports. A host that renders no annotations therefore pays only this walker
// (~0.2 kB), not the whole annotation layer — the per-subpath budgets stay
// honest (plan/21 §1).
import { Children, Fragment, isValidElement, type ReactNode } from "react";

/** Brand key — a static field on each annotation component function. */
export const ANNOTATION = "__mcAnnotation" as const;

/** The host's scale frame: data-space → viewBox mappers + box + font size. */
export interface AnnotationFrame {
  x: (dx: number) => number;
  y: (dy: number) => number;
  width: number;
  height: number;
  fontSize: number;
}

export interface AnnotationBrand {
  layer: "under" | "over";
  render: (props: unknown, frame: AnnotationFrame, key: string) => ReactNode;
}

export interface ResolvedAnnotations {
  /** Marks that sit BELOW the data ink (TargetZone). */
  under: ReactNode;
  /** Marks that sit ABOVE the data ink (Threshold, Marker, Callout). */
  over: ReactNode;
  /** Non-annotation children, passed through untouched (escape hatch). */
  rest: ReactNode;
}

export function resolveAnnotations(
  children: ReactNode,
  frame: AnnotationFrame,
): ResolvedAnnotations {
  const under: ReactNode[] = [];
  const over: ReactNode[] = [];
  const rest: ReactNode[] = [];
  let i = 0;

  const walk = (nodes: ReactNode): void => {
    Children.forEach(nodes, (child: ReactNode) => {
      if (isValidElement(child)) {
        // unwrap fragments so <><Threshold/><Marker/></> works as expected
        if (child.type === Fragment) {
          walk((child.props as { children?: ReactNode }).children);
          return;
        }
        const brand = (child.type as { [ANNOTATION]?: AnnotationBrand })[ANNOTATION];
        if (brand) {
          (brand.layer === "under" ? under : over).push(
            brand.render(child.props, frame, `mc-ann-${i++}`),
          );
          return;
        }
      }
      rest.push(child);
    });
  };
  walk(children);

  return {
    under: under.length > 0 ? under : null,
    over: over.length > 0 ? over : null,
    rest: rest.length > 0 ? rest : null,
  };
}
