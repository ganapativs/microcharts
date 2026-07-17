import { SegmentedBar } from "@microcharts/react/segmented-bar";
import { Bullet } from "@microcharts/react/bullet";
import { MicroBox } from "@microcharts/react/micro-box";
import { Progress } from "@microcharts/react/progress";
import { IconArray } from "@microcharts/react/icon-array";
import { SectionMark } from "@/components/home/section-mark";
import { Reveal } from "@/components/ui/reveal";

/**
 * 04 · The principles — and the refusals. The "not shipping" block renders
 * each replacement live: the argument against the pie chart is a real
 * SegmentedBar doing the same job better at word size.
 */

const PRINCIPLES = [
  {
    title: "Honest encoding",
    body: "Every chart has one documented primary channel and a precision rating. Lie factor = 1. Motion and texture may delight, but they never change what the data means.",
  },
  {
    title: "Accessible by default",
    body: "Every chart is an image with a generated sentence for a name. The words a screen reader speaks are the words a crawler indexes and a model can quote back.",
  },
  {
    title: "Server-first",
    body: "Static charts are hook-free, listener-free pure SVG, with zero client JS in RSC. Interactivity is a separate entry you opt into, never a tax you pay by default.",
  },
  {
    title: "Budget-gated",
    body: "Every subpath's gzip size is a CI gate, forever. A chart that gets heavier than its budget fails the build. The numbers on this page are the enforced ones.",
  },
] as const;

const REFUSALS = [
  {
    name: "pie",
    why: "angles are unreadable at word size",
    fix: "SegmentedBar",
    node: (
      <SegmentedBar
        data={[
          { label: "a", value: 62 },
          { label: "b", value: 24 },
          { label: "c", value: 14 },
        ]}
        width={96}
        height={10}
        summary={false}
      />
    ),
  },
  {
    name: "needle gauge",
    why: "spends its pixels on chrome, not data",
    fix: "Bullet",
    node: <Bullet value={72} target={80} bands={[50, 90]} width={96} height={12} summary={false} />,
  },
  {
    name: "violin",
    why: "density curves lie at twenty pixels tall",
    fix: "MicroBox",
    node: (
      <MicroBox data={[2, 4, 5, 5, 6, 7, 7, 8, 9, 12]} width={96} height={14} summary={false} />
    ),
  },
  {
    name: "battery",
    why: "reads as an icon before it reads as a value",
    fix: "Progress",
    node: <Progress value={0.68} width={96} height={10} summary={false} />,
  },
  {
    name: "waffle",
    why: "a hundred squares don't fit in a word",
    fix: "IconArray",
    node: <IconArray value={0.7} total={10} width={96} height={14} summary={false} />,
  },
] as const;

export function HomePrinciplesSection() {
  return (
    <section className="mx-auto max-w-shell px-4 py-14 sm:px-6">
      <SectionMark n="04">the principles</SectionMark>
      <Reveal>
        <h2 className="display max-w-2xl text-[length:var(--text-fluid-h2)]">
          Delight never lies.
        </h2>
      </Reveal>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PRINCIPLES.map((p, i) => (
          <Reveal key={p.title} delay={i * 60} className="panel p-4">
            <h3 className="text-[0.95rem] font-medium text-fd-foreground">{p.title}</h3>
            <p className="mt-1.5 text-[0.82rem] leading-normal text-fd-muted-foreground">
              {p.body}
            </p>
          </Reveal>
        ))}
      </div>

      <Reveal delay={120} className="hv-refusal mt-5 p-5">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h3 className="font-medium text-fd-foreground">Traded up, on purpose.</h3>
          <p className="text-sm text-fd-muted-foreground">
            Five shapes that fail at word size, and the honest chart each one became.
          </p>
        </div>
        <ul className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-5">
          {REFUSALS.map((r) => (
            <li key={r.name} className="flex flex-col gap-2">
              <span className="flex items-baseline gap-2 font-mono text-[0.8rem] leading-none">
                <s className="hv-refusal-name text-fd-muted-foreground">{r.name}</s>
                <span aria-hidden className="text-hairline">
                  →
                </span>
                <span className="font-medium text-fd-primary">{r.fix}</span>
              </span>
              <span aria-hidden className="flex h-7 items-center">
                {r.node}
              </span>
              <span className="text-[0.8rem] leading-snug text-fd-muted-foreground">{r.why}</span>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
