"use client";
import "@microcharts/react/motion";
import { useChartModule } from "@/lib/charts/use-chart-module";

/**
 * Chart-doc hero preview — interactive AND animated (static lives in the
 * Playground). `PreviewLive` defaults to `animate={false}` because its other two
 * consumers are boards of many charts (the /charts gallery, the homepage catalog
 * tiles) where a hundred simultaneous entrances read as noise. Here there is
 * exactly one chart and it is the subject of the page, so it draws itself.
 *
 * ONE box for both states. The loading and loaded branches used to render
 * different min-heights (8rem vs 5rem), so every chart page collapsed 48px the
 * moment its module landed — the panel visibly snapped on first load. The box
 * is the same element with the same classes now; the module arriving changes
 * what is inside it and never its size (the tallest hero preview measures
 * 140px — fat-digits — so the 9rem reserve holds every chart at every
 * viewport).
 */
export function EntryDemoDual({ slug }: { slug: string }) {
  const mod = useChartModule(slug);
  const Live = mod ? (mod.PreviewLive ?? mod.Preview) : null;

  return (
    <div className="flex min-h-36 w-full items-center justify-center" aria-hidden={!Live}>
      {Live ? <Live animate /> : null}
    </div>
  );
}
