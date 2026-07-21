import { describe, expect, it } from "vitest";
import { createElement, type ReactElement } from "react";
import { swapChartTree } from "./swap-chart-tree";

function Static(props: { n: number; children?: React.ReactNode }) {
  return createElement("span", { "data-static": props.n }, props.children);
}
function Live(props: { n: number; children?: React.ReactNode }) {
  return createElement("span", { "data-live": props.n }, props.children);
}

describe("swapChartTree", () => {
  it("replaces matching chart elements and keeps props", () => {
    const tree = createElement(
      "p",
      null,
      "lead ",
      createElement(Static, { n: 1 }),
      " mid ",
      createElement(Static, { n: 2 }),
    );
    const out = swapChartTree(tree, Static, Live) as ReactElement<{ children: unknown[] }>;
    const kids = out.props.children;
    expect(kids[1]).toMatchObject({ type: Live, props: { n: 1 } });
    expect(kids[3]).toMatchObject({ type: Live, props: { n: 2 } });
  });

  it("leaves unrelated elements alone", () => {
    const other = () => createElement("em");
    const tree = createElement("div", null, createElement(other), createElement(Static, { n: 3 }));
    const out = swapChartTree(tree, Static, Live) as ReactElement<{ children: ReactElement[] }>;
    const kids = out.props.children;
    expect(kids[0]!.type).toBe(other);
    expect(kids[1]!.type).toBe(Live);
  });
});
