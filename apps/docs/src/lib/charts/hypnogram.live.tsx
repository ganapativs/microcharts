import type { ChartModule, PlaygroundSpec } from "./types";
import { Hypnogram } from "@microcharts/react/hypnogram";
import { Hypnogram as HypnogramInteractive } from "@microcharts/react/hypnogram/interactive";
import staticModule, { playground as staticPlayground, SLEEP, STATES, DOM } from "./hypnogram";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <HypnogramInteractive
      data={SLEEP}
      states={STATES}
      domain={DOM}
      summary={false}
      width={150}
      height={64}
      animate={animate}
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <HypnogramInteractive
      data={SLEEP}
      states={STATES}
      domain={DOM}
      mode={s.mode as "steps" | "lanes"}
      emphasis={s.emphasis === "none" ? undefined : (s.emphasis as string)}
      connectors={s.connectors as boolean}
      animate={ui.animate}
      summary={false}
      width={300}
      height={30}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<Hypnogram",
      "  data={sleep}",
      `  states={["Awake", "REM", "Light", "Deep"]}`,
      s.mode !== "steps" && `  mode="${s.mode}"`,
      s.emphasis !== "none" && `  emphasis="${s.emphasis}"`,
      s.connectors === false && "  connectors={false}",
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: Hypnogram,
  ChartLive: HypnogramInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
