import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Sparkline } from "@microcharts/react/sparkline";
import { SparkBar } from "@microcharts/react/sparkbar";
import { StreamVignette } from "@/components/home/stream-vignette";
import { HeroSilk } from "@/components/home/hero-silk";
import { InstallCommand } from "@/components/ui/copy";
import { Reveal } from "@/components/ui/reveal";

/**
 * The first fold. The headline is STATIC — server-rendered inline charts, one
 * gentle reveal with everything else (a line-by-line word stagger was tried
 * and cut: it lagged the rest of the fold and read as broken). The motion
 * budget belongs to the reply card: the assistant reply streams in a reading
 * serif and its grammar morphs into shipped components. Ground: silk shader
 * under the graph paper, faded out before the fold ends. See DESIGN.md.
 */
const TREND = [3, 5, 4, 8, 6, 9, 7, 11];
export function HomeHero({ catalogTotal }: { catalogTotal: number }) {
  return (
    // -mt-14/pt-14: the fold's ground extends up UNDER the transparent sticky
    // nav (h-14), so the silk meets the top of the viewport with no seam; the
    // nav frosts itself only after scroll.
    <section className="relative -mt-14 overflow-hidden pt-14">
      <div aria-hidden className="hv-silk-fallback pointer-events-none absolute inset-0 -z-30" />
      <HeroSilk className="pointer-events-none absolute inset-0 -z-20" />
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
            {/* Optical tracking: the hero is the largest type on the page, so
                it tracks tighter than the .display baseline (-0.021em) tuned
                for section heads — negative tracking grows with display size
                (Apple type craft). */}
            <h1 className="display mt-5 text-balance text-[2.3rem] leading-[1.05] tracking-[-0.03em] text-fd-foreground sm:text-[3rem] lg:text-[3.65rem] xl:text-[3.9rem]">
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
              Word-sized charts for React. {catalogTotal} types that sit inside a sentence, a table
              cell, or a streamed reply, where a full chart library would be too heavy and too loud.
            </p>
          </Reveal>

          <Reveal delay={180} className="mt-8">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                prefetch={false}
                href="/docs/quickstart#set-up-with-an-ai-agent"
                className="cta-accent group inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-transform hover:-translate-y-0.5"
              >
                <Sparkles className="size-4" />
                Set up with AI
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <InstallCommand />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
              <Link
                prefetch={false}
                href="/gallery"
                className="group inline-flex items-center gap-2 text-fd-muted-foreground transition-colors hover:text-fd-foreground"
              >
                <span className="mono-label">
                  all {catalogTotal} types <span className="text-hairline">·</span>{" "}
                  <span className="underline decoration-1 underline-offset-[5px] [text-decoration-color:color-mix(in_oklab,var(--accent)_45%,transparent)] transition-[text-decoration-color] group-hover:[text-decoration-color:var(--accent)]">
                    browse the gallery
                  </span>
                </span>
                <ArrowRight className="size-3.5 text-fd-primary transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                prefetch={false}
                href="/docs"
                className="group inline-flex items-center gap-2 text-fd-muted-foreground transition-colors hover:text-fd-foreground"
              >
                <span className="mono-label">
                  the full story <span className="text-hairline">·</span>{" "}
                  <span className="underline decoration-1 underline-offset-[5px] [text-decoration-color:color-mix(in_oklab,var(--accent)_45%,transparent)] transition-[text-decoration-color] group-hover:[text-decoration-color:var(--accent)]">
                    read the docs
                  </span>
                </span>
                <ArrowRight className="size-3.5 text-fd-primary transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </Reveal>
        </div>

        <Reveal delay={140}>
          <StreamVignette serif startDelay={900} />
          <p className="mono-label mt-3 text-center opacity-70">
            what a model writes <span className="text-hairline">·</span> what a person reads
          </p>
        </Reveal>
      </div>
    </section>
  );
}
