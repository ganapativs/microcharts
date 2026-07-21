import type { ChartModule, PlaygroundSpec } from "./types";
import { CalendarStrip } from "@microcharts/react/calendar-strip";
import { CalendarStrip as CalendarStripInteractive } from "@microcharts/react/calendar-strip/interactive";
import staticModule, { playground as staticPlayground, DATA, END } from "./calendar-strip";

/** Interactive half of the calendar-strip chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./calendar-strip`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return (
    <CalendarStripInteractive
      data={DATA}
      end={END}
      summary={false}
      style={{ width: 110, height: 62 }}
      animate
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <CalendarStripInteractive
      data={DATA}
      end={END}
      weeks={Number(s.weeks)}
      weekStart={s.weekStart === "sunday" ? 0 : 1}
      shape={s.shape as "square" | "round" | "dot"}
      cell={Number(s.cell)}
      gap={Number(s.gap)}
      summary={false}
      animate={ui.animate}
      style={{
        width: 180,
        height: "auto",
      }}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<CalendarStrip",
      "  data={days}",
      `  end="${END}"`,
      s.weeks !== "4" && `  weeks={${s.weeks}}`,
      s.weekStart === "sunday" && "  weekStart={0}",
      s.shape !== "square" && `  shape="${s.shape}"`,
      Number(s.cell) !== 7 && `  cell={${s.cell}}`,
      Number(s.gap) !== 1 && `  gap={${s.gap}}`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: CalendarStrip,
  ChartLive: CalendarStripInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
