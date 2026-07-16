import { ArrowUpRight, Download } from "lucide-react";
import { Brandmark } from "@/components/brandmark";
import { SITE } from "@/lib/site";

export function BrandHero() {
  return (
    <section className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 grid-paper opacity-60"
      />
      <div className="relative z-0 mx-auto grid max-w-shell items-center gap-10 px-4 pb-14 pt-16 sm:px-6 sm:pb-16 sm:pt-18 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14">
        <div>
          <span className="mono-label text-fd-primary">Brand kit</span>
          <h1 className="display mt-3 text-balance text-[length:var(--text-fluid-h2)] text-fd-foreground">
            The mark, and how to use it.
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-fd-muted-foreground">
            Logo variants, colors, and type: the same small instrument that sits in the nav. Three
            data cells climb a diagonal, graded faint to solid.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="/brand/microcharts-brand-kit.zip"
              download
              className="cta-accent group inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-transform hover:-translate-y-0.5"
            >
              <Download className="size-4" />
              Download kit
              <span className="font-mono text-xs opacity-70">.zip</span>
            </a>
            <a
              href={SITE.repo}
              target="_blank"
              rel="noreferrer noopener"
              className="cta-ghost inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-fd-foreground"
            >
              Source
              <ArrowUpRight className="size-4 opacity-60" />
            </a>
          </div>
        </div>

        <div className="panel relative flex min-h-[16rem] items-center justify-center overflow-hidden px-6 py-14 sm:min-h-[18rem]">
          <div aria-hidden className="pointer-events-none absolute inset-0 grid-paper opacity-50" />
          <Brandmark size={148} className="relative drop-shadow-sm" />
        </div>
      </div>
    </section>
  );
}
