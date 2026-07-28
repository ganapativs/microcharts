import { Source_Serif_4 } from "next/font/google";
import { Reveal } from "@/components/ui/reveal";
import { SectionMark } from "@/components/brand/shared";

// The reading serif is scoped to the home page, so this page has to load it
// itself to show a truthful specimen. Not preloaded — it styles one tile,
// well below the fold.
const serif = Source_Serif_4({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-serif-src",
  display: "swap",
  preload: false,
});

const TYPE_FACES = [
  {
    cls: "display text-5xl",
    specimen: "Ag",
    name: "Open Runde",
    role: "Display",
    use: "Titles, section headings, the footer wordmark.",
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
  {
    cls: "text-5xl italic",
    style: { fontFamily: "var(--font-serif)" },
    specimen: "Ag",
    name: "Source Serif 4",
    role: "Reading",
    use: "The home page, where it depicts written prose.",
  },
];

export function BrandTypeSection() {
  return (
    <section
      className={`${serif.variable} mx-auto max-w-shell px-4 py-14 sm:px-6 [--font-serif:var(--font-serif-src),Georgia,serif]`}
    >
      <SectionMark>Type</SectionMark>
      <Reveal className="mb-8 max-w-2xl">
        <h2 className="display text-[length:var(--text-fluid-h2)]">The four typefaces</h2>
        <p className="mt-4 max-w-xl text-fd-muted-foreground">
          Display for titles, grotesk for reading, mono for measurement, and a serif for the one
          place the site sets prose as prose. Same four as the rest of the site.
        </p>
      </Reveal>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TYPE_FACES.map((t, i) => (
          <Reveal
            key={t.name}
            delay={i * 50}
            className="panel-soft flex h-full flex-col gap-4 px-5 py-6"
          >
            <div className={t.cls + " text-fd-foreground"} style={t.style}>
              {t.specimen}
            </div>
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
