import type { ReactNode } from "react";
import { Sparkline } from "@microcharts/react/sparkline";
import { SparkBar } from "@microcharts/react/sparkbar";
import { Delta } from "@microcharts/react/delta";
import { Bullet } from "@microcharts/react/bullet";
import { SegmentedBar } from "@microcharts/react/segmented-bar";
import { SectionMark } from "@/components/home/section-mark";
import { Reveal } from "@/components/ui/reveal";

/**
 * 07 · Where they live — the pitch is "sits INSIDE an interface," so this
 * section puts real charts inside the surfaces they were built for, all at
 * once: a product dashboard, a written report, and the small placements a
 * chart drops into (a table cell, a KPI figure, a tab, a sentence). No video,
 * no rotation. Every mark is a real static `@microcharts/react` component;
 * the demo IS the product. One motion idea only: cells settle on reveal.
 */

/* Illustrative product/report data — depicting an app, not claiming a fact. */
const MRR = [31, 33, 32, 36, 35, 40, 42, 45, 44, 48];
const LAT = [48, 45, 44, 40, 38, 36, 33, 31];
const BOOKINGS = [18, 22, 20, 27, 25, 31, 29, 34, 33, 38, 41, 46];
const SERVICES = [
  { name: "checkout", data: [48, 45, 44, 40, 38, 36, 33, 31], now: "31ms", d: -0.14 },
  { name: "search", data: [80, 78, 82, 79, 81, 80, 79, 78], now: "78ms", d: 0.01 },
  { name: "auth", data: [12, 13, 12, 14, 13, 15, 14, 16], now: "16ms", d: 0.08 },
];

/** Small caption under every surface so the "where" is always named. */
function Where({ children }: { children: ReactNode }) {
  return <span className="mono-label opacity-60">{children}</span>;
}

/* ── Surface 1 · the product dashboard (the tall, dense cell) ─────────────── */
function ProductSurface() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-fd-foreground">Revenue overview</span>
        <span className="mono-label opacity-60">last 30 days</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="plate-inner flex flex-col gap-1.5 p-3">
          <span className="mono-label opacity-70">MRR</span>
          <div className="flex items-baseline gap-1.5">
            <span className="display text-lg leading-none tabular-nums">$48k</span>
            <Delta value={0.082} summary={false} />
          </div>
          <Sparkline data={MRR} summary={false} width={128} height={22} fill dots="none" />
        </div>
        <div className="plate-inner flex flex-col gap-1.5 p-3">
          <span className="mono-label opacity-70">p95 latency</span>
          <div className="flex items-baseline gap-1.5">
            <span className="display text-lg leading-none tabular-nums">31ms</span>
            <Delta value={-0.14} summary={false} />
          </div>
          <Sparkline data={LAT} summary={false} width={128} height={22} dots="none" />
        </div>
      </div>
      <div className="plate-inner flex flex-col gap-1.5 p-3">
        <span className="mono-label opacity-70">error budget</span>
        <span className="display text-lg leading-none tabular-nums">72%</span>
        <Bullet
          value={72}
          target={90}
          bands={[60, 95]}
          width={220}
          height={12}
          className="w-full"
          summary={false}
        />
      </div>
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-hairline">
          {SERVICES.map((s) => (
            <tr key={s.name}>
              <td className="py-1.5 pr-3 text-fd-muted-foreground">{s.name}</td>
              <td className="py-1.5">
                <Sparkline data={s.data} summary={false} width={72} height={16} dots="none" />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{s.now}</td>
              <td className="py-1.5 pl-3 text-right">
                <Delta value={s.d} summary={false} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Surface 2 · the written report (serif, chart inside the prose) ───────── */
function ReportSurface() {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="mono-label opacity-60">Q3 review · finance</span>
      <h3 className="display text-lg leading-snug text-fd-foreground">
        Revenue held its climb into Q3.
      </h3>
      <p className="hv-reply-body text-[0.95rem] leading-relaxed text-fd-foreground">
        Bookings closed the quarter up{" "}
        <span className="mc-inline">
          <Sparkline data={BOOKINGS} summary={false} width={56} height={15} dots="none" />
        </span>{" "}
        <Delta value={0.184} summary={false} /> against plan, with new-logo mix steady.
      </p>
      <figure className="plate-inner mt-0.5 p-3.5">
        <SparkBar data={BOOKINGS} summary={false} width={340} height={48} className="w-full" />
        <figcaption className="mono-label mt-2 opacity-60">
          monthly bookings, $000 · fig. 3
        </figcaption>
      </figure>
    </div>
  );
}

/* ── Surface 3 · the small placements (cell / KPI / tab / sentence) ───────── */
function PlacementQuad() {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {/* table cell */}
      <div className="plate-inner flex flex-col gap-1.5 p-3">
        <Where>table cell</Where>
        <table className="mc-inline-table w-full text-[0.82rem] tabular-nums">
          <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-hairline">
            <tr>
              <td className="py-1 pr-2 text-fd-muted-foreground">EU</td>
              <td className="py-1">
                <Sparkline
                  data={[12, 14, 13, 18, 20]}
                  summary={false}
                  width={54}
                  height={14}
                  dots="none"
                />
              </td>
            </tr>
            <tr>
              <td className="py-1 pr-2 text-fd-muted-foreground">US</td>
              <td className="py-1">
                <Sparkline
                  data={[22, 19, 24, 21, 27]}
                  summary={false}
                  width={54}
                  height={14}
                  dots="none"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* KPI figure */}
      <div className="plate-inner flex flex-col gap-1.5 p-3">
        <Where>KPI card</Where>
        <div className="flex items-baseline gap-1.5">
          <span className="display text-xl leading-none tabular-nums">114%</span>
          <Delta value={0.03} summary={false} />
        </div>
        <span className="mono-label opacity-70">net revenue retention</span>
      </div>

      {/* tab header */}
      <div className="plate-inner col-span-2 flex flex-col gap-2 p-3">
        <Where>tab header</Where>
        <div className="flex items-center gap-4 text-[0.82rem]">
          <span className="flex items-center gap-1.5 border-b-2 border-[color:var(--accent)] pb-1 font-medium text-fd-foreground">
            Traffic
            <Sparkline
              data={[8, 9, 11, 10, 13, 16]}
              summary={false}
              width={44}
              height={13}
              dots="none"
            />
          </span>
          <span className="flex items-center gap-1.5 pb-1 text-fd-muted-foreground">
            Errors
            <Sparkline
              data={[6, 5, 6, 4, 3, 2]}
              summary={false}
              width={44}
              height={13}
              dots="none"
            />
          </span>
        </div>
      </div>

      {/* inside a sentence */}
      <div className="plate-inner col-span-2 flex flex-col gap-1.5 p-3">
        <Where>a sentence</Where>
        <p className="text-[0.9rem] leading-relaxed text-fd-foreground">
          Deploys are healthy this week{" "}
          <span className="mc-inline">
            <Sparkline
              data={[3, 2, 4, 3, 5, 4, 6]}
              summary={false}
              width={62}
              height={16}
              curve="smooth"
              dots="minmax"
            />
          </span>{" "}
          and error budget is holding.
        </p>
      </div>
    </div>
  );
}

/* ── Surface 4 · a chat reply (compact card: the answer reads in serif, the
      categorical chart it emitted sits under it with a legend) ─────────────── */
function ChatSurface() {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="grid size-6 place-items-center rounded-md bg-[color:var(--accent)]/12 text-[0.7rem] font-semibold text-[color:var(--accent)]"
        >
          AI
        </span>
        <span className="mono-label opacity-70">assistant</span>
      </div>
      <p className="hv-reply-body text-[0.98rem] leading-relaxed text-fd-foreground">
        Traffic split fairly evenly last week, with direct in the lead:
      </p>
      <SegmentedBar
        data={[
          { label: "direct", value: 42 },
          { label: "search", value: 31 },
          { label: "social", value: 15 },
          { label: "referral", value: 12 },
        ]}
        width={340}
        height={16}
        className="w-full"
        summary={false}
      />
      <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-[0.76rem] text-fd-muted-foreground">
        {[
          ["direct", "42%"],
          ["search", "31%"],
          ["social", "15%"],
          ["referral", "12%"],
        ].map(([k, v]) => (
          <span key={k}>
            {k} {v}
          </span>
        ))}
      </div>
    </div>
  );
}

export function HomeSurfacesSection() {
  return (
    <section className="mx-auto max-w-shell px-4 py-14 sm:px-6">
      <SectionMark n="07">where they live</SectionMark>

      {/* One bento, no separate header band: the heading is the top-left cell so
          the flagship product surface fills what was dead space top-right. Two
          height-matched masonry columns (header+report+chat ≈ product+placements),
          each packing independently so no corner is left blank. Every surface
          shows at once — a carousel would hide all but one, a weaker proof that
          the charts live everywhere. Mobile stacks. */}
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <div className="grid items-start gap-4">
          <Reveal className="flex flex-col gap-3 lg:pr-6 lg:pt-1">
            <h2 className="display max-w-md text-[length:var(--text-fluid-h2)]">
              Not a dashboard you visit. A mark inside the thing you were reading.
            </h2>
            <p className="max-w-md text-fd-muted-foreground">
              Word-sized charts sit where the words already are: a product screen, a report, a table
              cell, a KPI, a tab, a sentence. Same components, same grammar, every surface here
              rendered live from the library.
            </p>
          </Reveal>
          <Reveal className="panel flex flex-col gap-3 p-4" delay={140}>
            <Where>rendered report</Where>
            <ReportSurface />
          </Reveal>
          <Reveal className="panel flex flex-col gap-3 p-4" delay={210}>
            <Where>chat reply</Where>
            <ChatSurface />
          </Reveal>
        </div>

        <div className="grid items-start gap-4">
          <Reveal className="panel flex flex-col gap-3 p-4" delay={70}>
            <Where>product UI</Where>
            <ProductSurface />
          </Reveal>
          <Reveal className="panel flex flex-col gap-3 p-4" delay={180}>
            <Where>the small placements</Where>
            <PlacementQuad />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
