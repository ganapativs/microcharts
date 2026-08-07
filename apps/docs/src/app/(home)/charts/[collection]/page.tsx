import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { docsMeta } from "@/lib/metadata";
import { COLLECTIONS, isChartCollection } from "@/lib/collections";
import { GalleryView } from "../gallery-view";

type Props = { params: Promise<{ collection: string }> };

export function generateStaticParams() {
  return COLLECTIONS.map((c) => ({ collection: c.key }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { collection } = await params;
  const hub = COLLECTIONS.find((c) => c.key === collection);
  if (!hub) return {};
  return docsMeta({
    title: hub.title,
    description: hub.description,
    path: `/charts/${hub.key}`,
    keywords: [
      hub.label.toLowerCase(),
      "react microcharts",
      "word-sized charts",
      "svg charts",
      hub.key,
    ],
  });
}

export default async function CollectionGalleryPage({ params }: Props) {
  const { collection } = await params;
  if (!isChartCollection(collection)) notFound();
  return <GalleryView collection={collection} />;
}
