import Link from "next/link";
import { Sparkline } from "@microcharts/react/sparkline/interactive";
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
 * The INTERACTIVE entry. The beat's claim is that what came out of the fence is the
 * component you shipped, and a mark you cannot touch is a picture of one — so the
 * mark scrubs, and its readout lands on the same twelve numbers the JSON above
 * prints. That the two agree is the point, not a duplication of it.
 *
 * It also settles a smaller thing. The static entry renders an SVG `<title>`, which
 * the browser turns into a native tooltip — so hovering this mark used to pop a
 * grey OS bubble reading "Monthly bookings", which is chrome no chart drew and
 * nothing a reader could do anything with. The interactive entry carries the same
 * name as an `aria-label` on its wrapper instead: identical to a screen reader, no
 * tooltip, and the hover now returns a value.
 *
 * The file itself stays a server component — the import is `'use client'`, this
 * module is not.
 */
export function FenceBeat() {
  return (
    <div className="u-sub" style={{ maxWidth: "var(--m-prose)" }}>
      {/* The link sits on the thing the beat is named after. `/docs/ai` is where
          the fence grammar is specified, and it is reachable from the masthead as
          a nav item — this is the one place on the page where a reader is looking
          at a fence and might want the spec for it. */}
      <p className="lead">
        Inside a{" "}
        <Link prefetch={false} href="/docs/ai" className="u">
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
        {/* The machine surfaces this site actually serves, each at its own route.
            `agent-setup.md` pointed at `/docs/ai` — the human page about agents,
            not the file an agent fetches.

            `llms-full.txt` is served, and deliberately not listed here: it is
            `llms.txt`'s own expansion, so on a row of four it read as a second
            entry point rather than the same one at length. The three left are
            three different things — an index, a catalog, a setup file. */}
        {[
          { href: "/llms.txt", label: "llms.txt" },
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
