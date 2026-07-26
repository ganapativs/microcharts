// The inverse of readout-containment.browser.test.tsx.
//
// That suite fails a readout for being TOO LONG. Nothing failed a readout for
// dropping a number, and the pressure only ran one way — so several charts won
// the width gate by deleting data from the chip: StackedArea showed one band of
// three (the trailing series was never the leader, so its name was unreachable
// in the UI); ConfusionGrid showed a row percentage and never the tally it was
// computed from; PartitionStrip, LikertStrip and VolumeProfile showed shares
// with the magnitudes behind them missing from the chip AND the announcement.
//
// The rule these assert: whatever the caller passed in must be readable back
// out — from the chip, or from the live region, at the chart's default size. A
// derived figure (a share, a normalized percent) never substitutes for the
// number it was derived from, because it cannot be inverted without a total the
// reader does not have. Sighted and screen-reader users get the same facts.
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import type { ReactElement } from "react";

import "../../styles.css";

import { StackedArea } from "../charts/stacked-area/client.js";
import { ConfusionGrid } from "../charts/confusion-grid/client.js";
import { PartitionStrip } from "../charts/partition-strip/client.js";
import { LikertStrip } from "../charts/likert-strip/client.js";
import { VolumeProfile } from "../charts/volume-profile/client.js";
import { SegmentedBar } from "../charts/segmented-bar/client.js";
import { MicroDonut } from "../charts/micro-donut/client.js";
import { ActivityGrid } from "../charts/activity-grid/client.js";
import { CohortTriangle } from "../charts/cohort-triangle/client.js";
import { Seismogram } from "../charts/seismogram/client.js";
import { Waveform } from "../charts/waveform/client.js";

interface Case {
  ui: () => ReactElement;
  /** Arrow presses from focus to reach the unit under test (0 = first). */
  steps: number;
  /** Substrings the CHIP must contain. */
  chip: string[];
  /** Substrings the live region must contain. */
  live?: string[];
  /** Substrings the chip must NOT contain. */
  chipNot?: string[];
}

const MIX = [
  { label: "Mobile", values: [30, 34, 36, 40] },
  { label: "Web", values: [50, 48, 47, 45] },
  { label: "API", values: [20, 18, 17, 15] },
];

const CASES: Record<string, Case> = {
  // The report that started this: API is never the largest band, so a
  // leader-only chip could never name it at any column.
  "stacked-area names every band, not just the leader": {
    ui: () => <StackedArea data={MIX} title="Mix" />,
    steps: 1,
    chip: ["Mobile", "Web", "API"],
    live: ["Mobile", "Web", "API"],
  },
  "confusion-grid shows the cell tally, not only its row share": {
    ui: () => (
      <ConfusionGrid
        data={{
          labels: ["cat", "dog"],
          counts: [
            [88, 12],
            [10, 59],
          ],
        }}
        title="Classifier"
        size={80}
      />
    ),
    steps: 1,
    chip: ["88"],
    live: ["88"],
  },
  "partition-strip shows the node value behind the share": {
    ui: () => (
      <PartitionStrip
        data={[
          {
            label: "Compute",
            children: [
              { label: "CPU", value: 40 },
              { label: "GPU", value: 25 },
            ],
          },
          { label: "Storage", children: [{ label: "SSD", value: 35 }] },
        ]}
        title="Spend"
      />
    ),
    steps: 1,
    chip: ["Compute", "65"],
    live: ["65"],
  },
  "likert-strip shows the response count behind the share": {
    ui: () => (
      <LikertStrip
        data={[
          { label: "Strongly disagree", value: 10 },
          { label: "Disagree", value: 14 },
          { label: "Neutral", value: 14 },
          { label: "Agree", value: 34 },
          { label: "Strongly agree", value: 28 },
        ]}
        title="Q1"
      />
    ),
    steps: 1,
    chip: ["Strongly disagree", "10"],
    live: ["10"],
  },
  "volume-profile shows the activity mass behind the share": {
    ui: () => (
      <VolumeProfile
        data={[
          { level: 138, weight: 8 },
          { level: 142, weight: 25 },
          { level: 146, weight: 7 },
        ]}
        bins={3}
        title="Volume"
        width={120}
        height={60}
      />
    ),
    steps: 1,
    // The level is the BIN's centre (a computed number), so the assertion is on
    // the mass — the figure the caller actually passed and the chip used to omit.
    chip: ["8"],
    live: ["8"],
  },
  // The rolled-up "Other" segment spent its parenthesis on a category COUNT and
  // never showed the total it stood for.
  "segmented-bar shows the value of the Other rollup": {
    ui: () => (
      <SegmentedBar
        data={[
          { label: "Chrome", value: 620 },
          { label: "Safari", value: 240 },
          { label: "Firefox", value: 90 },
          { label: "Edge", value: 30 },
          { label: "Arc", value: 12 },
          { label: "Brave", value: 8 },
        ]}
        title="Share"
      />
    ),
    steps: 5,
    chip: ["Other", "20"],
    live: ["20"],
    chipNot: ["categories"],
  },
  "micro-donut shows the value of the Other rollup": {
    ui: () => (
      <MicroDonut
        data={[
          { label: "Chrome", value: 620 },
          { label: "Safari", value: 240 },
          { label: "Firefox", value: 90 },
          { label: "Edge", value: 30 },
          { label: "Arc", value: 12 },
          { label: "Brave", value: 8 },
        ]}
        title="Share"
      />
    ),
    steps: 5,
    // MicroDonut renders the localized announcement as its chip, so the rollup
    // total arrives through `strings.shareOther` rather than a composed line.
    chip: ["Other", "50"],
  },
  // `anchor` dates every cell; the chip used to show a bare number while the
  // date sat unused one prop away.
  "activity-grid names the day when the grid is dated": {
    ui: () => (
      <ActivityGrid
        data={Array.from({ length: 21 }, (_, i) => i)}
        anchor="2026-03-02"
        title="Commits"
      />
    ),
    steps: 1,
    chip: ["Mar 2"],
    live: ["Mar 2"],
  },
  "cohort-triangle names the cohort and the age": {
    ui: () => (
      <CohortTriangle
        data={[
          { label: "Jan", values: [1, 0.6, 0.4] },
          { label: "Feb", values: [1, 0.55] },
        ]}
        title="Cohorts"
      />
    ),
    steps: 1,
    chip: ["Jan"],
    live: ["Jan"],
  },
  // 0 is a measurement ("nothing happened"), null is the absence of one. Both
  // used to render as an em dash.
  "seismogram reads a quiet slot as zero, not as missing": {
    ui: () => <Seismogram data={[0, 3, 0, 8, 0]} title="Bursts" />,
    steps: 1,
    chip: ["0"],
    live: ["0"],
    chipNot: ["—"],
  },
  // …and the mirror case: an empty bucket must NOT read as a measured zero.
  "waveform reads an empty bucket as missing, not as zero": {
    ui: () => <Waveform data={[null, null, null, null]} title="Clip" width={60} />,
    steps: 1,
    chip: ["—"],
  },
};

const text = (el: Element | null): string => (el?.textContent ?? "").trim();

describe("a readout gives back the number the caller put in", () => {
  for (const [name, c] of Object.entries(CASES)) {
    it(name, async () => {
      const screen = await render(c.ui());
      const host = screen.container.querySelector<HTMLElement>('span[role="img"][tabindex]');
      expect(host, "interactive host wrapper").not.toBeNull();
      host!.focus();
      for (let i = 0; i < c.steps; i++) {
        host!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      }

      // The chip is React state — it lands on the next tick.
      await expect
        .poll(() => text(screen.container.querySelector(".mc-spark-readout")))
        .not.toBe("");
      const chip = text(screen.container.querySelector(".mc-spark-readout"));
      for (const needle of c.chip) {
        expect(chip, `chip "${chip}" is missing ${needle}`).toContain(needle);
      }
      for (const needle of c.chipNot ?? []) {
        expect(chip, `chip "${chip}" should not contain ${needle}`).not.toContain(needle);
      }
      if (c.live) {
        const live = text(screen.container.querySelector('[aria-live="polite"]'));
        for (const needle of c.live) {
          expect(live, `announcement "${live}" is missing ${needle}`).toContain(needle);
        }
      }
    });
  }
});
