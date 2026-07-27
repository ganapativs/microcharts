import { Sparkline } from "@microcharts/react/sparkline";
import { CodeTokens } from "@/components/code-tokens";
import { CopyLine } from "./copy-line";
import { FENCE_SERIES } from "./v3-data";

/**
 * The chart fence. Until it closes, a model's reply is ordinary text; after it
 * closes, the block is the component you shipped.
 *
 * The chart renders on its own line behind an explicit `↳ renders as`, not inline
 * on the closing fence — on the same line it read as part of the code. The series
 * below and the one the fence quotes are the same array, so the rendered mark is
 * genuinely that JSON and not a look-alike.
 *
 * The STATIC entry, and this file is a server component. A hover readout here would
 * report values the JSON two lines above already prints in full.
 */
export function FenceBeat() {
  return (
    <div className="mt-16 sm:mt-24" style={{ maxWidth: "var(--m-prose)" }}>
      <p className="lead">
        Until the chart fence closes, a model&rsquo;s reply is ordinary text. After it closes, the
        block is the component you shipped.
      </p>

      <div className="mt-8 grid gap-3 border-l pl-5 sm:pl-7" style={{ borderColor: "var(--rule)" }}>
        <p
          className="text-[17px] leading-[1.62]"
          style={{ fontFamily: "var(--fr)", color: "var(--ink-2)" }}
        >
          Bookings recovered through November and closed the quarter ahead of plan.
        </p>

        {/* The fence, on the code surface the rest of the page uses. The three
            backtick lines stay unhighlighted — they are the fence, not the
            payload, and colouring them would suggest they were part of the
            grammar a model has to get right. */}
        <pre className="code whitespace-pre-wrap px-4 py-3 leading-[1.7] [overflow-wrap:anywhere]">
          <span style={{ color: "var(--ink-3)" }}>```chart{"\n"}</span>
          <CodeTokens code={`{ "type": "sparkline", "data": [${FENCE_SERIES.join(", ")}] }`} />
          {"\n"}
          <span style={{ color: "var(--ink-3)" }}>```</span>
        </pre>

        <div className="flex flex-wrap items-center gap-3 pt-0.5">
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
        {/* The four machine surfaces this site actually serves, each at its own
            route. `agent-setup.md` pointed at `/docs/ai` — the human page about
            agents, not the file an agent fetches — and `llms-full.txt` was missing
            altogether. */}
        {[
          { href: "/llms.txt", label: "llms.txt" },
          { href: "/llms-full.txt", label: "llms-full.txt" },
          { href: "/catalog.json", label: "catalog.json" },
          { href: "/agent-setup.md", label: "agent-setup.md" },
        ].map((l) => (
          <a key={l.href} href={l.href} className="u" style={{ color: "var(--ink-2)" }}>
            {l.label}
          </a>
        ))}
        {/* A command, so it gets the same copy affordance every other command on
            the page has — reading a shell line off a screen and retyping it is
            work nobody should be asked to do. */}
        <CopyLine text="npx -y @microcharts/mcp" />
      </div>
    </div>
  );
}
