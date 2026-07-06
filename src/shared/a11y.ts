// Accessible-name plumbing (plan/08 §1). No hooks — the static entry is
// RSC-safe and cannot call useId. Ids come from a module counter, which is
// correct for server/SSR-static rendering (each chart on a page gets a unique
// id during one render pass). For repeated client-side hydration, pass an
// explicit `id` to <Chart> or use the interactive entry (which may use useId).
let counter = 0;

export function nextId(prefix = "mc"): string {
  counter += 1;
  return `${prefix}-${counter.toString(36)}`;
}

export interface LabelIds {
  /** value for aria-labelledby, or undefined when decorative/unnamed */
  labelledBy: string | undefined;
  titleId: string | undefined;
  descId: string | undefined;
}

/** Derives the title/desc ids and the composed aria-labelledby (plan/08 T1). */
export function labelIds(base: string, hasTitle: boolean, hasDesc: boolean): LabelIds {
  const titleId = hasTitle ? `${base}-t` : undefined;
  const descId = hasDesc ? `${base}-d` : undefined;
  const labelledBy = [titleId, descId].filter(Boolean).join(" ") || undefined;
  return { labelledBy, titleId, descId };
}
