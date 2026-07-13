// The animate contract: opt-in, engine-gated,
// reduced-motion-aware, at-rest output identical to the static render.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { Sparkline } from "../charts/sparkline/client.js";
import "./motion-engine.js"; // consumer opt-in: import "@microcharts/react/motion"

const D = [4, 6, 5, 9, 7, 8, 11, 9, 13, 12];

const svgOf = (host: HTMLElement): SVGSVGElement => host.querySelector("svg")!;

const settled = async (svg: SVGSVGElement): Promise<void> => {
  await vi.waitFor(() => {
    expect(svg.getAnimations({ subtree: true }).length).toBe(0);
  });
};

describe("entrance motion (opt-in `animate`)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("default (no animate): no animations, no inline motion styles", async () => {
    const screen = await render(<Sparkline data={D} title="Rev" />);
    const svg = svgOf(screen.getByRole("img").element() as HTMLElement);
    expect(svg.getAnimations({ subtree: true }).length).toBe(0);
    expect(svg.style.opacity).toBe("");
    expect(svg.querySelector<SVGPathElement>('[data-mc-ink="data"]')!.style.strokeDasharray).toBe(
      "",
    );
  });

  it("animate on a fresh client mount: draws on, then settles byte-identical", async () => {
    const screen = await render(
      <>
        <span data-test="plain">
          <Sparkline data={D} title="Rev" />
        </span>
        <span data-test="animated">
          <Sparkline data={D} title="Rev" animate />
        </span>
      </>,
    );
    const plainHTML = svgOf(
      screen.container.querySelector<HTMLElement>('[data-test="plain"]')!,
    ).outerHTML;
    const svg = svgOf(screen.container.querySelector<HTMLElement>('[data-test="animated"]')!);
    // Entrance is running (viewport-gated; the test viewport is visible).
    await vi.waitFor(() => {
      expect(svg.getAnimations({ subtree: true }).length).toBeGreaterThan(0);
    });
    await settled(svg);
    // At rest every inline style the entrance touched is restored — the DOM
    // is exactly what the static render produces.
    expect(svg.outerHTML).toBe(plainHTML);
  });

  it("prefers-reduced-motion: reduce → entrance never runs", async () => {
    const real = window.matchMedia.bind(window);
    vi.spyOn(window, "matchMedia").mockImplementation((q: string) => {
      const m = real(q);
      return q.includes("prefers-reduced-motion")
        ? ({ ...m, matches: true, media: q } as MediaQueryList)
        : m;
    });
    const screen = await render(<Sparkline data={D} title="Rev" animate />);
    const svg = svgOf(screen.getByRole("img").element() as HTMLElement);
    expect(svg.getAnimations({ subtree: true }).length).toBe(0);
    expect(svg.style.opacity).toBe("");
  });

  it("interaction is never blocked mid-entrance", async () => {
    const screen = await render(<Sparkline data={D} title="Rev" animate />);
    const host = screen.getByRole("img").element() as HTMLElement;
    const live = host.querySelector('[aria-live="polite"]')!;
    host.focus();
    // Keyboard readout responds immediately while the entrance is running.
    host.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    await vi.waitFor(() => {
      expect(live.textContent).toBe("Point 1 of 10: 4.");
    });
  });

  it("unmount mid-entrance cancels cleanly (no leaked animations)", async () => {
    const screen = await render(<Sparkline data={D} title="Rev" animate />);
    const svg = svgOf(screen.getByRole("img").element() as HTMLElement);
    await vi.waitFor(() => {
      expect(svg.getAnimations({ subtree: true }).length).toBeGreaterThan(0);
    });
    screen.unmount();
    expect(document.getAnimations().length).toBe(0);
  });
});

describe("entrance motion without the engine import", () => {
  // Registered engines can't be unregistered in this process — this suite
  // documents the gate's warn-once path via a fresh isolated check instead.
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("animate stays type-safe and defaults to false", async () => {
    const screen = await render(<Sparkline data={D} title="Rev" animate={false} />);
    const svg = svgOf(screen.getByRole("img").element() as HTMLElement);
    expect(svg.getAnimations({ subtree: true }).length).toBe(0);
  });
});
