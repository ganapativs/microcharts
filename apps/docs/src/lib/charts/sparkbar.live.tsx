import type { ChartModule, PlaygroundSpec } from "./types";
import { SparkBar } from "@microcharts/react/sparkbar";
import { SparkBar as SparkBarInteractive } from "@microcharts/react/sparkbar/interactive";
import staticModule, { entry, playground as staticPlayground } from "./sparkbar";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <SparkBarInteractive
      data={entry.demo}
      width={180}
      height={48}
      summary={false}
      animate={animate}
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, data, ui) => {
    const shown = s.mode === "winloss" ? data.map((n) => (n % 2 === 0 ? 1 : -1)) : data;
    const gap = Number((s.gap as number).toFixed(2));
    return (
      <SparkBarInteractive
        data={shown}
        width={340}
        height={92}
        mode={s.mode as "bar" | "winloss"}
        gap={gap}
        label={s.label ? "last" : "none"}
        positive={s.positive as "up" | "down"}
        locale={s.locale as string}
        animate={ui.animate}
        className="w-full max-w-md"
        title="Deploys per day"
      />
    );
  },
  codeInteractive: (s, data, ui) => {
    const shown = s.mode === "winloss" ? data.map((n) => (n % 2 === 0 ? 1 : -1)) : data;
    const gap = Number((s.gap as number).toFixed(2));
    return [
      "<SparkBar",
      `  data={[${shown.join(", ")}]}`,
      `  mode="${s.mode}"`,
      gap !== 0.25 && `  gap={${gap}}`,
      s.label && '  label="last"',
      s.positive !== "up" && `  positive="${s.positive}"`,
      s.locale !== "en-US" && `  locale="${s.locale}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n");
  },
};

export default {
  ...staticModule,
  Chart: SparkBar,
  ChartLive: SparkBarInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
