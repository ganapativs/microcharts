import type { Metadata } from "next";
import { SITE, abs } from "./site";

type MetaInput = {
  title: string;
  description: string;
  path: `/${string}`;
  image?: `/${string}`;
  imageAlt?: string;
  noindex?: boolean;
  /** Markdown-mirror URL — emitted as `<link rel="alternate" type="text/markdown">`
   *  so agents can discover the machine-readable copy of the page. */
  markdown?: `/${string}`;
  /** Docs/chart pages are articles; marketing pages stay `website`. */
  type?: "website" | "article";
  keywords?: readonly string[] | string[];
};

/** Shared metadata contract for every docs route. */
export function docsMeta({
  title,
  description,
  path,
  image = "/og/default.png",
  imageAlt,
  noindex = false,
  markdown,
  type = "website",
  keywords,
}: MetaInput): Metadata {
  const url = abs(path);
  const imageUrl = abs(image);
  /* Per-page OG cards render the page title on microcharts branding, so the
     default alt names that card. The shared default.png (the chart-specimen
     board) keeps the site-wide alt. */
  const resolvedImageAlt =
    imageAlt ?? (image === "/og/default.png" ? SITE.ogImageAlt : `${SITE.name} — ${title}`);

  return {
    /* Bare title — the root layout's `%s · ${SITE.name}` template appends the
       site name exactly once (a manual suffix here doubled it). */
    title,
    description,
    ...(keywords ? { keywords: [...keywords] } : {}),
    metadataBase: new URL(SITE.url),
    alternates: {
      canonical: url,
      ...(markdown ? { types: { "text/markdown": abs(markdown) } } : {}),
    },
    robots: noindex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
        },
    openGraph: {
      type,
      siteName: SITE.name,
      title,
      description,
      url,
      locale: "en_US",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: resolvedImageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      site: SITE.authorXHandle,
      creator: SITE.authorXHandle,
      title,
      description,
      images: [{ url: imageUrl, alt: resolvedImageAlt }],
    },
  };
}
