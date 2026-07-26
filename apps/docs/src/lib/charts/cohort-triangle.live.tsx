import type { ChartModule, PlaygroundSpec } from "./types";
import { CohortTriangle } from "@microcharts/react/cohort-triangle";
import { CohortTriangle as CohortTriangleInteractive } from "@microcharts/react/cohort-triangle/interactive";
import staticModule, { playground as staticPlayground, COHORTS } from "./cohort-triangle";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <CohortTriangleInteractive
      data={COHORTS}
      cell={10}
      labels={false}
      summary={false}
      animate={animate}
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <CohortTriangleInteractive
      data={COHORTS}
      labels={s.labels as boolean}
      highlight={s.highlight === "none" ? undefined : (s.highlight as string)}
      cell={Number(s.cell)}
      unit="month"
      animate={ui.animate}
      title="Monthly retention cohorts"
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<CohortTriangle",
      "  data={cohorts}",
      s.labels === false && "  labels={false}",
      s.highlight !== "none" && `  highlight="${s.highlight}"`,
      `  cell={${s.cell}}`,
      '  unit="month"',
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: CohortTriangle,
  ChartLive: CohortTriangleInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
