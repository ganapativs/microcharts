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

// `toPrecision` passes ±Infinity/NaN through unchanged. Exact integers carry
// no binary-float noise, so skip the round-trip for them — `toPrecision(12)`
// would corrupt integers with 13+ digits (e.g. 1234567890123 → …120).
const clean = (n: number): number => (Number.isInteger(n) ? n : Number(n.toPrecision(12)));

const wrapFn =
  (fn: (n: number) => string) =>
  (n: number): string =>
    fn(clean(n));

function fromOptions(
  locale: string | string[] | undefined,
  options: Intl.NumberFormatOptions | undefined,
): (n: number) => string {
  const nf = cachedNumberFormat(locale, options);
  return (n) => nf.format(clean(n));
}

/**
 * Resolves the shared `format`/`locale` props into a formatter function.
 * Custom functions pass through; `Intl` options hit the cached instance. Both
 * receive a float-noise-cleaned number: charts compute differences/sums/ratios
 * internally (e.g. `value - target` → `-3.5999999999999943`), and a consumer's
 * `format` function is written for clean data, not for IEEE arithmetic. The
 * number is snapped to 12 significant digits first — far more than any label
 * shows, well inside the ~15–17 digits where binary-float noise appears.
 *
 * For a chart that has unit defaults of its own, use `makeUnitFormatter`. This
 * one carries no merge logic ON PURPOSE: size-limit bundles every subpath
 * standalone, so the ~75 charts that format a bare number would each be charged
 * for a branch they can never reach. Measured at 95 B gzip per subpath, which is
 * the difference between `./sparkline/interactive` sitting under the 7 kB wall
 * and over it.
 */
export function makeFormatter(
  format: Format | undefined,
  locale: string | string[] | undefined,
): (n: number) => string {
  // Written out rather than delegating to the two helpers below: a chart that
  // formats a bare number pulls in only this function, and the two extra symbol
  // definitions measured +7 B on `./sparkline/interactive`, which has single
  // digits of room against the wall. The helpers stay for the two entry points
  // that share them.
  if (typeof format === "function") {
    const fn = format;
    return (n) => fn(clean(n));
  }
  const nf = cachedNumberFormat(locale, format);
  return (n) => nf.format(clean(n));
}

/**
 * `makeFormatter` for a chart that has formatting opinions of its own — a unit
 * (`style: "percent"` on the share labels of Funnel, Progress, StackedArea and
 * 15 others) and a precision calibrated to it.
 *
 * `defaults` MERGE UNDER the caller's options rather than being replaced by
 * them. Replacing the whole object meant `format={{ notation: "compact" }}`
 * silently changed 3% into 0.03 — a plausible wrong number, in the label a
 * reader is most likely to quote, with no warning. Per-key merging keeps the
 * unit; an explicit `{ style: "decimal" }` still opts out of it.
 */
export function makeUnitFormatter(
  format: Format | undefined,
  locale: string | string[] | undefined,
  defaults: Intl.NumberFormatOptions,
): (n: number) => string {
  if (typeof format === "function") return wrapFn(format);
  if (!format) return fromOptions(locale, defaults);
  // A caller's explicit `style` REPLACES the chart's unit, and the chart's digit
  // defaults were calibrated for that unit — `maximumFractionDigits: 0` reads as
  // "3%", but kept under `style: "decimal"` it rounds 0.03 to 0. So changing the
  // unit voids the whole default rather than half of it.
  if (format.style && format.style !== defaults.style) return fromOptions(locale, format);
  const opts = { ...defaults, ...format };
  // A chart default that lands on the wrong side of a caller's bound stops being
  // a default and becomes a `RangeError` — `Intl` rejects min > max outright,
  // and a chart that throws on a legal prop is worse than one that rounds oddly.
  // The caller's number is the intentional one, so the chart's yields — but only
  // when the caller did not set the other bound themselves: two incoherent
  // numbers from the SAME object are their own bug to see.
  const lo = opts.minimumFractionDigits;
  if (
    lo !== undefined &&
    format.maximumFractionDigits === undefined &&
    (opts.maximumFractionDigits ?? 20) < lo
  ) {
    opts.maximumFractionDigits = lo;
  }
  return fromOptions(locale, opts);
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
 * through the same cached instance — one `Intl.NumberFormat` per locale × digit
 * count across the whole catalog, not one per chart instance. There is no
 * caller `format` here to merge against, so it takes the options path directly
 * and charts using it pay nothing for `makeUnitFormatter`.
 */
export function makePercentFormatter(
  locale: string | string[] | undefined,
  maximumFractionDigits = 0,
): (fraction: number) => string {
  return fromOptions(locale, { style: "percent", maximumFractionDigits });
}

/** Prepend `+` for positive values only when `fmt` did not already emit a sign.
 *  Guards `++1.3%` when callers pass signed percent formatters. */
export function withPlus(n: number, fmt: (n: number) => string): string {
  if (!(n > 0)) return fmt(n);
  const s = fmt(n);
  return s.startsWith("+") || s.startsWith("-") || s.startsWith("−") ? s : `+${s}`;
}

/**
 * Drop a leading sign the formatter already emitted. The mirror of `withPlus`,
 * for charts that format a MAGNITUDE and print the direction themselves: they
 * pass `Math.abs(v)` and then prepend their own `+`/`−`, so a caller passing
 * `format={{ signDisplay: "always" }}` — a legal thing to write — got `++3%`,
 * and a negative got `−+3%`. Only the three signs `withPlus` tests for; a custom
 * function returning some other marker is beyond what a string test can know.
 */
export function unsigned(s: string): string {
  return s.startsWith("+") || s.startsWith("-") || s.startsWith("−") ? s.slice(1) : s;
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
