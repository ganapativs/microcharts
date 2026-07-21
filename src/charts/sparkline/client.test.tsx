import { describe, it, expect } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import { Sparkline } from "./client.js";

describe("interactive <Sparkline> overlays (jsdom)", () => {
  it("paints a selection ring into g[data-mc-ui] without React children on the static SVG", async () => {
    const { container } = render(<Sparkline data={[4, 6, 5, 9]} selectedIndex={1} title="T" />);
    await act(async () => {});
    const svg = container.querySelector("svg")!;
    const ui = svg.querySelector("g[data-mc-ui]");
    expect(ui).not.toBeNull();
    expect(ui!.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
    // Overlay group is a sibling of the series marks, not a React child of Chart content
    // that would bust memo — the static path still exists.
    expect(svg.querySelector("path")).not.toBeNull();
    cleanup();
  });
});
