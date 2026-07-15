import { Progress } from "@microcharts/react/progress";
import { SectionMark } from "@/components/home/section-mark";
import { Reveal } from "@/components/ui/reveal";
import { SIZE } from "@/lib/docs-facts";

/**
 * 01 · The problem — charts grew up in dashboards; answers moved into
 * sentences. The weight comparison is drawn by the library itself, to linear
 * scale: honesty is the argument. The microchart bar is nearly invisible —
 * that is the point.
 */

// External reference point, pinned + dated (never hand-wave a competitor):
// recharts 3.9.2, 145 kB min+gzip, 11 dependencies — bundlephobia, 2026-07-15.
const RECHARTS_KB = 145;
const RECHARTS_VERSION = "3.9.2";

export function HomeProblemSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <SectionMark n="01">the problem</SectionMark>
      <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
        <Reveal>
          <h2 className="display text-[length:var(--text-fluid-h2)]">
            Charts grew up in dashboards. Answers moved into sentences.
          </h2>
          <p className="mt-4 max-w-md text-fd-muted-foreground">
            An assistant answers in a paragraph. A table cell has room for one word. A KPI card
            wants a number and a shape, not a toolbar. The chart libraries we have were built for
            pages that were mostly chart — not for interfaces that are mostly words.
          </p>
          <p className="mt-3 max-w-md text-fd-muted-foreground">
            So numbers travel as prose, and readers parse trends out of sentences by hand. The
            missing piece is a chart the size of the word it replaces.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <div className="panel p-6">
            <p className="mono-label mb-4">what a chart costs, to scale</p>
            <div className="space-y-3">
              <div className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3">
                <span className="text-sm text-fd-muted-foreground">chart stack</span>
                <Progress
                  value={RECHARTS_KB}
                  max={RECHARTS_KB}
                  label="none"
                  color="var(--mc-neutral)"
                  width={280}
                  height={10}
                  summary={`A typical charting stack: ${RECHARTS_KB} kB gzip — the full bar.`}
                />
                <span className="font-medium tabular-nums text-fd-foreground">
                  {RECHARTS_KB} kB
                </span>
              </div>
              <div className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3">
                <span className="text-sm text-fd-muted-foreground">one microchart</span>
                <Progress
                  value={SIZE.median}
                  max={RECHARTS_KB}
                  label="none"
                  width={280}
                  height={10}
                  summary={`One microchart: ${SIZE.median} kB gzip on the same scale — ${Math.round(RECHARTS_KB / SIZE.median)} times smaller.`}
                />
                <span className="font-medium tabular-nums text-fd-foreground">
                  {SIZE.median} kB
                </span>
              </div>
            </div>
            <p className="mt-3 text-[0.8rem] text-fd-muted-foreground">
              Same scale, on purpose — the second bar being hard to see is the argument.
            </p>
            <div className="mt-4 grid gap-x-6 gap-y-2 text-sm text-fd-muted-foreground sm:grid-cols-2">
              <p>
                <span className="font-medium text-fd-foreground">{RECHARTS_KB} kB</span> min+gzip
                and 11 dependencies before the first chart renders.
              </p>
              <p>
                <span className="font-medium text-fd-foreground">{SIZE.median} kB</span> median per
                chart, zero dependencies — and 0 kB of client JS when it renders statically.
              </p>
            </div>
            <p className="mono-label mt-4 opacity-60">
              recharts {RECHARTS_VERSION} via bundlephobia, 2026-07 · microcharts median from
              .size-limit.json, CI-enforced
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
