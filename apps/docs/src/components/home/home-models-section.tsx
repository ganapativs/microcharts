import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { describeSeries } from "@microcharts/react";
import { Sparkline } from "@microcharts/react/sparkline";
import { SectionMark } from "@/components/home/section-mark";
import { ProviderWall } from "@/components/charts/ai-static";
import { PROVIDER_GROUPS } from "@/lib/ai-providers";
import { Reveal } from "@/components/ui/reveal";
import { CopyAgentSetup } from "@/components/ui/copy-agent-setup";

/** 04 · Models (dark band). Provider wall first, then machine surfaces + a
 *  hostile-data card. `dark` re-scopes real theme tokens. Hostile rows call
 *  `describeSeries` live — no hand-typed summaries. */

const SURFACES = [
  {
    path: "/llms.txt",
    note: "the library, summarized for a model's context window",
  },
  {
    path: "/llms-full.txt",
    note: "every doc page, one file, ready to paste into a system prompt",
  },
  {
    path: "/catalog.json",
    note: "all types with props and data shapes, machine-readable",
  },
  {
    path: "/agent-setup.md",
    note: "the whole setup as one prompt - install, conventions, first chart",
  },
] as const;

type Value = number | null;

type Case = {
  /** The literal, with the hostile bytes tinted so the eye lands on them. */
  literal: ReactNode;
  /** What the model actually emitted — fed verbatim to render + describe. */
  data: readonly Value[];
};

/** Tint for the bytes that crash a naive chart: NaN, ±Infinity, null, []. */
function Bad({ children }: { children: ReactNode }) {
  return <span className="text-[color:var(--mc-negative)]">{children}</span>;
}

// Four maximally-distinct rows (one summary shape each): non-finite → filtered,
// empty → no data, single → one value, flat-negative → covers flat AND minus in
// one line. Kept deliberately small: degradation is a guarantee, not a pitch.
const CASES: readonly Case[] = [
  {
    literal: (
      <>
        [<Bad>NaN</Bad>, 3, <Bad>Infinity</Bad>]
      </>
    ),
    data: [NaN, 3, Infinity],
  },
  {
    literal: <Bad>[]</Bad>,
    data: [],
  },
  {
    literal: <>[7]</>,
    data: [7],
  },
  {
    literal: <>[-4, -4]</>,
    data: [-4, -4],
  },
];

const PROVIDER_COUNT = PROVIDER_GROUPS.reduce((n, g) => n + g.names.length, 0);

/** The three tools the MCP server registers, in call order. */
const MCP_TOOLS = ["find_microchart", "get_microchart", "render_microchart"] as const;

/**
 * The band's third verb. Everything above it is a model *emitting* charts into a
 * surface you control, and the surfaces panel is a model *reading* the API; this
 * is a model *calling* them, for the surfaces you don't control.
 *
 * Deliberately the same `$ command` / `→ note` idiom as the surfaces panel above
 * rather than a new shape — the band already has a grammar, and a third
 * invention would read as three unrelated cards. The page still climaxes on the
 * examples, not here.
 */
function CallItRow() {
  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 className="font-medium text-fd-foreground">
          Callable, where the surface can&rsquo;t run React.
        </h3>
        <a href="/docs/mcp" className="link-underline text-[0.8rem] text-fd-muted-foreground">
          MCP server
        </a>
      </div>
      <div className="panel mt-3 overflow-hidden">
        <div className="flex items-center border-b border-hairline px-4 py-2.5">
          <span className="mono-label">call it · mcp</span>
        </div>
        <ul className="space-y-4 px-5 py-5 font-mono text-[0.8rem] leading-relaxed">
          <li>
            <span className="text-fd-foreground">
              <span aria-hidden className="text-fd-primary">
                ${" "}
              </span>
              npx -y @microcharts/mcp
            </span>
            <p className="mt-0.5 pl-4 text-fd-muted-foreground">→ {MCP_TOOLS.join(" · ")}</p>
          </li>
        </ul>
      </div>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fd-muted-foreground">
        For surfaces with nothing to render React - a desktop assistant, a terminal, an email draft
        - the MCP server picks the right chart and returns a finished SVG, alt text attached.
      </p>
    </div>
  );
}

export function HomeModelsSection() {
  return (
    <section className="dark hv-band py-14 text-fd-foreground">
      <div className="mx-auto max-w-shell px-4 sm:px-6">
        <SectionMark n="04">made for models</SectionMark>

        <Reveal>
          <h2 className="display max-w-2xl text-[length:var(--text-fluid-h2)]">
            Text is the wire format.
          </h2>
          <p className="mt-4 max-w-2xl text-fd-muted-foreground">
            A reply streams as plain text, and each chart block becomes the shipped component the
            moment it closes. It works wherever your models write: {PROVIDER_COUNT} assistants,
            coding agents, and SDKs, no adapter in between.
          </p>
        </Reveal>

        <Reveal delay={80} className="mt-8">
          <ProviderWall compact />
        </Reveal>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
          <Reveal delay={120}>
            <h3 className="font-medium text-fd-foreground">The docs, in model-ready form.</h3>
            <div className="panel mt-3 overflow-hidden">
              <div className="flex items-center border-b border-hairline px-4 py-2.5">
                <span className="mono-label">machine surfaces</span>
              </div>
              <ul className="space-y-4 px-5 py-5 font-mono text-[0.8rem] leading-relaxed">
                {SURFACES.map((s) => (
                  <li key={s.path}>
                    <a
                      href={s.path}
                      className="group inline-flex items-center gap-1.5 text-fd-foreground no-underline hover:text-fd-primary"
                    >
                      <span aria-hidden className="text-fd-primary">
                        $
                      </span>
                      curl microcharts.dev{s.path}
                      <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                    </a>
                    <p className="mt-0.5 pl-4 text-fd-muted-foreground">→ {s.note}</p>
                  </li>
                ))}
              </ul>
            </div>
            {/* The highest-intent action on this band, one click instead of a
                URL you have to know exists: the canonical setup prompt, onto
                the clipboard. */}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              <CopyAgentSetup />
              <p className="mono-label opacity-60">
                kept in sync with package.json#exports, gated by tests
              </p>
            </div>
          </Reveal>

          <Reveal delay={160}>
            <h3 className="font-medium text-fd-foreground">Safe to emit, even mid-stream.</h3>
            <div className="panel mt-3 overflow-hidden">
              <div className="flex items-center border-b border-hairline px-4 py-2.5">
                <span className="mono-label">malformed in · rendered + described out</span>
              </div>
              <ul>
                {CASES.map((c, i) => {
                  // The chart's accessible name and the visible sentence are
                  // the SAME describeSeries call, by construction.
                  const summary = describeSeries(c.data);
                  return (
                    <li
                      key={String(c.data)}
                      className="hx-stagger flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-hairline px-4 py-2.5 first:border-t-0"
                      style={{ "--i": i } as React.CSSProperties}
                    >
                      <code className="w-[8.5rem] shrink-0 font-mono text-[0.75rem] leading-tight text-fd-foreground">
                        {c.literal}
                      </code>
                      <span className="flex h-[18px] w-12 shrink-0 items-center justify-start">
                        <Sparkline
                          data={c.data}
                          width={48}
                          height={18}
                          dots="minmax"
                          summary={summary}
                        />
                      </span>
                      <span className="min-w-0 flex-1 text-[0.8rem] leading-snug text-fd-muted-foreground">
                        &ldquo;{summary}&rdquo;
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <p className="mono-label mt-3 opacity-60">
              no try/catch on this page · documented edge cases, verified in the test suite
            </p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-fd-muted-foreground">
              A model mid-reply can&rsquo;t promise clean numbers - bad values degrade to documented
              behavior, never to a crash in the reply.
            </p>
          </Reveal>
        </div>

        <Reveal delay={200}>
          <CallItRow />
        </Reveal>
      </div>
    </section>
  );
}
