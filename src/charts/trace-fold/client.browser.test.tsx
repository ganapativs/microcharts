import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { TraceFold } from "./client.js";

const ms = (n: number) => `${Math.round(n)} ms`;
const TRACE = [
  { label: "request", start: 0, duration: 200, depth: 0 },
  { label: "db", start: 10, duration: 120, depth: 1, parent: 0 },
  { label: "render", start: 130, duration: 60, depth: 1, parent: 0 },
];

describe("interactive <TraceFold>", () => {
  it("↓ then → roves spans; announces the span with depth + share", async () => {
    const screen = await render(
      <TraceFold data={TRACE} format={ms} title="Trace" width={200} height={30} />,
    );
    const wrap = screen.container.querySelector(".mc-trace-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect
      .poll(() => live.textContent)
      .toMatch(/(db|render), \d+ ms, \d+% of total, depth 1/);
  });

  it("onActive reports the focused datum (span index + duration + name); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <TraceFold data={TRACE} format={ms} width={200} height={30} onActive={(d) => seen.push(d)} />,
    );
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(seen.at(-1)).toMatchObject({ index: 1, value: 120, label: "db" });
    await userEvent.keyboard("{Escape}");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active span: fires onSelect + pins a persistent outline", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <TraceFold
        data={TRACE}
        format={ms}
        width={200}
        height={30}
        onSelect={(d) => picks.push(d)}
      />,
    );
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(picks.at(-1)).toMatchObject({ index: 1, value: 120, label: "db" });
    // Pin survives blur (it is selection, not hover).
    fig.blur();
    await expect.poll(() => fig.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });

  it("defaults to the static entry's box height", async () => {
    const screen = await render(<TraceFold data={TRACE} format={ms} width={200} />);
    // 2 depth rows → traceFoldHeight(2) = 32, the same formula the static folds by
    expect(screen.container.querySelector("svg")?.getAttribute("viewBox")).toBe("0 0 200 32");
  });

  it("controlled selectedIndex pins the outline with no interaction", async () => {
    const screen = await render(
      <TraceFold data={TRACE} format={ms} width={200} height={30} selectedIndex={2} />,
    );
    const fig = screen.getByRole("img").element() as HTMLElement;
    expect(fig.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });
});
