import { Reveal } from "@/components/ui/reveal";
import { SectionMark, SPECS } from "@/components/brand/shared";

export function BrandMarkSection() {
  return (
    <section className="mx-auto max-w-shell px-4 py-14 sm:px-6">
      <SectionMark n="01">The mark</SectionMark>
      <Reveal className="mb-8 max-w-2xl">
        <h2 className="display text-[length:var(--text-fluid-h2)]">ActivityGrid DNA, owned.</h2>
        <p className="mt-4 max-w-xl text-fd-muted-foreground">
          The three cells climb bottom-left to top-right, fill grading faint to solid. That grade is
          the same honest encoding the charts use — value carried by weight, not decoration.
        </p>
      </Reveal>
      <Reveal delay={60}>
        <dl className="panel grid grid-cols-2 sm:grid-cols-4">
          {SPECS.map(([k, v], i) => (
            <div
              key={k}
              className={
                "flex flex-col gap-1.5 px-5 py-4" +
                (i % 2 === 1 ? " border-l border-hairline" : "") +
                (i >= 2 ? " border-t border-hairline sm:border-t-0" : "") +
                (i > 0 ? " sm:border-l sm:border-hairline" : "")
              }
            >
              <dt className="mono-label leading-5">{k}</dt>
              <dd className="text-sm leading-5 text-fd-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </section>
  );
}
