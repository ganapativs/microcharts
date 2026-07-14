/**
 * The shared grammar — props whose name means the same thing on every chart, so
 * they're documented ONCE here instead of repeated in every per-chart table.
 *
 * Three consumers read this single source:
 *  - `catalog.json` emits it as a top-level `sharedProps` block so the machine
 *    catalog is a complete reference (not just chart-specific knobs).
 *  - `PropTable`'s footer links here rather than re-listing.
 *  - `prop-parity.test.ts` derives its allow-lists from `SHARED_PROP_NAMES` /
 *    `SHARED_INTERACTIVE_NAMES`, so a prop can never be "shared" in the docs but
 *    still flagged as drift by the guard (or vice-versa).
 *
 * Descriptions mirror quickstart#the-shared-grammar — keep them in sync.
 */
import type { ChartProp } from "./types";

/** The shared grammar — encoding vocabulary common to the whole catalog. */
export const GRAMMAR_PROPS: ChartProp[] = [
  {
    name: "data",
    type: "(number | null)[] | per-chart shape",
    required: true,
    description:
      "The series. `null` / `NaN` are gaps, never zeros. The one required prop; each chart documents its own shape when it isn't a plain number array.",
  },
  {
    name: "domain",
    type: "[min, max]",
    required: false,
    description: "Fix the value range instead of auto-fitting.",
  },
  {
    name: "color",
    type: "string",
    required: false,
    description:
      'Mark color: any CSS color or a token (`"var(--mc-accent)"`). Semantic tokens keep their meaning.',
  },
  {
    name: "title",
    type: "string",
    required: false,
    description: "A visible title, wired into the chart's accessible name.",
  },
  {
    name: "summary",
    type: "string | false",
    required: false,
    description:
      "Override the auto-generated accessible sentence, or pass `false` to mark the chart decorative.",
  },
  {
    name: "format",
    type: "Intl.NumberFormatOptions | (n) => string",
    required: false,
    description: "How numbers render in labels and summaries.",
  },
  {
    name: "positive",
    type: '"up" | "down"',
    required: false,
    description:
      'Which direction is good, so color and arrows point the honest way (lower latency is `"down"`).',
  },
  {
    name: "label",
    type: "per chart",
    required: false,
    description:
      "A short direct label next to the mark, in a reserved gutter — never an axis or legend.",
  },
  {
    name: "dots",
    type: "per chart",
    required: false,
    description: 'Which individual points to emphasize (e.g. `"minmax"` on a line).',
  },
];

/** Layout / container props every chart accepts. */
export const LAYOUT_PROPS: ChartProp[] = [
  {
    name: "width",
    type: "number | string",
    required: false,
    description: "Rendered width. Omit both dimensions to size from the container.",
  },
  {
    name: "height",
    type: "number | string",
    required: false,
    description: "Rendered height.",
  },
  {
    name: "className",
    type: "string",
    required: false,
    description: "Class on the chart root.",
  },
  {
    name: "style",
    type: "CSSProperties",
    required: false,
    description: "Inline style on the chart root (a common place to set width/height).",
  },
  {
    name: "id",
    type: "string",
    required: false,
    description:
      "Opts into `<title>`/`<desc>` + `aria-labelledby` naming instead of the default `aria-label`.",
  },
];

/** Internationalization plumbing — string bundles, shared with `strings`. */
export const I18N_PROPS: ChartProp[] = [
  {
    name: "locale",
    type: "string | string[]",
    required: false,
    description: "BCP-47 locale for number and date formatting (defaults to the runtime locale).",
  },
  {
    name: "strings",
    type: "SummaryStrings",
    required: false,
    description: "Override the summary/label string templates for translation.",
  },
  {
    name: "seriesStrings",
    type: "SeriesStrings",
    required: false,
    description:
      "Multi-series analog of `strings` — series/slot labels for charts that plot several series.",
  },
];

/**
 * The shared INTERACTIVE grammar — props that exist only on `/interactive`
 * entries but mean the same thing wherever they appear.
 */
export const SHARED_INTERACTIVE_PROPS: ChartProp[] = [
  {
    name: "animate",
    type: "boolean",
    required: false,
    interactive: true,
    description:
      'Opt-in entrance motion when the chart mounts client-side — add `import "@microcharts/react/motion"` once. Inert on the server, on hydrated server HTML, and under `prefers-reduced-motion`.',
  },
  {
    name: "live",
    type: "boolean",
    required: false,
    interactive: true,
    description:
      "Announce value changes through a polite live region as the data updates (default on). Throttled so a streaming value never spams a screen reader.",
  },
];

/** Everything, in the order the catalog reference should list it. */
export const SHARED_PROPS: ChartProp[] = [
  ...GRAMMAR_PROPS,
  ...LAYOUT_PROPS,
  ...I18N_PROPS,
  ...SHARED_INTERACTIVE_PROPS,
];

/**
 * Static-side shared prop names the per-chart guard/table may omit. Superset of
 * the documented grammar: also covers structural props (`children`, `ref`,
 * `key`) and sizing-ish universal knobs treated as layout, not chart-specific.
 */
export const SHARED_PROP_NAMES: ReadonlySet<string> = new Set([
  ...GRAMMAR_PROPS.map((p) => p.name),
  ...LAYOUT_PROPS.map((p) => p.name),
  ...I18N_PROPS.map((p) => p.name),
  // structural / react
  "children",
  "ref",
  "key",
  // sizing-ish universal knobs treated as layout, not chart-specific
  "size",
  "fontSize",
  "gap",
  "cell",
]);

/** Interactive-only shared prop names — documented once, omitted per chart. */
export const SHARED_INTERACTIVE_NAMES: ReadonlySet<string> = new Set(
  SHARED_INTERACTIVE_PROPS.map((p) => p.name),
);
