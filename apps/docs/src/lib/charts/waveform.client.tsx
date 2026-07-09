"use client";
import { Waveform as WaveformInteractive } from "@microcharts/react/waveform/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { WAVE } from "./waveform";

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or arrow across the buckets — each announces its position and peak amplitude.">
      <WaveformInteractive data={WAVE} progress={0.63} title="Voice memo" width={320} height={32} />
    </DemoPanel>
  );
}
