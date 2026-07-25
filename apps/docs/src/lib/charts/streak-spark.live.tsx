import type { ChartModule, PlaygroundSpec } from "./types";
import { StreakSpark } from "@microcharts/react/streak-spark";
import { StreakSpark as StreakSparkInteractive } from "@microcharts/react/streak-spark/interactive";
import staticModule, { playground as staticPlayground, STREAK } from "./streak-spark";

/** Interactive half of the streak-spark chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./streak-spark`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <StreakSparkInteractive
      data={STREAK}
      width={180}
      height={48}
      summary={false}
      animate={animate}
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, data, ui) => (
    <StreakSparkInteractive
      data={data}
      positive={s.positive as "up" | "down"}
      label={s.label as "current" | "both" | "none"}
      animate={ui.animate}
      width={340}
      height={92}
      className="w-full max-w-md"
      title="Playground"
    />
  ),
  codeInteractive: (s, data, ui) =>
    [
      "<StreakSpark",
      `  data={[${data.join(", ")}]}`,
      s.positive !== "up" && `  positive="${s.positive}"`,
      s.label !== "current" && `  label="${s.label}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: StreakSpark,
  ChartLive: StreakSparkInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
