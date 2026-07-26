import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { injectChartProps } from "./inject-chart-props";

function Chart(props: { onSelect?: () => void; title?: string }) {
  return createElement("i", { "data-title": props.title, "data-sel": !!props.onSelect });
}

describe("injectChartProps", () => {
  it("clones onto a bare chart root", () => {
    const sel = () => {};
    const out = injectChartProps(createElement(Chart), { onSelect: sel, title: "T" }) as {
      props: { onSelect: () => void; title: string };
    };
    expect(out.props.onSelect).toBe(sel);
    expect(out.props.title).toBe("T");
  });

  it("reaches a chart nested in a host span (Delta playground shape)", () => {
    const sel = () => {};
    const tree = createElement("span", { className: "text-3xl" }, createElement(Chart));
    const out = injectChartProps(tree, { onSelect: sel }) as {
      props: { children: { props: { onSelect: () => void } } };
    };
    const child = out.props.children;
    expect(child.props.onSelect).toBe(sel);
  });
});
