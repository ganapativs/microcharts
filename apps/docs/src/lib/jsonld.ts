import { SITE, abs } from "./site";

type Breadcrumb = { name: string; url: string };

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
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
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
    author: { "@type": "Person", name: SITE.author },
  };
}

/**
 * Serialize JSON-LD safely for inline `<script type="application/ld+json">`
 * (plan/20 §4 rendering rule).
 */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replaceAll("<", "\\u003c");
}

export { abs };
