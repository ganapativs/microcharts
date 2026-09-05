/** A series a chart must survive. These are the shipped edge-case contract. */
export interface Fixture {
  key: string;
  /** Muted one-liner shown under the picker — what this case proves. */
  note: string;
  apply: (data: number[]) => (number | null)[];
}

const flatten = (d: number[]): number[] => d.map(() => (d.length ? Math.round(mean(d)) : 0));
const mean = (d: number[]): number => d.reduce((a, b) => a + b, 0) / (d.length || 1);

export const FIXTURES: Fixture[] = [
  { key: "typical", note: "The demo series.", apply: (d) => d },
  {
    key: "empty",
    note: "data={[]} — nothing measured yet. Charts render an empty frame.",
    apply: () => [],
  },
  {
    key: "one",
    note: "A single point has no shape to draw; the mark still shows the value.",
    apply: (d) => d.slice(0, 1),
  },
  {
    key: "flat",
    note: "Every value equal — a zero-span domain maps to the middle, so flat reads as level.",
    apply: flatten,
  },
  {
    key: "gaps",
    note: "null = no measurement. Lines break at the gap; they never interpolate across it.",
    apply: (d) => d.map((v, i) => (i % 3 === 1 ? null : v)),
  },
  {
    key: "negative",
    note: "Values below zero — areas anchor at zero and valence color follows the sign.",
    apply: (d) => d.map((v, i) => (i % 2 ? -v : v)),
  },
  {
    key: "long",
    note: "300 points — past maxPoints the drawn path decimates min/max-preserving.",
    apply: (d) =>
      Array.from({ length: 300 }, (_, i) => {
        const base = d[i % (d.length || 1)] ?? 0;
        return Math.round(base + Math.sin(i / 7) * (base * 0.25 + 1));
      }),
  },
];

export const DEFAULT_FIXTURE = "typical";

/** The fixture's series, or the untouched data when the key is unknown. */
export function applyFixture(key: string, data: number[]): (number | null)[] {
  return (FIXTURES.find((f) => f.key === key) ?? FIXTURES[0]!).apply(data);
}
const seriesLiteral = (series: readonly (number | null)[]): string =>
  `[${series.map((v) => (v === null ? "null" : String(v))).join(", ")}]`;

/**
 * Point a snippet's `data={[…]}` at the fixture instead.
 *
 * Used for charts whose playground spec hard-codes its series: the fixture is
 * injected as a real `data` prop, so the printed code has to follow or the two
 * would disagree. Charts whose spec already threads `data` never reach this —
 * their `code()` prints whatever series it was handed.
 */
export function replaceDataLiteral(jsx: string, series: readonly (number | null)[]): string {
  return jsx.replace(/data=\{\[[^\]]*\]\}/, `data={${seriesLiteral(series)}}`);
}

/**
 * Charts whose `data` prop is a plain numeric series, from the catalog's
 * documented `dataShape`. Trailing prose is fine ("number[] (oldest first)",
 * "number[] + value" — the series is still the `data` prop); a nested array
 * (`number[][]`) or an object/union shape is not.
 *
 * This is only the FIRST filter: `gen-playground-caps.mjs` then renders the
 * chart with each fixture and keeps the option only if the markup really
 * changed, so a false positive here can never reach the UI.
 */
export const PLAIN_SERIES = /^\(?number(\s*\|\s*null)?\)?\[\](?!\[)/;

export interface FormatOption {
  key: string;
  /** `undefined` ⇒ omit the prop entirely (the library default). */
  value?: Intl.NumberFormatOptions;
  /** The prop as it appears in the snippet. */
  code?: string;
}

export const FORMATS: FormatOption[] = [
  { key: "default" },
  {
    key: "compact",
    value: { notation: "compact", maximumFractionDigits: 1 },
    code: '{ notation: "compact", maximumFractionDigits: 1 }',
  },
  {
    key: "currency",
    value: { style: "currency", currency: "USD", maximumFractionDigits: 0 },
    code: '{ style: "currency", currency: "USD", maximumFractionDigits: 0 }',
  },
  {
    key: "1 dp",
    value: { minimumFractionDigits: 1, maximumFractionDigits: 1 },
    code: "{ minimumFractionDigits: 1, maximumFractionDigits: 1 }",
  },
];

/** BCP-47 tags whose digits, separators or ordering differ visibly. */
export const LOCALES = ["en-US", "de-DE", "ja-JP", "hi-IN"] as const;
export const DEFAULT_LOCALE = "en-US";

export const formatOption = (key: string): FormatOption =>
  FORMATS.find((f) => f.key === key) ?? FORMATS[0]!;

/**
 * Token bundles that ship in `styles.css`. `modern` is the default and sets no
 * attribute; the rest are applied by scoping `data-mc-theme` — exactly what
 * `<MicroProvider theme="…">` renders.
 */
export const THEMES = ["modern", "editorial", "mono", "vivid", "dark", "print", "eink"] as const;
export type Theme = (typeof THEMES)[number];
export const DEFAULT_THEME: Theme = "modern";
export const themeAttr = (t: Theme): string | undefined => (t === "modern" ? undefined : t);

/** Prop lines for the format/locale axis, skipping anything already in the JSX. */
export function formatLines(formatKey: string, locale: string, jsx: string): (string | null)[] {
  const fmt = formatOption(formatKey);
  const has = (p: string): boolean => new RegExp(`\\b${p}=`).test(jsx);
  return [
    fmt.code && !has("format") ? `  format={${fmt.code}}` : null,
    locale !== DEFAULT_LOCALE && !has("locale") ? `  locale="${locale}"` : null,
  ];
}

/** Wrap a snippet in the provider that scopes a preset, indenting the body. */
export function wrapTheme(jsx: string, theme: Theme): string {
  if (theme === DEFAULT_THEME) return jsx;
  const body = jsx
    .split("\n")
    .map((l) => (l.length ? `  ${l}` : l))
    .join("\n");
  return [`<MicroProvider theme="${theme}">`, body, "</MicroProvider>"].join("\n");
}
