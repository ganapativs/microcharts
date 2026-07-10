"use client";
import { WinProbWorm as WinProbWormInteractive } from "@microcharts/react/win-prob-worm/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { GAME } from "./win-prob-worm";

export function InteractiveDemo() {
  // GAME referenced inside the component — this module and its registry parent
  // import each other (temporal-dead-zone trap at build otherwise).
  return (
    <DemoPanel hint="Hover or arrow across the game — each point announces the current leader and their probability. The worm reads accent while the top side leads, neutral when it trails; dots mark the lead changes.">
      <WinProbWormInteractive
        data={GAME}
        sides={["home", "away"]}
        title="Win probability"
        width={280}
        height={30}
      />
    </DemoPanel>
  );
}
