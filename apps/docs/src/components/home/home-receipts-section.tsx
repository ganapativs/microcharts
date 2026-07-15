import { Sparkline } from "@microcharts/react/sparkline";
import { SegmentedBar } from "@microcharts/react/segmented-bar";
import { Progress } from "@microcharts/react/progress";
import { SectionMark } from "@/components/home/section-mark";
import { Reveal } from "@/components/ui/reveal";
import { ReceiptsSizeHistogram } from "@/components/home/receipts-size-histogram";
import { CATALOG, SIZE } from "@/lib/docs-facts";

/**
 * 08 · The receipts — every stat is illustrated by a microchart OF ITSELF:
 * the size range is the real measured distribution, the dependency count is a
 * sparkline pinned at zero (the joke lands because it's true), the catalog is
 * its own four tiers. All figures derive from docs-facts.ts — measured, never
 * hand-typed.
 */

export function HomeReceiptsSection() {
  const stats = [
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
      big: String(CATALOG.total),
      label: "chart types",
      note: `core ${CATALOG.collections.core} · decision ${CATALOG.collections.decision} · expressive ${CATALOG.collections.expressive} · frontier ${CATALOG.collections.frontier}`,
      source: "catalog.json · generated from the registry",
      chart: (
        <SegmentedBar
          data={[
            { label: "core", value: CATALOG.collections.core },
            { label: "decision", value: CATALOG.collections.decision },
            { label: "expressive", value: CATALOG.collections.expressive },
            { label: "frontier", value: CATALOG.collections.frontier },
          ]}
          width={150}
          height={12}
          summary={`The ${CATALOG.total} chart types split across four tiers: core ${CATALOG.collections.core}, decision ${CATALOG.collections.decision}, expressive ${CATALOG.collections.expressive}, frontier ${CATALOG.collections.frontier}.`}
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
      <SectionMark n="08">the receipts</SectionMark>
      <Reveal>
        <h2 className="display max-w-2xl text-[length:var(--text-fluid-h2)]">
          Numbers the build measured, drawn by the library they describe.
        </h2>
      </Reveal>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 60} className="panel flex flex-col p-5">
            <p className="display text-[2rem] leading-none text-fd-foreground">{s.big}</p>
            <p className="mt-1.5 text-sm font-medium text-fd-foreground">{s.label}</p>
            <p className="mt-1 text-sm leading-snug text-fd-muted-foreground">{s.note}</p>
            <div className="mt-4 flex flex-1 items-end">{s.chart}</div>
            <p className="mono-label mt-3 opacity-60">{s.source}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
