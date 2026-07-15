import type { ReactNode } from "react";
import { describeSeries } from "@microcharts/react";
import { Sparkline } from "@microcharts/react/sparkline";
import { SectionMark } from "@/components/home/section-mark";
import { Reveal } from "@/components/ui/reveal";

/**
 * 06 · Safe on any data — the live proof behind §05's "safe to emit" claim.
 * A model streaming a reply cannot promise clean numbers, so the grammar has
 * to survive the hostile ones. Each row feeds a genuinely malformed input to
 * the SAME component, renders whatever it produces, and prints the summary
 * `describeSeries` generates from it. Nothing here is wrapped in a try/catch;
 * the summary text is computed live (never hand-typed) so it can't drift or
 * lie. These are the library's documented edge cases, on the record.
 */

type Value = number | null;

type Case = {
  /** The literal, with the hostile bytes tinted so the eye lands on them. */
  literal: ReactNode;
  /** What the model actually emitted — fed verbatim to render + describe. */
  data: readonly Value[];
  /** One-word tag for the failure mode this row survives. */
  mode: string;
};

/** Tint for the bytes that crash a naive chart: NaN, ±Infinity, null, []. */
function Bad({ children }: { children: ReactNode }) {
  return <span className="text-[color:var(--mc-negative)]">{children}</span>;
}

const CASES: readonly Case[] = [
  {
    literal: (
      <>
        [<Bad>NaN</Bad>, 3, <Bad>Infinity</Bad>]
      </>
    ),
    data: [NaN, 3, Infinity],
    mode: "non-finite",
  },
  {
    literal: <Bad>[]</Bad>,
    data: [],
    mode: "empty",
  },
  {
    literal: <>[7]</>,
    data: [7],
    mode: "single point",
  },
  {
    literal: <>[5, 5, 5, 5]</>,
    data: [5, 5, 5, 5],
    mode: "all equal",
  },
  {
    literal: <>[-4, -4]</>,
    data: [-4, -4],
    mode: "negative",
  },
  {
    literal: (
      <>
        [<Bad>null</Bad>, <Bad>null</Bad>, <Bad>null</Bad>]
      </>
    ),
    data: [null, null, null],
    mode: "all null",
  },
];

export function HomeRobustnessSection() {
  return (
    <section className="mx-auto max-w-shell px-4 py-14 sm:px-6">
      <SectionMark n="06">safe on any data</SectionMark>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1fr)] lg:gap-12">
        <Reveal>
          <h2 className="display text-[length:var(--text-fluid-h2)]">
            Hand it broken data. It degrades, it never crashes.
          </h2>
          <p className="mt-4 max-w-md text-fd-muted-foreground">
            A model streaming a reply can&rsquo;t promise clean numbers. Empty arrays, single
            points, flat series, negatives, even <code className="font-mono text-[0.9em]">NaN</code>{" "}
            and <code className="font-mono text-[0.9em]">Infinity</code>: every one renders
            something correct and writes an honest sentence about itself.
          </p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-fd-muted-foreground">
            No <code className="font-mono text-[0.85em]">try/catch</code> guards this page. The
            chart and the summary below are computed live from the library, so what you read is
            exactly what a screen reader hears and a model can quote back.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-hairline px-5 py-2.5">
              <span className="mono-label">malformed in · rendered + described out</span>
              <span className="mono-label opacity-60">describeSeries</span>
            </div>
            <ul>
              {CASES.map((c, i) => {
                // The one honest source of truth: the chart's default accessible
                // name and the visible sentence are the SAME call, by construction.
                const summary = describeSeries(c.data);
                return (
                  <li
                    key={c.mode}
                    className="hx-stagger grid grid-cols-[minmax(6.5rem,auto)_4rem_7rem_minmax(0,1fr)] items-center gap-x-4 gap-y-0.5 border-t border-hairline px-5 py-3 first:border-t-0 max-sm:grid-cols-[1fr_4rem]"
                    style={{ "--i": i } as React.CSSProperties}
                  >
                    <code className="font-mono text-[0.8rem] leading-tight text-fd-foreground">
                      {c.literal}
                    </code>
                    <span className="flex h-[22px] items-center justify-center">
                      <Sparkline
                        data={c.data}
                        width={56}
                        height={22}
                        dots="minmax"
                        summary={summary}
                      />
                    </span>
                    <span className="mono-label text-[0.62rem] opacity-55 max-sm:col-span-2 max-sm:mt-1">
                      {c.mode}
                    </span>
                    <span className="text-[0.86rem] leading-snug text-fd-muted-foreground max-sm:col-span-2">
                      &ldquo;{summary}&rdquo;
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
          <p className="mono-label mt-3 opacity-60">
            each row is a documented edge case, verified in the test suite
          </p>
        </Reveal>
      </div>
    </section>
  );
}
