import { describeSeries } from "@microcharts/react";
import { Sparkline } from "@microcharts/react/sparkline";
import { DEGRADE, FENCE_SERIES } from "./v3-data";

/**
 * Two claims that have to prove themselves, so they do.
 *
 * **Bad data renders anyway.** The three cards pass the literal hostile inputs
 * to the real `<Sparkline curve="smooth">` — `[NaN, 3, Infinity]`, `[]`, `[-4, -4]`. Nothing
 * here is wrapped in try/catch and nothing is a picture of the output. If one of
 * them ever threw, this section of the page would fail to render.
 *
 * **Every chart carries a sentence.** The quoted string is
 * `describeSeries(FENCE_SERIES)` called at build time on the same array the
 * chart beside it draws — so the sentence you read is the accessible name a
 * screen reader is handed, not a paraphrase of it.
 */
export function Degradation() {
  const spoken = describeSeries([...FENCE_SERIES]);

  return (
    <div className="shell mt-16 grid gap-14 lg:mt-28 lg:gap-24">
      <div>
        <h3 className="h3">Bad data renders anyway.</h3>
        <p className="prose mt-4" style={{ maxWidth: "var(--m-prose)" }}>
          A model mid-reply will emit NaN, or an empty array, or a single number. Each renders
          something sensible. Nothing on this page is wrapped in try/catch.
        </p>
        <div className="mt-7 flex flex-wrap gap-3.5">
          {DEGRADE.map((d) => (
            <div key={d.input} className="plate grid min-w-[11.25rem] gap-2.5 px-4 py-3.5">
              <div
                className="font-mono text-[11.5px] leading-none tracking-[-0.03em]"
                style={{ color: "var(--ink-3)" }}
              >
                {d.input}
              </div>
              <div className="flex h-5 items-center">
                <Sparkline data={[...d.data]} width={96} height={20} summary={false} />
              </div>
              <div className="text-[13px] leading-[1.4]" style={{ color: "var(--ink)" }}>
                {d.out}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="h3">The alt text writes itself.</h3>
        <p className="prose mt-4" style={{ maxWidth: "var(--m-prose)" }}>
          It is built from the same numbers the chart draws, so it can&rsquo;t go stale:{" "}
          <em style={{ fontFamily: "var(--fr)", color: "var(--ink)" }}>&ldquo;{spoken}&rdquo;</em>{" "}
          Charts take one tab stop, arrow keys move between values, and nothing is signalled by
          colour alone.
        </p>
        <div className="mt-6 flex items-center gap-4">
          {/* No `title` on purpose: with none, the accessible name is exactly
              the generated summary — the string quoted above, character for
              character, rather than that string with a caption in front. */}
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
