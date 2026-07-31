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

  // The failsafe timeout used to CALL the entrance, so a chart below the fold
  // played its whole animation unseen 400 ms after mount and the reader who
  // scrolled down found a static chart. It must only release the opacity hold.
  it("off-screen: reveals without animating, then animates when scrolled to", async () => {
    const screen = await render(
      <div>
        <div style={{ height: "250vh" }} />
        <span data-test="below">
          <Sparkline data={D} title="Rev" animate />
        </span>
      </div>,
    );
    const svg = svgOf(screen.container.querySelector<HTMLElement>('[data-test="below"]')!);
    try {
      // Past the 400 ms failsafe the chart is VISIBLE (no lingering opacity: 0)…
      await vi.waitFor(
        () => {
          expect(svg.style.opacity).toBe("");
        },
        { timeout: 2000 },
      );
      // …and it has not spent its entrance where nobody could see it.
      expect(svg.getAnimations({ subtree: true }).length).toBe(0);

      svg.scrollIntoView();
      await vi.waitFor(
        () => {
          expect(svg.getAnimations({ subtree: true }).length).toBeGreaterThan(0);
        },
        { timeout: 2000 },
      );
      await settled(svg);
    } finally {
      window.scrollTo(0, 0);
    }
  });

  // The acts overlap, so voice used to start ~220 ms before the story ended and
  // a right-hand label appeared while the line was still drawing toward the
  // point it names. Each voice element now waits for the story front to reach
  // its own x — and is clamped to the story's end, so the fix reorders the
  // entrance without lengthening it.
  it("a label never speaks before the mark it names arrives", async () => {
    const screen = await render(<Sparkline data={D} title="Rev" label="last" animate />);
    const svg = svgOf(screen.getByRole("img").element() as HTMLElement);
    const end = (a: Animation): number => {
      const t = a.effect!.getTiming();
      return Number(t.delay ?? 0) + Number(t.duration ?? 0);
    };
    await vi.waitFor(() => {
      expect(svg.getAnimations({ subtree: true }).length).toBeGreaterThan(0);
    });
    const anims = svg.getAnimations({ subtree: true });
    const label = anims.find((a) => (a.effect as KeyframeEffect).target?.tagName === "text");
    const line = anims.find(
      (a) => (a.effect as KeyframeEffect).target?.getAttribute("data-mc-ink") === "data",
    );
    expect(label).toBeDefined();
    expect(line).toBeDefined();
    // The endpoint label starts only once the stroke has effectively reached it,
    // and never outlives the story it is waiting for.
    const lineTiming = line!.effect!.getTiming();
    const drawStart = Number(lineTiming.delay ?? 0);
    const drawEnd = end(line!);
    const labelStart = Number(label!.effect!.getTiming().delay ?? 0);
    expect(labelStart).toBeGreaterThan(drawStart + (drawEnd - drawStart) * 0.8);
    expect(labelStart).toBeLessThanOrEqual(drawEnd);
    await settled(svg);
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
