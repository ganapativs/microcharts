import Link from "next/link";
import { describeSeries } from "@microcharts/react";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { Sparkline } from "@microcharts/react/sparkline";
import { SparkBar } from "@microcharts/react/sparkbar";
import { ActivityGrid } from "@microcharts/react/activity-grid";
import { Bullet } from "@microcharts/react/bullet";
import { HistogramStrip } from "@microcharts/react/histogram-strip";
import { getModule } from "@/lib/charts/registry";
import { LivingCatalog } from "@/components/home/living-catalog";
import { StreamVignette } from "@/components/home/stream-vignette";
import { FourContexts } from "@/components/charts/contexts";
import { SurfaceCarousel } from "@/components/home/surface-carousel";
import { ProviderWall, SurfaceCards } from "@/components/charts/ai-static";
import { InstallCommand } from "@/components/ui/copy";
import { Reveal } from "@/components/ui/reveal";
import { CATALOG, SIZE, BENCH, STATIC_SIZES } from "@/lib/docs-facts";
import { STATS } from "@/lib/stats";

// The home route inherits the site-level metadata from the root layout
// (indexable, canonical "/", default OG + title), so it sets none of its own.

/* One dataset the page keeps returning to. */
const TREND = [3, 5, 4, 8, 6, 9, 7, 11];
const CADENCE = [0, 2, 1, 3, 4, 2, 1, 3, 2, 4, 3, 2];

/* Accessible strings from describeSeries — not hand-written. */
const HERO = [3, 5, 4, 8, 6, 9];
const A11Y_ROWS = [
  { in: "[3, 5, 4, 8, 6, 9]", out: describeSeries(HERO) },
  { in: "[9, 7, 8, 4, 5, 2]", out: describeSeries([9, 7, 8, 4, 5, 2]) },
  { in: "[7]", out: describeSeries([7]) },
  { in: "[5, 5, 5, 5]", out: describeSeries([5, 5, 5, 5]) },
  { in: "[]", out: describeSeries([]) },
];

const HOW_MODELS_USE = [
  {
    who: "Chat assistants",
    what: "emit a chart block mid-reply, and it renders in the answer",
  },
  {
    who: "Coding agents & CLIs",
    what: "scaffold components straight from the typed catalog",
  },
  {
    who: "Frameworks & SDKs",
    what: "map tool-call output to a chart per row, no bridge",
  },
];

function SectionMark({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 flex items-center gap-3">
      <span className="mono-label text-fd-primary">{n}</span>
      <span className="h-px flex-1 bg-hairline" />
      <span className="mono-label">{children}</span>
    </div>
  );
}

/* A word-sized chart set inside display type — the product's core trick. */
function Word({ band, children }: { band?: boolean; children: React.ReactNode }) {
  return (
    <span aria-hidden className={band ? "hx-word hx-word--band" : "hx-word"}>
      {children}
    </span>
  );
}

const DotMark = getModule("dot-plot")!.Mark;

/* The five marks the whole catalog is built from. */
const PRIMITIVES = [
  {
    name: "stroke",
    node: <Sparkline data={TREND} curve="smooth" width={104} height={30} summary={false} />,
    builds: "Sparkline, Slope, Horizon, ForecastCone",
  },
  {
    name: "bar",
    node: <SparkBar data={TREND} width={104} height={30} summary={false} />,
    builds: "SparkBar, MiniBar, Funnel, Waterfall",
  },
  {
    name: "cell",
    node: <ActivityGrid data={CADENCE} layout="strip" cell={8} summary={false} />,
    builds: "ActivityGrid, HeatStrip, ConfusionGrid",
  },
  {
    name: "dot",
    node: <DotMark data={[3, 7, 4, 9, 6, 11]} width={104} height={30} />,
    builds: "DotPlot, MicroScatter, Constellation",
  },
  {
    name: "band",
    node: (
      <Bullet value={72} target={80} bands={[50, 90]} width={104} height={14} summary={false} />
    ),
    builds: "Bullet, GradedBand, TimeInRange",
  },
];

const SPEC = [
  { k: "Dependencies", v: "0 runtime, CI-enforced" },
  { k: "License", v: "MIT" },
  { k: "React", v: "18 & 19 (peer)" },
  { k: "Modules", v: "ESM, per-chart subpaths" },
  { k: "Rendering", v: "pure SVG, RSC-safe" },
  { k: "Styling", v: "~20 CSS variables" },
];

export default function HomePage() {
  const c = CATALOG.collections;
  const opsK = Math.round((BENCH.describeSeriesOpsPerSecRounded ?? 0) / 1000);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 grid-paper opacity-60"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-16 sm:px-6 sm:pb-16 sm:pt-18 lg:grid-cols-[1.06fr_0.94fr] lg:gap-14">
          <div>
            <Reveal className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {["Zero dependencies", "AI-native", "Accessible by default", "RSC-safe"].map(
                (t, i) => (
                  <span key={t} className="mono-label">
                    {i > 0 && <span className="mr-2 text-hairline">/</span>}
                    {t}
                  </span>
                ),
              )}
            </Reveal>

            <Reveal delay={60}>
              <h1 className="display mt-5 text-balance text-[2.3rem] leading-[1.05] text-fd-foreground sm:text-[3rem] lg:text-[3.65rem] xl:text-[3.9rem]">
                Small enough for a model to{" "}
                <span className="whitespace-nowrap">
                  write
                  <Word>
                    <Sparkline data={TREND} curve="smooth" width={60} height={20} summary={false} />
                  </Word>
                  ,
                </span>{" "}
                sharp enough for a person to{" "}
                <span className="whitespace-nowrap">
                  trust
                  <Word>
                    <SparkBar data={TREND} width={52} height={20} summary={false} />
                  </Word>
                  .
                </span>
              </h1>
            </Reveal>

            <Reveal delay={120}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-fd-muted-foreground">
                Word-sized charts for React. {CATALOG.total} types that sit inside a sentence, a
                table cell, or a streamed reply, where a full chart library would be too heavy and
                too loud.
              </p>
            </Reveal>

            <Reveal delay={180} className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/docs/quickstart"
                className="cta-accent group inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-transform hover:-translate-y-0.5"
              >
                Get started
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <InstallCommand />
            </Reveal>
          </div>

          <Reveal delay={140}>
            <LivingCatalog total={CATALOG.total} />
          </Reveal>
        </div>
      </section>

      {/* ── 01 · AI-native ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <SectionMark n="01">Made for machines and people</SectionMark>
        <Reveal className="mb-8 max-w-2xl">
          <h2 className="display text-[length:var(--text-fluid-h2)]">
            Plain text in, shipped components out.
          </h2>
          <p className="mt-4 max-w-xl text-fd-muted-foreground">
            One grammar across {CATALOG.total} types means an assistant that has seen one chart can
            write them all. It emits plain text; each block becomes the shipped component the moment
            it closes.
          </p>
        </Reveal>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
          <Reveal>
            <StreamVignette />
          </Reveal>
          <Reveal delay={80} className="flex flex-col gap-4">
            <ul className="panel divide-y divide-hairline">
              {HOW_MODELS_USE.map((r) => (
                <li key={r.who} className="flex flex-col gap-1 px-5 py-4">
                  <span className="text-sm font-medium text-fd-foreground">{r.who}</span>
                  <span className="text-[0.86rem] leading-relaxed text-fd-muted-foreground">
                    {r.what}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/docs/ai"
              className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-fd-primary link-underline"
            >
              The AI-native guide, prompts, and guardrails <ArrowRight className="size-4" />
            </Link>
          </Reveal>
        </div>

        <Reveal delay={120} className="mt-10">
          <div className="mono-label mb-3">runs where models already work</div>
          <ProviderWall />
        </Reveal>
        <Reveal delay={60} className="mt-6">
          <div className="mono-label mb-3">and reads its own docs</div>
          <SurfaceCards />
        </Reveal>
      </section>

      {/* ── 02 · Accessibility ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <SectionMark n="02">Reads itself aloud</SectionMark>
        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
          <Reveal>
            <h2 className="display text-[length:var(--text-fluid-h2)]">
              Every chart writes its own description.
            </h2>
            <p className="mt-4 max-w-md text-fd-muted-foreground">
              The default accessible name is generated from the data, so there is no alt text to
              forget and no summary to drift. The same words a screen reader speaks are the words a
              crawler indexes and a model can quote back.
            </p>
            <div className="panel mt-6 p-6">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-8 items-center">
                  <Sparkline data={HERO} width={92} height={26} curve="smooth" summary={false} />
                </span>
                <span className="mono-label">announced as</span>
              </div>
              <p className="text-lg leading-relaxed text-fd-foreground">
                &ldquo;Weekly revenue. {describeSeries(HERO)}&rdquo;
              </p>
            </div>
            <Link
              href="/docs/accessibility"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-fd-primary link-underline"
            >
              How the summaries work <ArrowRight className="size-4" />
            </Link>
          </Reveal>

          <Reveal delay={80}>
            <div className="panel overflow-hidden">
              <div className="border-b border-hairline px-5 py-3">
                <span className="mono-label">honest on the hard inputs</span>
              </div>
              <ul>
                {A11Y_ROWS.map((r, i) => (
                  <li
                    key={r.in}
                    className={
                      "grid grid-cols-1 gap-1 px-5 py-3.5 sm:grid-cols-[9.5rem_minmax(0,1fr)]" +
                      (i > 0 ? " border-t border-hairline" : "")
                    }
                  >
                    <code className="font-mono text-[0.8rem] text-fd-primary">{r.in}</code>
                    <span className="text-[0.86rem] leading-relaxed text-fd-muted-foreground">
                      {r.out}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-4 text-sm text-fd-muted-foreground">
              Empty, single, flat, or reversed data gets an honest short sentence, never a broken
              chart. Direction is never color alone, and strokes clear 4.5:1 in light and dark.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── 03 · Performance ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <SectionMark n="03">Measured, not marketed</SectionMark>
        <Reveal className="mb-8 max-w-2xl">
          <h2 className="display text-[length:var(--text-fluid-h2)]">
            Small enough for hundreds per page.
          </h2>
          <p className="mt-4 max-w-xl text-fd-muted-foreground">
            No chart engine, no D3, just SVG. Every number here regenerates from the repo, and a
            chart that grows past its budget fails the build.
          </p>
        </Reveal>

        <div className="grid gap-3 md:grid-cols-3">
          <Reveal className="md:col-span-2">
            <div className="glass relative flex h-full flex-col justify-between gap-6 overflow-hidden px-5 py-7">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 grid-paper opacity-50"
              />
              <div className="relative [&_text]:hidden">
                <HistogramStrip
                  data={STATIC_SIZES}
                  width={480}
                  height={64}
                  summary={false}
                  className="h-auto w-full"
                />
              </div>
              <div className="relative">
                <div className="text-sm text-fd-foreground">
                  Every chart&rsquo;s measured gzip weight, drawn by one of them.
                </div>
                <div className="mono-label mt-1 opacity-70">
                  {SIZE.min} to {SIZE.max} kB · median {SIZE.median} kB · {SIZE.under2} of{" "}
                  {SIZE.count} under 2 kB
                </div>
              </div>
            </div>
          </Reveal>
          <Reveal delay={60}>
            <div className="glass h-full px-5 py-7">
              <div className="display text-4xl tabular-nums text-fd-foreground sm:text-5xl">
                {STATS.deps}
              </div>
              <div className="mt-2 text-sm text-fd-foreground">runtime dependencies</div>
              <div className="mono-label mt-1 opacity-70">CI-enforced, forever</div>
            </div>
          </Reveal>
          {[
            {
              v: `${STATS.ssr.ms} ms`,
              u: `${STATS.ssr.rows} sparklines, server-rendered`,
              note: `~${STATS.avgBytes} bytes each · pnpm bench`,
            },
            {
              v: `${opsK}k/s`,
              u: "accessible summaries generated",
              note: "describeSeries, measured",
            },
            {
              v: "≤ 6",
              u: "SVG nodes, typical chart",
              note: "SVG node budget",
            },
          ].map((s, i) => (
            <Reveal key={s.u} delay={i * 60}>
              <div className="glass h-full px-5 py-7">
                <div className="display text-4xl tabular-nums text-fd-foreground sm:text-5xl">
                  {s.v}
                </div>
                <div className="mt-2 text-sm text-fd-foreground">{s.u}</div>
                <div className="mono-label mt-1 opacity-70">{s.note}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── 04 · Built from five marks ───────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <SectionMark n="04">Five marks, one hundred instruments</SectionMark>
        <Reveal className="mb-8 max-w-2xl">
          <h2 className="display text-[length:var(--text-fluid-h2)]">
            A small vocabulary, composed.
          </h2>
          <p className="mt-4 max-w-xl text-fd-muted-foreground">
            The catalog is built from a handful of honest marks. Learn the five and the other{" "}
            {CATALOG.total - 5} read without training.
          </p>
        </Reveal>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {PRIMITIVES.map((p, i) => (
            <Reveal key={p.name} delay={i * 60}>
              <div className="glass flex h-full flex-col gap-4 px-4 py-5">
                <div className="flex h-11 items-center [&_text]:hidden">{p.node}</div>
                <div className="mt-auto">
                  <div className="font-mono text-sm text-fd-foreground">{p.name}</div>
                  <div className="mono-label mt-1 leading-relaxed tracking-[0.06em] opacity-70">
                    {p.builds}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={80}>
          <Link
            href="/gallery"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-fd-primary link-underline"
          >
            Browse all {CATALOG.total} in the gallery <ArrowRight className="size-4" />
          </Link>
        </Reveal>
      </section>

      {/* ── 05 · Where they live ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <SectionMark n="05">One chart, four homes</SectionMark>
        <Reveal className="mb-2 max-w-2xl">
          <h2 className="display text-[length:var(--text-fluid-h2)]">
            Built to live inside your interface.
          </h2>
          <p className="mt-4 max-w-xl text-fd-muted-foreground">
            The same component, doing its job in a sentence, a table cell, a KPI card, and a tab.
          </p>
        </Reveal>
        <Reveal>
          <FourContexts slug="sparkline" />
        </Reveal>
      </section>

      {/* ── 05b · Every surface ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <SectionMark n="05b">One chart, every surface</SectionMark>
        <div className="grid items-start gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-12">
          <Reveal>
            <h2 className="display text-[length:var(--text-fluid-h2)]">
              The same mark in product, report, and docs.
            </h2>
            <p className="mt-4 max-w-md text-fd-muted-foreground">
              The chart a model writes is the one your product renders, your report exports, and
              your docs embed — plain SVG from <code>data</code> alone.
            </p>
          </Reveal>
          <Reveal delay={80}>
            <SurfaceCarousel />
          </Reveal>
        </div>
      </section>

      {/* ── 06 · Honest engineering ──────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <SectionMark n="06">Honest by construction</SectionMark>
        <div className="grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
          <Reveal>
            <h2 className="display text-[length:var(--text-fluid-h2)]">
              Opinions, baked into the defaults.
            </h2>
            <p className="mt-4 max-w-md text-fd-muted-foreground">
              No axes, legends, or gridlines. Areas anchor at zero, color encodes rather than
              decorates, and nothing loops. The same properties that make a chart safe for a model
              to write make it pleasant for a person to use.
            </p>
            <ul className="mt-6 flex flex-col gap-2.5">
              {[
                `${c.core} core, ${c.decision} decision, ${c.expressive} expressive, ${c.frontier} frontier`,
                "Static default ships zero client JavaScript",
                "Interactivity is a separate opt-in entry",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-sm text-fd-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-fd-primary" />
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={80}>
            <dl className="panel divide-y divide-hairline">
              {SPEC.map((s) => (
                <div key={s.k} className="flex items-baseline justify-between gap-4 px-5 py-3.5">
                  <dt className="mono-label">{s.k}</dt>
                  <dd className="text-right text-sm text-fd-foreground">{s.v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="panel grid-paper flex flex-col items-center gap-6 px-6 py-16 text-center">
          <h2 className="display max-w-2xl text-[length:var(--text-fluid-h2)]">
            Give your data a smaller voice.
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/docs/quickstart"
              className="cta-accent inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-transform hover:-translate-y-0.5"
            >
              Get started <ArrowRight className="size-4" />
            </Link>
            <a
              href="/llms.txt"
              className="cta-ghost inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium"
            >
              Open /llms.txt <ArrowUpRight className="size-4" />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
