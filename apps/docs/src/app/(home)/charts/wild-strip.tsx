import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { SHOWCASE } from "@/lib/showcase";

/**
 * End-of-gallery strip — the compact twin of the homepage "in the wild"
 * section: after browsing the catalog at true size, see the same charts
 * carrying seven real products. Static cards, no dock/filter coupling.
 */

const TILTS = ["-0.9deg", "0.7deg", "-0.6deg", "0.9deg", "-0.7deg", "0.8deg", "-1deg"] as const;

export function WildStrip() {
  return (
    <section
      aria-label="Example apps built with microcharts"
      className="mx-auto mt-16 max-w-shell px-4 pb-20 sm:px-6"
    >
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-hairline pt-8">
        <span className="mono-label text-fd-primary">the examples</span>
        <p className="text-sm text-fd-muted-foreground">
          Seven example apps put this catalog to work. Every card opens the live example.
        </p>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SHOWCASE.map((app, i) => (
          <a
            key={app.slug}
            href={app.url}
            target="_blank"
            rel="noreferrer noopener"
            className="wild-card wild-card--defer no-underline"
            style={
              {
                "--tilt": TILTS[i % TILTS.length],
                "--shot-l": `url(${app.shotLight})`,
                "--shot-d": `url(${app.shotDark})`,
              } as React.CSSProperties
            }
          >
            <span className="wild-shot" aria-hidden />
            <span className="wild-meta flex items-baseline justify-between gap-3 px-3.5 py-2.5">
              <span className="text-[0.85rem] font-medium text-fd-foreground">{app.name}</span>
              <ArrowUpRight aria-hidden className="wild-arrow size-3.5 shrink-0" />
            </span>
          </a>
        ))}
        {/* the reader's slot, one past the showcase. Completes the 4-col grid. */}
        <Link
          prefetch={false}
          href="/docs/quickstart"
          className="wild-card wild-door items-center justify-center gap-1.5 border-dashed !bg-transparent p-6 no-underline"
          style={{ "--tilt": "0.6deg" } as React.CSSProperties}
        >
          <span className="display text-[1.2rem] leading-none text-fd-foreground">Yours next.</span>
          <span className="mono-label inline-flex items-center gap-1.5 text-[0.6rem] tracking-[0.12em]">
            the quickstart <ArrowRight aria-hidden className="size-3" />
          </span>
        </Link>
      </div>
    </section>
  );
}
