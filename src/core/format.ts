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
 * Custom functions pass through; `Intl` options hit the cached instance.
 */
export function makeFormatter(
  format: Format | undefined,
  locale: string | string[] | undefined,
  defaults?: Intl.NumberFormatOptions,
): (n: number) => string {
  if (typeof format === "function") return format;
  const nf = cachedNumberFormat(locale, format ?? defaults);
  return (n) => nf.format(n);
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
