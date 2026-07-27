import { SITE } from "@/lib/site";
import { SIZE } from "@/lib/docs-facts";
import { RECHARTS } from "@/lib/competitor-facts";

/**
 * The field of kilobytes — the one object on the page that breaks the shell.
 *
 * `oneChartGzipKb` units, each unit one kilobyte. The first five are inked (what
 * a microchart costs) and the rest are ghosted (what you don't ship), so the
 * comparison is counted rather than asserted: the reader can check the ratio by
 * looking. Running off the right edge to the viewport is the point — the bill
 * does not fit inside the measure.
 *
 * This section holds the page's ONLY link to `.size-limit.json`, and it is in the
 * provenance line at the bottom — the one place a reader goes looking for where a
 * number came from. The fold, the bracket caption and the claim paragraph all
 * state measured figures and none of them link: a figure repeated four times with
 * four links to the same file reads as insistence, not evidence.
 */
const SIZE_LIMIT = `${SITE.repo}/blob/main/.size-limit.json`;

export function BillField() {
  const total = RECHARTS.oneChartGzipKb;
  const inked = Math.round(SIZE.interactiveMedian);
  const ghosted = total - inked;
  // Each caption needs more room than its bracket: the left one is short enough
  // to want ~15 units of room even when only 5 are inked.
  const leftSpan = Math.min(total - 1, Math.max(15, inked + 10));

  return (
    <>
      <div
        className="u-block"
        style={{
          // The field starts on the shell's left axis and runs to the viewport
          // edge — no right padding, on purpose.
          paddingLeft: "max(1.25rem, calc(50% - 620px + 1.25rem))",
          ["--units" as string]: String(total),
        }}
      >
        <div
          className="units items-end"
          style={{ height: "clamp(58px,8vw,124px)" }}
          role="img"
          aria-label={`${total} kilobytes for one chart from a general-purpose toolkit. ${inked} of them is what one microchart costs; the remaining ${ghosted} you do not ship.`}
        >
          {Array.from({ length: inked }, (_, i) => (
            <div key={`ink-${i}`} className="h-full" style={{ background: "var(--mc-accent)" }} />
          ))}
          {Array.from({ length: ghosted }, (_, i) => (
            <div key={`ghost-${i}`} className="h-full" style={{ background: "var(--mc-ghost)" }} />
          ))}
        </div>

        {/* Two brackets under the field: the rule is drawn only where something
            is plotted against it, so the inked span gets the heavier weight. */}
        <div aria-hidden className="units mt-2.5">
          <div
            className="h-[7px] border-t"
            style={{ gridColumn: `1 / span ${inked}`, borderColor: "var(--rule-2)" }}
          />
          <div
            className="h-[7px] border-t"
            style={{
              gridColumn: `${inked + 1} / span ${ghosted}`,
              borderColor: "var(--rule)",
            }}
          />
        </div>

        <div className="units pt-2">
          <div
            className="font-mono text-[11px] leading-[1.45] tracking-[-0.02em]"
            style={{ gridColumn: `1 / span ${leftSpan}`, color: "var(--ink)" }}
          >
            {/* A caption on a bracket, not a citation. It names what the inked
                span of the field is; the file it came from is credited once, in
                the provenance line under the argument. */}
            {inked} kB
          </div>
          <div
            className="pr-5 font-mono text-[11px] leading-[1.45] tracking-[-0.02em]"
            style={{
              gridColumn: `${leftSpan + 1} / span ${total - leftSpan}`,
              color: "var(--ink-3)",
            }}
          >
            {/* One template literal, not `{n} kB you don’t ship`: SWC glues the
                figure to the next word when a text node follows an expression,
                carries an entity, and spans a newline (swc-ssr-spaces.test.ts). */}
            {`${ghosted} kB you don’t ship`}
          </div>
        </div>
      </div>

      <div className="shell u-block grid items-start gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,224px)] lg:gap-x-16">
        <div className="grid gap-6">
          <p
            className="font-mono text-[12px] leading-[1.6] tracking-[-0.03em]"
            style={{ maxWidth: "var(--m-note)", color: "var(--ink-2)" }}
          >
            {/* Claims, unlinked. The provenance line three elements down cites
                `.size-limit.json` and the CI run that produced it, and this
                paragraph used to link BOTH of those same two URLs — the page
                citing one file from four places is a page that sounds unsure of
                it. Say the numbers here; receipt them once, below. */}
            {SIZE.interactiveMin.toFixed(2)}–{SIZE.interactiveMax.toFixed(2)} kB gzip per
            interactive chart. Median {SIZE.interactiveMedian.toFixed(2)}. Enforced in CI.
          </p>

          <p className="lead" style={{ maxWidth: "var(--m-lead)" }}>
            Static charts render in a Server Component and hydrate nothing.{" "}
            <span className="fig">0</span> kB of client JS.
          </p>

          <p
            className="font-mono text-[10px] leading-[1.65] tracking-[-0.01em]"
            style={{ maxWidth: "var(--m-note)", color: "var(--ink-3)" }}
          >
            {RECHARTS.pkg} {RECHARTS.version} one-chart esbuild tree-shake, {RECHARTS.measuredAt} ·
            microcharts median from{" "}
            <a href={SIZE_LIMIT} target="_blank" rel="noreferrer noopener" className="u">
              <code className="font-[inherit]">.size-limit.json</code>
            </a>{" "}
            ·{" "}
            <a
              href={`${SITE.repo}/actions`}
              target="_blank"
              rel="noreferrer noopener"
              className="u"
            >
              the CI run that&nbsp;produced&nbsp;it
            </a>
          </p>
        </div>

        <p
          className="border-t pt-1.5 font-mono text-[12px] leading-[1.65] tracking-[-0.03em]"
          style={{ borderColor: "var(--rule)", color: "var(--ink-2)" }}
        >
          <span className="block pt-2" style={{ color: "var(--ink)" }}>
            dependencies: {"{}"}
          </span>
          {`React is a peer dependency. There’s nothing else to install.`}
        </p>
      </div>
    </>
  );
}
