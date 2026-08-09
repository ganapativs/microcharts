// Browser half of `useFluidWidth`: a box only has a width in a real browser —
// jsdom reports 0 for everything and ships no ResizeObserver, so measurement,
// rounding, resize and the hidden-box rule can only be proven here.
import { StrictMode, type CSSProperties } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { useFluidWidth } from "./fluid.js";

/** The readout sits OUTSIDE the measured box, so it can never widen it. */
function Probe({ initial, box }: { initial?: number; box?: CSSProperties }): React.ReactNode {
  const { ref, width } = useFluidWidth(initial);
  return (
    <div>
      <div ref={ref} style={{ width: 300, ...box }} />
      <output data-testid="w">{width}</output>
    </div>
  );
}

const read = (root: HTMLElement): string | null =>
  root.querySelector('[data-testid="w"]')!.textContent;

/** Let `n` animation frames pass — the hook commits one width per frame. */
const frames = (n = 3): Promise<void> =>
  new Promise((resolve) => {
    const step = (): void => {
      n -= 1;
      if (n > 0) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });

describe("useFluidWidth measures the box", () => {
  it("reports the container's width", async () => {
    const screen = await render(<Probe />);
    await vi.waitFor(() => expect(read(screen.container)).toBe("300"));
  });

  it("reports the content box, not the border box", async () => {
    const screen = await render(<Probe box={{ boxSizing: "border-box", padding: 20 }} />);
    await vi.waitFor(() => expect(read(screen.container)).toBe("260"));
  });

  it("rounds to whole pixels, matching the integer viewBox charts draw in", async () => {
    const screen = await render(<Probe box={{ width: "300.4px" }} />);
    await vi.waitFor(() => expect(read(screen.container)).toBe("300"));
  });

  it("follows the box when it resizes", async () => {
    const screen = await render(<Probe />);
    await vi.waitFor(() => expect(read(screen.container)).toBe("300"));
    await screen.rerender(<Probe box={{ width: 180 }} />);
    await vi.waitFor(() => expect(read(screen.container)).toBe("180"));
  });

  // StrictMode mounts, unmounts and remounts: the first effect's observer is
  // disconnected and its pending frame cancelled, so the width that lands has
  // to come from the second one.
  it("measures under StrictMode's double mount", async () => {
    const screen = await render(
      <StrictMode>
        <Probe box={{ width: 260 }} />
      </StrictMode>,
    );
    await vi.waitFor(() => expect(read(screen.container)).toBe("260"));
  });
});

// The behaviour the field report was written about: a team measured 0 and drew
// nothing on first paint. A collapsed disclosure, an inactive tab and a
// `display: none` ancestor all measure 0, and a chart 0 units wide renders
// nothing at all — so 0 never reaches `width`.
describe("useFluidWidth ignores a measured zero", () => {
  it("holds the last real width while the box is hidden", async () => {
    const screen = await render(<Probe />);
    await vi.waitFor(() => expect(read(screen.container)).toBe("300"));

    await screen.rerender(<Probe box={{ display: "none" }} />);
    await frames(4);
    expect(read(screen.container)).toBe("300");

    await screen.rerender(<Probe box={{ width: 220 }} />);
    await vi.waitFor(() => expect(read(screen.container)).toBe("220"));
  });

  it("keeps the fallback for a box that is hidden at mount", async () => {
    const screen = await render(<Probe initial={240} box={{ display: "none" }} />);
    await frames(4);
    expect(read(screen.container)).toBe("240");
  });

  it("keeps the fallback for a box collapsed to zero width", async () => {
    const screen = await render(<Probe initial={160} box={{ width: 0 }} />);
    await frames(4);
    expect(read(screen.container)).toBe("160");
  });
});
