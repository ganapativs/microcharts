import Link from "next/link";
import { describeSeries } from "@microcharts/react";
import { ArrowRight } from "lucide-react";
import { HeroChart, InstrumentStrip } from "@/components/charts/showcase";
import { FourContexts } from "@/components/charts/contexts";
import { AiNative } from "@/components/charts/ai-native";
import { InstallCommand } from "@/components/ui/copy";
import { Reveal } from "@/components/ui/reveal";
import { STATS } from "@/lib/stats";

// The real accessible name microcharts generates — quoted, never hand-written.
const heroData = [3, 5, 4, 8, 6, 9];
const heroSummary = `Weekly revenue. ${describeSeries(heroData)}`;

function SectionMark({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 flex items-center gap-3">
      <span className="mono-label text-fd-primary">{n}</span>
      <span className="h-px flex-1 bg-hairline" />
      <span className="mono-label">{children}</span>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-hairline/60">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 grid-paper opacity-60"
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-20 sm:px-6 sm:pb-24 sm:pt-28">
          <Reveal className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {[
              "Zero dependencies",
              "~1 kB each",
              "RSC-safe",
              "AI-native",
              "Accessible by default",
            ].map((t, i) => (
              <span key={t} className="mono-label">
                {i > 0 && <span className="mr-2 text-hairline">/</span>}
                {t}
              </span>
            ))}
          </Reveal>

          <Reveal delay={60}>
            <h1 className="display mt-6 max-w-4xl text-[length:var(--text-fluid-hero)] text-fd-foreground">
              Word-sized charts <br className="hidden sm:block" />
              for React.
            </h1>
          </Reveal>

          <Reveal delay={120}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-fd-muted-foreground">
              A tiny, handcrafted chart set for dense interfaces — sentences, table cells, KPI
              cards, chat streams. Simple enough for a model to write mid-reply, honest enough for a
              person to trust. Server-rendered and nearly weightless.
            </p>
          </Reveal>

          <Reveal delay={180} className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/docs/quickstart"
              className="cta-accent group inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-transform hover:-translate-y-0.5"
            >
              Get started
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <InstallCommand />
            <Link
              href="/docs/ai"
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-fd-muted-foreground transition-colors hover:text-fd-foreground"
            >
              Watch a model draw one
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Reveal>

          <Reveal delay={260} className="mt-16">
            <div className="panel relative flex items-center justify-center overflow-hidden px-6 py-14">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 grid-paper opacity-70"
              />
              <HeroChart />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Falsifiable numbers ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { v: STATS.deps, u: "runtime deps", note: "CI-enforced, forever" },
            {
              v: `${STATS.ssr.ms} ms`,
              u: `${STATS.ssr.rows} charts, server-rendered`,
              note: "reproducible: pnpm bench",
            },
            { v: "~1 kB", u: "gzip per chart", note: "≤ 2 kB budget gate" },
            { v: "6", u: "SVG nodes, typical", note: "earn every mark" },
          ].map((s) => (
            <div key={s.u} className="glass px-5 py-7">
              <div className="display text-4xl tabular-nums text-fd-foreground sm:text-5xl">
                {s.v}
              </div>
              <div className="mt-2 text-sm text-fd-foreground">{s.u}</div>
              <div className="mono-label mt-1 opacity-70">{s.note}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── AI-native (flagship) ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <SectionMark n="01">Built for machines and people</SectionMark>
        <AiNative />
      </section>

      {/* ── The five ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <SectionMark n="02">The proving five</SectionMark>
        <InstrumentStrip />
      </section>

      {/* ── In context (the thesis) ──────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <SectionMark n="03">One chart, four homes</SectionMark>
        <div className="mb-8 max-w-2xl">
          <h2 className="display text-fluid-h2 text-[length:var(--text-fluid-h2)]">
            Built to live inside your interface.
          </h2>
        </div>
        <Reveal>
          <FourContexts slug="sparkline" />
        </Reveal>
      </section>

      {/* ── Accessibility flagship ───────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <SectionMark n="04">Reads itself aloud</SectionMark>
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <h2 className="display text-fluid-h2 text-[length:var(--text-fluid-h2)]">
              Every chart writes its own description.
            </h2>
            <p className="mt-4 max-w-md text-fd-muted-foreground">
              The default accessible name is generated from the data — no alt text to forget, no
              summary to drift. Screen readers, search crawlers, and LLMs read the same words.
            </p>
            <Link
              href="/docs/accessibility"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-fd-primary link-underline"
            >
              How it works <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="panel p-6">
            <div className="mono-label mb-4">Announced as</div>
            <p className="text-lg leading-relaxed text-fd-foreground">“{heroSummary}”</p>
            <div className="command-well mt-6 p-4 font-mono text-sm text-fd-muted-foreground">
              {`<Sparkline data={[3, 5, 4, 8, 6, 9]} title="Weekly revenue" />`}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="panel grid-paper flex flex-col items-center gap-6 px-6 py-16 text-center">
          <h2 className="display max-w-2xl text-fluid-h2 text-[length:var(--text-fluid-h2)]">
            Give your data a smaller voice.
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/docs/quickstart"
              className="cta-accent inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-transform hover:-translate-y-0.5"
            >
              Read the docs <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/gallery"
              className="cta-ghost inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium"
            >
              Browse the gallery
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
