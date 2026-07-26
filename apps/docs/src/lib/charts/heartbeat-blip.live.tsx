import type { ChartModule, PlaygroundSpec } from "./types";
import { HeartbeatBlip } from "@microcharts/react/heartbeat-blip";
import { HeartbeatBlip as HeartbeatBlipInteractive } from "@microcharts/react/heartbeat-blip/interactive";
import staticModule, { playground as staticPlayground, BUSY, NOW } from "./heartbeat-blip";

export function PreviewLive() {
  return <HeartbeatBlipInteractive events={BUSY} now={NOW} summary={false} width={80} />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s) => (
    <HeartbeatBlipInteractive
      events={Array.from({ length: s.count as number }, (_, k) => NOW - k * 4200 - 2000)}
      now={NOW}
      label={s.label as "none" | "count"}
      title="Liveness"
      width={160}
    />
  ),
  codeInteractive: (s) =>
    [
      "<HeartbeatBlip",
      "  events={eventTimestamps}",
      "  now={serverNow}",
      s.label !== "none" && `  label="${s.label}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: HeartbeatBlip,
  ChartLive: HeartbeatBlipInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
