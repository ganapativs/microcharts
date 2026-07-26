import type { ChartModule, PlaygroundSpec } from "./types";
import { HeatCell } from "@microcharts/react/heat-cell";
import { HeatCell as HeatCellInteractive } from "@microcharts/react/heat-cell/interactive";
import staticModule, { playground as staticPlayground, D } from "./heat-cell";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {[12, 35, 58, 79, 96].map((v) => (
        <HeatCellInteractive
          key={v}
          value={v}
          domain={D}
          summary={false}
          style={{ width: 16, height: 16 }}
          animate={animate}
        />
      ))}
    </span>
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <HeatCellInteractive
      value={s.value as number}
      domain={D}
      steps={s.steps as number}
      shape={s.shape as "square" | "round" | "dot"}
      label={(s.label as boolean) ? "value" : "none"}
      animate={ui.animate}
      style={{ width: 48, height: 48 }}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<HeatCell",
      `  value={${s.value}}`,
      "  domain={[0, 100]}",
      s.steps !== 5 && `  steps={${s.steps}}`,
      s.shape !== "square" && `  shape="${s.shape}"`,
      (s.label as boolean) && '  label="value"',
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: HeatCell,
  ChartLive: HeatCellInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
