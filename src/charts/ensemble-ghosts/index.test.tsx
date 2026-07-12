import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { EnsembleGhosts } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const ENS = Array.from({ length: 24 }, (_, i) => [31 + i, 31 + i, 31 + i]);

describe("<EnsembleGhosts>", () => {
  it("summary names the endpoint spread and the typical path — the real string", () => {
    const { container } = draw(<EnsembleGhosts data={ENS} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "24 simulated paths end between 31 and 54; typical path ends near 42.",
    );
  });

  it("single member → 'Single path' summary", () => {
    const { container } = draw(<EnsembleGhosts data={[[10, 20, 30]]} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Single path, ends at 30.",
    );
  });

  it("renders faint ghosts + one accent emphasis", () => {
    const { container } = draw(<EnsembleGhosts data={ENS} ghosts={8} />);
    expect(container.querySelectorAll('path[data-mc-ink="ghost"]').length).toBeLessThanOrEqual(8);
    expect(container.querySelectorAll('path[data-mc-ink="ghost"]').length).toBeGreaterThan(0);
    expect(container.querySelector('path[data-mc-ink="data"]')).not.toBeNull();
  });

  it("deterministic — two renders produce identical markup", () => {
    const a = draw(<EnsembleGhosts data={ENS} />).container.innerHTML;
    const b = draw(<EnsembleGhosts data={ENS} />).container.innerHTML;
    expect(a).toBe(b);
  });

  it("endpoints draws ghost endpoint dots", () => {
    const off = draw(<EnsembleGhosts data={ENS} />).container;
    const on = draw(<EnsembleGhosts data={ENS} endpoints />).container;
    expect(off.querySelector("circle")).toBeNull();
    expect(on.querySelectorAll("circle").length).toBeGreaterThan(0);
  });

  it("is axe-clean", async () => {
    const { container } = draw(<EnsembleGhosts data={ENS} title="Simulated futures" />);
    await expectNoA11yViolations(container);
  });
});
