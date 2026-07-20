import type { ChartModule, PlaygroundSpec } from "./types";
import { BurnChart as BurnChartInteractive } from "@microcharts/react/burn-chart/interactive";
import staticModule, { playground as staticPlayground, PLAN, ACTUAL } from "./burn-chart";

/** Interactive half of the burn-chart chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./burn-chart`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return (
    <BurnChartInteractive
      data={{ plan: PLAN, actual: ACTUAL }}
      summary={false}
      width={150}
      height={26}
      animate
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => {
    const up = s.mode === "up";
    const plan = up ? PLAN.map((v) => 40 - v) : PLAN;
    const actual = up ? ACTUAL.map((v) => 40 - v) : ACTUAL;
    return (
      <BurnChartInteractive
        data={{ plan, actual }}
        mode={s.mode as "down" | "up"}
        projection={s.projection as boolean}
        label={s.label as "gap" | "none"}
        animate={ui.animate}
        summary={false}
        width={280}
        height={30}
      />
    );
  },
  codeInteractive: (s, _data, ui) =>
    [
      "<BurnChart",
      "  data={{ plan, actual }}",
      s.mode !== "down" && `  mode="${s.mode}"`,
      s.projection === false && "  projection={false}",
      s.label !== "gap" && `  label="${s.label}"`,
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
