import { FourContexts } from "@/components/charts/contexts";
import { SurfaceCarousel } from "@/components/home/surface-carousel";
import { Reveal } from "@/components/ui/reveal";

function SectionMark({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 flex items-center gap-3">
      <span className="mono-label text-fd-primary">{n}</span>
      <span className="h-px flex-1 bg-hairline" />
      <span className="mono-label">{children}</span>
    </div>
  );
}

export function HomeContextsSection() {
  return (
    <>
      <section className="mx-auto max-w-shell px-4 py-14 sm:px-6">
        <SectionMark n="05">One chart, four homes</SectionMark>
        <Reveal className="mb-2 max-w-2xl">
          <h2 className="display text-[length:var(--text-fluid-h2)]">
            Built to live inside your interface.
          </h2>
          <p className="mt-4 max-w-xl text-fd-muted-foreground">
            The same component, doing its job in a sentence, a table cell, a KPI card, and a tab.
          </p>
        </Reveal>
        <Reveal>
          <FourContexts slug="sparkline" />
        </Reveal>
      </section>

      <section className="mx-auto max-w-shell px-4 py-14 sm:px-6">
        <SectionMark n="05b">One chart, every surface</SectionMark>
        <div className="grid items-start gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-12">
          <Reveal>
            <h2 className="display text-[length:var(--text-fluid-h2)]">
              The same mark in product, report, and docs.
            </h2>
            <p className="mt-4 max-w-md text-fd-muted-foreground">
              The chart a model writes is the one your product renders, your report exports, and
              your docs embed — plain SVG from <code>data</code> alone.
            </p>
          </Reveal>
          <Reveal delay={80}>
            <SurfaceCarousel />
          </Reveal>
        </div>
      </section>
    </>
  );
}
