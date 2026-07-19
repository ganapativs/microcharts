import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { FillWord } from "./client.js";

describe("interactive <FillWord>", () => {
  it("announces changes through a polite region (leading edge)", async () => {
    const screen = await render(<FillWord word="uploading" value={0.2} />);
    const live = document.querySelector('[aria-live="polite"]')!;
    expect(live.textContent).toBe("");
    await screen.rerender(<FillWord word="uploading" value={0.6} />);
    await vi.waitFor(() => expect(live.textContent).toBe("uploading: 60% complete."));
  });

  it("wrapper owns naming; static chart is decorative", async () => {
    const screen = await render(<FillWord word="uploading" value={0.62} title="Upload" />);
    const wrap = screen.container.querySelector(".mc-fillword-live")!;
    expect(wrap.getAttribute("aria-label")).toBe("Upload. uploading: 62% complete.");
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("click fires onSelect with the fill fraction + word", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <FillWord word="uploading" value={0.62} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-fillword-live") as HTMLElement;
    wrap.click();
    await expect.poll(() => picks.at(-1)).toEqual({ index: 0, value: 0.62, label: "uploading" });
  });

  it("Enter fires onSelect", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <FillWord word="uploading" value={0.2} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-fillword-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await expect.poll(() => picks.at(-1)).toEqual({ index: 0, value: 0.2, label: "uploading" });
  });
});
