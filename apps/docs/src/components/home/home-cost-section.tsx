import { Progress } from "@microcharts/react/progress";
import { Sparkline } from "@microcharts/react/sparkline";
import { SectionMark } from "@/components/home/section-mark";
import { ReceiptsSizeHistogram } from "@/components/home/receipts-size-histogram";
import { Reveal } from "@/components/ui/reveal";
import { SIZE } from "@/lib/docs-facts";

/**
 * 05 · The cost — the size argument, placed AFTER the product has sold
 * itself (grammar → catalog → surfaces → models): by now the reader wants
 * the thing; this section tells them it's nearly free. The weight comparison
 * is drawn by the library itself, to linear scale: honesty is the argument,
 * and the microchart bar being nearly invisible is the point. The receipts
 * strip below is the page's ONE home for the measured numbers (size
 * distribution, dependencies, client JS) — each stat illustrated by a
 * microchart of itself, all derived from docs-facts.ts.
 */

// External reference point, pinned + dated (never hand-wave a competitor):
// recharts 3.9.2, 145 kB min+gzip, 11 dependencies — bundlephobia, 2026-07-15.
const RECHARTS_KB = 145;
const RECHARTS_VERSION = "3.9.2";

export function HomeCostSection() {
  const receipts = [
    {
      big: `${SIZE.min}–${SIZE.max} kB`,
      label: "gzip per chart",
      note: `median ${SIZE.median} kB across all ${SIZE.count} static entries`,
      source: ".size-limit.json · CI-enforced",
      chart: <ReceiptsSizeHistogram />,
    },
    {
      big: "0",
      label: "runtime dependencies",
      note: "dependencies: {} forever; React is a peer",
      source: "package.json · CI-enforced",
      chart: (
        <Sparkline
          data={[0, 0, 0, 0, 0, 0, 0, 0]}
          width={150}
          height={30}
          summary="Runtime dependency count over time: a flat line at zero."
        />
      ),
    },
    {
      big: "0 kB",
      label: "client JS for static charts",
      note: "pure SVG out of an RSC; nothing hydrates",
      source: "static entries are hook-free by contract",
      chart: (
        <Progress
          value={0}
          width={150}
          height={12}
          summary="Client JavaScript required by a static chart: zero percent of anything."
        />
      ),
    },
  ];

  return (
    <section className="mx-auto max-w-shell px-4 py-14 sm:px-6">
      <SectionMark n="05">the cost</SectionMark>
      <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
        <Reveal>
          <h2 className="display text-[length:var(--text-fluid-h2)]">
            Word-sized on screen. Word-sized on the wire.
          </h2>
          <p className="mt-4 max-w-md text-fd-muted-foreground">
            Chart libraries were built for pages that were mostly chart, so the bill never mattered:{" "}
            {RECHARTS_KB} kB and 11 dependencies before the first mark renders. Inside a sentence or
            a table cell, it does.
          </p>
          <p className="mt-3 max-w-md text-fd-muted-foreground">
            Here, every chart&rsquo;s gzip size is a CI gate: a chart that outgrows its budget fails
            the build. The numbers on this page are the enforced ones, measured on every commit.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <div className="panel p-6">
            <p className="mono-label mb-4">what a chart costs, to scale</p>
            {/* minmax(0,1fr) + a shrink-to-fill bar wrapper: the Progress SVG
                carries a fixed viewBox width, so without this the grid can't
                shrink below it and the panel overflows the mobile viewport. */}
            <div className="space-y-3">
              <div className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-3 sm:grid-cols-[6.5rem_minmax(0,1fr)_auto]">
                <span className="text-sm text-fd-muted-foreground">chart stack</span>
                <span className="min-w-0 [&_svg]:!h-auto [&_svg]:!w-full">
                  <Progress
                    value={RECHARTS_KB}
                    max={RECHARTS_KB}
                    label="none"
                    color="var(--mc-neutral)"
                    width={280}
                    height={10}
                    summary={`A typical charting stack: ${RECHARTS_KB} kB gzip: the full bar.`}
                  />
                </span>
                <span className="font-medium tabular-nums text-fd-foreground">
                  {RECHARTS_KB} kB
                </span>
              </div>
              <div className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-3 sm:grid-cols-[6.5rem_minmax(0,1fr)_auto]">
                <span className="text-sm text-fd-muted-foreground">one microchart</span>
                <span className="min-w-0 [&_svg]:!h-auto [&_svg]:!w-full">
                  <Progress
                    value={SIZE.median}
                    max={RECHARTS_KB}
                    label="none"
                    width={280}
                    height={10}
                    summary={`One microchart: ${SIZE.median} kB gzip on the same scale, ${Math.round(RECHARTS_KB / SIZE.median)} times smaller.`}
                  />
                </span>
                <span className="font-medium tabular-nums text-fd-foreground">
                  {SIZE.median} kB
                </span>
              </div>
            </div>
            <p className="mt-3 text-[0.8rem] text-fd-muted-foreground">
              Same scale, on purpose. The second bar being hard to see is the argument.
            </p>
            <p className="mono-label mt-4 opacity-60">
              recharts {RECHARTS_VERSION} via bundlephobia, 2026-07 · microcharts median from
              .size-limit.json, CI-enforced
            </p>
          </div>
        </Reveal>
      </div>

      {/* The receipts — every figure measured by the build, every stat drawn
          by a microchart of itself. */}
      <Reveal delay={140} className="mt-10 border-t border-hairline pt-8">
        <div className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
          {receipts.map((s) => (
            <div key={s.label} className="flex flex-col">
              <p className="display text-[1.75rem] leading-none text-fd-foreground">{s.big}</p>
              <p className="mt-1.5 text-sm font-medium text-fd-foreground">{s.label}</p>
              <p className="mt-1 text-sm leading-snug text-fd-muted-foreground">{s.note}</p>
              <div className="mt-3 flex flex-1 items-end">{s.chart}</div>
              <p className="mono-label mt-2.5 opacity-60">{s.source}</p>
            </div>
          ))}
        </div>
        <p className="mono-label mt-6 opacity-60">
          numbers the build measured, drawn by the library they describe
        </p>
      </Reveal>
    </section>
  );
}
