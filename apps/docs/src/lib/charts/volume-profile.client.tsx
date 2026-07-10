"use client";
import { VolumeProfile as VolumeProfileInteractive } from "@microcharts/react/volume-profile/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { PROFILE } from "./volume-profile";

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or use ↑/↓ across the levels — each announces its share of total activity, and the POC is flagged.">
      <VolumeProfileInteractive data={PROFILE} title="Volume by price" width={120} height={90} />
    </DemoPanel>
  );
}
