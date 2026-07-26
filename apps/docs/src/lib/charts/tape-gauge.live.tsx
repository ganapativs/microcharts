import type { ChartModule, PlaygroundSpec } from "./types";
import { TapeGauge } from "@microcharts/react/tape-gauge";
import { TapeGauge as TapeGaugeInteractive } from "@microcharts/react/tape-gauge/interactive";
import staticModule, { playground as staticPlayground, ZONES } from "./tape-gauge";

/** Interactive half of the tape-gauge chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./tape-gauge`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <TapeGaugeInteractive
      value={142}
      rate={1}
      zones={ZONES}
      span={60}
      summary={false}
      width={46}
      height={60}
      animate={animate}
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => {
    const vertical = s.orientation !== "horizontal";
    return (
      <TapeGaugeInteractive
        value={s.value as number}
        rate={s.rate as number}
        zones={ZONES}
        span={60}
        orientation={s.orientation as "vertical" | "horizontal"}
        title="Playground"
        animate={ui.animate}
        width={vertical ? 44 : 240}
        height={vertical ? 112 : 48}
      />
    );
  },
  codeInteractive: (s, _data, ui) =>
    [
      "<TapeGauge",
      `  value={${s.value}}`,
      s.rate !== 0 && `  rate={${s.rate}}`,
      "  zones={zones}",
      s.orientation !== "vertical" && `  orientation="${s.orientation}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: TapeGauge,
  ChartLive: TapeGaugeInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
