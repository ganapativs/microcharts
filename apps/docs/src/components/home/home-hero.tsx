import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { TypesetHeadline } from "@/components/home/typeset-headline";
import { StreamVignette } from "@/components/home/stream-vignette";
import { InstallCommand } from "@/components/ui/copy";
import { Reveal } from "@/components/ui/reveal";

/**
 * The first fold — "The Typeset Answer". One choreography in reading order:
 * the sentence typesets itself (words settle, inline charts draw, a caret
 * blinks at the full stop), then the assistant reply streams in a reading
 * serif and its grammar morphs into shipped components. See DESIGN.md.
 */
export function HomeHero({ catalogTotal }: { catalogTotal: number }) {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 grid-paper opacity-60"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-10 pt-16 sm:px-6 sm:pt-18 lg:grid-cols-[1.06fr_0.94fr] lg:gap-14">
        <div>
          <Reveal className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {["Zero dependencies", "AI-native", "Accessible by default", "RSC-safe"].map((t, i) => (
              <span key={t} className="mono-label">
                {i > 0 && <span className="mr-2 text-hairline">/</span>}
                {t}
              </span>
            ))}
          </Reveal>

          <div className="mt-5">
            <TypesetHeadline />
          </div>

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
            <div className="mt-4">
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
          <StreamVignette serif startDelay={1900} />
          <p className="mono-label mt-3 text-center opacity-70">
            what a model writes <span className="text-hairline">·</span> what a person reads
          </p>
        </Reveal>
      </div>

      <div aria-hidden className="flex justify-center pb-6 pt-2">
        <span className="hv-cue" />
      </div>
    </section>
  );
}
