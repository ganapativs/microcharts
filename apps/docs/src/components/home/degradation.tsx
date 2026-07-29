import Link from "next/link";
import { describeSeries } from "@microcharts/react";
import { Sparkline } from "@microcharts/react/sparkline";
import { DEGRADE, FENCE_SERIES } from "./home-data";

/**
 * Two claims that prove themselves.
 *
 * **Bad data renders anyway.** The three cards pass the literal hostile inputs to
 * the real `<Sparkline>`. Nothing is wrapped in try/catch and nothing is a
 * picture of the output — if one ever threw, this section would fail to render.
 *
 * **Every chart carries a sentence.** The quoted string is
 * `describeSeries(FENCE_SERIES)`, called at build time on the same array the
 * chart beside it draws, so it is the accessible name itself.
 */
export function Degradation() {
  const spoken = describeSeries([...FENCE_SERIES]);

  return (
    <div className="shell u-sub grid gap-14 lg:gap-24">
      <div>
        <h3 className="h3">Bad data renders anyway.</h3>
        <p className="prose mt-4" style={{ maxWidth: "var(--m-prose)" }}>
          A model mid-reply will send NaN, or an empty array, or a single number. All three render
          something sensible, and nothing on this page is wrapped in try/catch.
        </p>
        {/* Three equal columns: sized by content they came out 317/344/288px
            wide, because `[NaN, 3, Infinity]` is a longer string than `[]`. */}
        <div className="mt-7 grid max-w-[46rem] gap-3.5 sm:grid-cols-3">
          {DEGRADE.map((d) => (
            <div key={d.input} className="plate grid gap-2.5 px-4 py-3.5">
              <div
                className="font-mono text-[11.5px] leading-none tracking-[-0.03em]"
                style={{ color: "var(--ink-3)" }}
              >
                {d.input}
              </div>
              <div className="flex h-5 items-center">
                <Sparkline data={[...d.data]} width={96} height={20} summary={false} />
              </div>
              {/* Two lines reserved from `sm` up, where the three sit side by
                  side and only the middle caption wraps. Below `sm` they stack
                  and reserving would only add a hole. */}
              <div
                className="text-[13px] leading-[1.4] sm:min-h-[37px]"
                style={{ color: "var(--ink)" }}
              >
                {d.out}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="h3">The alt text writes itself.</h3>
        <p className="prose mt-4" style={{ maxWidth: "var(--m-prose)" }}>
          {`It comes from the numbers the chart already has, so it can’t go stale: `}
          <em style={{ fontFamily: "var(--fr)", color: "var(--ink)" }}>
            &ldquo;{spoken}&rdquo;
          </em>{" "}
          The rest of the{" "}
          <Link prefetch={false} href="/docs/accessibility" className="ulink">
            accessibility work
          </Link>{" "}
          is done too: one tab stop per chart, arrow keys to move between values, and nothing shown
          by color alone. Forced colors and RTL are handled.
        </p>
        <div className="mt-6 flex items-center gap-4">
          {/* No `title` on purpose: with none, the accessible name is exactly the
              generated summary quoted above, character for character. */}
          <Sparkline
            curve="smooth"
            data={[...FENCE_SERIES]}
            width={132}
            height={34}
            dots="minmax"
          />
          <span className="mono-s" style={{ color: "var(--ink-3)" }}>
            ← this one, named by that sentence
          </span>
        </div>
      </div>
    </div>
  );
}
