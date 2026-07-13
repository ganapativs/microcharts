// Calendar grid math. UTC ONLY — every function works from
// UTC date parts, so the same input renders identically in any host timezone
// (the SSR/hydration + visual-test requirement; a live "now" never enters —
// callers pass `end` explicitly). Dates travel as ISO `yyyy-mm-dd` strings +
// UTC-midnight timestamps.

const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/;

/**
 * UTC-midnight timestamp for an ISO `yyyy-mm-dd` string (any time suffix is
 * dropped — the DAY is the unit) or a `Date` (its UTC calendar day). Returns
 * null for anything unparseable — the consuming chart raises the dev error.
 */
export function parseUTCDay(input: string | Date): number | null {
  if (input instanceof Date) {
    const t = input.getTime();
    if (Number.isNaN(t)) return null;
    return Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate());
  }
  const m = ISO_DAY.exec(input);
  if (!m) return null;
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(t);
  // reject rollover (2026-02-31 parses but lands in March)
  if (d.getUTCMonth() !== Number(m[2]) - 1 || d.getUTCDate() !== Number(m[3])) return null;
  return t;
}
