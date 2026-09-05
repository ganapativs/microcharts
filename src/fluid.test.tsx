// Node half of `useFluidWidth`: the paths that run where nothing can be
// measured. jsdom ships no `ResizeObserver` and gives every box a width of 0,
// which is the environment this hook has to survive without throwing — the same
// shape as a server render, an older WebKit and a non-DOM renderer. Real
// measurement is in fluid.browser.test.tsx, because a box only has a width in a
// browser.
import { StrictMode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { render, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useFluidWidth } from "./fluid.js";

describe("useFluidWidth without a ResizeObserver", () => {
  it("the environment really has none — so nothing below is mocked", () => {
    expect(typeof ResizeObserver).toBe("undefined");
  });

  it("returns the fallback width and does not throw", () => {
    const { result } = renderHook(() => useFluidWidth(240));
    expect(result.current.width).toBe(240);
  });

  it("defaults to 80 — the width charts fall back to with no `width` prop", () => {
    const { result } = renderHook(() => useFluidWidth());
    expect(result.current.width).toBe(80);
  });

  it("survives StrictMode's double mount and unmounts clean", () => {
    const { result, unmount } = renderHook(() => useFluidWidth(120), { wrapper: StrictMode });
    expect(result.current.width).toBe(120);
    expect(() => unmount()).not.toThrow();
  });
});

describe("useFluidWidth ref", () => {
  it("starts null and attaches to the element you put it on", () => {
    let seen: HTMLDivElement | null = null;
    function Probe(): React.ReactNode {
      const { ref } = useFluidWidth();
      // Reading the ref during render is the ASSERTION — the test below pins
      // that it is null until commit. Both rules fire on the probe, not on a bug.
      // oxlint-disable-next-line react/globals, react/refs
      seen = ref.current;
      return <div ref={ref} data-testid="box" />;
    }
    const { getByTestId } = render(<Probe />);
    // null during the first render — the ref only fills in at commit
    expect(seen).toBeNull();
    expect(getByTestId("box")).toBeInstanceOf(HTMLDivElement);
  });
});

// renderToStaticMarkup runs no effects, so a hook that reached for
// `ResizeObserver` (or `window`) during render would throw here.
function Card(): React.ReactNode {
  const { ref, width } = useFluidWidth(200);
  return <div ref={ref} data-width={width} />;
}

describe("useFluidWidth on the server", () => {
  it("renders the fallback width, touching no browser API", () => {
    expect(renderToStaticMarkup(<Card />)).toBe('<div data-width="200"></div>');
  });
});
