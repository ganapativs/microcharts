// Dev-only warnings (plan/22 shared conventions). Stripped in production by the
// standard NODE_ENV replacement every React bundler performs; guarded so the
// bare-browser ESM path (no `process`) stays silent instead of throwing.
const seen = new Set<string>();

/** Warn once per unique message, dev builds only. */
export function devWarn(message: string): void {
  if (typeof process === "undefined" || process.env.NODE_ENV === "production") return;
  if (seen.has(message)) return;
  seen.add(message);
  // eslint-disable-next-line no-console
  console.warn(`[microcharts] ${message}`);
}
