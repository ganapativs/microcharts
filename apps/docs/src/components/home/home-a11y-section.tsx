import { Ear, Keyboard, Radio, Eye, Contrast } from "lucide-react";
import { describeSeries } from "@microcharts/react";
import { Sparkline } from "@microcharts/react/sparkline";
import { SparkBar } from "@microcharts/react/sparkbar";
import { SectionMark } from "@/components/home/section-mark";
import { Reveal } from "@/components/ui/reveal";

/**
 * 05 · Accessible by default. The claim proves itself: each demo chart's
 * announced sentence is `describeSeries(data)` called live — the exact string
 * that is the chart's accessible name, so what you read here is what a screen
 * reader hears. No hand-written alt text anywhere on this page.
 */

const REVENUE = [128, 134, 131, 142, 138, 151, 147, 163];
const DEPLOYS = [4, 6, 2, 8, 5, 9, 3, 7];

const SPOKEN = [
  {
    label: "Sparkline",
    node: <Sparkline data={REVENUE} width={132} height={34} dots="minmax" summary={false} />,
    summary: describeSeries(REVENUE),
  },
  {
    label: "SparkBar",
    node: <SparkBar data={DEPLOYS} width={120} height={34} summary={false} />,
    summary: describeSeries(DEPLOYS),
  },
] as const;

const GUARANTEES = [
  {
    icon: Ear,
    title: "Named by its data",
    body: 'Charts are role="img", named by the generated sentence, so the caption can never drift from the numbers.',
  },
  {
    icon: Keyboard,
    title: "Keyboard, one tab stop",
    body: "Interactive charts take a single focus; arrows rove the units, Enter pins the readout so it survives blur.",
  },
  {
    icon: Radio,
    title: "Announced politely",
    body: "Each change of the active or selected unit is written to a polite live region, throttled so a stream never spams.",
  },
  {
    icon: Eye,
    title: "Never color alone",
    body: "Direction and state are doubled by glyph and position, and strokes clear a 4.5:1 contrast target by default.",
  },
  {
    icon: Contrast,
    title: "System preferences, handled",
    body: "prefers-reduced-motion, forced-colors, and prefers-contrast all work without any setup on your side.",
  },
] as const;

export function HomeA11ySection() {
  return (
    <section className="mx-auto max-w-shell px-4 py-14 sm:px-6">
      <SectionMark>accessible by default</SectionMark>

      <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
        <div>
          <Reveal>
            <h2 className="display text-[length:var(--text-fluid-h2)]">
              Screen readers get a real sentence
            </h2>
            <p className="mt-4 max-w-md text-fd-muted-foreground">
              A chart&rsquo;s accessible name is a sentence generated from its data, on by default.
              You don&rsquo;t write alt text and it can&rsquo;t go stale, because it comes from the
              same numbers the chart draws.
            </p>
          </Reveal>

          <Reveal delay={80}>
            <div className="panel-soft mt-6 overflow-hidden">
              <div className="flex items-center gap-2 border-b border-hairline px-4 py-2.5">
                <Ear className="size-3.5 text-fd-primary" aria-hidden />
                <span className="mono-label">what a screen reader hears</span>
              </div>
              <ul>
                {SPOKEN.map((s) => (
                  <li
                    key={s.label}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-hairline px-4 py-3.5 first:border-t-0"
                  >
                    <span className="flex h-[34px] w-[132px] shrink-0 items-center">{s.node}</span>
                    <span className="min-w-0 flex-1 text-[0.82rem] leading-snug text-fd-muted-foreground">
                      &ldquo;{s.summary}&rdquo;
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        <Reveal delay={120}>
          <ul>
            {GUARANTEES.map((g) => (
              <li
                key={g.title}
                className="flex gap-3.5 border-t border-hairline py-4 first:border-t-0 first:pt-0"
              >
                <g.icon className="mt-1 size-4 shrink-0 text-fd-primary" aria-hidden />
                <div className="min-w-0">
                  <p className="font-medium text-fd-foreground">{g.title}</p>
                  <p className="mt-0.5 text-sm leading-snug text-fd-muted-foreground">{g.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
