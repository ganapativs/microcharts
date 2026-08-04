// The active/hovered unit's treatment, as a CHANNEL rather than a hardcode.
//
// Two things are pinned here, and they came from the same report. A consumer
// embedding the library found that the hover state was unreachable through the
// `--mc-*` contract — the overlay was a literal `stroke="var(--mc-accent)"`, so
// the only way to restyle it was to scope CSS onto the package's private
// `data-mc-*` attributes from outside. And on a mark the chart itself emphasises
// with `data-mc-ink="accent"` — SparkBar's endpoint bar is the reference case —
// an accent outline over an accent fill is invisible by construction, so the
// most-looked-at unit in the chart was the one that answered the pointer least.
//
// So: `data-mc-active` marks the overlay, `styles.css` paints it from four
// tokens, and this file asserts the painted result rather than the markup —
// computed styles through the real cascade, in a real engine.
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import "../../styles.css";

import { SparkBar } from "../charts/sparkbar/client.js";
import { EventRaster } from "../charts/event-raster/client.js";

const DATA = [4, 9, 6, 11, 7, 13, 8];

/** Focus the wrapper and rove to unit `i`, then hand back the overlay marks. */
async function activate(
  ui: Parameters<typeof render>[0],
  i: number,
): Promise<{ host: HTMLElement; svg: SVGSVGElement; overlay: SVGGraphicsElement }> {
  const screen = await render(ui);
  const host = screen.container.querySelector("[data-mc-host]") as HTMLElement;
  const svg = host.querySelector("svg") as SVGSVGElement;
  host.focus();
  for (let n = 0; n <= i; n++) {
    host.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  }
  const overlay = await vi.waitFor(() => {
    const el = svg.querySelector<SVGGraphicsElement>("[data-mc-active]");
    expect(el, `no overlay after roving to unit ${i}`).not.toBeNull();
    return el!;
  });
  return { host, svg, overlay };
}

/** `rgb(…)`/`rgba(…)` → alpha, 1 when the notation carries none. */
function alphaOf(color: string): number {
  const m = /rgba?\([^)]*?(?:,|\/)\s*([\d.]+)\s*\)/.exec(color);
  return m ? Number(m[1]) : color === "none" || color === "transparent" ? 0 : 1;
}

describe("the active unit is visible on a mark the chart already emphasises", () => {
  // The endpoint bar is `data-mc-ink="accent"` (SparkBar gives the last bar
  // accent emphasis), so the ring's own stroke matches the fill underneath it.
  it("the overlay on the accent-inked endpoint bar paints more than its stroke", async () => {
    const { svg, overlay } = await activate(
      <SparkBar data={DATA} width={200} height={40} />,
      DATA.length - 1,
    );

    const endpoint = svg.querySelector('rect[data-mc-ink="accent"]') as SVGRectElement;
    expect(endpoint, "SparkBar no longer accents its endpoint bar").not.toBeNull();

    const ring = getComputedStyle(overlay);
    const bar = getComputedStyle(endpoint);
    // The failing state this guards: ring stroke === bar fill and nothing else
    // painted, i.e. the whole hover treatment cancels out.
    expect(ring.stroke).toBe(bar.fill);
    expect(
      alphaOf(ring.fill) * Number(ring.fillOpacity || 1),
      "the overlay adds no wash, so on the accent bar it paints nothing at all",
    ).toBeGreaterThan(0.1);
  });

  it("the overlay sits exactly on the bar it names", async () => {
    const i = 3;
    const { svg, overlay } = await activate(<SparkBar data={DATA} width={200} height={40} />, i);
    const bars = [...svg.querySelectorAll<SVGRectElement>("rect[data-mc-ink]")];
    const bar = bars[i]!;
    const a = overlay.getBBox();
    const b = bar.getBBox();
    // Same box: the wash lands on the mark, never on its neighbours.
    expect(Math.abs(a.x - b.x)).toBeLessThanOrEqual(0.01);
    expect(Math.abs(a.width - b.width)).toBeLessThanOrEqual(0.01);
  });
});

describe("the treatment answers to the tokens, not to a private selector", () => {
  it("--mc-active-stroke retargets the ring without touching the data ink", async () => {
    const { svg, overlay } = await activate(
      <SparkBar
        data={DATA}
        width={200}
        height={40}
        style={{ "--mc-active-stroke": "rgb(255, 0, 0)" } as React.CSSProperties}
      />,
      2,
    );
    expect(getComputedStyle(overlay).stroke).toBe("rgb(255, 0, 0)");
    const bar = svg.querySelector('rect[data-mc-ink="bar"]') as SVGRectElement;
    expect(getComputedStyle(bar).fill).not.toBe("rgb(255, 0, 0)");
  });

  it("--mc-active-fill + its opacity turn the outline into a solid block", async () => {
    const { overlay } = await activate(
      <SparkBar
        data={DATA}
        width={200}
        height={40}
        style={
          {
            "--mc-active-fill": "rgb(0, 0, 255)",
            "--mc-active-fill-opacity": 1,
          } as React.CSSProperties
        }
      />,
      2,
    );
    const cs = getComputedStyle(overlay);
    expect(cs.fill).toBe("rgb(0, 0, 255)");
    expect(Number(cs.fillOpacity)).toBe(1);
  });

  it("--mc-active-fill-opacity: 0 restores the pure outline", async () => {
    const { overlay } = await activate(
      <SparkBar
        data={DATA}
        width={200}
        height={40}
        style={{ "--mc-active-fill-opacity": 0 } as React.CSSProperties}
      />,
      2,
    );
    expect(Number(getComputedStyle(overlay).fillOpacity)).toBe(0);
  });

  // The third shape a host asks for, and the one that cannot be written from
  // outside the package: only the chart knows which mark is active, so a
  // consumer dimming "the others" had to dim everything and then re-lift the
  // active one by index. `:has([data-mc-active])` does it with no JS.
  it("--mc-rest-opacity dims the other marks and leaves the overlay alone", async () => {
    const { svg, overlay } = await activate(
      <SparkBar
        data={DATA}
        width={200}
        height={40}
        style={{ "--mc-rest-opacity": 0.25 } as React.CSSProperties}
      />,
      2,
    );
    const bars = [...svg.querySelectorAll<SVGRectElement>("rect[data-mc-ink]")];
    expect(bars.length).toBeGreaterThan(3);
    for (const b of bars) expect(Number(getComputedStyle(b).opacity)).toBeCloseTo(0.25, 5);
    expect(Number(getComputedStyle(overlay).opacity)).toBe(1);
  });

  // A CSS declaration beats a presentation attribute, so the dim rule has to
  // step around a mark whose opacity IS the encoding. EventRaster dims a lane
  // that way; without the `:not([opacity])` guard every dimmed lane snapped to
  // full strength the moment anything was picked.
  it("a mark that encodes in its own opacity keeps it", async () => {
    const screen = await render(
      <EventRaster
        data={[
          { label: "api", events: [1, 4, 9] },
          { label: "web", events: [2, 6] },
        ]}
        emphasis="api"
        width={220}
        height={44}
        style={{ "--mc-rest-opacity": 0.25 } as React.CSSProperties}
      />,
    );
    const host = screen.container.querySelector("[data-mc-host]") as HTMLElement;
    host.focus();
    host.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await vi.waitFor(() =>
      expect(screen.container.querySelector("[data-mc-active]")).not.toBeNull(),
    );
    const dimmed = [...screen.container.querySelectorAll<SVGElement>("[data-mc-ink][opacity]")];
    expect(dimmed.length, "EventRaster no longer dims a lane by attribute").toBeGreaterThan(0);
    for (const el of dimmed) {
      expect(Number(getComputedStyle(el).opacity)).toBeCloseTo(
        Number(el.getAttribute("opacity")),
        5,
      );
    }
  });

  it("nothing dims while nothing is active", async () => {
    const screen = await render(<SparkBar data={DATA} width={200} height={40} />);
    const svg = screen.container.querySelector("svg") as SVGSVGElement;
    for (const b of svg.querySelectorAll<SVGRectElement>("rect[data-mc-ink]")) {
      expect(Number(getComputedStyle(b).opacity)).toBe(1);
    }
  });
});
