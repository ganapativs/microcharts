import { Ear, Keyboard, Radio, Eye, Contrast, ScanLine } from "lucide-react";
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
    body: 'Every chart is role="img" with a generated sentence for a name - nothing to caption, nothing to drift.',
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
    body: "prefers-reduced-motion, forced-colors, and prefers-contrast are all respected - no extra work from you.",
  },
] as const;

export function HomeA11ySection() {
  return (
    <section className="mx-auto max-w-shell px-4 py-14 sm:px-6">
      <SectionMark n="05">accessible by default</SectionMark>

      <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
        <div>
          <Reveal>
            <h2 className="display text-[length:var(--text-fluid-h2)]">
              Every chart can say what it shows.
            </h2>
            <p className="mt-4 max-w-md text-fd-muted-foreground">
              Every chart names itself with a sentence generated from its data. It comes built in -
              nothing to wire, nothing to retrofit.
            </p>
          </Reveal>

          <Reveal delay={80}>
            <div className="panel mt-6 overflow-hidden">
              <div className="flex items-center gap-2 border-b border-hairline px-4 py-2.5">
                <Ear className="size-3.5 text-fd-primary" aria-hidden />
                <span className="mono-label">what a screen reader hears</span>
              </div>
              <ul>
                {SPOKEN.map((s, i) => (
                  <li
                    key={s.label}
                    className="hx-stagger flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-hairline px-4 py-3.5 first:border-t-0"
                    style={{ "--i": i } as React.CSSProperties}
                  >
                    <span className="flex h-[34px] w-[132px] shrink-0 items-center">{s.node}</span>
                    <span className="min-w-0 flex-1 text-[0.82rem] leading-snug text-fd-muted-foreground">
                      &ldquo;{s.summary}&rdquo;
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mono-label mt-3 flex items-center gap-1.5 opacity-60">
              <ScanLine className="size-3.5" aria-hidden />
              each sentence is describeSeries(data), the chart&rsquo;s real accessible name
            </p>
          </Reveal>
        </div>

        <Reveal delay={120}>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {GUARANTEES.map((g, i) => (
              <li
                key={g.title}
                className="hx-stagger panel flex gap-3.5 p-4"
                style={{ "--i": i } as React.CSSProperties}
              >
                <g.icon className="mt-0.5 size-4 shrink-0 text-fd-primary" aria-hidden />
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
