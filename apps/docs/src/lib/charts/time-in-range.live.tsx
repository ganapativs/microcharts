import type { ChartModule, PlaygroundSpec } from "./types";
import { TimeInRange } from "@microcharts/react/time-in-range";
import { TimeInRange as TimeInRangeInteractive } from "@microcharts/react/time-in-range/interactive";
import staticModule, { playground as staticPlayground, GLUCOSE } from "./time-in-range";

/** Interactive half of the time-in-range chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./time-in-range`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return <TimeInRangeInteractive data={GLUCOSE} summary={false} width={130} height={16} />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => {
    const inV = s.in as number;
    const rest = 100 - inV;
    const data = {
      severeBelow: 2,
      below: Math.round(rest * 0.35),
      in: inV,
      above: Math.round(rest * 0.5),
      severeAbove: 2,
    };
    return s.orientation === "vertical" ? (
      <TimeInRangeInteractive
        data={data}
        label={s.label as "in" | "all" | "none"}
        orientation="vertical"
        animate={ui.animate}
        summary={false}
        width={26}
        height={120}
      />
    ) : (
      <TimeInRangeInteractive
        data={data}
        label={s.label as "in" | "all" | "none"}
        animate={ui.animate}
        summary={false}
        width={280}
        height={22}
      />
    );
  },
  codeInteractive: (s, _data, ui) =>
    [
      "<TimeInRange",
      `  data={{ below: 9, in: ${s.in}, above: 19 }}`,
      s.label !== "in" && `  label="${s.label}"`,
      s.orientation !== "horizontal" && `  orientation="${s.orientation}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: TimeInRange,
  ChartLive: TimeInRangeInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
