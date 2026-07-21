"use client";
import "@microcharts/react/motion";
import { useChartModule } from "@/lib/charts/use-chart-module";

/** Chart-doc hero preview — interactive by default (static lives in the Playground). */
export function EntryDemoDual({ slug }: { slug: string }) {
  const mod = useChartModule(slug);

  if (!mod) {
    return <div className="min-h-32 w-full" aria-hidden />;
  }

  const Live = mod.PreviewLive ?? mod.Preview;

  return (
    <div className="flex min-h-20 w-full items-center justify-center">
      <Live />
    </div>
  );
}
