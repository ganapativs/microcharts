import { Reveal } from "@/components/ui/reveal";
import { SectionMark } from "@/components/brand/shared";

const TYPE_FACES = [
  {
    cls: "display text-5xl",
    specimen: "Ag",
    name: "Mona Sans",
    role: "Display",
    use: "Titles, hero, section headings.",
  },
  {
    cls: "text-5xl font-semibold tracking-tight",
    specimen: "Ag",
    name: "Hanken Grotesk",
    role: "UI · Body",
    use: "Prose, controls, everything read at length.",
  },
  {
    cls: "font-mono text-5xl",
    specimen: "Ag",
    name: "JetBrains Mono",
    role: "Metadata · Code",
    use: "Labels, sizes, coordinates, snippets.",
  },
];

export function BrandTypeSection() {
  return (
    <section className="mx-auto max-w-shell px-4 py-14 sm:px-6">
      <SectionMark>Type</SectionMark>
      <Reveal className="mb-8 max-w-2xl">
        <h2 className="display text-[length:var(--text-fluid-h2)]">The three typefaces</h2>
        <p className="mt-4 max-w-xl text-fd-muted-foreground">
          Display for titles, grotesk for reading, mono for measurement. Same trio as the rest of
          the site.
        </p>
      </Reveal>
      <div className="grid gap-3 md:grid-cols-3">
        {TYPE_FACES.map((t, i) => (
          <Reveal
            key={t.name}
            delay={i * 50}
            className="panel-soft flex h-full flex-col gap-4 px-5 py-6"
          >
            <div className={t.cls + " text-fd-foreground"}>{t.specimen}</div>
            <div className="mt-auto border-t border-hairline pt-4 leading-5">
              <div className="text-sm font-medium leading-5 text-fd-foreground">{t.name}</div>
              <div className="mono-label leading-5">{t.role}</div>
              <p className="mt-2 text-sm leading-5 text-fd-muted-foreground">{t.use}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
