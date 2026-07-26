/**
 * The playground's naming knobs, kept pure so the preview and the code tab are
 * driven by ONE resolution of `title` / `summary` / `id` — a snippet that
 * disagreed with the chart on screen would be the one thing a live playground
 * must never do.
 */

/** How the chart is named + described. */
export const SUMMARY_MODES = ["auto", "custom", "off"] as const;
export type SummaryMode = (typeof SUMMARY_MODES)[number];

export interface A11yProps {
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
}

/** Minimal registry shape these knobs read. */
export interface NamingEntry {
  slug: string;
  tagline: string;
  example: { title: string };
}

/**
 * Resolve the knobs to props.
 *
 * `auto` omits `summary` entirely — the library then generates it with
 * `describeSeries`, which is the default every consumer gets. `custom` shows an
 * authored sentence winning over the generated one; `off` is the decorative
 * opt-out.
 */
export function a11yProps(
  mode: SummaryMode,
  named: boolean,
  byId: boolean,
  entry: NamingEntry,
): A11yProps {
  const props: A11yProps = {};
  // OMITTED, not `undefined`: a key set to undefined still overrides through
  // `cloneElement`, which would strip the title the chart's own demo passes.
  // Off means "leave this chart as its snippet ships it".
  if (named) props.title = entry.example.title;
  if (byId) props.id = `${entry.slug}-demo`;
  // `auto` DOES override with undefined, on purpose: playground specs render
  // with `summary={false}` so a doc page doesn't announce the same chart twice,
  // and auto restores the library default (a generated `describeSeries`).
  props.summary = mode === "custom" ? entry.tagline : mode === "off" ? false : undefined;
  return props;
}

/** Add prop lines to a self-closing chart snippet; no-op if it isn't one. */
export function injectProps(jsx: string, lines: readonly (string | null)[]): string {
  const extra = lines.filter(Boolean).join("\n");
  if (!extra) return jsx;
  if (!/\n?\/>\s*$/.test(jsx)) return jsx;
  return jsx.replace(/\n?\/>\s*$/, `\n${extra}\n/>`);
}

/**
 * The same props as snippet lines. A prop the chart's own snippet already
 * spells out is left alone, so injection can never produce a duplicate
 * attribute.
 */
export function a11yLines(p: A11yProps, jsx: string): (string | null)[] {
  const has = (prop: string): boolean => new RegExp(`\\b${prop}=`).test(jsx);
  return [
    p.title && !has("title") ? `  title=${JSON.stringify(p.title)}` : null,
    has("summary")
      ? null
      : p.summary === false
        ? "  summary={false}"
        : p.summary
          ? `  summary=${JSON.stringify(p.summary)}`
          : null,
    p.id && !has("id") ? `  id=${JSON.stringify(p.id)}` : null,
  ];
}
