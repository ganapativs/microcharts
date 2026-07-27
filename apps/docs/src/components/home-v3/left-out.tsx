import Link from "next/link";
import { SegmentedBar } from "@microcharts/react/segmented-bar";
import { SHARES } from "./v3-data";

/**
 * What the catalog leaves out, and what answers the same question instead.
 *
 * The pie is drawn here by hand, in this file, because there is no `Pie` to
 * import — that is the argument. Both marks plot the identical five shares from
 * one `SHARES` list at the identical height, so the comparison is about the
 * encoding and nothing else. Different data in the two panels would prove
 * nothing, and an earlier draft of this beat did exactly that.
 */

const PIE_SIZE = 14;

/** Five wedges at 14px, in the same categorical ramp SegmentedBar uses. */
function FailingPie() {
  const r = PIE_SIZE / 2;
  const total = SHARES.reduce((a, b) => a + b, 0);
  let angle = -Math.PI / 2;
  const wedges = SHARES.map((share, i) => {
    const next = angle + (share / total) * Math.PI * 2;
    const p0 = [r + r * Math.cos(angle), r + r * Math.sin(angle)];
    const p1 = [r + r * Math.cos(next), r + r * Math.sin(next)];
    const large = next - angle > Math.PI ? 1 : 0;
    angle = next;
    return {
      key: `${share}-${i}`,
      d: `M${r} ${r} L${p0[0]!.toFixed(2)} ${p0[1]!.toFixed(2)} A${r} ${r} 0 ${large} 1 ${p1[0]!.toFixed(2)} ${p1[1]!.toFixed(2)} Z`,
      fill: `var(--mc-cat-${(i % 6) + 1})`,
    };
  });

  return (
    <svg
      width={PIE_SIZE}
      height={PIE_SIZE}
      viewBox={`0 0 ${PIE_SIZE} ${PIE_SIZE}`}
      role="img"
      aria-label="A pie chart at 14 pixels. Five shares, none of them readable."
      className="block"
    >
      {wedges.map((w) => (
        <path key={w.key} d={w.d} fill={w.fill} />
      ))}
    </svg>
  );
}

const STANDINS = [
  { gone: "needle gauge", use: "Bullet" },
  { gone: "violin", use: "MicroBox" },
  { gone: "battery", use: "Progress" },
  { gone: "waffle", use: "IconArray" },
] as const;

export function LeftOut({ ceilingPx }: { ceilingPx: number }) {
  return (
    <section className="act">
      <div className="shell">
        {/* The exclusions are a documented decision, not an omission, so the
            clause that states them links to where that decision is written down —
            `design-notes` has a "What we don't ship" section and this is the only
            place on the page that raises the subject. */}
        <p className="prose" style={{ maxWidth: "var(--m-prose)" }}>
          Pie charts, needle gauges, violins and waffles stop being readable at this size, so{" "}
          <Link prefetch={false} href="/docs/design-notes#what-we-dont-ship" className="u">
            {`the catalog doesn’t have them`}
          </Link>
          . Each one has a replacement that answers the same question.
        </p>

        <div className="u-ruled border-t pt-6" style={{ borderColor: "var(--rule)" }}>
          <div className="kicker">same five shares · {SHARES.join(" ")}</div>

          <div className="mt-6 grid gap-7 sm:grid-cols-[repeat(2,minmax(0,max-content))] sm:gap-x-12 lg:gap-x-[4.5rem]">
            <div className="grid justify-items-start gap-3">
              <span className="flex h-[26px] items-center">
                <FailingPie />
              </span>
              <span
                className="font-mono text-[12px] font-medium leading-[1.5] tracking-[-0.03em]"
                style={{ color: "var(--ink-3)" }}
              >
                Pie, 14px
              </span>
              <span
                className="max-w-[24ch] text-[15px] leading-[1.5]"
                style={{ color: "var(--ink-3)" }}
              >
                Which share is largest? You can&rsquo;t tell.
              </span>
            </div>

            <div className="grid justify-items-start gap-3">
              <span className="flex h-[26px] items-center">
                <SegmentedBar
                  data={SHARES.map((value, i) => ({ label: `Share ${i + 1}`, value }))}
                  width={150}
                  height={PIE_SIZE}
                  label="none"
                />
              </span>
              <span
                className="font-mono text-[12px] font-medium leading-[1.5] tracking-[-0.03em]"
                style={{ color: "var(--ink)" }}
              >
                SegmentedBar, 14px
              </span>
              <span
                className="max-w-[24ch] text-[15px] leading-[1.5]"
                style={{ color: "var(--ink)" }}
              >
                The first one, at <span className="fig">{SHARES[0]}%</span>. Same size, same data.
              </span>
            </div>
          </div>
        </div>

        <div
          className="mt-6 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[12px] tracking-[-0.03em]"
          style={{ color: "var(--ink-3)" }}
        >
          {STANDINS.map((s) => (
            <span key={s.gone}>
              {s.gone} → <span style={{ color: "var(--ink-2)" }}>{s.use}</span>
            </span>
          ))}
        </div>

        <p
          className="lead u-ruled border-t pt-7"
          style={{ maxWidth: "var(--m-lead)", borderColor: "var(--rule-2)" }}
        >
          Somewhere around <span className="fig">{ceilingPx}</span> pixels a chart starts wanting
          axes, and that&rsquo;s where you want a full charting library instead.
        </p>
      </div>
    </section>
  );
}
