import type { ChartModule, PlaygroundSpec } from "./types";
import { IconArray } from "@microcharts/react/icon-array";
import { IconArray as IconArrayInteractive } from "@microcharts/react/icon-array/interactive";
import staticModule, { playground as staticPlayground } from "./icon-array";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <IconArrayInteractive
      value={0.15}
      total={20}
      summary={false}
      width={110}
      height={26}
      animate={animate}
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => {
    const total = Number(s.total) as 10 | 20 | 100;
    const tall = total === 100;
    return (
      <IconArrayInteractive
        value={(s.pct as number) / 100}
        total={total}
        label={s.label as "ratio" | "percent" | "none"}
        shape={s.shape as "square" | "round" | "dot"}
        summary={false}
        animate={ui.animate}
        width={tall ? 200 : 220}
        height={tall ? 100 : 30}
      />
    );
  },
  codeInteractive: (s, _data, ui) =>
    [
      "<IconArray",
      `  value={${((s.pct as number) / 100).toFixed(2)}}`,
      s.total !== "20" && `  total={${s.total}}`,
      s.label !== "ratio" && `  label="${s.label}"`,
      s.shape !== "square" && `  shape="${s.shape}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: IconArray,
  ChartLive: IconArrayInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
