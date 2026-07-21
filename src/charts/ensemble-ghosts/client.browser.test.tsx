import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { EnsembleGhosts } from "./client.js";

// member i ends at 31 + 2i, so endpoint-rank ghost selection is deterministic
// and member 0 is always the first ghost.
const ENS = Array.from({ length: 12 }, (_, i) => [20, 20 + i, 31 + i * 2]);

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

const mount = async (extra?: Record<string, unknown>) => {
  const screen = await render(
    <EnsembleGhosts data={ENS} width={160} height={40} title="Futures" {...extra} />,
  );
  return {
    screen,
    wrap: screen.container.querySelector(".mc-ensemble-ghosts-live") as HTMLElement,
  };
};

describe("interactive <EnsembleGhosts>", () => {
  it("←/→ step members discretely, announcing each (the reduced-motion path)", async () => {
    const { wrap } = await mount();
    wrap.focus();
    key(wrap, "ArrowRight");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toMatch(/^Member \d+ of 12; ends at \d+\.$/);
    // stepping surfaces one member as a full-accent overlay path
    await expect.poll(() => wrap.querySelectorAll("path").length).toBeGreaterThan(0);
  });

  it("Escape clears the emphasis and the announcement", async () => {
    const { wrap } = await mount();
    wrap.focus();
    key(wrap, "ArrowRight");
    key(wrap, "Escape");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("");
  });

  it("onActive reports the focused member (data index + terminal value); null on clear", async () => {
    const seen: unknown[] = [];
    const { wrap } = await mount({ onActive: (d: unknown) => seen.push(d) });
    wrap.focus();
    key(wrap, "Home");
    expect(seen.at(-1)).toMatchObject({ index: 0, value: 31 });
    key(wrap, "Escape");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active member: fires onSelect + pins a persistent strand", async () => {
    const picks: unknown[] = [];
    const { screen, wrap } = await mount({ onSelect: (d: unknown) => picks.push(d) });
    wrap.focus();
    key(wrap, "Home");
    key(wrap, "Enter");
    expect(picks.at(-1)).toMatchObject({ index: 0, value: 31 });
    // Pin survives blur (it is selection, not hover).
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('path[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("controlled selectedIndex pins the strand without focus", async () => {
    const { screen } = await mount({ ghosts: 12, selectedIndex: 2 });
    expect(screen.container.querySelector('path[data-mc-w="tick"]')).not.toBeNull();
  });

  it("selecting a member with a non-finite terminal announces no data, not NaN", async () => {
    // Member 1's series ends non-finite, so it is excluded from the drawn ghost
    // bundle but is still reachable through controlled selection.
    const dirty = ENS.map((m, i) => (i === 1 ? [20, 21, Number.NaN] : m));
    const screen = await render(
      <EnsembleGhosts data={dirty} width={160} height={40} title="Futures" selectedIndex={1} />,
    );
    const live = screen.container.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toMatch(/^Member 2 of \d+; no data\.$/);
  });
});
