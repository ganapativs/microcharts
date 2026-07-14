import { SITE, abs } from "./site";

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
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    mainEntityOfPage: input.url,
    headline: input.headline,
    description: input.description,
    dateModified: input.dateModified,
    image: input.image,
    about: ["React", "SVG charts", "accessibility", "data visualization"],
    proficiencyLevel: "Intermediate",
    author,
    publisher: author,
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    author,
    sameAs: [SITE.repo, SITE.npm, SITE.authorX],
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
    description: SITE.description,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    softwareRequirements: "React 18 or 19",
    url: SITE.url,
    downloadUrl: SITE.npm,
    license: "https://opensource.org/licenses/MIT",
    author,
    offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
    sameAs: [SITE.repo, SITE.npm],
  };
}

/** Serialize JSON-LD for inline `<script type="application/ld+json">`. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replaceAll("<", "\\u003c");
}

export { abs };
