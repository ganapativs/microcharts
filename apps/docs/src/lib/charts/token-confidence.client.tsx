"use client";
import { TokenConfidence as TokenConfidenceInteractive } from "@microcharts/react/token-confidence/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { ANSWER } from "./token-confidence";

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Tab in, then use ←/→ to rove the flagged tokens — each announces its tier and confidence.">
      <TokenConfidenceInteractive data={ANSWER} title="Model answer" style={{ fontSize: "1rem" }} />
    </DemoPanel>
  );
}
