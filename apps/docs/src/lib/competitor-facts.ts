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
  /** npm downloads API, week ending 2026-07-21. */
  downloadsLastWeek: 250_390,
  downloadsWeekEnding: "2026-07-21",
  /** Whole package (Sparklines + SparklinesLine), react external, esbuild
   *  minify+gzip — 2026-07-23. */
  packageGzipKb: 7.9,
  measuredAt: "2026-07-23",
  runtimeDeps: ["prop-types"],
  repo: "https://github.com/borisyankov/react-sparklines",
  npm: "https://www.npmjs.com/package/react-sparklines",
} as const;

/** MUI X Charts — `SparkLineChart` is the direct inline-chart neighbor.
 *  Community package is MIT; sizes measured 2026-07-23 via esbuild
 *  minify+gzip on `import { SparkLineChart } from "@mui/x-charts/SparkLineChart"`. */
export const MUI_X_CHARTS = {
  name: "MUI X Charts",
  pkg: "@mui/x-charts",
  version: "9.10.0",
  license: "MIT",
  /** SparkLineChart with the MUI peers external (react, react-dom,
   *  @mui/material, @mui/system, emotion) — the marginal cost in an app
   *  already on MUI. */
  sparklineInMuiAppGzipKb: 93.0,
  /** Same import with only react/react-dom external — the cost when MUI is
   *  not already in the bundle. */
  sparklineStandaloneGzipKb: 148.7,
  runtimeDeps: 10,
  /** Required peers (emotion pair is optional): @mui/material + @mui/system. */
  requiredPeers: ["@mui/material", "@mui/system", "react", "react-dom"],
  /** npm downloads API, week ending 2026-07-21 — whole @mui/x-charts package. */
  downloadsLastWeek: 976_191,
  downloadsWeekEnding: "2026-07-21",
  measuredAt: "2026-07-23",
} as const;

/** visx — low-level visualization primitives from Airbnb, not finished charts.
 *  Minimal sparkline = LinePath (@visx/shape) + scaleLinear (@visx/scale),
 *  react external, esbuild minify+gzip — 2026-07-23. */
export const VISX = {
  name: "visx",
  pkg: "@visx/shape",
  version: "4.0.0",
  minimalSparklineGzipKb: 16.3,
  /** @visx/shape runtime deps: @visx/curve, @visx/group, @visx/scale,
   *  @visx/vendor (vendored d3), classnames. */
  shapeRuntimeDeps: 5,
  measuredAt: "2026-07-23",
} as const;

/** TanStack Charts — a typed chart grammar over granular d3 modules, published
 *  as a `0.0.0` proof on 2026-07-29. Sizes measured 2026-07-30 via esbuild
 *  minify+gzip on one `lineY` chart through `@tanstack/react-charts`, react
 *  external. Markup facts read from the SSR output of that same bundle. */
export const TANSTACK_CHARTS = {
  name: "TanStack Charts",
  pkg: "@tanstack/charts",
  reactPkg: "@tanstack/react-charts",
  version: "0.0.0",
  firstPublish: "2026-07-29",
  license: "MIT",
  /** README, 2026-07-30: not published for production use yet. */
  status: "unpublished 0.0.0 product proof",
  /** One line chart (defineChart + lineY + two d3 scales) through the React
   *  adapter, react/react-dom external, esbuild minify+gzip — 2026-07-30. */
  oneChartGzipKb: 20.2,
  /** tanstack.com/charts, 2026-07-30 — their own figure, vanilla renderer. */
  vendorSvgChartGzipKb: "18.5–19.2",
  /** d3-array, d3-geo, d3-scale, d3-shape (plus two @types packages). */
  runtimeDeps: 4,
  /** The app installs d3 scale/array itself; the docs install line says so. */
  appInstalls: ["d3-array", "d3-scale"],
  reactPeer: "^19.0.0",
  /** SVG element count in the SSR output of that one-line chart, grid and axes
   *  included — measured 2026-07-30. */
  ssrSvgNodes: 28,
  measuredAt: "2026-07-30",
  docs: "https://tanstack.com/charts",
  repo: "https://github.com/TanStack/charts",
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
