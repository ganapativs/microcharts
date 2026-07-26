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
          {/* The four claims, above the headline. Load-bearing — a visitor who
              reads nothing else gets the whole pitch from this line. Keep it. */}
          <Reveal className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {["Zero dependencies", "AI-native", "Accessible by default", "RSC-safe"].map((t, i) => (
              <span key={t} className="mono-label">
                {i > 0 && <span className="mr-2 text-hairline">/</span>}
                {t}
              </span>
            ))}
          </Reveal>

          <Reveal delay={60}>
            {/* Tighter tracking than .display — tracking follows display size.
                Tops out at 3rem, between the old 3.45 (shouted) and a first
                pass at 2.6 (went thin against the reply panel): the fold is
                still the loudest thing on the site, by a step and a half rather
                than three. The inline charts follow on their own — .hx-word
                sizes them in em. */}
            <h1 className="display mt-5 text-balance text-[2.05rem] leading-[1.1] tracking-[-0.022em] text-fd-foreground sm:text-[2.45rem] lg:text-[2.8rem] xl:text-[3rem]">
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
              Word-sized React charts. {catalogTotal} types that fit inside a sentence, a table
              cell, or a streamed reply.
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
            </div>
          </Reveal>
        </div>

        {/* The panel paints with the rest of the fold. It used to be `deferred`
            — hidden in the server HTML, faded in on hydration — which cost the
            whole JS download before the frame existed and read as a section
            arriving late. The server markup IS the panel at its final size
            (chrome + ghost-reserved height); only the reply text needs JS, and
            it starts typing the moment hydration lands. */}
        <Reveal>
          <StreamVignette serif />
        </Reveal>
      </div>
    </section>
  );
}
