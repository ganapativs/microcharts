import Link from "next/link";
import { Sparkline } from "@microcharts/react/sparkline/interactive";
import { CodeTokens } from "@/components/code-tokens";
import { CopyLine } from "./copy-line";
import { FENCE_SERIES } from "./home-data";

/**
 * The chart fence. Until it closes, a model's reply is ordinary text; after it
 * closes, the block is the component you shipped.
 *
 * The fence and the mark below it read the same `FENCE_SERIES`, so the rendered
 * chart is genuinely that JSON. It uses the INTERACTIVE entry — a mark you cannot
 * touch is a picture of the claim — which also drops the native tooltip the
 * static entry's SVG `<title>` produces, in favour of an `aria-label` on the
 * wrapper.
 *
 * The file itself stays a server component: the import is `'use client'`, this
 * module is not.
 */
export function FenceBeat() {
  return (
    <div className="u-sub" style={{ maxWidth: "var(--m-prose)" }}>
      <p className="lead">
        Inside a{" "}
        <Link prefetch={false} href="/docs/ai" className="ulink">
          chart fence
        </Link>
        {` a model is only writing text. Close the fence and what you get back is the component you shipped.`}
      </p>

      <div className="mt-8 grid gap-3 border-l pl-5 sm:pl-7" style={{ borderColor: "var(--rule)" }}>
        <p
          className="text-[17px] leading-[1.62]"
          style={{ fontFamily: "var(--fr)", color: "var(--ink-2)" }}
        >
          Bookings recovered through November and closed the quarter ahead of plan.
        </p>

        {/* The backtick lines stay unhighlighted — they are the fence, not the
            payload. */}
        <pre className="code whitespace-pre-wrap px-4 py-3 leading-[1.7] [overflow-wrap:anywhere]">
          <span style={{ color: "var(--ink-3)" }}>```chart{"\n"}</span>
          <CodeTokens code={`{ "type": "sparkline", "data": [${FENCE_SERIES.join(", ")}] }`} />
          {"\n"}
          <span style={{ color: "var(--ink-3)" }}>```</span>
        </pre>

        {/* `pt-2`, not `pt-0.5`: the readout chip is absolutely positioned above the
            mark, and at the tighter padding it grazed the fence block above it. */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <span aria-hidden className="text-[13px]" style={{ color: "var(--ink-3)" }}>
            ↳
          </span>
          <span className="kicker">renders as</span>
          <Sparkline
            curve="smooth"
            data={[...FENCE_SERIES]}
            width={120}
            height={26}
            title="Monthly bookings"
          />
        </div>
      </div>

      <div className="mt-7 flex flex-wrap items-baseline gap-x-6 gap-y-3 font-mono text-[12px] tracking-[-0.03em]">
        {/* An index, a catalog, a setup file. `llms-full.txt` is served and left
            off: it is `llms.txt`'s own expansion, not a fourth entry point. */}
        {[
          { href: "/llms.txt", label: "llms.txt" },
          { href: "/catalog.json", label: "catalog.json" },
          { href: "/agent-setup.md", label: "agent-setup.md" },
        ].map((l) => (
          <a key={l.href} href={l.href} className="ulink" style={{ color: "var(--ink-2)" }}>
            {l.label}
          </a>
        ))}
        <CopyLine text="npx -y @microcharts/mcp" />
      </div>
    </div>
  );
}
