import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { BalanceBeam } from "./client.js";

const IN_OUT = [
  { label: "Inflow", value: 620 },
  { label: "outflow", value: 480 },
] as const;

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <BalanceBeam>", () => {
  it("announces when the heavier side flips", async () => {
    const screen = await render(<BalanceBeam data={IN_OUT} />);
    const live = document.querySelector('[aria-live="polite"]')!;
    expect(live.textContent).toBe("");
    // flip: now outflow heavier
    await screen.rerender(
      <BalanceBeam
        data={[
          { label: "Inflow", value: 480 },
          { label: "outflow", value: 620 },
        ]}
      />,
    );
    await vi.waitFor(() =>
      expect(live.textContent).toBe("Inflow 480 vs outflow 620; outflow heavier."),
    );
  });

  it("wrapper owns naming; static chart is decorative", async () => {
    const screen = await render(<BalanceBeam data={IN_OUT} title="Cash flow" />);
    const wrap = screen.container.querySelector(".mc-beam-live")!;
    expect(wrap.getAttribute("aria-label")).toBe(
      "Cash flow. Inflow 620 vs outflow 480; Inflow heavier.",
    );
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("onActive reports the focused pan; ←/→ are absolute sides; null on Escape", async () => {
    const seen: unknown[] = [];
    const screen = await render(<BalanceBeam data={IN_OUT} onActive={(d) => seen.push(d)} />);
    const wrap = screen.container.querySelector(".mc-beam-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    expect(seen[seen.length - 1]).toMatchObject({ index: 1, value: 480, label: "outflow" });
    key(wrap, "ArrowLeft");
    expect(seen[seen.length - 1]).toMatchObject({ index: 0, value: 620, label: "Inflow" });
    key(wrap, "Escape");
    expect(seen[seen.length - 1]).toBeNull();
  });

  it("Enter selects the active pan: fires onSelect + pins a ring that survives blur", async () => {
    const picks: unknown[] = [];
    const screen = await render(<BalanceBeam data={IN_OUT} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-beam-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    key(wrap, "Enter");
    expect(picks[picks.length - 1]).toMatchObject({ index: 1, value: 480, label: "outflow" });
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('rect[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("controlled selectedIndex pins the ring without focus", async () => {
    const screen = await render(<BalanceBeam data={IN_OUT} selectedIndex={0} />);
    expect(screen.container.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });

  it("←/→ rove pans with per-pan announcements", async () => {
    const screen = await render(<BalanceBeam data={IN_OUT} />);
    const wrap = screen.container.querySelector(".mc-beam-live") as HTMLElement;
    const live = document.querySelector('[aria-live="polite"]')!;
    wrap.focus();
    key(wrap, "ArrowRight");
    await expect.poll(() => live.textContent).toBe("outflow: 480.");
    key(wrap, "ArrowLeft");
    await expect.poll(() => live.textContent).toBe("Inflow: 620.");
  });

  it("clearing the roving falls back to the data-change announcement", async () => {
    const screen = await render(<BalanceBeam data={IN_OUT} />);
    const wrap = screen.container.querySelector(".mc-beam-live") as HTMLElement;
    const live = document.querySelector('[aria-live="polite"]')!;
    wrap.focus();
    key(wrap, "ArrowRight");
    await expect.poll(() => live.textContent).toBe("outflow: 480.");
    key(wrap, "Escape");
    await expect.poll(() => live.textContent).toBe("");
  });
});
