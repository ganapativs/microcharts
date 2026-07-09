"use client";
import { useState } from "react";
import { TallyMarks as TallyMarksInteractive } from "@microcharts/react/tally-marks/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

export function InteractiveDemo() {
  const [value, setValue] = useState(7);
  return (
    <DemoPanel hint="Tap to count — each new mark draws in and the total is announced through a polite live region. A count has no sub-parts, so focus reads the summary and there is no cursor to move.">
      <button
        type="button"
        onClick={() => setValue((v) => (v >= 40 ? 0 : v + 1))}
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", lineHeight: 0 }}
        aria-label="Add a mark"
      >
        <TallyMarksInteractive value={value} title="Count" height={26} />
      </button>
    </DemoPanel>
  );
}
