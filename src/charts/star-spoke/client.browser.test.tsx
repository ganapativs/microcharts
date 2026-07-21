import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { StarSpoke } from "./client.js";

const PROFILE = [
  { label: "Speed", value: 0.9 },
  { label: "Power", value: 0.6 },
  { label: "Cost", value: 0.3 },
];

describe("interactive <StarSpoke>", () => {
  // The first arrow from nothing lands on spoke 0 (kernel contract); the second
  // rotates to spoke 1.
  it("→ rotates focus through spokes; announces label + value", async () => {
    const screen = await render(<StarSpoke data={PROFILE} title="Profile" size={64} />);
    const wrap = screen.container.querySelector(".mc-star-live") as HTMLElement;
    wrap.focus();
    const live = document.querySelector('[aria-live="polite"]')!;
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("Speed: 0.9.");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("Power: 0.6.");
  });

  // Regression: the wrapper is an inline-block sized by the `size` prop (no CSS
  // width class), so the composed SVG must hug it at its natural size — a
  // stray `style={{width:"100%"}}` on the static entry collapses both to 0×0
  // in this exact layout (see memory: interactive-wrapper-fills-svg "Nuance").
  it("composed SVG fills the size-prop wrapper exactly (no 0×0 collapse)", async () => {
    const screen = await render(<StarSpoke data={PROFILE} title="Profile" size={64} />);
    const wrap = screen.container.querySelector(".mc-star-live") as HTMLElement;
    const svg = wrap.querySelector("svg")!;
    const wrapRect = wrap.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();
    expect(svgRect.width).toBeGreaterThan(0);
    expect(svgRect.width).toBe(wrapRect.width);
    expect(svgRect.height).toBe(wrapRect.height);
  });

  it("a null-value spoke announces no data without throwing", async () => {
    // `value` is typed `number`, but bad data reaches the readout at runtime.
    const gappy = [
      { label: "Speed", value: 0.9 },
      { label: "Power", value: null as unknown as number },
      { label: "Cost", value: 0.3 },
    ];
    const screen = await render(<StarSpoke data={gappy} title="Profile" size={64} />);
    const wrap = screen.container.querySelector(".mc-star-live") as HTMLElement;
    wrap.focus();
    const live = document.querySelector('[aria-live="polite"]')!;
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("Power: no data.");
  });

  it("reports the active spoke to onActive; null when cleared", async () => {
    const onActive = vi.fn();
    const screen = await render(
      <StarSpoke data={PROFILE} title="Profile" size={64} onActive={onActive} />,
    );
    const fig = screen.container.querySelector(".mc-star-live") as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{End}");
    expect(onActive).toHaveBeenLastCalledWith(
      expect.objectContaining({ index: 2, value: 0.3, label: "Cost" }),
    );
    await userEvent.keyboard("{Escape}");
    expect(onActive).toHaveBeenLastCalledWith(null);
  });

  it("Enter selects the active spoke and pins a mark that survives blur", async () => {
    const onSelect = vi.fn();
    const screen = await render(
      <StarSpoke data={PROFILE} title="Profile" size={64} onSelect={onSelect} />,
    );
    const fig = screen.container.querySelector(".mc-star-live") as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{Home}{Enter}");
    expect(onSelect).toHaveBeenLastCalledWith(
      expect.objectContaining({ index: 0, value: 0.9, label: "Speed" }),
    );
    fig.blur();
    await vi.waitFor(() =>
      expect(screen.container.querySelector('line[data-mc-w="tick"]')).not.toBeNull(),
    );
  });

  it("controlled selectedIndex pins a spoke with no interaction", async () => {
    const screen = await render(<StarSpoke data={PROFILE} size={64} selectedIndex={1} />);
    expect(screen.container.querySelectorAll('line[data-mc-w="tick"]').length).toBe(1);
  });
});
