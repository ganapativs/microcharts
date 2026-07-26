import type { ChartModule, PlaygroundSpec } from "./types";
import { CometTrail } from "@microcharts/react/comet-trail";
import { CometTrail as CometTrailInteractive } from "@microcharts/react/comet-trail/interactive";
import staticModule, { playground as staticPlayground, RISING } from "./comet-trail";

export function PreviewLive() {
  return <CometTrailInteractive data={RISING} summary={false} width={80} />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s) => (
    <CometTrailInteractive
      data={RISING}
      trail={s.trail as number}
      label={s.label as "last" | "none"}
      summary={false}
      width={180}
    />
  ),
  codeInteractive: (s) =>
    [
      "<CometTrail",
      "  data={rollingWindow}",
      s.trail !== 12 && `  trail={${s.trail}}`,
      s.label !== "last" && `  label="${s.label}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: CometTrail,
  ChartLive: CometTrailInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
