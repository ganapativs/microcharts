import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { getModule, STABLE_CHARTS } from "@/lib/charts/registry";
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
 * the library's own static charts: zero client JS, and no entrance motion, like
 * every other page on this surface.
 */

function MarkTile({ slug, name }: { slug: string; name: string }) {
  const Preview = getModule(slug)?.Preview;
  const body: ReactNode = Preview ? <Preview /> : null;
  return (
    <Link
      prefetch={false}
      href={`/docs/charts/${slug}`}
      className="ex-mark"
      aria-label={`${name} — chart reference`}
    >
      <span className="ex-mark-body" aria-hidden>
        {body}
      </span>
      <span className="ex-mark-name">{name}</span>
    </Link>
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
    <>
      <section className="act-open">
        <div className="shell">
          <Link prefetch={false} href="/examples" className="door group" data-quiet>
            <ArrowLeft
              aria-hidden
              className="size-3.5 shrink-0 transition-transform duration-200 group-hover:-translate-x-1"
            />
            <span className="door-label">All examples</span>
          </Link>

          <div className="mt-8 grid items-start gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
            <div>
              <p className="kicker">example · {app.tag}</p>
              <h1 className="display-2 mt-3">{app.name}</h1>
              <p className="prose u-lede" style={{ maxWidth: "var(--m-prose)" }}>
                {app.story}
              </p>

              <div className="mt-8 flex flex-wrap items-baseline gap-x-8 gap-y-4">
                <a
                  href={app.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="door group"
                  data-primary
                  data-analytics="cta:example-live"
                >
                  <span className="door-label">Open the live app</span>
                  <ArrowUpRight
                    aria-hidden
                    className="size-[1em] shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </a>
                <span className="mono" style={{ color: "var(--ink-3)" }}>
                  {app.host}
                </span>
              </div>

              {/* The genuinely impressive number is the count itself — one app
                  fields this many distinct marks. (The 106/106 flex belongs on
                  the index.) */}
              <p className="u-block flex items-baseline gap-2.5">
                <span className="figure">{app.charts.length}</span>
                <span className="mono" style={{ color: "var(--ink-3)" }}>
                  of {total} chart types, in one app
                </span>
              </p>
            </div>

            <a
              href={app.url}
              target="_blank"
              rel="noreferrer noopener"
              className="shot-frame"
              aria-label={`Open the live ${app.name} app`}
              data-analytics="cta:example-live"
            >
              <span
                className="shot"
                aria-hidden
                style={
                  {
                    "--shot-l": `url(${app.shotLight})`,
                    "--shot-d": `url(${app.shotDark})`,
                  } as React.CSSProperties
                }
              />
            </a>
          </div>
        </div>
      </section>

      {/* The marks it uses — every one live, linked to its own page. */}
      {linked.length > 0 && (
        <section aria-labelledby="marks" className="act">
          <div className="shell">
            <h2 id="marks" className="h3">
              The charts it uses
            </h2>
            <p className="prose u-lede" style={{ maxWidth: "var(--m-prose)" }}>
              Every type {app.name} imports, drawn here at the size it ships at. Each one opens its
              reference page.
            </p>
            <div className="ex-marks u-block">
              {linked.map((c) => (
                <MarkTile key={c.slug} slug={c.slug} name={c.name} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Prev / next through the showcase. Two doors under a rule, not two
          cards: a card here floated between the marks above it and the footer
          below, belonging to neither. The rule ties it to the section it ends,
          and `u-ruled` is the surface's own step for exactly that. */}
      <div className="shell">
        <nav className="u-ruled grid gap-8 sm:grid-cols-2">
          {prev ? (
            <Link prefetch={false} href={`/examples/${prev.slug}`} className="ex-step group">
              <span className="kicker inline-flex items-center gap-1.5">
                <ArrowLeft
                  aria-hidden
                  className="size-3 transition-transform duration-200 group-hover:-translate-x-0.5"
                />
                Previous
              </span>
              <span className="ex-step-name">{prev.name}</span>
              <span className="mono" style={{ color: "var(--ink-3)" }}>
                {prev.tag}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              prefetch={false}
              href={`/examples/${next.slug}`}
              className="ex-step group items-end text-right"
            >
              <span className="kicker inline-flex items-center gap-1.5">
                Next
                <ArrowRight
                  aria-hidden
                  className="size-3 transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </span>
              <span className="ex-step-name">{next.name}</span>
              <span className="mono" style={{ color: "var(--ink-3)" }}>
                {next.tag}
              </span>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </div>
    </>
  );
}
