import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { getModule, STABLE_CHARTS } from "@/lib/charts/registry";
import { Reveal } from "@/components/ui/reveal";
import { SHOWCASE, type ShowcaseApp } from "@/lib/showcase";
import { CATALOG } from "@/lib/docs-facts";

/** Only stable charts have a catalog page — that's exactly what we can link to
 *  (matches the gallery's linkable set). Every currently-shipped slug resolves;
 *  the filter guards against a future composite that has no page, so no tile can
 *  become a dead end. */
const PAGED = new Map(STABLE_CHARTS.map((c) => [c.slug, c] as const));

/**
 * One example, walked through. The hero screenshot is theme-aware (light/dark
 * twin) and links to the live app; the story is the app's own; "the marks it
 * uses" resolves each imported slug against the catalog registry — rendering the
 * real static Preview and linking to that chart's page. Pure server markup +
 * the library's own static charts: zero client JS.
 */

function MarkTile({ slug, name, delay }: { slug: string; name: string; delay: number }) {
  const Preview = getModule(slug)?.Preview;
  const body: ReactNode = Preview ? <Preview /> : null;
  return (
    <Reveal className="h-full" delay={delay}>
      <Link
        prefetch={false}
        href={`/docs/charts/${slug}`}
        className="ex-mark h-full"
        aria-label={`${name} — chart reference`}
      >
        <span className="ex-mark-body" aria-hidden>
          {body}
        </span>
        <span className="ex-mark-name">{name}</span>
      </Link>
    </Reveal>
  );
}

export function ExampleView({ app }: { app: ShowcaseApp }) {
  const i = SHOWCASE.findIndex((a) => a.slug === app.slug);
  const prev = i > 0 ? SHOWCASE[i - 1] : null;
  const next = i < SHOWCASE.length - 1 ? SHOWCASE[i + 1] : null;

  // Only the marks that actually have a catalog page — that's what we can link.
  const linked = app.charts.map((s) => PAGED.get(s)).filter((c) => c !== undefined);
  const total = CATALOG.total;

  return (
    // `.g2` shell — same gutters as the /examples index and /charts, so edges
    // don't jump on navigation.
    <div className="g2 pt-8 sm:pt-10">
      <Reveal>
        <Link
          prefetch={false}
          href="/examples"
          className="group inline-flex items-center gap-1.5 text-[0.72rem] font-medium uppercase tracking-[0.1em] text-fd-muted-foreground transition-colors hover:text-fd-foreground"
        >
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
          All examples
        </Link>
      </Reveal>

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
        <div>
          <Reveal delay={40}>
            <p className="mono-label text-fd-primary">example · {app.tag}</p>
            <h1 className="display mt-3 text-[length:var(--text-fluid-h2)] text-fd-foreground">
              {app.name}
            </h1>
            <p className="mt-4 max-w-xl text-fd-muted-foreground">{app.story}</p>
          </Reveal>

          <Reveal delay={100} className="mt-6">
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={app.url}
                target="_blank"
                rel="noreferrer noopener"
                className="cta-accent group inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-transform hover:-translate-y-0.5"
              >
                Open the live app
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <span className="font-mono text-[0.72rem] text-fd-muted-foreground">{app.host}</span>
            </div>
          </Reveal>

          {/* The genuinely impressive number is the count itself — one app fields
              this many distinct marks. (The 106/106 flex belongs on the index.) */}
          <Reveal delay={140} className="mt-8">
            <p className="flex items-baseline gap-2.5">
              <span className="display text-3xl leading-none text-fd-foreground">
                {app.charts.length}
              </span>
              <span className="text-sm text-fd-muted-foreground">
                of {total} chart types, in one app
              </span>
            </p>
          </Reveal>
        </div>

        <Reveal delay={80}>
          <a
            href={app.url}
            target="_blank"
            rel="noreferrer noopener"
            className="ex-shot-frame"
            aria-label={`Open the live ${app.name} app`}
          >
            <span
              className="ex-shot"
              aria-hidden
              style={
                {
                  "--shot-l": `url(${app.shotLight})`,
                  "--shot-d": `url(${app.shotDark})`,
                } as React.CSSProperties
              }
            />
          </a>
        </Reveal>
      </div>

      {/* The marks it uses — every one live, linked to its own page. */}
      {linked.length > 0 && (
        <section className="mt-14 border-t border-hairline pt-8">
          <Reveal>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="display text-xl text-fd-foreground">The marks it uses</h2>
              <p className="max-w-md text-sm text-fd-muted-foreground">
                Every chart type {app.name} imports, live and linked. Same components, same grammar
                — tap one for its page.
              </p>
            </div>
          </Reveal>
          <div className="ex-marks mt-6">
            {linked.map((c, idx) => (
              <MarkTile key={c.slug} slug={c.slug} name={c.name} delay={Math.min(idx * 24, 320)} />
            ))}
          </div>
        </section>
      )}

      {/* Prev / next through the showcase. */}
      <nav className="mt-14 grid gap-4 border-t border-hairline pt-8 sm:grid-cols-2">
        {prev ? (
          <Link
            prefetch={false}
            href={`/examples/${prev.slug}`}
            className="ex-nav group flex flex-col gap-1 px-5 py-4 no-underline"
          >
            <span className="inline-flex items-center gap-1.5 text-[0.68rem] font-medium uppercase tracking-[0.1em] text-fd-muted-foreground">
              <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
              Previous
            </span>
            <span className="font-medium text-fd-foreground">{prev.name}</span>
            <span className="text-sm text-fd-muted-foreground">{prev.tag}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            prefetch={false}
            href={`/examples/${next.slug}`}
            className="ex-nav group flex flex-col items-end gap-1 px-5 py-4 text-right no-underline"
          >
            <span className="inline-flex items-center gap-1.5 text-[0.68rem] font-medium uppercase tracking-[0.1em] text-fd-muted-foreground">
              Next
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
            <span className="font-medium text-fd-foreground">{next.name}</span>
            <span className="text-sm text-fd-muted-foreground">{next.tag}</span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
