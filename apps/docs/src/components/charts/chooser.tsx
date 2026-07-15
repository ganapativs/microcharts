import Link from "next/link";
import { getChart } from "@/lib/catalog";
import { getModule } from "@/lib/charts/registry";
import { ChooserFilter } from "./chooser-filter";

/** Chart chooser by decision question. Partition coverage asserted in tests.
 *  Server component: the per-chart glyphs (Mark) render on the server so the
 *  106-chart component graph never reaches the client — only the tiny chip
 *  filter is a client island. */

interface Job {
  id: string;
  q: string;
  when: string;
  slugs: string[];
}

// Every stable chart in exactly one job (chooser.test.ts). Best pick first.
const JOBS: Job[] = [
  {
    id: "trend",
    q: "A trend over time",
    when: "Values in sequence — read direction, shape, and where it turned.",
    slugs: [
      "sparkline",
      "dual-sparkline",
      "horizon",
      "stacked-area",
      "comet-trail",
      "tree-rings",
      "music-staff",
      "win-prob-worm",
      "change-point",
      "cycle-plot",
      "rate-volume",
      "waveform",
      "ohlc",
      "bump-strip",
      "percentile-trace",
      "queue-depth",
    ],
  },
  {
    id: "compare",
    q: "Compare & rank",
    when: "Several things on one scale — which leads, and by how much.",
    slugs: [
      "mini-bar",
      "sparkbar",
      "dot-plot",
      "bubble-row",
      "city-skyline",
      "pareto-strip",
      "fat-digits",
      "star-spoke",
      "sprout-row",
      "paired-bars",
      "slope",
      "dumbbell",
      "ab-strips",
      "shift-histogram",
      "balance-beam",
      "spread-band",
      "bias-strip",
      "net-flow",
    ],
  },
  {
    id: "parts",
    q: "Parts of a whole",
    when: "One quantity split into pieces — read the mix and the biggest slice.",
    slugs: [
      "segmented-bar",
      "micro-donut",
      "funnel",
      "waterfall",
      "partition-strip",
      "likert-strip",
    ],
  },
  {
    id: "target",
    q: "On track?",
    when: "A value against a target, budget, or deadline — the gap and the pace.",
    slugs: [
      "bullet",
      "progress",
      "progress-ring",
      "burn-chart",
      "error-budget",
      "eta-bar",
      "thermometer",
      "tape-gauge",
      "fill-word",
      "dual-window-meter",
      "control-strip",
      "forecast-cone",
      "hourglass",
      "coverage-strip",
    ],
  },
  {
    id: "state",
    q: "State right now",
    when: "One current condition, glanceable — often before any number.",
    slugs: [
      "status-dot",
      "delta",
      "trend-arrow",
      "breathing-dot",
      "heartbeat-blip",
      "orbit-status",
      "wind-barb",
      "station-glyph",
      "moon-phase",
    ],
  },
  {
    id: "spread",
    q: "Distribution & uncertainty",
    when: "Not one number but its spread, tail, and how much to trust it.",
    slugs: [
      "histogram-strip",
      "micro-box",
      "rug-strip",
      "quantile-dots",
      "graded-band",
      "percentile-ladder",
      "ensemble-ghosts",
      "benchmark-strip",
      "volume-profile",
    ],
  },
  {
    id: "timing",
    q: "Timing & events",
    when: "When things happened, how often, and in what rhythm.",
    slugs: [
      "activity-grid",
      "calendar-strip",
      "event-timeline",
      "seismogram",
      "heat-strip",
      "event-raster",
      "constellation",
      "streak-spark",
      "hypnogram",
      "time-in-range",
      "folded-day-band",
      "polar-clock",
      "spiral-year",
      "garden-grid",
    ],
  },
  {
    id: "count",
    q: "Count",
    when: "Small quantities a reader can verify by counting.",
    slugs: ["pictogram-row", "icon-array", "tally-marks", "dice-pips", "honeycomb"],
  },
  {
    id: "special",
    q: "Specialized instruments",
    when: "Uncommon questions — relationships, models, ops — each an unusually apt encoding.",
    slugs: [
      "micro-scatter",
      "quadrant-dot",
      "phase-trace",
      "confusion-grid",
      "calibration-strip",
      "token-confidence",
      "trace-fold",
      "depth-wedge",
      "minimap-strip",
      "data-diff",
      "cohort-triangle",
      "retention-curve",
      "rubric-strip",
      "grade-profile",
      "heat-cell",
    ],
  },
];

export const CHOOSER_JOBS = JOBS;

function Row({ slug, first }: { slug: string; first: boolean }) {
  const c = getChart(slug);
  const mod = getModule(slug);
  if (!c || !mod) return null;
  const { Mark } = mod;
  return (
    <li className="border-b border-hairline/60 last:border-0">
      <Link
        prefetch={false}
        href={`/docs/charts/${slug}`}
        className="group flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 no-underline"
      >
        <span
          aria-hidden
          className="chooser-glyph flex h-5 w-12 shrink-0 items-center justify-center overflow-hidden opacity-90"
        >
          <Mark data={c.demo} width={44} height={16} />
        </span>
        <span className="flex items-baseline gap-2">
          <span className="font-medium text-fd-foreground transition-colors group-hover:text-fd-primary">
            {c.name}
          </span>
          {first && (
            <span className="mono-label text-[0.55rem] text-fd-primary opacity-80">start here</span>
          )}
        </span>
        <span className="min-w-0 flex-1 text-sm text-fd-muted-foreground">{c.tagline}</span>
      </Link>
    </li>
  );
}

export function ChartChooser() {
  const sections = JOBS.map((j) => ({
    id: j.id,
    q: j.q,
    body: (
      <section>
        <div className="mb-1 flex items-baseline justify-between gap-4">
          <h3 className="display text-lg text-fd-foreground">{j.q}</h3>
          <span className="mono-label shrink-0 tabular-nums opacity-55">
            {j.slugs.length.toString().padStart(2, "0")}
          </span>
        </div>
        <p className="mb-3 border-b border-hairline pb-3 text-sm text-fd-muted-foreground">
          {j.when}
        </p>
        <ul className="grid grid-cols-1 gap-x-10">
          {j.slugs.map((slug, i) => (
            <Row key={slug} slug={slug} first={i === 0} />
          ))}
        </ul>
      </section>
    ),
  }));

  return <ChooserFilter sections={sections} />;
}
