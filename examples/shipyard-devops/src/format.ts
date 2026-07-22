// Shared formatters. Passed to charts as `format` — never `new Intl` in a
// component; either a plain fn or an Intl options object (both are valid Format).

export const ms = (n: number) => `${Math.round(n)} ms`;
export const msTight = (n: number) => `${Math.round(n)}ms`;
export const pct0 = { style: "percent", maximumFractionDigits: 0 } as const;
export const pct2 = { style: "percent", maximumFractionDigits: 2 } as const;
export const pct3 = (n: number) => `${n.toFixed(3)}%`;
export const utilPct = (n: number) => `${Math.round(n)}%`;
export const mins = (n: number) => `${Math.round(n)}m`;
export const kmin = (n: number) => `${Math.round(n)}k min`;
export const rps = (n: number) => `${Math.round(n).toLocaleString()} rps`;

/** Minutes-since-midnight → HH:MM (event-raster / timeline axes). */
export const hhmm = (n: number) => {
  const h = Math.floor(n / 60);
  const m = Math.round(n % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};
