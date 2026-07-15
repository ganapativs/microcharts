import { SectionMark } from "@/components/home/section-mark";
import { GrammarDemo } from "@/components/home/grammar-demo";
import { Reveal } from "@/components/ui/reveal";

/** 02 · The grammar — plain text in, shipped components out. */
export function HomeGrammarSection({ catalogTotal }: { catalogTotal: number }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <SectionMark n="02">the grammar</SectionMark>
      <div className="grid items-start gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
        <Reveal>
          <h2 className="display text-[length:var(--text-fluid-h2)]">
            Plain text in, shipped components out.
          </h2>
          <p className="mt-4 max-w-md text-fd-muted-foreground">
            One grammar across all {catalogTotal} types: <code className="text-sm">data</code> alone
            renders something correct, and the same prop means the same thing on every chart. A
            model that has seen one chart can write them all — and annotations are children, so
            thresholds and milestones read like markup, not configuration.
          </p>
          <p className="mt-3 max-w-md text-fd-muted-foreground">
            Every chart ships with its own words: the accessible sentence below the demo is
            generated from the data, live. Nothing to caption, nothing to drift.
          </p>
        </Reveal>
        <Reveal delay={80}>
          <GrammarDemo />
        </Reveal>
      </div>
    </section>
  );
}
