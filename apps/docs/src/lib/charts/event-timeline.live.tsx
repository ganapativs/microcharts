import type { ChartModule, PlaygroundSpec } from "./types";
import { EventTimeline as EventTimelineInteractive } from "@microcharts/react/event-timeline/interactive";
import staticModule, {
  playground as staticPlayground,
  DATA,
  WINDOW,
  T0,
  H,
} from "./event-timeline";

/** Interactive half of the event-timeline chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./event-timeline`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return (
    <EventTimelineInteractive
      data={DATA}
      domain={WINDOW}
      summary={false}
      width={150}
      height={20}
      animate
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <EventTimelineInteractive
      data={DATA}
      domain={WINDOW}
      now={s.now ? T0 + 21 * H : undefined}
      label={s.label as "none" | "spans"}
      animate={ui.animate}
      width={280}
      height={36}
      summary={false}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<EventTimeline",
      "  data={windows}",
      "  domain={today}",
      s.now && "  now={Date.now()}",
      s.label !== "none" && `  label="${s.label}"`,
      ui.animate && " animate",
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
