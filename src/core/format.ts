// Cached number formatting (plan/04 rule 7). `Intl.NumberFormat` construction
// is ~µs-expensive; per-render/per-call construction multiplies across
// hundreds of chart instances (plan/07). One bounded cache, keyed by
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
