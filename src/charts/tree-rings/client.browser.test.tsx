import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { TreeRings } from "./client.js";

const YEARS = [8, 12, 10, 18, 22, 15, 20, 14];

describe("interactive <TreeRings>", () => {
  it("arrow keys step rings inner→outer and announce the period", async () => {
    const screen = await render(<TreeRings data={YEARS} periodWord="year" title="Age" />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    const live = fig.querySelector('[aria-live="polite"]')!;
    fig.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(live.textContent).toBe("Year 1: 8.");
    await userEvent.keyboard("{ArrowRight}");
    expect(live.textContent).toBe("Year 2: 12.");
  });

  it("wrapper owns naming; static chart is decorative", async () => {
    const screen = await render(
      <TreeRings data={YEARS} unit="years" periodWord="year" title="Age" />,
    );
    const wrap = screen.container.querySelector(".mc-tree-live")!;
    expect(wrap.getAttribute("aria-label")).toBe("Age. 8 years; latest 14, biggest 22 in year 5.");
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("onActive reports the focused datum (ring index + value + label); null on Escape", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <TreeRings data={YEARS} periodWord="year" onActive={(d) => seen.push(d)} />,
    );
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(seen.at(-1)).toMatchObject({ index: 0, value: 8, label: "Year 1" });
    await userEvent.keyboard("{Escape}");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active ring: fires onSelect + pins a halo that survives blur", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <TreeRings data={YEARS} periodWord="year" onSelect={(d) => picks.push(d)} />,
    );
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{ArrowRight}{Enter}");
    expect(picks.at(-1)).toMatchObject({ index: 0, value: 8, label: "Year 1" });
    fig.blur();
    await expect.poll(() => fig.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });

  it("controlled selectedIndex pins the halo without focus", async () => {
    const screen = await render(<TreeRings data={YEARS} selectedIndex={3} />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    expect(fig.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });

  it("the halo's stroke is viewBox geometry, so it scales with the disc", async () => {
    // Its width IS the ring's own thickness; `non-scaling-stroke` pinned that to
    // screen pixels, so the halo stopped covering its ring at any zoom but 1:1.
    // It carries `data-mc-w` for the pin marker, which the library-wide rule now
    // keys on — so `.mc-ring-halo` is exempted back out in styles.css.
    const screen = await render(<TreeRings data={YEARS} selectedIndex={3} />);
    const halo = screen.container.querySelector('circle[data-mc-w="tick"]')!;
    expect(halo.getAttribute("vector-effect")).toBeNull();
  });

  // `periodWord[0]` is a UTF-16 code unit, not a character: "" threw
  // `undefined.toUpperCase()` on mount, and an astral noun was capitalised to
  // half a surrogate pair.
  it("an empty periodWord labels the ring by number instead of throwing", async () => {
    const screen = await render(<TreeRings data={YEARS} periodWord="" title="Age" />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(fig.querySelector('[aria-live="polite"]')!.textContent).toBe("1: 8.");
  });

  it("an astral periodWord survives capitalisation intact", async () => {
    const screen = await render(<TreeRings data={YEARS} periodWord="🌲ring" title="Age" />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(fig.querySelector('[aria-live="polite"]')!.textContent).toBe("🌲ring 1: 8.");
  });
});
