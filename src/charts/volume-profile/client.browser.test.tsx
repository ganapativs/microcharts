import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { VolumeProfile } from "./client.js";
import { profileLayout } from "./geometry.js";
import { labelFont } from "../../core/labels.js";
import { makeFormatter } from "../../core/format.js";

const PROFILE = [
  { level: 138, weight: 8 },
  { level: 140, weight: 14 },
  { level: 142, weight: 25 },
  { level: 144, weight: 13 },
  { level: 146, weight: 7 },
];

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <VolumeProfile>", () => {
  it("↑/↓ rove levels; POC announces its clause", async () => {
    const screen = await render(
      <VolumeProfile data={PROFILE} bins={5} title="Volume" width={120} height={60} />,
    );
    const wrap = screen.container.querySelector(".mc-volprofile-live") as HTMLElement;
    wrap.focus();
    // first arrow lands on bin 0 (lowest level); ↓ twice more reaches the POC (bin 2)
    key(wrap, "ArrowDown");
    key(wrap, "ArrowDown");
    key(wrap, "ArrowDown");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toContain("(POC)");
  });

  it("onActive reports the focused level bin; null on Escape", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <VolumeProfile
        data={PROFILE}
        bins={5}
        width={120}
        height={60}
        onActive={(d) => seen.push(d)}
      />,
    );
    const wrap = screen.container.querySelector(".mc-volprofile-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowDown");
    expect(seen.at(-1)).toEqual({ index: 0, value: 8, label: "138.8" });
    key(wrap, "Escape");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active bin: fires onSelect + pins a band", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <VolumeProfile
        data={PROFILE}
        bins={5}
        width={120}
        height={60}
        onSelect={(d) => picks.push(d)}
      />,
    );
    const wrap = screen.container.querySelector(".mc-volprofile-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowDown");
    key(wrap, "Enter");
    expect(picks.at(-1)).toEqual({ index: 0, value: 8, label: "138.8" });
    // Pin survives blur (it is selection, not hover).
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('rect[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("its layout matches the painted bars (the POC-label gutter is reserved)", async () => {
    const screen = await render(
      <VolumeProfile data={PROFILE} bins={5} align="right" width={120} height={60} />,
    );
    const fig = screen.getByRole("img").element() as HTMLElement;
    // The same call, with the same args, the client now makes for its own
    // geometry — so its bars are the painted ones. Dropping the second layout
    // pass widens every bar and, at align="right", moves every x.
    const geo = profileLayout({
      data: PROFILE,
      bins: 5,
      valueArea: 0.7,
      align: "right",
      width: 120,
      height: 60,
      label: "poc",
      fontSize: labelFont(60, 0.11),
      fmt: makeFormatter(undefined, undefined),
    });
    const bar = geo.bars.find((b) => !b.poc)!;
    expect(fig.querySelector('path[data-mc-ink="bar"]')?.getAttribute("d")).toContain(
      `M${bar.x} ${bar.y}h${bar.width}`,
    );
  });

  it("controlled selectedIndex pins the band without focus", async () => {
    const screen = await render(
      <VolumeProfile data={PROFILE} bins={5} width={120} height={60} selectedIndex={2} />,
    );
    expect(screen.container.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });
});
