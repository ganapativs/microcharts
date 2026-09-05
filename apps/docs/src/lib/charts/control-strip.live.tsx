import type { ChartModule, PlaygroundSpec } from "./types";
import { ControlStrip } from "@microcharts/react/control-strip";
import { ControlStrip as ControlStripInteractive } from "@microcharts/react/control-strip/interactive";
import staticModule, { playground as staticPlayground, DEMO } from "./control-strip";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <ControlStripInteractive
      data={DEMO}
      summary={false}
      width={150}
      height={22}
      animate={animate}
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <ControlStripInteractive
      data={DEMO}
      rules={s.rules ? "we" : "none"}
      dots={s.dots ? "all" : "out"}
      summary={false}
      animate={ui.animate}
      width={280}
      height={26}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<ControlStrip",
      "  data={weights}",
      s.rules && '  rules="we"',
      s.dots && '  dots="all"',
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: ControlStrip,
  ChartLive: ControlStripInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
