import type { ChartModule, PlaygroundSpec } from "./types";
import { Honeycomb } from "@microcharts/react/honeycomb";
import { Honeycomb as HoneycombInteractive } from "@microcharts/react/honeycomb/interactive";
import staticModule, { playground as staticPlayground } from "./honeycomb";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <HoneycombInteractive
      value={34}
      total={40}
      unit="seats"
      summary={false}
      cell={4}
      animate={animate}
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <HoneycombInteractive
      value={s.value as number}
      total={s.total as number}
      empty={s.empty as "outline" | "blank"}
      label={s.label as "none" | "count" | "percent"}
      unit="seats"
      summary={false}
      animate={ui.animate}
      cell={7}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<Honeycomb",
      `  value={${s.value}}`,
      `  total={${s.total}}`,
      s.empty !== "outline" && `  empty="${s.empty}"`,
      s.label !== "none" && `  label="${s.label}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: Honeycomb,
  ChartLive: HoneycombInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
