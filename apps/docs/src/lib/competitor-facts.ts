/**
 * Dated external reference points for Choose / compare docs.
 * Never invent competitor sizes — pin version + measurement date + method.
 * microcharts sizes always come from `docs-facts` / `.size-limit.json`, not here.
 */

/** Recharts — full dashboard toolkit. Numbers match the homepage cost section. */
export const RECHARTS = {
  name: "Recharts",
  pkg: "recharts",
  version: "3.9.2",
  /** Whole package, min+gzip — bundlephobia, 2026-07-15. */
  packageGzipKb: 145,
  /**
   * Tree-shaken one LineChart set (LineChart, Line, XAxis, YAxis, Tooltip,
   * ResponsiveContainer; react external), esbuild minify+gzip — 2026-07-21.
   */
  oneChartGzipKb: 106,
  runtimeDeps: 11,
  measuredAt: "2026-07",
} as const;

/** `react-sparklines` — still heavily downloaded; last npm publish 2017.
 *  Mentioned on /docs/react-sparklines as context, not as a succession claim. */
export const REACT_SPARKLINES_LEGACY = {
  name: "react-sparklines",
  pkg: "react-sparklines",
  version: "1.7.0",
  lastPublish: "2017-07-27",
  /** npm downloads API, week ending 2026-07-19. */
  downloadsLastWeek: 242_308,
  downloadsWeekEnding: "2026-07-19",
  runtimeDeps: ["prop-types"],
  repo: "https://github.com/borisyankov/react-sparklines",
  npm: "https://www.npmjs.com/package/react-sparklines",
} as const;

/** Chart.js + the usual React wrapper. Canvas-first, full chart surfaces. */
export const CHART_JS = {
  name: "Chart.js",
  pkg: "chart.js",
  version: "4.5.1",
  /** chart.js alone, min+gzip — bundlephobia, 2026-07-21. */
  packageGzipKb: 66.7,
  wrapper: "react-chartjs-2",
  wrapperVersion: "5.3.0",
  /** Thin React bindings; Chart.js is the real cost. */
  wrapperGzipKb: 1.0,
  runtimeDeps: 1,
  measuredAt: "2026-07-21",
} as const;
