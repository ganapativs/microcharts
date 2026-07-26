import { SectionMark } from "@/components/home/section-mark";
import { GrammarDemo } from "@/components/home/grammar-demo";
import { Reveal } from "@/components/ui/reveal";

/** The shared-prop-API section. First after the hero on purpose: the reader
 *  just watched a reply stream charts into a sentence, and the obvious next
 *  question is what that costs in their own code. Answer: one prop vocabulary,
 *  106 components. This is deliberately NOT the `microchart …` stream grammar
 *  — that lives in the hero and in /docs/ai. */
export function HomeGrammarSection({ catalogTotal }: { catalogTotal: number }) {
  return (
    <section className="mx-auto max-w-shell px-4 py-12 sm:px-6">
      {/* NOT "the grammar" — /docs/ai already owns that name for the compact
          `microchart …` syntax a chat model emits. This section is the React
          prop API: one set of prop names across all 106 components. */}
      <SectionMark>one api</SectionMark>
      <div className="grid items-start gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
        <Reveal>
          <h2 className="display text-[length:var(--text-fluid-h2)]">Charts a model can type</h2>
          <p className="mt-4 max-w-md text-fd-muted-foreground">
            Every chart reads the same way: <code className="text-sm">data</code> alone renders
            something correct, and a prop like <code className="text-sm">domain</code> or{" "}
            <code className="text-sm">color</code> means the same thing everywhere. Once a model has
            seen one of these, it can write the other {catalogTotal - 1}.
          </p>
        </Reveal>
        <Reveal delay={80}>
          <GrammarDemo />
        </Reveal>
      </div>
    </section>
  );
}
