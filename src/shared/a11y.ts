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
 *
 * `summary === false` drops the generated sentence. That is the decorative
 * opt-out — but ONLY when it leaves the chart with no name at all: an explicit
 * `title` IS a name, so a titled chart stays exposed and is named by its title
 * alone. Silently swallowing an author-supplied name would be the surprise, and
 * the interactive entries (`shared/interactive.ts` `named()`, and by hand in
 * `token-confidence/client.tsx`) have always resolved it this way — this is the
 * one rule both entries follow. To hide a titled chart, drop the title
 * (`micro-donut`'s `decorative` prop does exactly that).
 */
export function accessibleNaming(
  title: string | undefined,
  summary: string | false | undefined,
  id: string | undefined,
): AccessibleNaming {
  const hasTitle = typeof title === "string" && title.length > 0;

  if (summary === false && !hasTitle) {
    return {
      rootAttrs: { "aria-hidden": true },
      titleId: undefined,
      descId: undefined,
      renderTitle: false,
      renderDesc: false,
    };
  }

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
  // "Chart" is the sole hardcoded-English string in a static bundle. It's the
  // last-resort name when a chart has no title and an EMPTY generated summary
  // (`summary={false}` with no title never reaches here — it's hidden above), so
  // the chart is never an unnamed `role="img"`. Pulling it from the EN dictionary
  // would drag the whole aggregate `strings` module into every static bundle
  // (kilobytes, per the size budget), so this one literal stays inline.
  return {
    rootAttrs: { role: "img", "aria-label": label || "Chart" },
    titleId: undefined,
    descId: undefined,
    // <title> still renders (tooltip + secondary naming); <desc> only with ids.
    renderTitle: hasTitle,
    renderDesc: false,
  };
}
