import type { Metadata } from "next";
import { ChartDocPage, chartDocMetadata } from "@/components/chart-doc-page";

// The /docs/charts index (content/docs/charts/index.mdx — the ChartChooser
// page). Served by the chart route, not the guide catch-all, so its registry
// shells stay out of the guide bundle.
export default function Page() {
  return <ChartDocPage slug={["charts"]} />;
}

export function generateMetadata(): Promise<Metadata> {
  return chartDocMetadata(["charts"]);
}
