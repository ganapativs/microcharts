import type { ChartModule, PlaygroundSpec } from "./types";
import { PictogramRow } from "@microcharts/react/pictogram-row";
import { PictogramRow as PictogramRowInteractive } from "@microcharts/react/pictogram-row/interactive";
import staticModule, { playground as staticPlayground } from "./pictogram-row";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <PictogramRowInteractive
      value={5}
      total={8}
      summary={false}
      width={110}
      height={16}
      animate={animate}
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => {
    const total = s.total as number;
    const value = Math.min(s.value as number, total);
    return (
      <PictogramRowInteractive
        value={value}
        total={total}
        shape={s.shape as "dot" | "square"}
        fractional={s.fractional as "clip" | "round"}
        summary={false}
        animate={ui.animate}
        width={240}
        height={28}
      />
    );
  },
  codeInteractive: (s, _data, ui) => {
    const total = s.total as number;
    const value = Math.min(s.value as number, total);
    return [
      "<PictogramRow",
      `  value={${value}}`,
      `  total={${total}}`,
      s.shape !== "dot" && `  shape="${s.shape}"`,
      s.fractional !== "clip" && `  fractional="${s.fractional}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n");
  },
};

export default {
  ...staticModule,
  Chart: PictogramRow,
  ChartLive: PictogramRowInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
