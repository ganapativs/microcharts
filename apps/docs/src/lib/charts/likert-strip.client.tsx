"use client";
import { LikertStrip as LikertStripInteractive } from "@microcharts/react/likert-strip/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const SURVEY = [
  { label: "Strongly disagree", value: 10 },
  { label: "Disagree", value: 14 },
  { label: "Neutral", value: 14 },
  { label: "Agree", value: 34 },
  { label: "Strongly agree", value: 28 },
];

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or arrow through the levels — each announces its share and position.">
      <LikertStripInteractive
        data={SURVEY}
        title="Q1 satisfaction"
        style={{ width: 260, height: 26 }}
      />
    </DemoPanel>
  );
}
