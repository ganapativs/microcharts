import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { BalanceBeam } from "./client.js";

const IN_OUT = [
  { label: "Inflow", value: 620 },
  { label: "outflow", value: 480 },
] as const;

describe("interactive <BalanceBeam> (plan/24 #8)", () => {
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
});
