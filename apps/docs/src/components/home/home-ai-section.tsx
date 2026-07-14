import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StreamVignette } from "@/components/home/stream-vignette";
import { ProviderWall, SurfaceCards } from "@/components/charts/ai-static";
import { Reveal } from "@/components/ui/reveal";

const HOW_MODELS_USE = [
  {
    who: "Chat assistants",
    what: "emit a chart block mid-reply, and it renders in the answer",
  },
  {
    who: "Coding agents & CLIs",
    what: "scaffold components straight from the typed catalog",
  },
  {
    who: "Frameworks & SDKs",
    what: "map tool-call output to a chart per row, no bridge",
  },
];

function SectionMark({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 flex items-center gap-3">
      <span className="mono-label text-fd-primary">{n}</span>
      <span className="h-px flex-1 bg-hairline" />
      <span className="mono-label">{children}</span>
    </div>
  );
}

export function HomeAiSection({ catalogTotal }: { catalogTotal: number }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <SectionMark n="01">Made for machines and people</SectionMark>
      <Reveal className="mb-8 max-w-2xl">
        <h2 className="display text-[length:var(--text-fluid-h2)]">
          Plain text in, shipped components out.
        </h2>
        <p className="mt-4 max-w-xl text-fd-muted-foreground">
          One grammar across {catalogTotal} types means an assistant that has seen one chart can
          write them all. It emits plain text; each block becomes the shipped component the moment
          it closes.
        </p>
      </Reveal>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
        <Reveal>
          <StreamVignette />
        </Reveal>
        <Reveal delay={80} className="flex flex-col gap-4">
          <ul className="panel divide-y divide-hairline">
            {HOW_MODELS_USE.map((r) => (
              <li key={r.who} className="flex flex-col gap-1 px-5 py-4">
                <span className="text-sm font-medium text-fd-foreground">{r.who}</span>
                <span className="text-[0.86rem] leading-relaxed text-fd-muted-foreground">
                  {r.what}
                </span>
              </li>
            ))}
          </ul>
          <Link
            href="/docs/ai"
            className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-fd-primary link-underline"
          >
            The AI-native guide, prompts, and guardrails <ArrowRight className="size-4" />
          </Link>
        </Reveal>
      </div>

      <Reveal delay={120} className="mt-10">
        <div className="mono-label mb-3">runs where models already work</div>
        <ProviderWall />
      </Reveal>
      <Reveal delay={60} className="mt-6">
        <div className="mono-label mb-3">and reads its own docs</div>
        <SurfaceCards />
      </Reveal>
    </section>
  );
}
