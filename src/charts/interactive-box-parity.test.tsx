import { describe, it, expect } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import { Sparkline as StaticSparkline } from "./sparkline/index.js";
import { Sparkline } from "./sparkline/client.js";
import { Waveform as StaticWaveform } from "./waveform/index.js";
import { Waveform } from "./waveform/client.js";

// An interactive entry composes its static twin, then lays its overlay and its
// pointer map against a box it resolves itself. When the two resolutions
// disagree the line still paints correctly and the crosshair points somewhere
// else, so the box (and the name derived from it) is asserted equal here rather
// than per chart: every row below was a shipped divergence.
const attr = (ui: React.ReactNode, name: string) => {
  const { container } = render(ui);
  // The interactive wrapper owns the accessible name, the static's SVG owns it.
  const el =
    name === "aria-label"
      ? container.querySelector("[aria-label]")
      : container.querySelector("svg");
  const v = el!.getAttribute(name);
  cleanup();
  return v;
};

const WAVE = Array.from({ length: 1234 }, (_, i) => Math.sin(i / 3) * 0.15);

describe("interactive entries resolve the same box as their static twin", () => {
  it("<Sparkline> seats its overlay in the box the static clamped to", async () => {
    // `width={NaN}` off a collapsed container: the static clamps to 80 and paints
    // a correct line, so an unclamped overlay rings a coordinate that is not on it.
    const size = { width: Number.NaN, height: 20 } as const;
    const { container } = render(<Sparkline data={[4, 6, 5, 9]} selectedIndex={1} {...size} />);
    await act(async () => {});
    const vbWidth = Number(container.querySelector("svg")!.getAttribute("viewBox")!.split(" ")[2]);
    const cx = Number(container.querySelector('circle[data-mc-w="tick"]')!.getAttribute("cx"));
    cleanup();
    expect(vbWidth).toBe(
      Number(attr(<StaticSparkline data={[4, 6, 5, 9]} {...size} />, "viewBox")!.split(" ")[2]),
    );
    expect(cx).toBeGreaterThanOrEqual(0);
    expect(cx).toBeLessThanOrEqual(vbWidth);
  });

  it("<Waveform> announces the sample count in the caller's locale", () => {
    expect(attr(<Waveform data={WAVE} locale="de-DE" />, "aria-label")).toBe(
      attr(<StaticWaveform data={WAVE} locale="de-DE" />, "aria-label"),
    );
  });
});
