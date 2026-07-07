import type { Metadata } from "next";
import { SITE, abs } from "./site";

type MetaInput = {
  title: string;
  description: string;
  path: `/${string}`;
  image?: `/${string}`;
  imageAlt?: string;
  noindex?: boolean;
};

/**
 * The one metadata contract (plan/20 §3). Every route calls this; no page
 * hand-rolls `<head>`. Domain comes from the swappable {@link SITE.url}.
 */
export function docsMeta({
  title,
  description,
  path,
  image = "/og/default.png",
  imageAlt = SITE.ogImageAlt,
  noindex = false,
}: MetaInput): Metadata {
  const url = abs(path);
  const imageUrl = abs(image);

  return {
    title: `${title} · ${SITE.name}`,
    description,
    metadataBase: new URL(SITE.url),
    alternates: { canonical: url },
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
