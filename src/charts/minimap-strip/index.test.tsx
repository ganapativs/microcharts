import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { MinimapStrip, minimapSummary } from "./index.js";
import { minimapDomain } from "./geometry.js";
import { EN_MINIMAP } from "../../core/strings-minimap.js";
import { makeFormatter } from "../../core/format.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";
import type { Value } from "../../core/types.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const fmt = makeFormatter(undefined, undefined);
const CONTENT = Array.from({ length: 1200 }, (_, i) => Math.sin(i / 40) + 1);
const DATA = {
  content: CONTENT,
  window: [520, 660] as [number, number],
  marks: [100, 600, 1100],
  known: [[0, 1104]] as [number, number][],
};

describe("<MinimapStrip> (plan/25 §10, plan/17 F10)", () => {
  it("renders the window + content + marks; docs-as-tests summary", () => {
    const { container } = draw(<MinimapStrip data={DATA} />);
    expect(container.querySelectorAll("rect").length).toBeGreaterThanOrEqual(1);
    expect(minimapSummary(DATA, minimapDomain(DATA), 0.08, EN_MINIMAP, fmt)).toBe(
      "Viewing 12% of the whole (520–660 of 1,200); 3 marks; 8% unknown.",
    );
  });

  it("fog renders for unknown regions", () => {
    const { container } = draw(<MinimapStrip data={DATA} />);
    expect(container.querySelector('path[data-mc-ink="muted"]')).not.toBeNull();
  });

  it("heat variant renders content as opacity, no bar path", () => {
    const { container } = draw(<MinimapStrip data={DATA} variant="heat" />);
    expect(container.querySelector('path[data-mc-ink="bar"]')).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<MinimapStrip data={DATA} title="Document position" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("MinimapStrip", (data: readonly Value[]) => (
  <MinimapStrip data={{ content: data, window: [0, Math.max(1, data.length) / 2] }} title="Edge" />
));
