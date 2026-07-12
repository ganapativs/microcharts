// Accessible-name plumbing.
//
// The static entry is hook-free (RSC-safe → no useId) and must produce output
// that is IDENTICAL across server render, client render, StrictMode double
// render, and any concurrent re-render. A module counter cannot guarantee that
// (discarded renders advance it → hydration mismatches on id attributes), so:
//
//   - DEFAULT (no `id` prop): name the svg with a composed `aria-label`
//     (title + summary) and still render `<title>` for hover/secondary naming.
//     Fully deterministic — nothing generated.
//   - EXPLICIT `id` prop: the maximal `<title>/<desc>` + `aria-labelledby`
// wiring — safe because the id is stable.
//
// Interactive entries use React's `useId` instead (client-only, always safe).

export interface AccessibleNaming {
  /** Attributes to spread on the root svg. */
  rootAttrs:
    | { "aria-hidden": true }
    | { role: "img"; "aria-label": string }
    | { role: "img"; "aria-labelledby": string };
  /** id for the `<title>` element (only in explicit-id mode). */
  titleId: string | undefined;
  /** id for the `<desc>` element (only in explicit-id mode). */
  descId: string | undefined;
  /** Whether to render the <title>/<desc> children at all. */
  renderTitle: boolean;
  renderDesc: boolean;
}

/**
 * Composes the chart's accessible naming from `title` + `summary`.
 * `summary === false` → decorative (T0, hidden from AT).
 */
export function accessibleNaming(
  title: string | undefined,
  summary: string | false | undefined,
  id: string | undefined,
): AccessibleNaming {
  if (summary === false) {
    return {
      rootAttrs: { "aria-hidden": true },
      titleId: undefined,
      descId: undefined,
      renderTitle: false,
      renderDesc: false,
    };
  }

  const hasTitle = typeof title === "string" && title.length > 0;
  const hasDesc = typeof summary === "string" && summary.length > 0;

  if (id) {
    const titleId = hasTitle ? `${id}-t` : undefined;
    const descId = hasDesc ? `${id}-d` : undefined;
    const labelledBy = [titleId, descId].filter(Boolean).join(" ");
    if (labelledBy) {
      return {
        rootAttrs: { role: "img", "aria-labelledby": labelledBy },
        titleId,
        descId,
        renderTitle: hasTitle,
        renderDesc: hasDesc,
      };
    }
  }

  const label = [title, hasDesc ? summary : undefined].filter(Boolean).join(". ");
  return {
    rootAttrs: { role: "img", "aria-label": label || "Chart" },
    titleId: undefined,
    descId: undefined,
    // <title> still renders (tooltip + secondary naming); <desc> only with ids.
    renderTitle: hasTitle,
    renderDesc: false,
  };
}
