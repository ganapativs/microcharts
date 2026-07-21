// Pointer → unit must land on the painted mark — measured in a real browser.
//
// Two layouts that used to desync the hit box from the mark:
//   1. `.mc-inline` seats the interactive wrapper via translate; measuring the
//      wrapper's *layout* box (pre-transform) mapped the pointer to the wrong
//      unit. The kernel measures the SVG's painted box instead.
//   2. Flex parents + FILL width:100% stretched the wrapper; fit-content width
//      keeps the static attribute box without centering KPI columns.
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import "../../styles.css";

import { HeatStrip } from "../charts/heat-strip/client.js";
import { Sparkline } from "../charts/sparkline/client.js";
import { Dumbbell } from "../charts/dumbbell/client.js";

const STRIP = [12, 18, 40, 70, 90, 55, 28, 60, 80, 35];
const WAVE = [12, 13, 12.4, 14, 15.2, 14.8, 16, 17.5, 17, 18.4];

function fireMove(host: Element, clientX: number, clientY: number): void {
  host.dispatchEvent(
    new PointerEvent("pointermove", {
      bubbles: true,
      cancelable: true,
      clientX,
      clientY,
      pointerType: "mouse",
      pointerId: 1,
    }),
  );
}

describe("interactive hit box tracks the painted mark", () => {
  it("heat-strip in mc-inline: left/right cells match pointer x", async () => {
    const screen = await render(
      <p style={{ margin: 0, font: "16px/1.6 Georgia, serif" }}>
        load{" "}
        <span className="mc-inline">
          <HeatStrip data={STRIP} domain={[0, 100]} width={100} height={14} summary={false} />
        </span>{" "}
        peaked.
      </p>,
    );
    const host = screen.container.querySelector(".mc-heat-strip-live") as HTMLElement;
    const svg = host.querySelector("svg") as SVGSVGElement;
    const cells = [...svg.querySelectorAll('rect[data-mc-ink="cell"]')] as SVGRectElement[];
    expect(cells.length).toBe(STRIP.length);

    const left = cells[0]!.getBoundingClientRect();
    fireMove(host, left.left + left.width / 2, left.top + left.height / 2);
    const ringL = svg.querySelector('rect[data-mc-w="support"]') as SVGRectElement;
    expect(ringL).toBeTruthy();
    expect(
      Math.abs(+ringL.getAttribute("x")! - (+cells[0]!.getAttribute("x")! - 0.5)),
    ).toBeLessThan(0.6);

    const right = cells[cells.length - 1]!.getBoundingClientRect();
    fireMove(host, right.left + right.width / 2, right.top + right.height / 2);
    const ringR = svg.querySelector('rect[data-mc-w="support"]') as SVGRectElement;
    expect(
      Math.abs(+ringR.getAttribute("x")! - (+cells[cells.length - 1]!.getAttribute("x")! - 0.5)),
    ).toBeLessThan(0.6);
  });

  it("sparkline in items-center tab: chart midY matches label midY", async () => {
    const screen = await render(
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          font: "14px/1.4 system-ui",
        }}
      >
        Acme
        <Sparkline data={WAVE} width={44} height={12} summary={false} />
      </span>,
    );
    const label = screen.container.querySelector("span")!;
    const text = [...label.childNodes].find((n) => n.nodeType === 3)!;
    const range = document.createRange();
    range.selectNodeContents(text);
    const tb = range.getBoundingClientRect();
    const svg = label.querySelector("svg")!.getBoundingClientRect();
    expect(Math.abs(svg.top + svg.height / 2 - (tb.top + tb.height / 2))).toBeLessThan(1.5);
  });

  it("heat-strip in table cell: chart midY matches label midY", async () => {
    const screen = await render(
      <table style={{ borderCollapse: "collapse", font: "14px/1.4 system-ui" }}>
        <tbody>
          <tr>
            <td style={{ verticalAlign: "middle", padding: "6px 8px" }}>Acme</td>
            <td style={{ verticalAlign: "middle", padding: "6px 8px" }}>
              <HeatStrip data={STRIP} domain={[0, 100]} width={90} height={14} summary={false} />
            </td>
          </tr>
        </tbody>
      </table>,
    );
    const tds = screen.container.querySelectorAll("td");
    const name = tds[0]!.getBoundingClientRect();
    const svg = tds[1]!.querySelector("svg")!.getBoundingClientRect();
    expect(Math.abs(svg.top + svg.height / 2 - (name.top + name.height / 2))).toBeLessThan(1.5);
    const host = tds[1]!.querySelector(".mc-heat-strip-live") as HTMLElement;
    expect(getComputedStyle(host).verticalAlign).toBe("middle");
    expect(host.hasAttribute("data-mc-host")).toBe(true);
  });

  it("dumbbell single-row tab: hover ring shares the row's y", async () => {
    const screen = await render(
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        Offices
        <Dumbbell data={[{ from: 48, to: 68 }]} width={60} height={12} summary={false} />
      </span>,
    );
    const host = screen.container.querySelector(".mc-dumbbell-live") as HTMLElement;
    const svg = host.querySelector("svg") as SVGSVGElement;
    const mark = svg.querySelector("circle") as SVGCircleElement;
    const mb = mark.getBoundingClientRect();
    fireMove(host, mb.left + mb.width / 2, mb.top + mb.height / 2);
    const rings = [...svg.querySelectorAll('circle[data-mc-w="support"]')] as SVGCircleElement[];
    expect(rings.length).toBeGreaterThan(0);
    for (const r of rings) {
      expect(Math.abs(+r.getAttribute("cy")! - +mark.getAttribute("cy")!)).toBeLessThan(0.1);
    }
  });
});
