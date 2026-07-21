import type { ChartModule, PlaygroundSpec } from "./types";
import { ErrorBudget } from "@microcharts/react/error-budget";
import { ErrorBudget as ErrorBudgetInteractive } from "@microcharts/react/error-budget/interactive";
import staticModule, { playground as staticPlayground, DEMO, WINDOW, BURNED } from "./error-budget";

/** Interactive half of the error-budget chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./error-budget`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return (
    <ErrorBudgetInteractive
      data={DEMO}
      window={WINDOW}
      summary={false}
      width={150}
      height={26}
      animate
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <ErrorBudgetInteractive
      data={s.exhausted ? BURNED : DEMO}
      window={s.exhausted ? 20 : WINDOW}
      rates={s.wedges ? undefined : [1]}
      label={s.label as "remaining" | "none"}
      unit="day"
      animate={ui.animate}
      summary={false}
      width={280}
      height={30}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<ErrorBudget",
      "  data={remaining}",
      "  window={30}",
      s.wedges === false && "  rates={[1]}",
      s.label !== "remaining" && `  label="${s.label}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: ErrorBudget,
  ChartLive: ErrorBudgetInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
