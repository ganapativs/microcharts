import type { ChartModule, PlaygroundSpec } from "./types";
import { BalanceBeam } from "@microcharts/react/balance-beam";
import { BalanceBeam as BalanceBeamInteractive } from "@microcharts/react/balance-beam/interactive";
import staticModule, { playground as staticPlayground, FLOW } from "./balance-beam";

/** Interactive half of the balance-beam chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./balance-beam`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return (
    <span className="inline-flex items-center gap-4">
      <BalanceBeamInteractive data={FLOW} summary={false} width={56} height={24} animate />
      <BalanceBeam
        data={[
          { label: "A", value: 500 },
          { label: "B", value: 500 },
        ]}
        summary={false}
        width={56}
        height={24}
      />
    </span>
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <BalanceBeamInteractive
      data={[
        { label: "Inflow", value: s.left as number },
        { label: "Outflow", value: s.right as number },
      ]}
      shape={s.shape as "square" | "round"}
      label={s.label ? "values" : "none"}
      summary={false}
      animate={ui.animate}
      width={120}
      height={44}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<BalanceBeam",
      `  data={[{ label: "Inflow", value: ${s.left} }, { label: "Outflow", value: ${s.right} }]}`,
      s.shape !== "square" && `  shape="${s.shape}"`,
      s.label && '  label="values"',
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
