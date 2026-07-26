import type { ChartModule, PlaygroundSpec } from "./types";
import { TraceFold } from "@microcharts/react/trace-fold";
import { TraceFold as TraceFoldInteractive } from "@microcharts/react/trace-fold/interactive";
import staticModule, { playground as staticPlayground, TRACE, ms } from "./trace-fold";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <TraceFoldInteractive
      data={TRACE}
      format={ms}
      summary={false}
      width={180}
      height={48}
      animate={animate}
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <TraceFoldInteractive
      data={TRACE}
      emphasis={s.emphasis as "critical" | "none"}
      labels={s.labels as boolean}
      format={ms}
      animate={ui.animate}
      summary={false}
      width={320}
      height={48}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<TraceFold",
      "  data={spans}",
      s.emphasis !== "critical" && `  emphasis="${s.emphasis}"`,
      s.labels === false && "  labels={false}",
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: TraceFold,
  ChartLive: TraceFoldInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
