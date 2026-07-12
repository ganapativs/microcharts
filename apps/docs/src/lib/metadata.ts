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
};

/** Shared metadata contract for every docs route. */
export function docsMeta({
  title,
  description,
  path,
  image = "/og/default.png",
  imageAlt = SITE.ogImageAlt,
  noindex = false,
  markdown,
}: MetaInput): Metadata {
  const url = abs(path);
  const imageUrl = abs(image);

  return {
    /* Bare title — the root layout's `%s · ${SITE.name}` template appends the
       site name exactly once (a manual suffix here doubled it). */
    title,
    description,
    metadataBase: new URL(SITE.url),
    alternates: {
      canonical: url,
      ...(markdown ? { types: { "text/markdown": abs(markdown) } } : {}),
    },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      title,
      description,
      url,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      site: SITE.authorXHandle,
      creator: SITE.authorXHandle,
      title,
      description,
      images: [imageUrl],
    },
  };
}
