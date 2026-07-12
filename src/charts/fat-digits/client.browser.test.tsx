import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { FatDigits } from "./client.js";

describe("interactive <FatDigits>", () => {
  it("announces the value + tier on change; quiet on mount", async () => {
    const screen = await render(<FatDigits value={200} domain={[0, 1000]} />);
    const live = document.querySelector('[aria-live="polite"]')!;
    expect(live.textContent).toBe("");
    await screen.rerender(<FatDigits value={900} domain={[0, 1000]} />);
    expect(live.textContent).toBe("900 — tier 5 of 5.");
  });

  it("wrapper owns naming; static chart is decorative", async () => {
    const screen = await render(<FatDigits value={1204} domain={[0, 1500]} title="Revenue" />);
    const wrap = screen.container.querySelector(".mc-fat-live")!;
    expect(wrap.getAttribute("aria-label")).toBe("Revenue. 1,204 — tier 4 of 5.");
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });
});
