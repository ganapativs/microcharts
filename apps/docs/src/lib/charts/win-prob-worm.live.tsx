import type { ChartModule, PlaygroundSpec } from "./types";
import { WinProbWorm } from "@microcharts/react/win-prob-worm";
import { WinProbWorm as WinProbWormInteractive } from "@microcharts/react/win-prob-worm/interactive";
import staticModule, {
  playground as staticPlayground,
  GAME,
  SIDES,
  NAILBITER,
  DECIDED,
} from "./win-prob-worm";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <WinProbWormInteractive
      data={GAME}
      sides={SIDES}
      summary={false}
      width={120}
      height={16}
      animate={animate}
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
  Chart: WinProbWorm,
  ChartLive: WinProbWormInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
