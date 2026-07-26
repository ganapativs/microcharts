import type { ChartModule, PlaygroundSpec } from "./types";
import { VolumeProfile } from "@microcharts/react/volume-profile";
import { VolumeProfile as VolumeProfileInteractive } from "@microcharts/react/volume-profile/interactive";
import staticModule, { playground as staticPlayground, PROFILE } from "./volume-profile";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <VolumeProfileInteractive
      data={PROFILE}
      summary={false}
      width={60}
      height={40}
      animate={animate}
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <VolumeProfileInteractive
      data={PROFILE}
      align={s.align as "left" | "right"}
      label={s.label as "poc" | "none"}
      valueArea={(s.valueArea as number) / 100}
      animate={ui.animate}
      summary={false}
      width={200}
      height={132}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<VolumeProfile",
      "  data={profile}",
      s.align !== "left" && `  align="${s.align}"`,
      s.label !== "poc" && `  label="${s.label}"`,
      s.valueArea !== 70 && `  valueArea={${((s.valueArea as number) / 100).toFixed(2)}}`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: VolumeProfile,
  ChartLive: VolumeProfileInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
