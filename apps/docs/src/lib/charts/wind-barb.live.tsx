import type { ChartModule, PlaygroundSpec } from "./types";
import { WindBarb } from "@microcharts/react/wind-barb";
import { WindBarb as WindBarbInteractive } from "@microcharts/react/wind-barb/interactive";
import staticModule, { playground as staticPlayground } from "./wind-barb";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <WindBarbInteractive
      direction={225}
      magnitude={32}
      summary={false}
      size={32}
      animate={animate}
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <WindBarbInteractive
      direction={s.direction as number}
      magnitude={s.magnitude as number}
      step={s.step as number}
      label={s.label as "none" | "value"}
      summary={false}
      size={64}
      animate={ui.animate}
    />
  ),
  codeInteractive: (s, _data, ui) => {
    const lines = [
      "<WindBarb",
      `  direction={${s.direction}}`,
      `  magnitude={${s.magnitude}}`,
      s.step !== 10 && `  step={${s.step}}`,
      s.label === "value" && '  label="value"',
      ui.animate && " animate",
      "/>",
    ];
    return lines.filter(Boolean).join("\n");
  },
};

export default {
  ...staticModule,
  Chart: WindBarb,
  ChartLive: WindBarbInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
