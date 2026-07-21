import type { ChartModule, PlaygroundSpec } from "./types";
import { Hourglass } from "@microcharts/react/hourglass";
import { Hourglass as HourglassInteractive } from "@microcharts/react/hourglass/interactive";
import staticModule, { playground as staticPlayground } from "./hourglass";

/** Interactive half of the hourglass chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./hourglass`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return (
    <span className="inline-flex items-center gap-3">
      {[0.15, 0.4, 0.6, 0.85].map((v) => (
        <HourglassInteractive key={v} value={v} summary={false} />
      ))}
    </span>
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s) => (
    <HourglassInteractive
      value={(s.value as number) / 100}
      label={s.label as "none" | "remaining" | "elapsed"}
      stream={s.stream as boolean}
      summary={false}
      height={64}
    />
  ),
  codeInteractive: (s) =>
    [
      "<Hourglass",
      `  value={${((s.value as number) / 100).toFixed(2)}}`,
      s.label !== "none" && `  label="${s.label}"`,
      s.stream === false && "  stream={false}",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: Hourglass,
  ChartLive: HourglassInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
