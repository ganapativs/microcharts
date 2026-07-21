import type { Metadata } from "next";
import { docsMeta } from "@/lib/metadata";
import { chartsIndexDescription } from "@/lib/seo";
import { GalleryView } from "./gallery-view";

export const metadata: Metadata = docsMeta({
  title: "React Microcharts Catalog",
  description: chartsIndexDescription(),
  path: "/charts",
  keywords: [
    "react charts",
    "react sparkline",
    "microcharts catalog",
    "svg charts",
    "inline charts",
  ],
});

export default function GalleryPage() {
  return <GalleryView />;
}
