import { Progress } from "@microcharts/react/progress";
import { Sparkline } from "@microcharts/react/sparkline";
import { SectionMark } from "@/components/home/section-mark";
import { ReceiptsSizeHistogram } from "@/components/home/receipts-size-histogram";
import { Reveal } from "@/components/ui/reveal";
import { SIZE } from "@/lib/docs-facts";

/** 05 · Size. Weight bar is linear (library vs one Recharts chart). Receipts
 *  below are the measured numbers from docs-facts.ts. */

// External reference point, pinned + dated (never hand-wave a competitor).
// Package: recharts 3.9.2 = 145 kB min+gzip, 11 deps — bundlephobia, 2026-07-15.
// One chart: esbuild minify+gzip of a tree-shaken LineChart set (LineChart, Line,
// XAxis, YAxis, Tooltip, ResponsiveContainer; react external) = ~106 kB — 2026-07-21.
// Recharts ships sideEffects: false, so tree-shaking does run; the shared Redux/d3
// kernel keeps a single chart in the ~70–106 kB band (LineChart alone ≈ 69 kB).
const RECHARTS_ONE_CHART_KB = 106;
const RECHARTS_PACKAGE_KB = 145;
const RECHARTS_DEPS = 11;
const RECHARTS_VERSION = "3.9.2";

export function HomeCostSection() {
  const receipts = [
    {
      big: `${SIZE.interactiveMin}–${SIZE.interactiveMax} kB`,
      label: "gzip per interactive chart",
      note: `median ${SIZE.interactiveMedian} kB · static ${SIZE.min}–${SIZE.max} kB (median ${SIZE.median})`,
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
            Not a head-to-head. Recharts is a full charting toolkit — axes, legends, tooltips, every
            chart type — and it costs about {RECHARTS_ONE_CHART_KB} kB gzip and {RECHARTS_DEPS}{" "}
            dependencies for one tree-shaken LineChart. That bill is fine on a page that&nbsp;is
            mostly chart. Inside a sentence or a table cell, it isn&rsquo;t.
          </p>
          <p className="mt-3 max-w-md text-fd-muted-foreground">
            microcharts is for the other job: when you already know the shape of the answer and just
            need the mark — minimal, honest, small enough to live in the interface. Every
            chart&rsquo;s gzip size is a CI gate; the numbers on this page are the enforced ones.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <div className="panel p-6">
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
                  {SIZE.interactiveMedian} kB
                </span>
              </div>
            </div>
            <p className="mt-3 text-[0.8rem] text-fd-muted-foreground">
              Same scale, different jobs. Recharts keeps the dashboard surface; tree-shaking drops
              unused chart types, but one LineChart still ships the shared Redux/d3 kernel (~
              {RECHARTS_ONE_CHART_KB} kB with axes + tooltip; LineChart alone ~69 kB; package{" "}
              {RECHARTS_PACKAGE_KB} kB / {RECHARTS_DEPS} deps). microcharts is one subpath for the
              inlined mark — static from {SIZE.min} kB.
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
