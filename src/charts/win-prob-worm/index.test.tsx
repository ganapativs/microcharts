import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { WinProbWorm } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const GAME = [50, 48, 45, 52, 60, 58, 42, 38, 55, 68, 82, 90, 88, 94, 98];
const SIDES = ["home", "away"] as const;

describe("<WinProbWorm>", () => {
  it("summary names the leader, flips, and biggest swing — the real string", () => {
    const { container } = draw(<WinProbWorm data={GAME} sides={SIDES} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Per the supplied model, home leads at 98%; 3 lead changes, biggest swing +17 at point 8.",
    );
  });

  it("a constant lead reads flat; a constant 50 reads tied", () => {
    const flat = draw(<WinProbWorm data={[64, 64, 64]} sides={SIDES} />);
    expect(flat.container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Per the supplied model, home holds 64% throughout.",
    );
    const tied = draw(<WinProbWorm data={[50, 50, 50]} sides={SIDES} />);
    expect(tied.container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Per the supplied model, even at 50% throughout.",
    );
  });

  it("a single point reads as a flat hold", () => {
    const { container } = draw(<WinProbWorm data={[72]} sides={SIDES} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Per the supplied model, home holds 72% throughout.",
    );
  });

  it("renders the midline, both worm sides, crossing dots + an endpoint dot", () => {
    const { container } = draw(<WinProbWorm data={GAME} sides={SIDES} width={200} height={16} />);
    // at word height the swing marker is seat-gated off → exactly one muted line (the midline)
    expect(container.querySelectorAll('line[data-mc-ink="muted"]').length).toBe(1);
    expect(container.querySelector('path[data-mc-ink="accent"]')).not.toBeNull(); // leading
    expect(container.querySelector('path[data-mc-ink="muted"]')).not.toBeNull(); // trailing
    // 3 crossing dots + 1 endpoint dot
    expect(container.querySelectorAll('circle[data-mc-ink="point"]').length).toBe(4);
  });

  it("label='last' prints the current leader's probability; 'none' hides it", () => {
    const shown = draw(<WinProbWorm data={GAME} width={200} height={16} label="last" />);
    expect(shown.container.querySelector("text")!.textContent).toBe("98%");
    const hidden = draw(<WinProbWorm data={GAME} width={200} height={16} label="none" />);
    expect(hidden.container.querySelector("text")).toBeNull();
  });

  it("markSwing draws a seat-gated delta at a tall size; false hides it", () => {
    const on = draw(<WinProbWorm data={GAME} sides={SIDES} width={220} height={28} />);
    expect([...on.container.querySelectorAll("text")].some((t) => t.textContent === "+17")).toBe(
      true,
    );
    const off = draw(
      <WinProbWorm data={GAME} sides={SIDES} width={220} height={28} markSwing={false} />,
    );
    expect([...off.container.querySelectorAll("text")].some((t) => t.textContent === "+17")).toBe(
      false,
    );
  });

  it("out-of-range values are clamped, never leaked", () => {
    const { container } = draw(<WinProbWorm data={[120, -20, 50, 140]} width={120} />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
  });

  it("is axe-clean", async () => {
    const { container } = draw(<WinProbWorm data={GAME} sides={SIDES} title="Win probability" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("WinProbWorm", (data) => <WinProbWorm data={data} title="Win prob" />);
