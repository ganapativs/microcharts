import { Reveal } from "@/components/ui/reveal";
import { SizeFootprintCard } from "@/components/home/size-footprint-card";
import { BENCH } from "@/lib/docs-facts";
import { STATS } from "@/lib/stats";

function SectionMark({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 flex items-center gap-3">
      <span className="mono-label text-fd-primary">{n}</span>
      <span className="h-px flex-1 bg-hairline" />
      <span className="mono-label">{children}</span>
    </div>
  );
}

function StatCard({ v, u, note }: { v: string | number; u: string; note: string }) {
  return (
    <div className="glass flex h-full flex-col justify-center px-4 py-3.5 sm:px-5 sm:py-4">
      <div className="display text-2xl tabular-nums text-fd-foreground sm:text-3xl">{v}</div>
      <div className="mt-1 text-[0.8rem] leading-snug text-fd-foreground">{u}</div>
      <div className="mono-label mt-1 opacity-70">{note}</div>
    </div>
  );
}

export function HomePerformanceSection() {
  const opsK = Math.round((BENCH.describeSeriesOpsPerSecRounded ?? 0) / 1000);

  const side = [
    { v: STATS.deps, u: "runtime dependencies", note: "CI-enforced, forever" },
    {
      v: `${STATS.ssr.ms} ms`,
      u: `${STATS.ssr.rows} sparklines, SSR`,
      note: `~${STATS.avgBytes} B · pnpm bench`,
    },
    {
      v: `${opsK}k/s`,
      u: "accessible summaries",
      note: "describeSeries, measured",
    },
    {
      v: "≤ 6",
      u: "SVG nodes, typical",
      note: "SVG node budget",
    },
  ];

  return (
    <section className="mx-auto max-w-shell px-4 py-14 sm:px-6">
      <SectionMark n="03">Measured, not marketed</SectionMark>
      <Reveal className="mb-8 max-w-2xl">
        <h2 className="display text-[length:var(--text-fluid-h2)]">
          Small enough for hundreds per page.
        </h2>
        <p className="mt-4 max-w-xl text-fd-muted-foreground">
          No chart engine, no D3, just SVG. Every number here regenerates from the repo, and a chart
          that grows past its budget fails the build.
        </p>
      </Reveal>

      <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
        <Reveal className="flex min-w-0 flex-1 flex-col [&_.glass]:h-full">
          <SizeFootprintCard />
        </Reveal>
        <div className="grid w-full auto-rows-fr grid-cols-2 gap-3 md:w-[min(100%,22rem)] md:shrink-0 lg:w-[24rem]">
          {side.map((s, i) => (
            <Reveal key={s.u} delay={40 + i * 40} className="min-h-0 h-full">
              <StatCard {...s} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
