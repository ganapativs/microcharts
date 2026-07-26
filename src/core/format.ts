// Cached number formatting. `Intl.NumberFormat` construction
// is ~µs-expensive; per-render/per-call construction multiplies across
// hundreds of chart instances. One bounded cache, keyed by
// locale + options. Pure module state — safe on server and client.
export type Format = Intl.NumberFormatOptions | ((n: number) => string);

const cache = new Map<string, Intl.NumberFormat>();
const MAX = 64; // bounded: locales × option shapes in one app is tiny

function cachedNumberFormat(
  locale: string | string[] | undefined,
  options: Intl.NumberFormatOptions | undefined,
): Intl.NumberFormat {
  const key = JSON.stringify([locale, options]);
  let nf = cache.get(key);
  if (!nf) {
    if (cache.size >= MAX) cache.clear();
    nf = new Intl.NumberFormat(locale, options);
    cache.set(key, nf);
  }
  return nf;
}

/**
 * Resolves the shared `format`/`locale` props into a formatter function.
 * Custom functions pass through; `Intl` options hit the cached instance. Both
 * receive a float-noise-cleaned number: charts compute differences/sums/ratios
 * internally (e.g. `value - target` → `-3.5999999999999943`), and a consumer's
 * `format` function is written for clean data, not for IEEE arithmetic. The
 * number is snapped to 12 significant digits first — far more than any label
 * shows, well inside the ~15–17 digits where binary-float noise appears.
 */
export function makeFormatter(
  format: Format | undefined,
  locale: string | string[] | undefined,
  defaults?: Intl.NumberFormatOptions,
): (n: number) => string {
  // `toPrecision` passes ±Infinity/NaN through unchanged. Exact integers carry
  // no binary-float noise, so skip the round-trip for them — `toPrecision(12)`
  // would corrupt integers with 13+ digits (e.g. 1234567890123 → …120).
  const clean = (n: number) => (Number.isInteger(n) ? n : Number(n.toPrecision(12)));
  if (typeof format === "function") {
    const fn = format;
    return (n) => fn(clean(n));
  }
  const nf = cachedNumberFormat(locale, format ?? defaults);
  return (n) => nf.format(clean(n));
}

/**
 * The one way a chart may render a percent.
 *
 * A literal `` `${Math.round(x * 100)}%` `` is not a percent, it is an
 * en-US percent: `fr-FR` and most of Europe put a NBSP before the sign, `tr-TR`
 * puts the sign in front of the number, and several locales use their own digits.
 * Charts were spelling it out inline in chip text, live-region announcements and
 * painted labels alike, so a `locale` prop that correctly localised every other
 * number on the chart left its percentages in English.
 *
 * Takes a FRACTION (0.42 → "42%"), matching `Intl`'s own `style: "percent"`
 * contract, so a caller can never be unsure whether to pre-multiply. Routed
 * through `makeFormatter` for the same shared cache — one `Intl.NumberFormat` per
 * locale × digit count across the whole catalog, not one per chart instance.
 */
export function makePercentFormatter(
  locale: string | string[] | undefined,
  maximumFractionDigits = 0,
): (fraction: number) => string {
  return makeFormatter(undefined, locale, { style: "percent", maximumFractionDigits });
}

/** Prepend `+` for positive values only when `fmt` did not already emit a sign.
 *  Guards `++1.3%` when callers pass signed percent formatters. */
export function withPlus(n: number, fmt: (n: number) => string): string {
  if (!(n > 0)) return fmt(n);
  const s = fmt(n);
  return s.startsWith("+") || s.startsWith("-") || s.startsWith("−") ? s : `+${s}`;
}

// Cached date/time formatting — same caching
// discipline as numbers. `Intl.DateTimeFormat` construction is even costlier.
export type DateFormat = Intl.DateTimeFormatOptions | ((d: Date) => string);

const dateCache = new Map<string, Intl.DateTimeFormat>();

function cachedDateFormat(
  locale: string | string[] | undefined,
  options: Intl.DateTimeFormatOptions | undefined,
): Intl.DateTimeFormat {
  const key = JSON.stringify([locale, options]);
  let df = dateCache.get(key);
  if (!df) {
    if (dateCache.size >= MAX) dateCache.clear();
    df = new Intl.DateTimeFormat(locale, options);
    dateCache.set(key, df);
  }
  return df;
}

/**
 * Resolves date-format props into a formatter. Calendar charts pass UTC-day
 * timestamps, so `timeZone: "UTC"` is the default for option-based formatting —
 * the same input renders identically in any host timezone. A caller can still
 * override it (e.g. `{ timeZone: "America/New_York" }`) via the format options,
 * which spread after the default.
 */
export function makeDateFormatter(
  format: DateFormat | undefined,
  locale: string | string[] | undefined,
  defaults?: Intl.DateTimeFormatOptions,
): (d: Date) => string {
  if (typeof format === "function") return format;
  const df = cachedDateFormat(locale, { timeZone: "UTC", ...(format ?? defaults) });
  return (d) => df.format(d);
}
