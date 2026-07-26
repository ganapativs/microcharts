/** Playground naming knobs — one resolution drives preview + code tab. */

export const SUMMARY_MODES = ["auto", "custom", "off"] as const;
export type SummaryMode = (typeof SUMMARY_MODES)[number];

export interface A11yProps {
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
}

export interface NamingEntry {
  slug: string;
  tagline: string;
  example: { title: string };
}

/** `auto` omits summary (library default); `custom` / `off` set authored / false. */
export function a11yProps(
  mode: SummaryMode,
  named: boolean,
  byId: boolean,
  entry: NamingEntry,
): A11yProps {
  const props: A11yProps = {};
  // Omit keys (don't set `undefined`) — cloneElement treats undefined as an override
  // and would strip the title the chart's own demo already passes.
  if (named) props.title = entry.example.title;
  if (byId) props.id = `${entry.slug}-demo`;
  // Playground specs ship `summary={false}` (doc page mustn't announce twice);
  // `auto` restores describeSeries by intentionally setting `undefined`.
  props.summary = mode === "custom" ? entry.tagline : mode === "off" ? false : undefined;
  return props;
}

export function injectProps(jsx: string, lines: readonly (string | null)[]): string {
  const extra = lines.filter(Boolean).join("\n");
  if (!extra) return jsx;
  if (!/\n?\/>\s*$/.test(jsx)) return jsx;
  return jsx.replace(/\n?\/>\s*$/, `\n${extra}\n/>`);
}

/** Snippet lines for a11y props; skip attrs the snippet already sets. */
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
