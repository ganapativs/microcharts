import { WinProbWorm } from "@microcharts/react/win-prob-worm";
import { WinProbWorm as WinProbWormInteractive } from "@microcharts/react/win-prob-worm/interactive";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
// a game where the lead flips three times, then home pulls away to 98%
export const GAME: number[] = [50, 48, 45, 52, 60, 58, 42, 38, 55, 68, 82, 90, 88, 94, 98];
const NAILBITER: number[] = [50, 53, 49, 52, 48, 51, 47, 50, 46, 49, 45, 48, 52];
const DECIDED: number[] = [50, 58, 66, 74, 80, 86, 90, 93, 96, 98, 99];
const SIDES: [string, string] = ["home", "away"];

export const entry: ChartEntry = {
  name: "WinProbWorm",
  slug: "win-prob-worm",
  status: "stable",
  collection: "frontier",
  tagline: "Who's winning, and when did the lead flip?",
  staticImport: `${PKG}/win-prob-worm`,
  interactiveImport: `${PKG}/win-prob-worm/interactive`,
  dataShape: "number[]",
  encoding: {
    channel: "y = win probability on a fixed 0–100 axis, split at the 50% line",
    precision: "high",
  },
  nodeBudget: "≤ 5 + 1 per lead change",
  bestFor: [
    "live win / election probability where the lead flips",
    "a modelled forecast whose crossings are the story",
    "any 0–100 probability you must not truncate",
  ],
  avoidFor: ["a raw score or margin (Sparkline)", "a value that isn't a bounded 0–100 probability"],
  props: [
    {
      name: "data",
      type: "number[]",
      required: true,
      description: "A single win-probability series, clamped to 0–100.",
    },
    {
      name: "sides",
      type: "[string, string]",
      required: false,
      description: 'Names for the two sides — [>50, <50]. Default ["A", "B"].',
    },
    {
      name: "label",
      type: '"last" | "none"',
      required: false,
      description: 'Print the current leader\'s probability at the endpoint (default "last").',
    },
    {
      name: "markSwing",
      type: "boolean",
      required: false,
      description: "Mark the biggest momentum swing (default true; seat-gated).",
    },
  ],
  demo: GAME,
  example: {
    title: "Win probability",
    code: `import { WinProbWorm } from "${PKG}/win-prob-worm";\n\n<WinProbWorm\n  data={[50, 48, 45, 52, 60, 58, 42, 38, 55, 68, 82, 90, 88, 94, 98]}\n  sides={["home", "away"]}\n  title="Win probability"\n/>`,
  },
};

export function Preview() {
  return <WinProbWorm data={GAME} sides={SIDES} summary={false} width={120} height={16} />;
}

export const showcase = {
  hint: "watch the lead flip",
  Node: () => (
    <WinProbWorm data={GAME} sides={SIDES} title="Win probability" width={160} height={24} />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "game",
      label: "game",
      options: ["flips", "nailbiter", "decided"],
      init: "flips",
    },
    { kind: "toggle", key: "swing", label: "mark swing", init: true },
    { kind: "toggle", key: "label", label: "endpoint label", init: true },
  ],
  render: (s) => (
    <WinProbWorm
      data={s.game === "nailbiter" ? NAILBITER : s.game === "decided" ? DECIDED : GAME}
      sides={SIDES}
      markSwing={s.swing as boolean}
      label={s.label ? "last" : "none"}
      title="Win probability"
      summary={false}
      width={280}
      height={30}
    />
  ),
  code: (s) =>
    [
      "<WinProbWorm",
      `  data={${s.game === "nailbiter" ? "nailbiter" : s.game === "decided" ? "decided" : "game"}}`,
      '  sides={["home", "away"]}',
      s.swing === false && "  markSwing={false}",
      s.label === false && '  label="none"',
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
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
  interactiveHint:
    "Hover or arrow across the game — each point announces the current leader and their probability. The worm reads accent while the top side leads, neutral when it trails; dots mark the lead changes.",
};

export const recipes: Recipe[] = [
  {
    label: "a wire-to-wire lead never crosses 50",
    code: `<WinProbWorm data={decided} sides={["home", "away"]} />`,
    node: <WinProbWorm data={DECIDED} sides={SIDES} summary={false} width={200} height={24} />,
  },
  {
    label: "a nailbiter hovers around the line",
    code: `<WinProbWorm data={nailbiter} sides={["home", "away"]} />`,
    node: <WinProbWorm data={NAILBITER} sides={SIDES} summary={false} width={200} height={24} />,
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <WinProbWorm
      data={props.data.length ? props.data : GAME}
      sides={SIDES}
      summary={false}
      width={props.width ?? 90}
      height={props.height ?? 16}
    />
  );
}

export function markCode(): string {
  return `<WinProbWorm data={winProb} sides={["home", "away"]} />`;
}

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

export default {
  entry,
  Preview,
  PreviewLive,
  showcase,
  playground,
  recipes,
  Mark,
  markCode,
} satisfies ChartModule;
