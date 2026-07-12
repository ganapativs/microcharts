import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { PartitionStrip } from "./client.js";

const TREE = [
  {
    label: "JS",
    children: [
      { label: "react", value: 28 },
      { label: "vue", value: 16 },
    ],
  },
  { label: "CSS", value: 56 },
];

describe("interactive <PartitionStrip>", () => {
  it("↓ drops into a child; announces its share of the whole and of its parent", async () => {
    const screen = await render(
      <PartitionStrip data={TREE} title="Bundle" width={200} height={24} />,
    );
    const wrap = screen.container.querySelector(".mc-partition-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("react: 28% of the whole, 64% of JS.");
  });
});
