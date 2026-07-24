import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { SHOWCASE, coveredCharts, type ShowcaseApp } from "@/lib/showcase";
import { CATALOG } from "@/lib/docs-facts";

/**
 * The on-domain examples hub. Every card is a real page (`/examples/<slug>`),
 * not an off-site jump — so the catalog's proof lives on microcharts.dev, links
 * build the site's own authority, and each app gets a crawlable detail page.
 * Field-specimen cards borrow the homepage marquee language (resting tilt,
 * theme-swapped screenshot, squaring up on hover) but lead somewhere deeper.
 */

const TILTS = ["-1deg", "0.8deg", "-0.7deg", "0.9deg", "-0.8deg", "0.7deg"] as const;

function ExampleCard({ app, tilt, wide }: { app: ShowcaseApp; tilt?: string; wide?: boolean }) {
  return (
    <Link
      prefetch={false}
      href={`/examples/${app.slug}`}
      className={`wild-card no-underline${wide ? " wild-card--wide" : ""}`}
      style={
        {
          "--tilt": tilt ?? "0deg",
          "--shot-l": `url(${app.shotLight})`,
          "--shot-d": `url(${app.shotDark})`,
        } as React.CSSProperties
      }
    >
      <span className="wild-chrome">
        <span
          aria-hidden
          className={`size-1.5 shrink-0 rounded-full bg-fd-primary ${wide ? "hx-pulse" : "opacity-80"}`}
        />
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
        {/* The flagship carries its proof: the marks it fields, like the
            homepage teaser it was reached from. */}
        {wide && (
          <span className="mt-4 flex flex-wrap gap-1.5">
            {app.charts.slice(0, 6).map((c) => (
              <span
                key={c}
                className="plate-inner px-2 py-1 font-mono text-[0.62rem] leading-none text-fd-muted-foreground"
              >
                {c}
              </span>
            ))}
            {app.charts.length > 6 && (
              <span className="self-center font-mono text-[0.62rem] leading-none text-fd-muted-foreground/70">
                +{app.charts.length - 6} more
              </span>
            )}
          </span>
        )}
        <span
          className={`inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-[0.08em] text-fd-muted-foreground/80 ${wide ? "mt-4" : "mt-2"}`}
        >
          {app.charts.length} chart types
          <span aria-hidden className="text-hairline">
            ·
          </span>
          <span className="inline-flex items-center gap-1 text-fd-primary">
            explore <ArrowRight className="size-3" aria-hidden />
          </span>
        </span>
      </span>
    </Link>
  );
}

export function ExamplesGallery() {
  const [featured, ...rest] = SHOWCASE;
  const covered = coveredCharts().size;

  return (
    <div className="g2">
      {/* Same shell + header treatment as /charts (`.g2` / `.g2-head`, mono
          eyebrow → display h1 → intro) so navigating between the two pages
          shifts nothing. */}
      <header className="g2-head">
        <span className="mono-label text-fd-primary">The examples</span>
        <h1 className="display mt-3 text-fluid-h2 text-[length:var(--text-fluid-h2)]">
          The catalog, put to work.
        </h1>
        <p className="mt-3 max-w-3xl text-fd-muted-foreground">
          {SHOWCASE.length} independent apps, each built with{" "}
          <code className="text-fd-foreground">@microcharts/react</code> installed from npm — a
          trading terminal, a print magazine, an eval console. Between them they exercise every one
          of the {CATALOG.total} chart types. Each card opens a walk-through; the walk-through opens
          the live app.
        </p>
      </header>

      {/* Coverage, spent across seven apps — the middle stat is the flex: the
          union is the whole catalog, so say it plainly. */}
      <Reveal delay={60}>
        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
          {[
            { big: String(SHOWCASE.length), label: "example apps" },
            {
              big: `${covered}`,
              label:
                covered === CATALOG.total
                  ? "chart types — all of them"
                  : `of ${CATALOG.total} chart types`,
            },
            { big: "0", label: "runtime dependencies" },
          ].map((s) => (
            <div key={s.label} className="flex items-baseline gap-2">
              <span className="display text-2xl leading-none text-fd-foreground">{s.big}</span>
              <span className="text-sm text-fd-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </Reveal>

      <div className="mt-9 grid gap-4">
        <Reveal>
          <ExampleCard app={featured} wide />
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((app, i) => (
            <Reveal key={app.slug} delay={i * 55} className="h-full">
              <ExampleCard app={app} tilt={TILTS[i % TILTS.length]} />
            </Reveal>
          ))}
        </div>
      </div>

      <Reveal delay={80}>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-8">
          <p className="max-w-md text-sm text-fd-muted-foreground">
            The eighth is yours. Install from npm, pick a mark, ship it inside a sentence.
          </p>
          <Link
            prefetch={false}
            href="/docs/quickstart"
            className="cta-accent group inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-transform hover:-translate-y-0.5"
          >
            Start building
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
