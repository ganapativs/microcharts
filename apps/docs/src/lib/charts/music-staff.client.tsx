"use client";
import { MusicStaff as MusicStaffInteractive } from "@microcharts/react/music-staff/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const MELODY = [3, 5, 4, 8, 6, 9, 7, 11];

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or arrow ←/→ across the notes — each announces its position and value, like stepping through a melody. Pitch reads in steps, so exact reads steer to Sparkline.">
      <MusicStaffInteractive
        data={MELODY}
        label="last"
        title="Sprint melody"
        width={220}
        height={40}
      />
    </DemoPanel>
  );
}
