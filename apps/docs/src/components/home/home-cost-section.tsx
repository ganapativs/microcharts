import { Progress } from "@microcharts/react/progress";
import { SectionMark } from "@/components/home/section-mark";
import { Reveal } from "@/components/ui/reveal";
import { SIZE } from "@/lib/docs-facts";
import { RECHARTS } from "@/lib/competitor-facts";

/** The cost section. Weight bar is linear (library vs one Recharts chart).
 *  Receipts below are the measured numbers from docs-facts.ts. Bars and
 *  figures render settled — a size comparison is evidence, and evidence
 *  doesn't need a count-up (the animated version read as showmanship). */

const RECHARTS_ONE_CHART_KB = RECHARTS.oneChartGzipKb;
const RECHARTS_PACKAGE_KB = RECHARTS.packageGzipKb;
const RECHARTS_DEPS = RECHARTS.runtimeDeps;
const RECHARTS_VERSION = RECHARTS.version;

export function HomeCostSection() {
  const receipts = [
    {
      big: `${SIZE.interactiveMin}–${SIZE.interactiveMax} kB`,
      label: "gzip per interactive chart",
      note: `median ${SIZE.interactiveMedian} kB · static ${SIZE.min}–${SIZE.max} kB (median ${SIZE.median})`,
    },
    {
      big: "0",
      label: "runtime dependencies",
      // The literal is set in mono: `{}` in the body sans reads as a typo, and
      // it IS code — package.json's own field. 0.9em because JetBrains Mono's
      // x-height runs taller than Hanken's, so 1em would look oversized beside
      // the two plain-sans notes either side of it.
      note: (
        <>
          {/* mr nudge: the mono space inside the literal is wider than the sans
              space that follows it, so the braces looked lopsided without it. */}
          <code className="font-mono text-[0.9em] text-fd-foreground/70 mr-[0.08em]">
            dependencies: {"{}"}
          </code>{" "}
          forever; React is a peer
        </>
      ),
    },
    {
      big: "0 kB",
      label: "client JS for static charts",
      note: "pure SVG out of an RSC; nothing hydrates",
    },
  ];

  return (
    <section className="mx-auto max-w-shell px-4 py-14 sm:px-6">
      <SectionMark>the cost</SectionMark>
      <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
        <Reveal>
          <h2 className="display text-[length:var(--text-fluid-h2)]">
            {SIZE.interactiveMin}–{SIZE.interactiveMax} kB per interactive chart, enforced in CI
          </h2>
          <p className="mt-4 max-w-md text-fd-muted-foreground">
            Recharts is a full charting toolkit, and its bill is fair for what it carries: one
            tree-shaken LineChart still costs about {RECHARTS_ONE_CHART_KB} kB gzip and
            {/* template literal: SWC drops the leading space of an entity-bearing
                multiline text node after an expression — see swc-ssr-spaces.test.ts */}
            {` ${RECHARTS_DEPS} dependencies`}, because the shared kernel comes along. On a page
            that&nbsp;is mostly chart, that&rsquo;s fine. Inside a sentence or a table cell,
            it&rsquo;s most of your budget.
          </p>
          <p className="mt-3 max-w-md text-fd-muted-foreground">
            microcharts covers the other job: you already know the shape of the answer and just need
            the mark, small enough to live in the interface.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <div className="panel-soft p-6">
            <p className="mono-label mb-4">what it costs to draw one chart, to scale</p>
            {/* minmax(0,1fr) + a shrink-to-fill bar wrapper: the Progress SVG
                carries a fixed viewBox width, so without this the grid can't
                shrink below it and the panel overflows the mobile viewport. */}
            <div className="space-y-3">
              <div className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-3 sm:grid-cols-[6.5rem_minmax(0,1fr)_auto]">
                <span className="text-sm text-fd-muted-foreground">recharts, one LineChart</span>
                <span className="min-w-0 [&_svg]:!h-auto [&_svg]:!w-full">
                  <Progress
                    value={RECHARTS_ONE_CHART_KB}
                    max={RECHARTS_ONE_CHART_KB}
                    label="none"
                    color="var(--mc-neutral)"
                    width={280}
                    height={10}
                    summary={`recharts, one tree-shaken LineChart: ${RECHARTS_ONE_CHART_KB} kB gzip: the full bar.`}
                  />
                </span>
                <span className="font-medium tabular-nums text-fd-foreground">
                  {RECHARTS_ONE_CHART_KB} kB
                </span>
              </div>
              <div className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-3 sm:grid-cols-[6.5rem_minmax(0,1fr)_auto]">
                <span className="text-sm text-fd-muted-foreground">
                  microcharts, one interactive
                </span>
                <span className="min-w-0 [&_svg]:!h-auto [&_svg]:!w-full">
                  <Progress
                    value={SIZE.interactiveMedian}
                    max={RECHARTS_ONE_CHART_KB}
                    label="none"
                    width={280}
                    height={10}
                    summary={`microcharts, one interactive subpath: ${SIZE.interactiveMedian} kB gzip on the same scale, ${Math.round(RECHARTS_ONE_CHART_KB / SIZE.interactiveMedian)} times smaller.`}
                  />
                </span>
                <span className="font-medium tabular-nums text-fd-foreground">
                  {SIZE.interactiveMedian.toFixed(2)} kB
                </span>
              </div>
            </div>
            <p className="mt-3 text-[0.8rem] text-fd-muted-foreground">
              Both bars share one scale. Tree-shaking drops Recharts&rsquo; unused chart types, but
              a single LineChart still ships the shared Redux/d3 kernel; a microcharts subpath is
              just the inlined mark, static from {SIZE.min} kB.
            </p>
            <p className="mono-label mt-4 opacity-60">
              recharts {RECHARTS_VERSION} one-chart: esbuild tree-shake, 2026-07 · package{" "}
              {RECHARTS_PACKAGE_KB} kB via bundlephobia · microcharts interactive median from
              .size-limit.json, CI-enforced
            </p>
          </div>
        </Reveal>
      </div>

      <Reveal delay={140} className="mt-10 border-t border-hairline pt-8">
        <div className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
          {receipts.map((s) => (
            <div key={s.label} className="flex flex-col">
              <p className="display text-[1.75rem] leading-none text-fd-foreground">{s.big}</p>
              <p className="mt-1.5 text-sm font-medium text-fd-foreground">{s.label}</p>
              <p className="mt-1 text-sm leading-snug text-fd-muted-foreground">{s.note}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
