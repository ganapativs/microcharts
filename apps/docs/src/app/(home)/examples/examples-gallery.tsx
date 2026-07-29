import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SITE } from "@/lib/site";
import { SHOWCASE, coveredCharts, type ShowcaseApp } from "@/lib/showcase";
import { CATALOG } from "@/lib/docs-facts";

/**
 * The on-domain examples hub. Every card is a real page (`/examples/<slug>`),
 * not an off-site jump — so the catalog's proof lives on microcharts.dev, links
 * build the site's own authority, and each app gets a crawlable detail page.
 *
 * The plates are the landing page's Act IV plates with a screenshot in them:
 * flush rows, one edge, no tilt and no lift. The reader has just seen these same
 * seven apps on `/`, and they should not have changed clothes on the way here.
 */

function ExamplePlate({ app, wide, defer }: { app: ShowcaseApp; wide?: boolean; defer?: boolean }) {
  return (
    <Link
      prefetch={false}
      href={`/examples/${app.slug}`}
      className={`plate group flex h-full flex-col overflow-clip${wide ? " plate--wide" : ""}${
        defer ? " plate--defer" : ""
      }`}
      style={
        {
          "--shot-l": `url(${app.shotLight})`,
          "--shot-d": `url(${app.shotDark})`,
        } as React.CSSProperties
      }
    >
      {/* The chrome strip: the host it runs on, and the arrow. No status dot —
          it reported nothing, it was a browser-chrome ornament, and the host
          name is already the proof that this is a deployed app. */}
      <span className="plate-chrome">
        <span className="kicker truncate">{app.host}</span>
        <ArrowRight
          aria-hidden
          className="ml-auto size-3.5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
          style={{ color: "var(--ink-3)" }}
        />
      </span>

      <span className="shot" aria-hidden />

      <span
        className={`plate-shelf flex min-w-0 flex-col gap-1.5 ${wide ? "p-5 sm:p-6" : "px-4 py-4"}`}
      >
        <span className="flex items-baseline justify-between gap-3">
          <span
            className="font-mono font-medium leading-none tracking-[-0.03em] transition-colors group-hover:text-[var(--mc-accent)]"
            style={{ color: "var(--ink)", fontSize: wide ? "15px" : "13px" }}
          >
            {app.name}
          </span>
          <span className="kicker shrink-0">{app.tag}</span>
        </span>
        <span
          className={wide ? "prose max-w-md text-[0.92rem]" : "prose text-[0.84rem]"}
          style={{ lineHeight: 1.5 }}
        >
          {app.blurb}
        </span>

        {/* The flagship carries its proof: the marks it fields. */}
        {wide && (
          <span className="mt-4 flex flex-wrap gap-1.5">
            {app.charts.slice(0, 6).map((c) => (
              <span key={c} className="chip">
                {c}
              </span>
            ))}
            {app.charts.length > 6 && (
              <span className="chip" style={{ background: "transparent" }}>
                +{app.charts.length - 6} more
              </span>
            )}
          </span>
        )}

        <span className={`kicker ${wide ? "mt-4" : "mt-2.5"}`}>
          {app.charts.length} chart types
        </span>
      </span>
    </Link>
  );
}

export function ExamplesGallery() {
  const [featured, ...rest] = SHOWCASE;
  const covered = coveredCharts().size;

  return (
    <>
      <section className="act-open">
        <div className="shell">
          <h1 className="display-2" style={{ maxWidth: "var(--m-head)" }}>
            What it looks like in a real app
          </h1>
          <p className="prose u-lede" style={{ maxWidth: "var(--m-prose)" }}>
            {SHOWCASE.length} apps, each one installing{" "}
            <code className="font-mono text-[0.82em]" style={{ color: "var(--ink)" }}>
              {SITE.pkg}
            </code>{" "}
            from npm the way you would. There is a trading terminal in here, a print magazine, an
            eval console, and between them they use every one of the {CATALOG.total} chart types.
            Each card opens a walk-through, and the walk-through opens the running app.
          </p>

          {/* Coverage, spent across seven apps — the middle figure is the flex:
              the union is the whole catalog, so say it plainly. Mono, because no
              numeral on this surface is ever set in the display face. */}
          <div className="u-block flex flex-wrap items-baseline gap-x-10 gap-y-4">
            {[
              { big: String(SHOWCASE.length), label: "example apps" },
              {
                big: `${covered}`,
                label:
                  covered === CATALOG.total
                    ? "chart types, all of them"
                    : `of ${CATALOG.total} chart types`,
              },
              { big: "0", label: "runtime dependencies" },
            ].map((s) => (
              <p key={s.label} className="flex items-baseline gap-2.5">
                <span className="figure">{s.big}</span>
                <span className="mono" style={{ color: "var(--ink-3)" }}>
                  {s.label}
                </span>
              </p>
            ))}
          </div>
        </div>
      </section>

      <div className="shell u-sub grid gap-4">
        <ExamplePlate app={featured} wide />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((app) => (
            <ExamplePlate key={app.slug} app={app} defer />
          ))}
        </div>
      </div>

      <section className="act">
        <div className="shell">
          <p className="lead" style={{ maxWidth: "var(--m-lead)" }}>
            The quickstart gets a first chart into one of your sentences.
          </p>
          <div className="mt-6">
            <Link prefetch={false} href="/docs/quickstart" className="door group" data-primary>
              <span className="door-label">Start building</span>
              <ArrowRight
                aria-hidden
                className="size-[1em] shrink-0 transition-transform duration-200 group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
