import type { ChartModule, PlaygroundSpec } from "./types";
import { QuadrantDot } from "@microcharts/react/quadrant-dot";
import { QuadrantDot as QuadrantDotInteractive } from "@microcharts/react/quadrant-dot/interactive";
import staticModule, { playground as staticPlayground, FOCAL, FIELD, AXES } from "./quadrant-dot";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <QuadrantDotInteractive
      data={FOCAL}
      field={FIELD}
      {...AXES}
      summary={false}
      width={48}
      height={48}
      animate={animate}
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <QuadrantDotInteractive
      data={FOCAL}
      field={FIELD}
      {...AXES}
      split={[s.splitX as number, s.splitY as number]}
      region={s.region as boolean}
      quadrants={s.named ? ["quick win", "big bet", "skip", "time sink"] : undefined}
      title="Effort vs impact"
      summary={false}
      animate={ui.animate}
      width={120}
      height={120}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<QuadrantDot",
      "  data={item}",
      "  field={backlog}",
      `  split={[${s.splitX}, ${s.splitY}]}`,
      s.region === false && "  region={false}",
      s.named && `  quadrants={["quick win", "big bet", "skip", "time sink"]}`,
      '  xLabel="effort" yLabel="impact"',
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: QuadrantDot,
  ChartLive: QuadrantDotInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
