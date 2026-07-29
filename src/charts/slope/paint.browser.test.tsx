// What the browser actually paints. Slope carried its row color as a
// `stroke=` ATTRIBUTE next to `data-mc-ink="data"`, and a stylesheet rule
// outranks an SVG presentation attribute — so every connector painted
// `--mc-stroke` while the endpoint dots (inline `style`) obeyed `positive`,
// `highlight` and `color`. A jsdom attribute assertion cannot see that: it
// needs styles.css and a real cascade, which is why this file exists.
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import "../../../styles.css";

import { Slope } from "./index.js";

const DATA = [
  { label: "East", from: 40, to: 47 },
  { label: "West", from: 55, to: 41 },
];

const strokes = (root: Element) =>
  [...root.querySelectorAll("line")].map((l) => getComputedStyle(l).stroke);
const fills = (root: Element) =>
  [...root.querySelectorAll("circle")].map((c) => getComputedStyle(c).fill);

describe("Slope row ink reaches the paint", () => {
  it("default: the connector and its dots resolve to the SAME neutral ink", async () => {
    const screen = await render(<Slope data={DATA} />);
    const [line] = strokes(screen.container);
    expect(fills(screen.container).every((f) => f === line)).toBe(true);
  });

  it("positive, highlight and color each repaint the connector", async () => {
    const plain = strokes((await render(<Slope data={DATA} />)).container)[0]!;
    const valenced = strokes((await render(<Slope data={DATA} positive="up" />)).container);
    const highlighted = strokes((await render(<Slope data={DATA} highlight="West" />)).container);
    const colored = strokes((await render(<Slope data={DATA} color="#c0ffee" />)).container);

    // up ≠ down ≠ neutral: three distinct inks, none of them the default one
    expect(new Set([plain, valenced[0]!, valenced[1]!]).size).toBe(3);
    expect(highlighted[1]).not.toBe(plain);
    expect(highlighted[0]).toBe(plain);
    expect(colored[0]).toBe("rgb(192, 255, 238)");
  });

  it("a value label paints label ink, not the bare text default", async () => {
    const screen = await render(<Slope data={DATA} label="both" width={140} />);
    const texts = [...screen.container.querySelectorAll("text")];
    expect(texts.length).toBeGreaterThan(0);
    const inks = new Set(texts.map((t) => getComputedStyle(t).fill));
    // one ink across both columns — the right column used to paint --mc-stroke
    expect(inks.size).toBe(1);
    // the token is a hex literal in styles.css; `fill` computes to rgb()
    const hex = getComputedStyle(screen.container.querySelector(".mc-root")!)
      .getPropertyValue("--mc-neutral")
      .trim();
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    expect([...inks][0]).toBe(`rgb(${r}, ${g}, ${b})`);
  });
});
