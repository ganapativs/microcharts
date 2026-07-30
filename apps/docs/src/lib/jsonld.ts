import { SITE, abs } from "./site";
import { CATALOG } from "./docs-facts";

type Breadcrumb = { name: string; url: string };

/** The author, as a reusable schema.org Person node. `sameAs` ties the identity
 *  to its other homes (X, GitHub) — the signal Google uses for author authority
 *  and knowledge-graph entity resolution. */
const author = {
  "@type": "Person",
  name: SITE.author,
  url: SITE.authorUrl,
  sameAs: [SITE.authorX, SITE.authorGithub],
} as const;

export function breadcrumbJsonLd(items: Breadcrumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: { "@id": item.url, name: item.name },
    })),
  };
}

export function techArticleJsonLd(input: {
  url: string;
  headline: string;
  description: string;
  dateModified: string;
  datePublished?: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    mainEntityOfPage: { "@type": "WebPage", "@id": input.url },
    headline: input.headline,
    description: input.description,
    datePublished: input.datePublished ?? input.dateModified,
    dateModified: input.dateModified,
    image: input.image,
    inLanguage: "en",
    about: ["React", "SVG charts", "sparklines", "accessibility", "data visualization"],
    proficiencyLevel: "Intermediate",
    author,
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
      logo: abs("/apple-icon"),
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    alternateName: SITE.pkg,
    url: SITE.url,
    description: SITE.description,
    inLanguage: "en",
    author,
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    sameAs: [SITE.repo, SITE.npm, SITE.authorX],
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    legalName: SITE.name,
    url: SITE.url,
    logo: abs("/apple-icon"),
    description: SITE.description,
    foundingDate: "2025",
    sameAs: [SITE.repo, SITE.npm, SITE.authorX, SITE.authorGithub, SITE.authorUrl],
    founder: author,
  };
}

export function softwareSourceCodeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: SITE.pkg,
    description: SITE.description,
    programmingLanguage: "TypeScript",
    runtimePlatform: "React",
    license: "https://opensource.org/licenses/MIT",
    codeRepository: SITE.repo,
    url: SITE.url,
    author,
  };
}

/** The npm package as a schema.org SoftwareApplication — the type Google
 *  surfaces in software rich results. Free + developer-facing; `sameAs` links
 *  the package's canonical homes. */
export function softwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE.pkg,
    alternateName: SITE.name,
    description: SITE.description,
    applicationCategory: "DeveloperApplication",
    applicationSubCategory: "Data visualization",
    operatingSystem: "Any",
    softwareRequirements: "React 18 or 19",
    url: SITE.url,
    downloadUrl: SITE.npm,
    installUrl: SITE.npm,
    license: "https://opensource.org/licenses/MIT",
    featureList: [
      `${CATALOG.total} word-sized chart types`,
      "Zero runtime dependencies",
      "Accessible by default (role=img + generated summary)",
      "React Server Component safe static entries",
      "Interactive /animate client entries",
    ],
    author,
    offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
    sameAs: [SITE.repo, SITE.npm],
  };
}

export function chartCatalogJsonLd(
  charts: readonly { name: string; slug: string; tagline: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${SITE.name} chart catalog`,
    description: `All ${charts.length} word-sized React chart types in ${SITE.pkg}.`,
    numberOfItems: charts.length,
    itemListElement: charts.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      description: c.tagline,
      url: abs(`/docs/charts/${c.slug}`),
    })),
  };
}

export function faqJsonLd(faqs: readonly { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** Intro / docs home FAQ — must match visible copy on `/docs`. */
export const DOCS_INTRO_FAQS = [
  {
    q: "What are micro charts?",
    a: "Micro charts — also called sparklines, tiny charts, or inline charts — are small, word-sized data visualizations: a trend line, bar, or dot that fits inside a sentence, table cell, or KPI card without axes or legends. They answer one question at a glance in the space of a word, where a full chart would be too heavy and too loud.",
  },
  {
    q: "What is microcharts?",
    a: "microcharts is a React chart library of word-sized SVG charts — sparklines, bars, bullets, and the rest of the catalog — built to sit inside sentences, table cells, KPI cards, and AI replies. Zero runtime dependencies, accessible by default, and server-component safe.",
  },
  {
    q: "How is microcharts different from Recharts or Chart.js?",
    a: "Those are full chart libraries for surfaces that are mostly chart. microcharts sits inside an interface — word-sized SVG marks where a full chart library would be too heavy and too loud. One chart per subpath, ~2–7 kB interactive · ~1–4 kB static gzip, no axes or legends, static RSC entries with zero client JavaScript. Not a replacement. See /docs/when-to-use and /docs/full-chart-libraries, or the measured per-library pages: /docs/vs-recharts, /docs/vs-chartjs, /docs/vs-react-sparklines, /docs/vs-mui-x-sparkline, /docs/vs-visx, and /docs/vs-tanstack-charts.",
  },
  {
    q: "Are microcharts accessible?",
    a: 'Yes. Every chart is role="img" with a natural-language summary generated from the data. Interactive entries add keyboard navigation and a polite live region. Direction and state are never color-alone.',
  },
  {
    q: "Do static microcharts need client JavaScript?",
    a: "No. Default exports are hook-free pure SVG — RSC-safe with zero client JS. Import the matching /interactive subpath only when you need hover, keyboard, touch, or selection.",
  },
  {
    q: "Why is there no pie chart, gauge, or waffle?",
    a: "They fail at word size: pie angles are unreadable in a table cell, a needle gauge spends its pixels on chrome, a waffle doesn't fit in a word. Each refusal has an honest in-catalog replacement — SegmentedBar for pie, Bullet for gauges, IconArray for waffle. The reasoning lives in /docs/design-notes and /docs/when-to-use.",
  },
  {
    q: "Why does my first chart render unstyled, or with serif labels?",
    a: 'Almost always one of two setup steps: the stylesheet isn\'t imported at your app root (import "@microcharts/react/styles.css", once), or the surrounding page never sets a font-family, so SVG text falls back to a serif — set --mc-font or give the page a font. Both are covered in /docs/quickstart.',
  },
  {
    q: "Can I match the charts to my brand color?",
    a: "Yes — pass one accent to defineTheme and it derives a color-blind-safe categorical palette plus hand-tuned-style dark twins, in OKLCH, with zero dependencies; or set the --mc-* tokens directly. The one thing a theme can never change is what the data means: positive and negative keep their hues on every accent and preset. See /docs/theming.",
  },
  {
    q: "How do I propose a new chart type?",
    a: "Open an issue first. The catalog is open to new types and already broad, so a proposal has to clear the admission bar: a data story the existing charts can't already tell, one honest encoding channel, and readable at ≤ 200×60 px without training. New props work the same way — bring the use case to an issue and wait for a yes before writing code. CONTRIBUTING.md in the repository has the policy.",
  },
] as const;

/** Serialize JSON-LD for inline `<script type="application/ld+json">`. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replaceAll("<", "\\u003c");
}

export { abs };
