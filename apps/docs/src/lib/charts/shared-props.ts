/**
 * Shared grammar — documented once for `catalog.json`, PropTable footer, and
 * `prop-parity.test.ts` (`SHARED_PROP_NAMES` / `SHARED_INTERACTIVE_NAMES`).
 * Descriptions mirror quickstart#the-shared-grammar — keep in sync.
 */
import type { ChartProp } from "./types";

const GRAMMAR_PROPS: ChartProp[] = [
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
    description:
      "Names the chart — rendered as an SVG `<title>`, so it becomes the accessible name and the native hover tooltip, not visible text on the page.",
  },
  {
    name: "summary",
    type: "string | false",
    required: false,
    description:
      "Override the auto-generated accessible sentence, or pass `false` to drop it — with no `title`, that marks the chart decorative (hidden from assistive tech).",
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
  {
    name: "labelSize",
    type: "number",
    required: false,
    description:
      "Raise the minimum label size, in viewBox units. Labels size themselves from the mark and floor at 7; set this where 7 reads too small. A label the box cannot seat at the raised floor drops rather than shrinking back under it, so a bigger number can mean fewer labels, never smaller ones.",
  },
];

const LAYOUT_PROPS: ChartProp[] = [
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

const I18N_PROPS: ChartProp[] = [
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

/** Interactive-only shared props — see `types.ts` (`picker` / `animates` flags). */
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
      "Announce value changes through a polite live region as the data updates (default on), on the entries whose value can change without the reader touching the chart. Charts that stream a fast-moving number throttle their own announcements — EtaBar exposes the interval as `announceEvery`.",
  },
  {
    name: "onActive",
    type: "(datum: MicroDatum | null) => void",
    required: false,
    interactive: true,
    description:
      "The active unit changed — the one under the pointer or the keyboard focus. `null` when the chart is cleared (pointer leaves, focus blurs, Escape). Payload is `MicroDatum` — `{ index, value, label?, formatted? }`, where `index` identifies the navigable unit, `value` is its primary encoded number (`null` for an empty unit), and `formatted` is the exact string the chart's own readout chip would show. Pair with `readout={false}` to render that value outside the chart.",
  },
  {
    name: "onSelect",
    type: "(datum: MicroDatum | null) => void",
    required: false,
    interactive: true,
    description:
      "A unit was activated — click, tap, `Enter` or `Space`. On multi-unit pickers this pins the unit so it survives blur (`null` when cleared by re-selecting, by `Escape`, or by a pointer press outside the chart). On lean scalars there is only one unit, so the callback fires with no pinned state. Same `MicroDatum` payload as `onActive`.",
  },
  {
    name: "selectedIndex",
    type: "number | null",
    required: false,
    interactive: true,
    description:
      "Controlled selected unit — an index into the chart's navigable units, or `null` for none. Pass it to own the selection; pair with `onSelect`.",
  },
  {
    name: "defaultSelectedIndex",
    type: "number | null",
    required: false,
    interactive: true,
    description:
      "Uncontrolled initial selection. Ignored once `selectedIndex` is set. Use it to open a chart with one unit already pinned.",
  },
  {
    name: "readout",
    type: "boolean",
    required: false,
    interactive: true,
    description:
      "Show the floating value chip that follows the pointer/focus (default `true`). `false` suppresses only the chip — the hover crosshair, keyboard roving, live-region announcements, and both callbacks keep working — so you can render `datum.formatted` in your own layout instead.",
  },
];

export const SHARED_PROPS: ChartProp[] = [
  ...GRAMMAR_PROPS,
  ...LAYOUT_PROPS,
  ...I18N_PROPS,
  ...SHARED_INTERACTIVE_PROPS,
];

/**
 * Static shared names per-chart tables may omit. `size`, `fontSize`, `gap`, `cell`
 * left this set — not universal and not one meaning across charts; each chart
 * documents its own row (`prop-parity` enforces).
 */
export const SHARED_PROP_NAMES: ReadonlySet<string> = new Set([
  ...GRAMMAR_PROPS.map((p) => p.name),
  ...LAYOUT_PROPS.map((p) => p.name),
  ...I18N_PROPS.map((p) => p.name),
  // structural / react
  "children",
  "ref",
  "key",
]);

export const SHARED_INTERACTIVE_NAMES: ReadonlySet<string> = new Set(
  SHARED_INTERACTIVE_PROPS.map((p) => p.name),
);
