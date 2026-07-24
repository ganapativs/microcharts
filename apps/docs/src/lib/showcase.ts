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
      "An eval console that reads a model's answer through the model's own confidence. Token-confidence spans, calibration strips, and a confusion grid turn raw eval output into marks a reviewer can trust at a glance.",
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
      "Product analytics rendered entirely in React Server Components — the static routes ship no chart JavaScript at all. Dozens of series, funnels, and cohort triangles, hydrated only where a reader actually reaches in to interact.",
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
    blurb: "A night-session trading terminal: candles, order flow, live animated marks.",
    story:
      "A night-session trading terminal: OHLC candles, depth wedges, and order-flow marks that draw on as quotes tick. Every chart is the interactive entry, driven by one pointer listener and the shared animate engine.",
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
      "A print magazine where the charts sit inside the sentences, as typography. The editorial preset and the inline seat let a sparkline or a dumbbell set on the baseline like a letter, not a figure.",
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
      "A grayscale service-health console where color is spent only on meaning. The mono preset holds everything neutral until an error budget or a burn-down actually needs to speak.",
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
    blurb: "A gentle health almanac: rings, hypnograms, and streaks on cream stock.",
    story:
      "A gentle health almanac — rings, hypnograms, and streaks on cream stock. Per-instance categorical palettes keep sleep stages and activity legible without ever moving the valence hues.",
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
    blurb: "Housing-market intelligence: heat maps, dumbbells, and slopes on limestone.",
    story:
      "Housing-market intelligence on limestone: heat maps, dumbbells, and slopes under a custom ink theme. One accent, run through defineTheme, derives the whole color-blind-safe palette and its dark twin.",
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
