"use client";
import "@microcharts/react/motion";
import { useChartModule } from "@/lib/charts/use-chart-module";

/**
 * Chart-doc hero preview — interactive AND animated (static lives in the
 * Playground). `PreviewLive` defaults to `animate={false}` because its other two
 * consumers are boards of many charts (the /charts gallery, the homepage catalog
 * tiles) where a hundred simultaneous entrances read as noise. Here there is
 * exactly one chart and it is the subject of the page, so it draws itself.
 */
export function EntryDemoDual({ slug }: { slug: string }) {
  const mod = useChartModule(slug);

  if (!mod) {
    return <div className="min-h-32 w-full" aria-hidden />;
  }

  const Live = mod.PreviewLive ?? mod.Preview;

  return (
    <div className="flex min-h-20 w-full items-center justify-center">
      <Live animate />
    </div>
  );
}
