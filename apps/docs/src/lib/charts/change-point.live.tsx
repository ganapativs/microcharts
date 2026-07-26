import type { ChartModule, PlaygroundSpec } from "./types";
import { ChangePoint } from "@microcharts/react/change-point";
import { ChangePoint as ChangePointInteractive } from "@microcharts/react/change-point/interactive";
import staticModule, { playground as staticPlayground, ERRORS, RAMP } from "./change-point";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <ChangePointInteractive
      data={ERRORS}
      summary={false}
      width={120}
      height={16}
      animate={animate}
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <ChangePointInteractive
      data={s.preset === "ramp" ? RAMP : ERRORS}
      maxItems={s.maxItems as number}
      means={s.means as boolean}
      label={s.delta ? "delta" : "none"}
      title="Error rate"
      animate={ui.animate}
      summary={false}
      width={280}
      height={28}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<ChangePoint",
      "  data={errors}",
      s.maxItems !== 2 && `  maxItems={${s.maxItems}}`,
      s.means === false && "  means={false}",
      s.delta && '  label="delta"',
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: ChangePoint,
  ChartLive: ChangePointInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
