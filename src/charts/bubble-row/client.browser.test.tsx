import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { BubbleRow } from "./client.js";

const REGIONS = [
  { label: "EMEA", value: 1240 },
  { label: "AMER", value: 890 },
  { label: "LATAM", value: 210 },
] as const;

describe("interactive <BubbleRow> (plan/24 #11)", () => {
  it("arrow keys rove and announce each bubble's exact value", async () => {
    const screen = await render(<BubbleRow data={REGIONS} title="Markets" />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    const live = fig.querySelector('[aria-live="polite"]')!;
    fig.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(live.textContent).toBe("EMEA: 1,240.");
    await userEvent.keyboard("{ArrowRight}");
    expect(live.textContent).toBe("AMER: 890.");
  });

  it("wrapper owns naming; static chart is decorative", async () => {
    const screen = await render(<BubbleRow data={REGIONS} title="Markets" />);
    const wrap = screen.container.querySelector(".mc-bubble-live")!;
    expect(wrap.getAttribute("aria-label")).toBe(
      "Markets. 3 items; largest EMEA at 1,240, smallest LATAM at 210.",
    );
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });
});
