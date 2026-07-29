import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { SproutRow } from "./client.js";
import { SproutRow as StaticSproutRow } from "./index.js";

const ACCT = [
  { label: "Acme", value: 3 },
  { label: "Beta", value: 1 },
  { label: "Gamma", value: null },
] as const;

const viewBox = (root: { container: HTMLElement }): string | null =>
  root.container.querySelector("svg")!.getAttribute("viewBox");

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

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

  it("onActive reports the focused datum (value = stage); null once cleared", async () => {
    const seen: unknown[] = [];
    const screen = await render(<SproutRow data={ACCT} onActive={(d) => seen.push(d)} />);
    const wrap = screen.container.querySelector(".mc-sprout-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    expect(seen.at(-1)).toMatchObject({ index: 0, value: 3, label: "Acme" });
    key(wrap, "End"); // the missing item reports a null value
    expect(seen.at(-1)).toMatchObject({ index: 2, value: null, label: "Gamma" });
    key(wrap, "Escape");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active sprout: fires onSelect + pins a ring", async () => {
    const picks: unknown[] = [];
    const screen = await render(<SproutRow data={ACCT} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-sprout-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    key(wrap, "Enter");
    expect(picks.at(-1)).toMatchObject({ index: 0, value: 3, label: "Acme" });
    // Pin survives blur (it is selection, not hover).
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('ellipse[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("controlled selectedIndex pins the ring without focus", async () => {
    const screen = await render(<SproutRow data={ACCT} selectedIndex={1} />);
    expect(screen.container.querySelectorAll('ellipse[data-mc-w="tick"]')).toHaveLength(1);
  });

  it("a hostile height resolves to the same box the static picks", async () => {
    // Both entries have to agree about the frame, or the hit box and the focus
    // ring are sized against a box the glyphs were never drawn in.
    const live = await render(<SproutRow data={ACCT} height={NaN} />);
    const still = await render(<StaticSproutRow data={ACCT} height={NaN} />);
    expect(viewBox(live)).toBe(viewBox(still));
    expect(viewBox(live)).not.toMatch(/NaN/);
  });

  it("consumer children reach the composed static chart", async () => {
    const screen = await render(
      <SproutRow data={ACCT}>
        <rect data-testid="annotation" x={0} y={0} width={1} height={1} />
      </SproutRow>,
    );
    expect(screen.container.querySelector('[data-testid="annotation"]')).not.toBeNull();
  });
});
