import { ArrowUpRight } from "lucide-react";
import { SectionMark } from "@/components/home/section-mark";
import { ProviderWall } from "@/components/charts/ai-static";
import { PROVIDER_GROUPS } from "@/lib/ai-providers";
import { Reveal } from "@/components/ui/reveal";

/**
 * 05 · Made for models — the page's one dark band. The `dark` class re-scopes
 * the theme tokens, so this is the real hand-tuned dark theme, not a tinted
 * box. Terminal lines land one by one on reveal (hv-term-line).
 */

const SURFACES = [
  {
    path: "/llms.txt",
    note: "the library, summarized for a model's context window",
  },
  {
    path: "/llms-full.txt",
    note: "every doc page, one file — paste it into a system prompt",
  },
  {
    path: "/catalog.json",
    note: "all types with props and data shapes, machine-readable",
  },
] as const;

const CLAIMS = [
  {
    title: "One grammar",
    body: "The same prop means the same thing on every chart. A model that has seen one chart can write them all.",
  },
  {
    title: "Text is the wire format",
    body: "A reply streams as plain text; each chart block becomes the shipped component the moment it closes.",
  },
  {
    title: "Safe to emit",
    body: "data alone renders something correct — bad values degrade to documented behavior, never to a crash in the reply.",
  },
] as const;

const PROVIDER_COUNT = PROVIDER_GROUPS.reduce((n, g) => n + g.names.length, 0);

export function HomeModelsSection({ catalogTotal }: { catalogTotal: number }) {
  return (
    <section className="dark bg-fd-background py-14 text-fd-foreground">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionMark n="05">made for models</SectionMark>
        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
          <Reveal>
            <h2 className="display text-[length:var(--text-fluid-h2)]">
              Built to be written by a model, read by a person.
            </h2>
            <dl className="mt-6 space-y-5">
              {CLAIMS.map((c) => (
                <div key={c.title}>
                  <dt className="font-medium text-fd-foreground">{c.title}</dt>
                  <dd className="mt-1 max-w-md text-sm leading-relaxed text-fd-muted-foreground">
                    {c.body}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delay={80}>
            <div className="panel overflow-hidden">
              <div className="flex items-center border-b border-hairline px-4 py-2.5">
                <span className="mono-label">machine surfaces</span>
              </div>
              <ul className="space-y-4 px-5 py-5 font-mono text-[0.8rem] leading-relaxed">
                {SURFACES.map((s, i) => (
                  <li
                    key={s.path}
                    className="hv-term-line"
                    style={{ "--i": i * 2 } as React.CSSProperties}
                  >
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
                    <p
                      className="hv-term-line mt-0.5 pl-4 text-fd-muted-foreground"
                      style={{ "--i": i * 2 + 1 } as React.CSSProperties}
                    >
                      → {s.note}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mono-label mt-3 opacity-60">
              kept in sync with package.json#exports, gated by tests
            </p>
          </Reveal>
        </div>

        <Reveal delay={120} className="mt-10">
          <p className="mono-label mb-4 opacity-70">
            reads wherever text does · {PROVIDER_COUNT} tools, {catalogTotal} types
          </p>
          <ProviderWall compact />
        </Reveal>
      </div>
    </section>
  );
}
