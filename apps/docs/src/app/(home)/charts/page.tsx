import type { Metadata } from "next";
import { docsMeta } from "@/lib/metadata";
import { chartsIndexDescription } from "@/lib/seo";
import { GalleryView } from "./gallery-view";

export const metadata: Metadata = docsMeta({
  title: "Micro Charts for React — Full Catalog",
  description: chartsIndexDescription(),
  path: "/charts",
  markdown: "/charts.md",
  keywords: [
    "micro charts",
    "micro charts react",
    "tiny charts",
    "small charts react",
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
