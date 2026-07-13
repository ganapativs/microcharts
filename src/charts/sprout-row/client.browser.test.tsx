import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { SproutRow } from "./client.js";

const ACCT = [
  { label: "Acme", value: 3 },
  { label: "Beta", value: 1 },
  { label: "Gamma", value: null },
] as const;

describe("interactive <SproutRow>", () => {
  it("arrow keys rove and announce each item's stage", async () => {
    const screen = await render(<SproutRow data={ACCT} title="Accounts" />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    const live = fig.querySelector('[aria-live="polite"]')!;
    fig.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(live.textContent).toBe("Acme: bloom, stage 4 of 4.");
    await userEvent.keyboard("{ArrowRight}");
    expect(live.textContent).toBe("Beta: sprout, stage 2 of 4.");
    await userEvent.keyboard("{ArrowRight}");
    expect(live.textContent).toBe("Gamma: no data.");
  });

  it("wrapper owns naming; static chart is decorative", async () => {
    const screen = await render(<SproutRow data={ACCT} title="Accounts" />);
    const wrap = screen.container.querySelector(".mc-sprout-live")!;
    expect(wrap.getAttribute("aria-label")).toBe("Accounts. 3 items; 1 at bloom, 0 at seed.");
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });
});
