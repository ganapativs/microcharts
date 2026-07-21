import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { SectionMark } from "@/components/home/section-mark";
import { Reveal } from "@/components/ui/reveal";
import { SHOWCASE, type ShowcaseApp } from "@/lib/showcase";
import { CATALOG } from "@/lib/docs-facts";

/**
 * 06 · the examples — seven independent example apps that install the package
 * from npm and, between them, exercise the whole catalog. Cards are pinned
 * field specimens: a slight resting tilt, the app's hero screenshot
 * (theme-swapped), squaring up on hover. Pure server markup — zero client JS.
 */

const TILTS = ["-1.1deg", "0.9deg", "-0.7deg", "1deg", "-0.9deg", "0.8deg"] as const;

/** The reader's slot is one past the showcase, so the copy is derived from
 *  `SHOWCASE.length` rather than typed — adding an example app can't leave
 *  "the eighth is yours" sitting next to a count that says nine. */
const ORDINALS = [
  "first",
  "second",
  "third",
  "fourth",
  "fifth",
  "sixth",
  "seventh",
  "eighth",
  "ninth",
  "tenth",
  "eleventh",
  "twelfth",
] as const;

function ordinal(n: number): string {
  return ORDINALS[n - 1] ?? `${n}th`;
}

const CARDINALS = [
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
] as const;

function cardinal(n: number): string {
  return CARDINALS[n - 1] ?? String(n);
}

function WildCard({ app, tilt, wide }: { app: ShowcaseApp; tilt?: string; wide?: boolean }) {
  return (
    <a
      href={app.url}
      target="_blank"
      rel="noreferrer noopener"
      className={`wild-card no-underline${wide ? " wild-card--wide" : " wild-card--defer"}`}
      style={
        {
          "--tilt": tilt ?? "0deg",
          "--shot-l": `url(${app.shotLight})`,
          "--shot-d": `url(${app.shotDark})`,
        } as React.CSSProperties
      }
    >
      <span className="wild-chrome">
        {/* one live-pulse per section (the marquee); the small cards keep a
            static dot so seven pulses don't compete */}
        <span
          aria-hidden
          className={`size-1.5 shrink-0 rounded-full bg-fd-primary ${wide ? "hx-pulse" : "opacity-80"}`}
        />
        {/* not .mono-label on compact cards — that class is unlayered CSS, so
            its 0.68rem/0.14em beats layered Tailwind utilities and the long
            pages.dev hosts truncate at 4-up width. */}
        <span
          className={
            wide
              ? "mono-label truncate leading-none text-[0.6rem]"
              : "truncate font-mono text-[0.55rem] font-medium uppercase leading-none tracking-[0.06em] text-fd-muted-foreground"
          }
        >
          {app.host}
        </span>
        <ArrowUpRight aria-hidden className="wild-arrow size-3.5 shrink-0" />
      </span>
      <span className="wild-shot" aria-hidden />
      <span
        className={`wild-meta flex min-w-0 flex-col gap-1 ${wide ? "p-5 sm:p-6" : "px-4 py-3.5"}`}
      >
        <span className="flex items-baseline justify-between gap-3">
          <span
            className={`font-medium text-fd-foreground ${wide ? "display text-xl" : "text-[0.95rem]"}`}
          >
            {app.name}
          </span>
          <span
            className={
              wide
                ? "mono-label shrink-0 text-[0.6rem] text-fd-primary"
                : "shrink-0 font-mono text-[0.56rem] font-medium uppercase tracking-[0.08em] text-fd-primary"
            }
          >
            {app.tag}
          </span>
        </span>
        <span
          className={`text-fd-muted-foreground ${wide ? "max-w-md text-sm leading-relaxed" : "text-[0.8rem] leading-snug"}`}
        >
          {app.blurb}
        </span>
        {wide && app.charts && (
          <span className="mt-4 flex flex-wrap gap-1.5">
            {app.charts.map((c) => (
              <span
                key={c}
                className="plate-inner px-2 py-1 font-mono text-[0.62rem] leading-none text-fd-muted-foreground"
              >
                {c}
              </span>
            ))}
          </span>
        )}
      </span>
    </a>
  );
}

export function HomeWildSection() {
  const [featured, ...rest] = SHOWCASE;
  return (
    <section id="examples" className="mx-auto max-w-shell scroll-mt-20 px-4 py-14 sm:px-6">
      <SectionMark n="06">the examples</SectionMark>
      <Reveal>
        <h2 className="display max-w-2xl text-[length:var(--text-fluid-h2)]">
          The catalog, put to work.
        </h2>
        <p className="mt-4 max-w-2xl text-fd-muted-foreground">
          {cardinal(SHOWCASE.length)} example apps, each built with{" "}
          <code className="text-fd-foreground">@microcharts/react</code> installed from npm: a
          trading terminal, a print magazine, an eval console. Between them they exercise all{" "}
          {CATALOG.total} chart types. Every card opens the live example.
        </p>
      </Reveal>

      <div className="mt-8 grid gap-4">
        <Reveal>
          <WildCard app={featured} wide />
        </Reveal>
        {/* Full-bleed; 4-up keeps cards small.
            6 apps leave the last row ragged on lg — the dashed "yours next"
            door closes it on purpose (2 cells wide, the reader's slot). */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {rest.map((app, i) => (
            <Reveal key={app.slug} delay={i * 60} className="h-full">
              <WildCard app={app} tilt={TILTS[i % TILTS.length]} />
            </Reveal>
          ))}
          <Reveal delay={120} className="h-full sm:col-span-2">
            <Link
              prefetch={false}
              href="/docs/quickstart"
              className="wild-card wild-door items-center justify-center gap-2 border-dashed !bg-transparent p-8 text-center no-underline"
              style={{ "--tilt": "0.5deg" } as React.CSSProperties}
            >
              <span className="display text-[1.5rem] leading-none text-fd-foreground">
                The {ordinal(SHOWCASE.length + 1)} is yours.
              </span>
              <span className="max-w-xs text-sm leading-relaxed text-fd-muted-foreground">
                Install from npm, pick a chart, ship it inside a sentence.
              </span>
              <span className="mono-label mt-2 inline-flex items-center gap-1.5 text-[0.62rem] tracking-[0.12em] text-fd-primary">
                the quickstart <ArrowRight aria-hidden className="size-3" />
              </span>
              <span className="mono-label mt-5 text-[0.58rem] tracking-[0.1em] opacity-70">
                {SHOWCASE.length} examples · {CATALOG.total} types · 0 dependencies
              </span>
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
