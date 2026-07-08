"use client";
import { Sparkline } from "@microcharts/react/sparkline/interactive";
import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";
import { CHART_MODULES } from "@/lib/charts/registry";
import { CHART_GZIP } from "@/lib/stats";

/** Curated homepage order — trend, magnitude, target, cadence, change. */
const STRIP = ["sparkline", "sparkbar", "bullet", "activity-grid", "delta"] as const;

/** The hero centerpiece — a wide, elegant, interactive sparkline. */
export function HeroChart() {
  return (
    <Sparkline
      data={[12, 15, 13, 18, 16, 22, 19, 24, 21, 28, 25, 31, 29, 36, 33, 41]}
      width={520}
      height={120}
      curve="smooth"
      dots="minmax"
      label="last"
      className="w-full max-w-2xl"
      title="Monthly active developers"
    />
  );
}

export function InstrumentStrip() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {STRIP.map((slug, i) => {
        const mod = CHART_MODULES[slug];
        if (!mod) return null;
        const Node = mod.showcase.Node;
        return (
          <Reveal key={slug} delay={i * 70}>
            <Link
              href={`/docs/charts/${slug}`}
              className="glass glass-lift group flex h-full flex-col overflow-hidden"
            >
              <div className="flex items-baseline justify-between border-b border-hairline px-4 py-2.5">
                <span className="mono-label group-hover:text-fd-primary transition-colors">
                  {mod.entry.name}
                </span>
                <span className="mono-label opacity-60">{CHART_GZIP[slug]?.static} kB</span>
              </div>
              <div className="flex min-h-[104px] flex-1 items-center justify-center px-4 py-6">
                <Node />
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 text-xs text-fd-muted-foreground">
                <span>{mod.showcase.hint}</span>
                <span className="font-mono opacity-0 transition-opacity group-hover:opacity-100">
                  →
                </span>
              </div>
            </Link>
          </Reveal>
        );
      })}
    </div>
  );
}
