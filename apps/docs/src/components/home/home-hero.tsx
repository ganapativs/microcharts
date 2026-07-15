import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Sparkline } from "@microcharts/react/sparkline";
import { SparkBar } from "@microcharts/react/sparkbar";
import { LivingCatalog } from "@/components/home/living-catalog";
import { InstallCommand } from "@/components/ui/copy";
import { Reveal } from "@/components/ui/reveal";

const TREND = [3, 5, 4, 8, 6, 9, 7, 11];

function Word({ band, children }: { band?: boolean; children: React.ReactNode }) {
  return (
    <span aria-hidden className={band ? "hx-word hx-word--band" : "hx-word"}>
      {children}
    </span>
  );
}

export function HomeHero({ catalogTotal }: { catalogTotal: number }) {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 grid-paper opacity-60"
      />
      <div className="relative mx-auto grid max-w-shell items-center gap-10 px-4 pb-14 pt-16 sm:px-6 sm:pb-16 sm:pt-18 lg:grid-cols-[1.06fr_0.94fr] lg:gap-14">
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
                aria-label="Read the docs — introduction"
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
          <LivingCatalog total={catalogTotal} />
        </Reveal>
      </div>
    </section>
  );
}
