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

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <PartitionStrip>", () => {
  it("↓ drops into a child; announces its share of the whole and of its parent", async () => {
    const screen = await render(
      <PartitionStrip data={TREE} title="Bundle" width={200} height={24} />,
    );
    const wrap = screen.container.querySelector(".mc-partition-live") as HTMLElement;
    wrap.focus();
    // First arrow lands on unit 0 (the parent row); the second drops to its child.
    key(wrap, "ArrowDown");
    key(wrap, "ArrowDown");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("react: 28% of the whole, 64% of JS.");
  });

  it("←/→ stay inside the current row; ↑ returns to the parent", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <PartitionStrip data={TREE} width={200} height={24} onActive={(d) => seen.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-partition-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight"); // → unit 0 (JS)
    expect(seen.at(-1)).toMatchObject({ index: 0, value: 0.44, label: "JS" });
    key(wrap, "ArrowRight"); // skips the child row → CSS
    expect(seen.at(-1)).toMatchObject({ index: 3, value: 0.56, label: "CSS" });
    key(wrap, "ArrowLeft");
    expect(seen.at(-1)).toMatchObject({ index: 0, value: 0.44, label: "JS" });
    key(wrap, "ArrowDown"); // into react
    key(wrap, "ArrowRight"); // → vue (same row)
    expect(seen.at(-1)).toMatchObject({ index: 2, value: 0.16, label: "vue" });
    key(wrap, "ArrowUp"); // back to the parent
    expect(seen.at(-1)).toMatchObject({ index: 0, value: 0.44, label: "JS" });
    key(wrap, "Escape");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active segment: fires onSelect + pins an outline", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <PartitionStrip data={TREE} width={200} height={24} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-partition-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowDown");
    key(wrap, "ArrowDown");
    key(wrap, "Enter");
    expect(picks.at(-1)).toMatchObject({ index: 1, value: 0.28, label: "react" });
    // Pin survives blur (it is selection, not hover).
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('rect[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("controlled selectedIndex pins the outline without focus", async () => {
    const screen = await render(
      <PartitionStrip data={TREE} width={200} height={24} selectedIndex={3} />,
    );
    expect(screen.container.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });
});
