import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Sparkline } from "@microcharts/react/sparkline";
import { SparkBar } from "@microcharts/react/sparkbar";
import { ActivityGrid } from "@microcharts/react/activity-grid";
import { Bullet } from "@microcharts/react/bullet";
import { getModule } from "@/lib/charts/registry";
import { Reveal } from "@/components/ui/reveal";

const TREND = [3, 5, 4, 8, 6, 9, 7, 11];
const CADENCE = [0, 2, 1, 3, 4, 2, 1, 3, 2, 4, 3, 2];
const DotMark = getModule("dot-plot")!.Mark;

const PRIMITIVES = [
  {
    name: "stroke",
    node: <Sparkline data={TREND} curve="smooth" width={104} height={30} summary={false} />,
    builds: "Sparkline, Slope, Horizon, ForecastCone",
  },
  {
    name: "bar",
    node: <SparkBar data={TREND} width={104} height={30} summary={false} />,
    builds: "SparkBar, MiniBar, Funnel, Waterfall",
  },
  {
    name: "cell",
    node: <ActivityGrid data={CADENCE} layout="strip" cell={8} summary={false} />,
    builds: "ActivityGrid, HeatStrip, ConfusionGrid",
  },
  {
    name: "dot",
    node: <DotMark data={[3, 7, 4, 9, 6, 11]} width={104} height={30} />,
    builds: "DotPlot, MicroScatter, Constellation",
  },
  {
    name: "band",
    node: (
      <Bullet value={72} target={80} bands={[50, 90]} width={104} height={14} summary={false} />
    ),
    builds: "Bullet, GradedBand, TimeInRange",
  },
];

function SectionMark({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 flex items-center gap-3">
      <span className="mono-label text-fd-primary">{n}</span>
      <span className="h-px flex-1 bg-hairline" />
      <span className="mono-label">{children}</span>
    </div>
  );
}

export function HomePrimitivesSection({ catalogTotal }: { catalogTotal: number }) {
  return (
    <section className="mx-auto max-w-shell px-4 py-14 sm:px-6">
      <SectionMark n="04">Five marks, one hundred instruments</SectionMark>
      <Reveal className="mb-8 max-w-2xl">
        <h2 className="display text-[length:var(--text-fluid-h2)]">
          A small vocabulary, composed.
        </h2>
        <p className="mt-4 max-w-xl text-fd-muted-foreground">
          The catalog is built from a handful of honest marks. Learn the five and the other{" "}
          {catalogTotal - 5} read without training.
        </p>
      </Reveal>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {PRIMITIVES.map((p, i) => (
          <Reveal key={p.name} delay={i * 60}>
            <div className="glass flex h-full flex-col gap-4 px-4 py-5">
              <div className="flex h-11 items-center [&_text]:hidden">{p.node}</div>
              <div className="mt-auto">
                <div className="font-mono text-sm text-fd-foreground">{p.name}</div>
                <div className="mono-label mt-1 leading-relaxed tracking-[0.06em] opacity-70">
                  {p.builds}
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal delay={80}>
        <Link
          prefetch={false}
          href="/gallery"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-fd-primary link-underline"
        >
          Browse all {catalogTotal} in the gallery <ArrowRight className="size-4" />
        </Link>
      </Reveal>
    </section>
  );
}
