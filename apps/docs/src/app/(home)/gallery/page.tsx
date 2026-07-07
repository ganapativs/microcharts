import Link from "next/link";
import type { Metadata } from "next";
import { Sparkline } from "@microcharts/react/sparkline";
import { SparkBar } from "@microcharts/react/sparkbar";
import { Delta } from "@microcharts/react/delta";
import { Bullet } from "@microcharts/react/bullet";
import { ActivityGrid } from "@microcharts/react/activity-grid";
import { docsMeta } from "@/lib/metadata";
import { STABLE_CHARTS, type ChartEntry } from "@/lib/catalog";
import { CHART_GZIP } from "@/lib/stats";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = docsMeta({
  title: "Gallery",
  description:
    "Every shipped microchart, side by side — Sparkline, SparkBar, Delta, Bullet, and ActivityGrid, with the data shape each one answers.",
  path: "/gallery",
});

function Preview({ chart }: { chart: ChartEntry }) {
  switch (chart.slug) {
    case "sparkline":
      return <Sparkline data={chart.demo} width={180} height={48} dots="minmax" summary={false} />;
    case "sparkbar":
      return <SparkBar data={chart.demo} width={180} height={48} summary={false} />;
    case "delta":
      return (
        <span className="text-2xl">
          <Delta value={0.184} summary={false} />
        </span>
      );
    case "bullet":
      return (
        <Bullet value={72} target={80} bands={[50, 90]} width={190} height={22} summary={false} />
      );
    case "activity-grid":
      return <ActivityGrid data={chart.demo} cell={10} summary={false} />;
    default:
      return null;
  }
}

export default function GalleryPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="max-w-2xl">
        <span className="mono-label text-fd-primary">The catalog</span>
        <h1 className="display mt-3 text-fluid-h2 text-[length:var(--text-fluid-h2)]">
          Five shipped. Ninety-six planned.
        </h1>
        <p className="mt-4 text-fd-muted-foreground">
          Each chart earns its place: a unique data story, an honest encoding, and a read that needs
          no training. Here are the five in v1.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STABLE_CHARTS.map((chart, i) => (
          <Reveal key={chart.slug} delay={i * 60}>
            <Link
              href={`/docs/charts/${chart.slug}`}
              className="glass glass-lift group flex h-full flex-col overflow-hidden"
            >
              <div className="flex items-baseline justify-between border-b border-fd-border px-4 py-2.5">
                <span className="mono-label group-hover:text-fd-primary transition-colors">
                  {chart.name}
                </span>
                <span className="mono-label opacity-60">{CHART_GZIP[chart.slug]?.static} kB</span>
              </div>
              <div className="flex min-h-[120px] flex-1 items-center justify-center px-5 py-8">
                <Preview chart={chart} />
              </div>
              <div className="border-t border-fd-border px-4 py-3">
                <p className="text-sm text-fd-foreground">{chart.tagline}</p>
                <p className="mono-label mt-2 opacity-70">{chart.dataShape}</p>
              </div>
            </Link>
          </Reveal>
        ))}

        {/* teaser for the planned catalog */}
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-fd-border p-6 text-center">
          <span className="display text-4xl text-fd-muted-foreground">+91</span>
          <p className="text-sm text-fd-muted-foreground">
            decision, expressive, and frontier charts on the roadmap
          </p>
        </div>
      </div>
    </div>
  );
}
