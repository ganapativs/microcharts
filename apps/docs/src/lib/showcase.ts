/**
 * The example-app showcase — seven independent, production-grade apps that
 * install `@microcharts/react` from npm and, between them, run every chart
 * type in the catalog. Deployed live on Cloudflare Pages; screenshots live
 * in /public/examples (light + dark hero per app, except dispatch, which is
 * a print magazine and stays paper in both schemes — by design).
 *
 * Ranked: the order below is the presentation order everywhere (homepage
 * marquee first, then the supporting cast).
 */

export type ShowcaseApp = {
  slug: string;
  name: string;
  /** the one-line story this app proves */
  blurb: string;
  /** mono capability tag — the library feature it demonstrates */
  tag: string;
  url: string;
  /** hostname shown in the card chrome */
  host: string;
  shotLight: string;
  shotDark: string;
  /** headline chart types, shown as chips on the marquee card */
  charts?: string[];
};

export const SHOWCASE: ShowcaseApp[] = [
  {
    slug: "cortex",
    name: "Cortex",
    blurb: "An eval console that reads a model's answer through the model's own confidence.",
    tag: "the AI story",
    url: "https://microcharts-cortex.pages.dev",
    host: "microcharts-cortex.pages.dev",
    shotLight: "/examples/cortex-light.webp",
    shotDark: "/examples/cortex-dark.webp",
    charts: ["token-confidence", "calibration-strip", "confusion-grid", "trace-fold"],
  },
  {
    slug: "pulse",
    name: "Pulse",
    blurb:
      "Product analytics rendered in Server Components. Static routes ship no chart JS at all.",
    tag: "RSC · zero client JS",
    url: "https://microcharts-pulse.pages.dev",
    host: "microcharts-pulse.pages.dev",
    shotLight: "/examples/pulse-light.webp",
    shotDark: "/examples/pulse-dark.webp",
  },
  {
    slug: "ledger",
    name: "Ledger",
    blurb: "A night-session trading terminal: candles, order flow, live animated marks.",
    tag: "interactive + animate",
    url: "https://microcharts-ledger.pages.dev",
    host: "microcharts-ledger.pages.dev",
    shotLight: "/examples/ledger-light.webp",
    shotDark: "/examples/ledger-dark.webp",
  },
  {
    slug: "dispatch",
    name: "Dispatch",
    blurb: "A print magazine where the charts sit inside the sentences, as typography.",
    tag: "inline · editorial preset",
    url: "https://microcharts-dispatch.pages.dev",
    host: "microcharts-dispatch.pages.dev",
    shotLight: "/examples/dispatch-light.webp",
    shotDark: "/examples/dispatch-light.webp",
  },
  {
    slug: "shipyard",
    name: "Shipyard",
    blurb: "A grayscale service-health console where color is spent only on meaning.",
    tag: "mono preset",
    url: "https://microcharts-shipyard.pages.dev",
    host: "microcharts-shipyard.pages.dev",
    shotLight: "/examples/shipyard-light.webp",
    shotDark: "/examples/shipyard-dark.webp",
  },
  {
    slug: "vitals",
    name: "Vitals",
    blurb: "A gentle health almanac: rings, hypnograms, and streaks on cream stock.",
    tag: "categorical colors[]",
    url: "https://microcharts-vitals.pages.dev",
    host: "microcharts-vitals.pages.dev",
    shotLight: "/examples/vitals-light.webp",
    shotDark: "/examples/vitals-dark.webp",
  },
  {
    slug: "atlas",
    name: "Atlas",
    blurb: "Housing-market intelligence: heat maps, dumbbells, and slopes on limestone.",
    tag: "custom ink theme",
    url: "https://microcharts-atlas.pages.dev",
    host: "microcharts-atlas.pages.dev",
    shotLight: "/examples/atlas-light.webp",
    shotDark: "/examples/atlas-dark.webp",
  },
];
