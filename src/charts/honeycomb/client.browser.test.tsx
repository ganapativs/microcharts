import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { Honeycomb } from "./client.js";

describe("interactive <Honeycomb>", () => {
  it("announces the new count on change; quiet on mount", async () => {
    const screen = await render(<Honeycomb value={30} total={40} unit="seats" />);
    const live = document.querySelector('[aria-live="polite"]')!;
    expect(live.textContent).toBe("");
    await screen.rerender(<Honeycomb value={34} total={40} unit="seats" />);
    expect(live.textContent).toBe("34 of 40 seats filled.");
  });

  it("wrapper owns naming; static chart is decorative", async () => {
    const screen = await render(<Honeycomb value={34} total={40} unit="seats" title="Occupancy" />);
    const wrap = screen.container.querySelector(".mc-honeycomb-live")!;
    expect(wrap.getAttribute("aria-label")).toBe("Occupancy. 34 of 40 seats filled.");
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  // total 10 / rows "auto" → 3 rows of 4 (last row holds 8 and 9).
  it("→ walks within a row and stops at the row edge", async () => {
    const screen = await render(<Honeycomb value={6} total={10} title="Seats" />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    const live = fig.querySelector('[aria-live="polite"]')!;
    fig.focus();
    await userEvent.keyboard("{ArrowRight}"); // first arrow lands on cell 0
    expect(live.textContent).toBe("Cell 1 of 10 — filled.");
    await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}"); // → cell 3, row end
    expect(live.textContent).toBe("Cell 4 of 10 — filled.");
    await userEvent.keyboard("{ArrowRight}"); // consumed, never wraps into row 1
    expect(live.textContent).toBe("Cell 4 of 10 — filled.");
  });

  it("↑/↓ hold the column and stop at a short last row", async () => {
    const screen = await render(<Honeycomb value={6} total={10} title="Seats" />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    const live = fig.querySelector('[aria-live="polite"]')!;
    fig.focus();
    await userEvent.keyboard("{Home}{ArrowRight}{ArrowRight}{ArrowRight}"); // cell 3 (row 0, col 3)
    await userEvent.keyboard("{ArrowDown}"); // row 1, col 3 = cell 7
    expect(live.textContent).toBe("Cell 8 of 10 — empty.");
    await userEvent.keyboard("{ArrowDown}"); // row 2 col 3 does not exist — consumed
    expect(live.textContent).toBe("Cell 8 of 10 — empty.");
    await userEvent.keyboard("{ArrowUp}"); // round-trips back to cell 3
    expect(live.textContent).toBe("Cell 4 of 10 — filled.");
  });

  it("speaks the cell's state, never a bare numeral (the chip keeps the numerals)", async () => {
    const screen = await render(<Honeycomb value={6} total={10} title="Seats" />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    const live = fig.querySelector('[aria-live="polite"]')!;
    fig.focus();
    await userEvent.keyboard("{Home}"); // cell 0 — within the 6 filled
    expect(live.textContent).toBe("Cell 1 of 10 — filled.");
    expect(fig.querySelector(".mc-spark-readout")!.textContent).toBe("1 / 10");
    await userEvent.keyboard("{End}"); // cell 9 — beyond the 6 filled
    expect(live.textContent).toBe("Cell 10 of 10 — empty.");
    expect(fig.querySelector(".mc-spark-readout")!.textContent).toBe("10 / 10");
  });

  it("a custom `strings` owns the cell announcement (no hardcoded English)", async () => {
    const screen = await render(
      <Honeycomb
        value={6}
        total={10}
        strings={{
          noData: "Aucune donnée.",
          honeycomb: (v, t) => `${v} sur ${t}.`,
          honeycombCell: (i, t, filled) => `Case ${i} sur ${t} — ${filled ? "pleine" : "vide"}.`,
        }}
      />,
    );
    const fig = screen.getByRole("img").element() as HTMLElement;
    const live = fig.querySelector('[aria-live="polite"]')!;
    fig.focus();
    await userEvent.keyboard("{Home}");
    expect(live.textContent).toBe("Case 1 sur 10 — pleine.");
  });

  it("reports the active cell to onActive (1 = filled, 0 = empty); null when cleared", async () => {
    const onActive = vi.fn();
    const screen = await render(<Honeycomb value={6} total={10} onActive={onActive} />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{Home}");
    expect(onActive).toHaveBeenLastCalledWith({ index: 0, value: 1 });
    await userEvent.keyboard("{End}"); // cell 9 — beyond the 6 filled
    expect(onActive).toHaveBeenLastCalledWith({ index: 9, value: 0 });
    await userEvent.keyboard("{Escape}");
    expect(onActive).toHaveBeenLastCalledWith(null);
  });

  it("Enter selects the active cell and pins a hex that survives blur", async () => {
    const onSelect = vi.fn();
    const screen = await render(<Honeycomb value={6} total={10} onSelect={onSelect} />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{Home}{Enter}");
    expect(onSelect).toHaveBeenLastCalledWith({ index: 0, value: 1 });
    fig.blur();
    await vi.waitFor(() =>
      expect(screen.container.querySelector('path[data-mc-w="tick"]')).not.toBeNull(),
    );
  });

  it("controlled selectedIndex pins a hex with no interaction", async () => {
    const screen = await render(<Honeycomb value={6} total={10} selectedIndex={4} />);
    expect(screen.container.querySelectorAll('path[data-mc-w="tick"]').length).toBe(1);
  });
});
