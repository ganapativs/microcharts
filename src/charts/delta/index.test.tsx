import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { Delta } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

describe("<Delta> (plan/05 S4, plan/08)", () => {
  it("positive value → up glyph, positive valence, signed percent", () => {
    const { container } = draw(<Delta value={0.124} />);
    const el = container.querySelector(".mc-delta")!;
    expect(el.getAttribute("data-mc-valence")).toBe("pos");
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("Up 12.4%.");
    expect(container.querySelector(".mc-delta-num")!.textContent).toBe("+12.4%");
  });

  it("negative value → down glyph + negative valence + minus sign", () => {
    const { container } = draw(<Delta value={-0.03} />);
    const el = container.querySelector(".mc-delta")!;
    expect(el.getAttribute("data-mc-valence")).toBe("neg");
    expect(el.getAttribute("aria-label")).toBe("Down 3%.");
    expect(container.querySelector(".mc-delta-num")!.textContent).toBe("−3%");
  });

  it("zero → flat glyph, neutral valence, 'No change.'", () => {
    const { container } = draw(<Delta value={0} />);
    const el = container.querySelector(".mc-delta")!;
    expect(el.getAttribute("data-mc-valence")).toBe("flat");
    expect(el.getAttribute("aria-label")).toBe("No change.");
  });

  it("positive='down' inverts valence color (down is good)", () => {
    // latency dropped 10% → good
    const { container } = draw(<Delta value={-0.1} positive="down" />);
    expect(container.querySelector(".mc-delta")!.getAttribute("data-mc-valence")).toBe("pos");
  });

  it("from → derives percent change and its direction", () => {
    const { container } = draw(<Delta value={120} from={100} />);
    const el = container.querySelector(".mc-delta")!;
    expect(el.getAttribute("aria-label")).toBe("Up 20%.");
    expect(container.querySelector(".mc-delta-num")!.textContent).toBe("+20%");
  });

  it("custom format (absolute) is honored", () => {
    const { container } = draw(
      <Delta
        value={1500}
        format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
      />,
    );
    expect(container.querySelector(".mc-delta-num")!.textContent).toBe("+$1,500");
  });

  it("non-finite value → em-dash + 'No change.', not 'NaN%' (plan/09)", () => {
    const { container } = draw(<Delta value={Number.NaN} />);
    const el = container.querySelector(".mc-delta")!;
    expect(el.getAttribute("data-mc-valence")).toBe("flat");
    expect(el.getAttribute("aria-label")).toBe("No change.");
    expect(container.querySelector(".mc-delta-num")!.textContent).toBe("—");
  });

  it("summary={false} → decorative, aria-hidden, no role", () => {
    const { container } = draw(<Delta value={0.1} summary={false} />);
    const el = container.querySelector(".mc-delta")!;
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(el.getAttribute("role")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<Delta value={0.124} title="Revenue" />);
    await expectNoA11yViolations(container);
  });
});
