import type { ChartModule, PlaygroundSpec } from "./types";
import { EventRaster } from "@microcharts/react/event-raster";
import { EventRaster as EventRasterInteractive } from "@microcharts/react/event-raster/interactive";
import staticModule, { playground as staticPlayground, RASTER } from "./event-raster";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <EventRasterInteractive
      data={RASTER}
      summary={false}
      width={220}
      height={56}
      animate={animate}
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <EventRasterInteractive
      data={RASTER}
      emphasis={s.emphasis === "none" ? undefined : (s.emphasis as string)}
      labels={s.labels as boolean}
      overflow={s.overflow as "bin" | "clip"}
      summary={false}
      animate={ui.animate}
      width={320}
      height={36}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<EventRaster",
      "  data={services}",
      s.emphasis !== "none" && `  emphasis="${s.emphasis}"`,
      s.labels === false && "  labels={false}",
      s.overflow !== "bin" && `  overflow="${s.overflow}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: EventRaster,
  ChartLive: EventRasterInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
