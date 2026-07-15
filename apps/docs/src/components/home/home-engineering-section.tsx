import { Check } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { CATALOG } from "@/lib/docs-facts";

const SPEC = [
  { k: "Dependencies", v: "0 runtime, CI-enforced" },
  { k: "License", v: "MIT" },
  { k: "React", v: "18 & 19 (peer)" },
  { k: "Modules", v: "ESM, per-chart subpaths" },
  { k: "Rendering", v: "pure SVG, RSC-safe" },
  { k: "Styling", v: "~20 CSS variables" },
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

export function HomeEngineeringSection() {
  const c = CATALOG.collections;

  return (
    <section className="mx-auto max-w-shell px-4 py-14 sm:px-6">
      <SectionMark n="06">Honest by construction</SectionMark>
      <div className="grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
        <Reveal>
          <h2 className="display text-[length:var(--text-fluid-h2)]">
            Opinions, baked into the defaults.
          </h2>
          <p className="mt-4 max-w-md text-fd-muted-foreground">
            No axes, legends, or gridlines. Areas anchor at zero, color encodes rather than
            decorates, and nothing loops. The same properties that make a chart safe for a model to
            write make it pleasant for a person to use.
          </p>
          <ul className="mt-6 flex flex-col gap-2.5">
            {[
              `${c.core} core, ${c.decision} decision, ${c.expressive} expressive, ${c.frontier} frontier`,
              "Static default ships zero client JavaScript",
              "Interactivity is a separate opt-in entry",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-sm text-fd-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-fd-primary" />
                {t}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={80}>
          <dl className="panel divide-y divide-hairline">
            {SPEC.map((s) => (
              <div key={s.k} className="flex items-baseline justify-between gap-4 px-5 py-3.5">
                <dt className="mono-label">{s.k}</dt>
                <dd className="text-right text-sm text-fd-foreground">{s.v}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
