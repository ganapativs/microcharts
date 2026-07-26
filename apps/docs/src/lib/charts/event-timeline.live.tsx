import type { ChartModule, PlaygroundSpec } from "./types";
import { EventTimeline } from "@microcharts/react/event-timeline";
import { EventTimeline as EventTimelineInteractive } from "@microcharts/react/event-timeline/interactive";
import staticModule, {
  playground as staticPlayground,
  DATA,
  WINDOW,
  T0,
  H,
} from "./event-timeline";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <EventTimelineInteractive
      data={DATA}
      domain={WINDOW}
      summary={false}
      width={150}
      height={20}
      animate={animate}
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
  Chart: EventTimeline,
  ChartLive: EventTimelineInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
