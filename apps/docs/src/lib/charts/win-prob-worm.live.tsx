import type { ChartModule, PlaygroundSpec } from "./types";
import { WinProbWorm as WinProbWormInteractive } from "@microcharts/react/win-prob-worm/interactive";
import staticModule, {
  playground as staticPlayground,
  GAME,
  SIDES,
  NAILBITER,
  DECIDED,
} from "./win-prob-worm";

/** Interactive half of the win-prob-worm chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./win-prob-worm`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return (
    <WinProbWormInteractive
      data={GAME}
      sides={SIDES}
      summary={false}
      width={120}
      height={16}
      animate
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <WinProbWormInteractive
      data={s.game === "nailbiter" ? NAILBITER : s.game === "decided" ? DECIDED : GAME}
      sides={SIDES}
      markSwing={s.swing as boolean}
      label={s.label ? "last" : "none"}
      title="Win probability"
      animate={ui.animate}
      summary={false}
      width={280}
      height={30}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<WinProbWorm",
      `  data={${s.game === "nailbiter" ? "nailbiter" : s.game === "decided" ? "decided" : "game"}}`,
      '  sides={["home", "away"]}',
      s.swing === false && "  markSwing={false}",
      s.label === false && '  label="none"',
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
