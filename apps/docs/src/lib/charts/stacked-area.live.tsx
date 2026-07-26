import type { ChartModule, PlaygroundSpec } from "./types";
import { StackedArea } from "@microcharts/react/stacked-area";
import { StackedArea as StackedAreaInteractive } from "@microcharts/react/stacked-area/interactive";
import staticModule, { playground as staticPlayground, MIX } from "./stacked-area";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <StackedAreaInteractive data={MIX} summary={false} width={130} height={22} animate={animate} />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <StackedAreaInteractive
      data={MIX}
      mode={s.mode as "stacked" | "ridge"}
      order={s.order as "data" | "asc"}
      label={s.label as "last" | "none"}
      curve={s.curve as "linear" | "smooth"}
      locale={s.locale as string}
      animate={ui.animate}
      summary={false}
      width={260}
      height={32}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<StackedArea",
      "  data={mix}",
      s.mode !== "stacked" && `  mode="${s.mode}"`,
      s.order !== "data" && `  order="${s.order}"`,
      s.label !== "none" && `  label="${s.label}"`,
      s.curve !== "linear" && `  curve="${s.curve}"`,
      s.locale !== "en-US" && `  locale="${s.locale}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: StackedArea,
  ChartLive: StackedAreaInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
