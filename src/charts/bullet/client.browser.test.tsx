import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { Bullet } from "./client.js";

const mount = async (ui: React.ReactNode) => {
  const screen = await render(ui);
  return screen.getByRole("img").element() as HTMLElement;
};

describe("interactive <Bullet> (plan/04 §4, plan/08 T2)", () => {
  it("focusable role=img with the composed name; inner chart is decorative", async () => {
    const fig = await mount(<Bullet value={72} target={80} title="Sales" />);
    expect(fig.getAttribute("tabindex")).toBe("0");
    expect(fig.getAttribute("aria-label")).toMatch(/Sales\. 72 of 80 target\./);
    expect(fig.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("focus reveals a value/target readout; blur hides it", async () => {
    const fig = await mount(<Bullet value={72} target={80} />);
    fig.focus();
    await expect
      .poll(() => fig.querySelector(".mc-spark-readout")?.textContent)
      .toBe("72 / 80 · −8");
    fig.blur();
    await expect.poll(() => fig.querySelector(".mc-spark-readout")).toBe(null);
  });
});
