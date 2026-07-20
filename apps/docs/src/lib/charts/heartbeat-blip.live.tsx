import type { ChartModule, PlaygroundSpec } from "./types";
import { HeartbeatBlip as HeartbeatBlipInteractive } from "@microcharts/react/heartbeat-blip/interactive";
import staticModule, { playground as staticPlayground, BUSY, NOW } from "./heartbeat-blip";

/** Interactive half of the heartbeat-blip chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./heartbeat-blip`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

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
      summary={false}
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
  PreviewLive,
  playground,
} satisfies ChartModule;
