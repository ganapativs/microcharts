import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Sparkline } from "@microcharts/react/sparkline";
import { SparkBar } from "@microcharts/react/sparkbar";
import { StreamVignette } from "@/components/home/stream-vignette";
import { InstallCommand } from "@/components/ui/copy";
import { SetupWithAi } from "@/components/ui/setup-with-ai";
import { Reveal } from "@/components/ui/reveal";

/**
 * The first fold. The headline is STATIC — server-rendered inline charts, one
 * gentle reveal with everything else (a line-by-line word stagger was tried
 * and cut: it lagged the rest of the fold and read as broken). The motion
 * budget belongs to the reply card: the assistant reply streams in a reading
 * serif and its grammar morphs into shipped components. Ground: graph paper
 * masked to the top of the fold. See DESIGN.md.
 */
const TREND = [3, 5, 4, 8, 6, 9, 7, 11];
export function HomeHero({ catalogTotal }: { catalogTotal: number }) {
  return (
    // -mt-14/pt-14: the fold's ground extends up UNDER the transparent sticky
    // nav (h-14), so the grid meets the top of the viewport with no seam; the
    // nav frosts itself only after scroll.
    <section className="relative -mt-14 overflow-hidden pt-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 grid-paper opacity-60"
      />
      <div className="relative mx-auto grid max-w-shell items-center gap-10 px-4 pb-14 pt-16 sm:px-6 sm:pt-18 lg:grid-cols-[1.06fr_0.94fr] lg:gap-14">
        <div>
          <Reveal className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {["Zero dependencies", "AI-native", "Accessible by default", "RSC-safe"].map((t, i) => (
              <span key={t} className="mono-label">
                {i > 0 && <span className="mr-2 text-hairline">/</span>}
                {t}
              </span>
            ))}
          </Reveal>

          <Reveal delay={60}>
            {/* Tighter tracking than .display — scale grows with display size. */}
            <h1 className="display mt-5 text-balance text-[2.05rem] leading-[1.08] tracking-[-0.028em] text-fd-foreground sm:text-[2.65rem] lg:text-[3.2rem] xl:text-[3.45rem]">
              Small enough for a model to{" "}
              <span className="whitespace-nowrap">
                <em className="hv-em">write</em>
                <span aria-hidden className="hx-word">
                  <Sparkline data={TREND} curve="smooth" width={60} height={20} summary={false} />
                </span>
                ,
              </span>{" "}
              sharp enough for a person to{" "}
              <span className="whitespace-nowrap">
                <em className="hv-em">trust</em>
                <span aria-hidden className="hx-word">
                  <SparkBar data={TREND} width={52} height={20} summary={false} />
                </span>
                .
              </span>
            </h1>
          </Reveal>

          <Reveal delay={120}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-fd-muted-foreground">
              {/* literal ’, not &rsquo; — an entity in this text node re-triggers the
                  SWC dropped-space bug after {catalogTotal} (see swc-ssr-spaces.test.ts) */}
              Word-sized React charts - sparklines and inline SVG microcharts. {catalogTotal} types
              that sit inside a sentence, a table cell, or a streamed reply, at sizes where a full
              chart library wouldn’t fit.
            </p>
          </Reveal>

          <Reveal delay={180} className="mt-8">
            {/* Two doors, two intents: "Get started" (accent) converts the
                visitor with a table cell to fill today; "Browse charts" opens
                the catalog for the one who needs to see the goods first. The
                AI door lives in the meta row — the hero's streamed reply and
                act 04 already carry that story, and the quickstart's first
                section IS the agent path, so nothing is lost. */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                prefetch={false}
                href="/docs/quickstart"
                className="cta-accent group inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-transform hover:-translate-y-0.5"
              >
                Get started
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                prefetch={false}
                href="/charts"
                className="cta-ghost group inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium"
              >
                Browse {catalogTotal} charts
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-2">
              <InstallCommand variant="inline" />
              <span className="select-none text-sm text-fd-muted-foreground/40" aria-hidden>
                /
              </span>
              <SetupWithAi
                variant="link"
                tone="muted"
                className="text-[0.72rem] uppercase tracking-[0.08em]"
              />
              <span className="select-none text-sm text-fd-muted-foreground/40" aria-hidden>
                /
              </span>
              <a
                href="#examples"
                className="group inline-flex items-center gap-1 text-[0.72rem] font-medium tracking-[0.08em] text-fd-muted-foreground uppercase transition-colors hover:text-fd-foreground"
              >
                <span className="underline decoration-1 underline-offset-[5px] [text-decoration-color:color-mix(in_oklab,var(--accent)_45%,transparent)] transition-[text-decoration-color] group-hover:[text-decoration-color:var(--accent)]">
                  examples
                </span>
                <ArrowRight className="size-3.5 text-fd-primary transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
          </Reveal>
        </div>

        {/* deferred: the panel server-renders as an empty frame (the scenario
            ghosts are stacked to reserve height, not to be read) and only fills
            once the stream starts. Painting that frame early would just pop. */}
        <Reveal delay={140} deferred>
          <StreamVignette serif startDelay={900} />
          <p className="mono-label mt-3 text-center opacity-70">
            the reply is plain text <span className="text-hairline">·</span> the charts are the
            shipped components
          </p>
        </Reveal>
      </div>
    </section>
  );
}
