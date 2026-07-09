import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { EtaBar } from "./client.js";

const min = (t: number) => `${Math.round(t)} min`;

describe("interactive <EtaBar> (plan/25 §3)", () => {
  it("focus reveals the forecast readout + announces it", async () => {
    const screen = await render(
      <EtaBar
        progress={0.64}
        elapsed={3.6}
        rate={0.18}
        formatEta={min}
        title="Export"
        width={160}
        height={16}
      />,
    );
    const wrap = screen.container.querySelector(".mc-eta-live") as HTMLElement;
    wrap.focus();
    await expect
      .poll(() => screen.container.querySelector(".mc-spark-readout")?.textContent)
      .toBe("64% done; about 2 min remaining at the current rate.");
  });
});
