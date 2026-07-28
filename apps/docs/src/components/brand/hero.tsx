import { ArrowUpRight, Download } from "lucide-react";
import { Brandmark } from "@/components/brandmark";
import { SITE } from "@/lib/site";

/**
 * The brand page's opening. Same shape as every other page on this surface: a
 * mono kicker, a display heading, one lede, then doors. The mark itself sits on
 * a specimen ground beside them — on this page the graph paper is a measuring
 * instrument, which is the one place it earns its keep.
 */
export function BrandHero() {
  return (
    <section className="act-open">
      <div className="shell">
        <div className="grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14">
          <div>
            <p className="kicker">Brand kit</p>
            <h1 className="display-2 mt-3" style={{ maxWidth: "var(--m-head)" }}>
              The mark, and how to use it
            </h1>
            <p className="prose u-lede" style={{ maxWidth: "var(--m-prose)" }}>
              Logo variants, colors, and type: the same small instrument that sits in the nav. Three
              data cells climb a diagonal, graded faint to solid.
            </p>
            <div className="mt-9 flex flex-wrap items-baseline gap-x-9 gap-y-4">
              <a
                href="/brand/microcharts-brand-kit.zip"
                download
                className="door group"
                data-primary
              >
                <Download aria-hidden className="size-[0.9em] shrink-0" />
                <span className="door-label">Download the kit</span>
                <span className="mono-s" style={{ color: "var(--ink-3)" }}>
                  .zip
                </span>
              </a>
              <a href={SITE.repo} target="_blank" rel="noreferrer noopener" className="door group">
                <span className="door-label">Source</span>
                <ArrowUpRight
                  aria-hidden
                  className="size-[1em] shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </a>
            </div>
          </div>

          {/* The grid is drawn wider and taller than the column and faded out on
              every side, so it reads as a field the mark is standing in rather
              than a tile it is sitting on. `overflow: clip` on the column keeps
              the overhang off the page's horizontal scroll. */}
          <div className="relative flex min-h-[18rem] items-center justify-center overflow-clip sm:min-h-[21rem]">
            <span aria-hidden className="bk-field" />
            <Brandmark size={148} className="relative" />
          </div>
        </div>
      </div>
    </section>
  );
}
