import type { ChartModule, PlaygroundSpec } from "./types";
import { SproutRow } from "@microcharts/react/sprout-row";
import { SproutRow as SproutRowInteractive } from "@microcharts/react/sprout-row/interactive";
import staticModule, { playground as staticPlayground, ACCTS } from "./sprout-row";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return <SproutRowInteractive data={ACCTS} summary={false} height={22} animate={animate} />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <SproutRowInteractive
      data={ACCTS}
      labels={s.labels as boolean}
      label={s.value ? "value" : "none"}
      summary={false}
      animate={ui.animate}
      height={s.labels ? 46 : 26}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<SproutRow",
      "  data={accounts}",
      s.labels && "  labels",
      s.value && '  label="value"',
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: SproutRow,
  ChartLive: SproutRowInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
