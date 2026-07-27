/**
 * The example-app showcase — seven independent, production-grade apps that
 * install `@microcharts/react` from npm and, between them, run every chart
 * type in the catalog. Deployed live on Cloudflare Pages; screenshots live
 * in /public/examples (light + dark hero per app, except dispatch, which is
 * a print magazine and stays paper in both schemes — by design).
 *
 * Ranked: the order below is the presentation order everywhere (homepage
 * marquee first, then the supporting cast).
 *
 * `charts` is the real list of chart types each app imports — derived from the
 * example source (`@microcharts/react/<slug>` imports), not hand-curated, so
 * the detail pages can't claim a mark the app doesn't actually render. Every
 * current slug resolves to a catalog page; the detail view still resolves each
 * against the registry and links only those that exist, so a future composite
 * with no page can't become a dead tile.
 */

export type ShowcaseApp = {
  slug: string;
  name: string;
  /** the one-line story this app proves */
  blurb: string;
  /** a two-sentence expansion for the detail page */
  story: string;
  /** mono capability tag — the library feature it demonstrates */
  tag: string;
  url: string;
  /** hostname shown in the card chrome */
  host: string;
  shotLight: string;
  shotDark: string;
  /** every chart type the app imports, in slug form */
  charts: string[];
};

export const SHOWCASE: ShowcaseApp[] = [
  {
    slug: "cortex",
    name: "Cortex",
    blurb: "An eval console that reads a model's answer through the model's own confidence.",
    story:
      "Every screen is built out of the model's own eval output: token-confidence spans over the answer text, calibration strips beside it, a confusion grid for the run as a whole. A reviewer can see where the model was unsure without reading a number.",
    tag: "the AI story",
    url: "https://microcharts-cortex.pages.dev",
    host: "microcharts-cortex.pages.dev",
    shotLight: "/examples/cortex-light.webp",
    shotDark: "/examples/cortex-dark.webp",
    charts: [
      "activity-grid",
      "bias-strip",
      "bullet",
      "calibration-strip",
      "comet-trail",
      "confusion-grid",
      "control-strip",
      "delta",
      "eta-bar",
      "event-raster",
      "heartbeat-blip",
      "orbit-status",
      "percentile-trace",
      "quantile-dots",
      "rubric-strip",
      "segmented-bar",
      "sparkline",
      "star-spoke",
      "status-dot",
      "token-confidence",
      "trace-fold",
      "waveform",
    ],
  },
  {
    slug: "pulse",
    name: "Pulse",
    blurb:
      "Product analytics rendered in Server Components. Static routes ship no chart JS at all.",
    story:
      "Dozens of series, funnels and cohort triangles, all drawn on the server. Hydration happens only on the screens where a reader reaches in to scrub something, so most of the app arrives as HTML and stays that way.",
    tag: "RSC · zero client JS",
    url: "https://microcharts-pulse.pages.dev",
    host: "microcharts-pulse.pages.dev",
    shotLight: "/examples/pulse-light.webp",
    shotDark: "/examples/pulse-dark.webp",
    charts: [
      "ab-strips",
      "activity-grid",
      "benchmark-strip",
      "bullet",
      "bump-strip",
      "change-point",
      "city-skyline",
      "cohort-triangle",
      "comet-trail",
      "control-strip",
      "data-diff",
      "delta",
      "dot-plot",
      "dual-sparkline",
      "dual-window-meter",
      "fat-digits",
      "forecast-cone",
      "funnel",
      "heartbeat-blip",
      "icon-array",
      "mini-bar",
      "net-flow",
      "ohlc",
      "pareto-strip",
      "progress",
      "quantile-dots",
      "queue-depth",
      "rate-volume",
      "retention-curve",
      "segmented-bar",
      "shift-histogram",
      "sparkline",
      "sprout-row",
      "stacked-area",
      "waterfall",
    ],
  },
  {
    slug: "ledger",
    name: "Ledger",
    blurb: "A night-session trading terminal where the marks redraw as quotes tick.",
    story:
      "Every chart here is the interactive entry: OHLC candles, depth wedges and order-flow marks that draw on as quotes arrive, each one driven by a single pointer listener and the shared animate engine. It is the densest app of the seven, and the one that spends the most on interaction.",
    tag: "interactive + animate",
    url: "https://microcharts-ledger.pages.dev",
    host: "microcharts-ledger.pages.dev",
    shotLight: "/examples/ledger-light.webp",
    shotDark: "/examples/ledger-dark.webp",
    charts: [
      "balance-beam",
      "bias-strip",
      "bubble-row",
      "bullet",
      "comet-trail",
      "delta",
      "depth-wedge",
      "ensemble-ghosts",
      "forecast-cone",
      "heartbeat-blip",
      "histogram-strip",
      "horizon",
      "micro-donut",
      "micro-scatter",
      "net-flow",
      "ohlc",
      "percentile-ladder",
      "phase-trace",
      "sparkline",
      "spread-band",
      "stacked-area",
      "tape-gauge",
      "tree-rings",
      "volume-profile",
      "win-prob-worm",
    ],
  },
  {
    slug: "dispatch",
    name: "Dispatch",
    blurb: "A print magazine where the charts sit inside the sentences, as typography.",
    story:
      "The editorial preset and the inline seat let a sparkline or a dumbbell stand on the baseline like a letter rather than sit in a box beside the text. Nothing in the issue is captioned, because nothing in it is a figure.",
    tag: "inline · editorial preset",
    url: "https://microcharts-dispatch.pages.dev",
    host: "microcharts-dispatch.pages.dev",
    shotLight: "/examples/dispatch-light.webp",
    shotDark: "/examples/dispatch-light.webp",
    charts: [
      "delta",
      "dice-pips",
      "dumbbell",
      "fill-word",
      "garden-grid",
      "histogram-strip",
      "hourglass",
      "likert-strip",
      "moon-phase",
      "music-staff",
      "paired-bars",
      "partition-strip",
      "segmented-bar",
      "slope",
      "sparkbar",
      "sparkline",
      "station-glyph",
      "status-dot",
      "trend-arrow",
      "wind-barb",
    ],
  },
  {
    slug: "shipyard",
    name: "Shipyard",
    blurb: "A grayscale service-health console where color is spent only on meaning.",
    story:
      "The mono preset holds every mark neutral until something needs to speak. An error budget going red or a burn-down falling behind is the only color on the screen, which is what makes it readable at three in the morning.",
    tag: "mono preset",
    url: "https://microcharts-shipyard.pages.dev",
    host: "microcharts-shipyard.pages.dev",
    shotLight: "/examples/shipyard-light.webp",
    shotDark: "/examples/shipyard-dark.webp",
    charts: [
      "activity-grid",
      "bullet",
      "burn-chart",
      "constellation",
      "coverage-strip",
      "delta",
      "dual-window-meter",
      "error-budget",
      "event-raster",
      "event-timeline",
      "graded-band",
      "heat-cell",
      "heat-strip",
      "histogram-strip",
      "honeycomb",
      "micro-box",
      "minimap-strip",
      "orbit-status",
      "queue-depth",
      "seismogram",
      "sparkline",
      "status-dot",
    ],
  },
  {
    slug: "vitals",
    name: "Vitals",
    blurb: "A gentle health almanac on cream stock, where a year of sleep fits on one page.",
    story:
      "Sleep stages, activity and streaks, printed at almanac scale on cream stock. Per-instance categorical palettes keep a night's stages apart without ever moving the valence hues, so up is still good and down is still bad.",
    tag: "categorical palette",
    url: "https://microcharts-vitals.pages.dev",
    host: "microcharts-vitals.pages.dev",
    shotLight: "/examples/vitals-light.webp",
    shotDark: "/examples/vitals-dark.webp",
    charts: [
      "activity-grid",
      "breathing-dot",
      "bullet",
      "calendar-strip",
      "cycle-plot",
      "delta",
      "eta-bar",
      "folded-day-band",
      "forecast-cone",
      "grade-profile",
      "hypnogram",
      "micro-donut",
      "moon-phase",
      "percentile-trace",
      "pictogram-row",
      "polar-clock",
      "progress-ring",
      "rug-strip",
      "sparkbar",
      "sparkline",
      "spiral-year",
      "streak-spark",
      "tally-marks",
      "thermometer",
      "time-in-range",
    ],
  },
  {
    slug: "atlas",
    name: "Atlas",
    blurb: "Housing-market intelligence, dense enough that every table cell carries its own chart.",
    story:
      "Regional price and supply data on limestone stock, under a custom ink theme. One accent, run through defineTheme, derives the whole color-blind-safe palette and its dark twin, and the tables lean on it hard: heat cells, dumbbells and slopes sit inside the rows rather than beside them.",
    tag: "custom ink theme",
    url: "https://microcharts-atlas.pages.dev",
    host: "microcharts-atlas.pages.dev",
    shotLight: "/examples/atlas-light.webp",
    shotDark: "/examples/atlas-dark.webp",
    charts: [
      "benchmark-strip",
      "bullet",
      "calendar-strip",
      "delta",
      "dot-plot",
      "dumbbell",
      "event-timeline",
      "heat-cell",
      "histogram-strip",
      "micro-box",
      "mini-bar",
      "net-flow",
      "paired-bars",
      "partition-strip",
      "percentile-ladder",
      "pictogram-row",
      "quadrant-dot",
      "rate-volume",
      "rug-strip",
      "segmented-bar",
      "slope",
      "sparkline",
      "stacked-area",
      "thermometer",
      "volume-profile",
    ],
  },
];

/** Look up one app by slug. */
export function getShowcase(slug: string): ShowcaseApp | undefined {
  return SHOWCASE.find((a) => a.slug === slug);
}

/** Unique chart slugs exercised across every example — the full catalog. */
export function coveredCharts(): Set<string> {
  const set = new Set<string>();
  for (const app of SHOWCASE) for (const c of app.charts) set.add(c);
  return set;
}
