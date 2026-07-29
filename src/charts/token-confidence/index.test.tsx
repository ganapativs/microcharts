import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { TokenConfidence, tokenConfidenceSummary } from "./index.js";
import { EN_TOKEN_CONFIDENCE } from "../../core/strings-token-confidence.js";
import { tokenTiers } from "./geometry.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

const SENT = [
  { token: "The", confidence: 0.98 },
  { token: " capital", confidence: 0.95 },
  { token: " of", confidence: 0.99 },
  { token: " France", confidence: 0.9 },
  { token: " is", confidence: 0.97 },
  { token: " Paris", confidence: 0.62 },
  { token: ", founded", confidence: 0.35 },
  { token: " in", confidence: 0.88 },
  { token: " 52", confidence: 0.28 },
  { token: " BC", confidence: 0.55 },
];

describe("<TokenConfidence>", () => {
  it("renders one span per flagged token; confident tokens are bare text summary", () => {
    const { container } = draw(<TokenConfidence data={SENT} />);
    const host = container.querySelector(".mc-token-confidence")!;
    // SSR hot path: no per-token wrapper — only the 4 flagged (unsure/guessing)
    // tokens get a span; the 6 confident tokens render as bare text nodes.
    expect(host.querySelectorAll(":scope > span").length).toBe(4);
    expect(
      tokenConfidenceSummary(tokenTiers({ data: SENT, tiers: [0.5, 0.8] }), EN_TOKEN_CONFIDENCE),
    ).toBe("10 tokens: 6 confident, 2 unsure, 2 guessing.");
  });

  it("marks unsure + guessing tokens, leaves confident unmarked", () => {
    const { container } = draw(<TokenConfidence data={SENT} />);
    expect(container.querySelectorAll(".mc-tc-unsure").length).toBe(2);
    expect(container.querySelectorAll(".mc-tc-guessing").length).toBe(2);
    expect(container.querySelectorAll(".mc-tc-seen").length).toBe(0);
  });

  it("show='all' hairlines confident tokens too", () => {
    const { container } = draw(<TokenConfidence data={SENT} show="all" />);
    expect(container.querySelectorAll(".mc-tc-seen").length).toBe(6);
  });

  it("the host does not overflow its inline flow (wraps)", () => {
    const { container } = draw(<TokenConfidence data={SENT} />);
    const host = container.querySelector(".mc-token-confidence") as HTMLElement;
    // an inline span host has no forced width; content wraps with its parent
    expect(host.getAttribute("role")).toBe("img");
    expect(host.getAttribute("aria-label")).toContain("10 tokens");
  });

  // A cutoff arriving as null/NaN used to redefine the tiering silently: the
  // painted marks and the accessible name agreed with each other and with
  // nothing else — `[null, null]` flagged not one token.
  it("a non-finite tiers cutoff falls back to the default, marks and name alike", () => {
    const base = draw(<TokenConfidence data={SENT} />);
    const expected = base.container
      .querySelector(".mc-token-confidence")!
      .getAttribute("aria-label");
    for (const tiers of [[null, null], [Number.NaN, Number.NaN], []]) {
      const { container } = draw(
        <TokenConfidence data={SENT} tiers={tiers as unknown as readonly [number, number]} />,
      );
      const host = container.querySelector(".mc-token-confidence")!;
      expect(host.getAttribute("aria-label")).toBe(expected);
      expect(host.querySelectorAll(".mc-tc-unsure").length).toBe(2);
      expect(host.querySelectorAll(".mc-tc-guessing").length).toBe(2);
    }
  });

  it("legend appends the inline key", () => {
    const { container } = draw(<TokenConfidence data={SENT} legend />);
    expect(container.querySelector(".mc-tc-legend")!.textContent).toContain("unsure");
  });

  it("is axe-clean", async () => {
    const { container } = draw(<TokenConfidence data={SENT} title="Model answer" />);
    await expectNoA11yViolations(container);
  });
});
