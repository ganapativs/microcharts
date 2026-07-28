import { Source_Serif_4 } from "next/font/google";

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

const TYPE_FACES: {
  cls: string;
  style?: React.CSSProperties;
  specimen: string;
  name: string;
  role: string;
  use: string;
}[] = [
  {
    // The four specimens are set at ONE size, so the card compares faces and not
    // sizes. That is why the display face is named here rather than reached via
    // `.display-2`, whose clamp would render this one a step smaller than its
    // three neighbours at most widths.
    cls: "text-[44px] font-semibold leading-none tracking-tight",
    style: { fontFamily: "var(--fd)" },
    specimen: "Ag",
    name: "Open Runde",
    role: "Display",
    use: "Titles, section headings, the footer wordmark.",
  },
  {
    cls: "text-[44px] font-semibold leading-none tracking-tight",
    specimen: "Ag",
    name: "Hanken Grotesk",
    role: "UI · Body",
    use: "Prose, controls, everything read at length.",
  },
  {
    cls: "font-mono text-[44px] leading-none tracking-tight",
    specimen: "Ag",
    name: "JetBrains Mono",
    role: "Metadata · Code",
    use: "Labels, sizes, coordinates, snippets.",
  },
  {
    cls: "text-[44px] italic leading-none",
    style: { fontFamily: "var(--font-serif)" },
    specimen: "Ag",
    name: "Source Serif 4",
    role: "Reading",
    use: "The home page, where it depicts written prose.",
  },
];

export function BrandTypeSection() {
  return (
    <section className={`${serif.variable} act [--font-serif:var(--font-serif-src),Georgia,serif]`}>
      <div className="shell">
        <h2 className="display-2" style={{ maxWidth: "var(--m-head)" }}>
          The four typefaces
        </h2>
        <p className="prose u-lede" style={{ maxWidth: "var(--m-prose)" }}>
          Display for titles, grotesk for reading, mono for measurement, and a serif for the one
          place the site sets prose as prose. Same four as the rest of the site.
        </p>
        <div className="u-block grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TYPE_FACES.map((t) => (
            <div key={t.name} className="plate flex h-full flex-col gap-5 px-5 py-6">
              <div className={t.cls} style={{ color: "var(--ink)", ...t.style }}>
                {t.specimen}
              </div>
              <div className="u-ruled mt-auto">
                <div
                  className="font-mono text-[13px] font-medium tracking-[-0.03em]"
                  style={{ color: "var(--ink)" }}
                >
                  {t.name}
                </div>
                <div className="kicker mt-1.5">{t.role}</div>
                <p className="prose mt-3 text-[0.86rem]">{t.use}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
