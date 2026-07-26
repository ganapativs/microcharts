import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionMark } from "@/components/home/section-mark";
import { Reveal } from "@/components/ui/reveal";
import { SHOWCASE, type ShowcaseApp } from "@/lib/showcase";
import { CATALOG } from "@/lib/docs-facts";

/**
 * The examples section — independent example apps that install the package
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
    // On-domain now: the card leads to the app's walk-through page (which then
    // opens the live app), so the homepage feeds the /examples hub instead of
    // being a second gallery that jumps straight off-site.
    <Link
      prefetch={false}
      href={`/examples/${app.slug}`}
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
        {/* static dot on every card — the pulse read as noise, not signal */}
        <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-fd-primary opacity-80" />
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
        <ArrowRight aria-hidden className="wild-arrow size-3.5 shrink-0" />
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
        {wide && app.charts.length > 0 && (
          <span className="mt-4 flex flex-wrap items-center gap-1.5">
            {app.charts.slice(0, 6).map((c) => (
              <span
                key={c}
                className="plate-inner px-2 py-1 font-mono text-[0.62rem] leading-none text-fd-muted-foreground"
              >
                {c}
              </span>
            ))}
            {app.charts.length > 6 && (
              <span className="font-mono text-[0.62rem] leading-none text-fd-muted-foreground/70">
                +{app.charts.length - 6} more
              </span>
            )}
          </span>
        )}
      </span>
    </Link>
  );
}

export function HomeWildSection() {
  return (
    <section id="examples" className="mx-auto max-w-shell scroll-mt-20 px-4 pb-20 pt-16 sm:px-6">
      <SectionMark>the examples</SectionMark>
      <Reveal>
        <h2 className="display max-w-2xl text-[length:var(--text-fluid-h2)]">
          {cardinal(SHOWCASE.length)} real apps, all {CATALOG.total} charts
        </h2>
        <p className="mt-4 max-w-2xl text-fd-muted-foreground">
          We built {SHOWCASE.length} example apps with{" "}
          <code className="text-fd-foreground">@microcharts/react</code> installed from npm, and
          between them they use every chart type in the catalog. Each card opens the live app, or
          you can{" "}
          <Link
            prefetch={false}
            href="/examples"
            className="font-medium text-fd-primary underline decoration-1 underline-offset-[3px] hover:text-fd-foreground"
          >
            walk through them as pages
          </Link>
          .
        </p>
      </Reveal>

      {/* One even grid — the wide featured card went in the 2026-07 density
          pass. 7 apps + the reader's dashed door = 8 cells, two clean rows. */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SHOWCASE.map((app, i) => (
          <Reveal key={app.slug} className="h-full">
            <WildCard app={app} tilt={TILTS[i % TILTS.length]} />
          </Reveal>
        ))}
        <Reveal className="h-full">
          <Link
            prefetch={false}
            href="/docs/quickstart"
            className="wild-card wild-door h-full items-center justify-center gap-2 border-dashed !bg-transparent p-6 text-center no-underline"
            style={{ "--tilt": "0.5deg" } as React.CSSProperties}
          >
            <span className="display text-[1.35rem] leading-tight text-fd-foreground">
              Build the {ordinal(SHOWCASE.length + 1)}
            </span>
            <span className="max-w-xs text-sm leading-relaxed text-fd-muted-foreground">
              Install from npm and put a chart in a sentence of your own.
            </span>
            <span className="mono-label mt-2 inline-flex items-center gap-1.5 text-[0.62rem] tracking-[0.12em] text-fd-primary">
              the quickstart <ArrowRight aria-hidden className="size-3" />
            </span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
