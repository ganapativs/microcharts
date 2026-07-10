"use client";
import { GradeProfile as GradeProfileInteractive } from "@microcharts/react/grade-profile/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { TRAIL } from "./grade-profile";

const m = (n: number) => `${n} m`;

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover, or use ←/→ — each pitch announces its distance, true grade, and cumulative climb.">
      <GradeProfileInteractive
        data={TRAIL}
        format={m}
        title="Queen stage"
        width={300}
        height={44}
      />
    </DemoPanel>
  );
}
