"use client";
import { Sparkline } from "@microcharts/react/sparkline/interactive";
import { SparkBar } from "@microcharts/react/sparkbar/interactive";
import { Delta } from "@microcharts/react/delta/interactive";
import { Bullet } from "@microcharts/react/bullet/interactive";
import { ActivityGrid } from "@microcharts/react/activity-grid/interactive";
import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";
import { CHART_GZIP } from "@/lib/stats";

const grid = [3, 2, 4, 1, 3, 0, 2, 4, 3, 1, 2, 4, 0, 1, 3, 2, 4, 3, 2, 1, 3, 0, 2, 3, 4, 1, 2, 0];

const cards = [
  {
    slug: "sparkline",
    label: "Sparkline",
    hint: "trend",
    node: (
      <Sparkline
        data={[8, 11, 9, 14, 12, 18, 15, 21, 19, 26, 24, 30]}
        width={150}
        height={44}
        dots="minmax"
        title="Revenue trend"
      />
    ),
  },
  {
    slug: "sparkbar",
    label: "SparkBar",
    hint: "magnitude",
    node: (
      <SparkBar
        data={[5, 8, 3, 9, 6, 11, 4, 10, 7, 12]}
        width={150}
        height={44}
        title="Deploys per day"
      />
    ),
  },
  {
    slug: "bullet",
    label: "Bullet",
    hint: "vs target",
    node: (
      <Bullet
        value={72}
        target={80}
        bands={[50, 90]}
        width={168}
        height={26}
        title="Quota attainment"
      />
    ),
  },
  {
    slug: "activity-grid",
    label: "ActivityGrid",
    hint: "cadence",
    node: <ActivityGrid data={grid} cell={9} title="Commit activity" />,
  },
  {
    slug: "delta",
    label: "Delta",
    hint: "change",
    node: (
      <span className="text-lg">
        <Delta value={0.184} title="Growth vs last week" live />
      </span>
    ),
  },
];

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
      {cards.map((c, i) => (
        <Reveal key={c.slug} delay={i * 70}>
          <Link
            href={`/docs/charts/${c.slug}`}
            className="group block h-full rounded-xl border border-fd-border bg-fd-card transition-colors hover:border-fd-primary/40"
          >
            <div className="flex items-baseline justify-between border-b border-fd-border px-4 py-2.5">
              <span className="mono-label group-hover:text-fd-primary transition-colors">
                {c.label}
              </span>
              <span className="mono-label opacity-60">{CHART_GZIP[c.slug]?.static} kB</span>
            </div>
            <div className="flex min-h-[104px] items-center justify-center px-4 py-6">{c.node}</div>
            <div className="flex items-center justify-between px-4 py-2.5 text-xs text-fd-muted-foreground">
              <span>{c.hint}</span>
              <span className="font-mono opacity-0 transition-opacity group-hover:opacity-100">
                →
              </span>
            </div>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}
