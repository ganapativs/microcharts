// Getting OUT of a selection, measured in a real browser.
//
// A selection is a pin: it survives the pointer leaving, because that is what
// makes it useful next to a table or a KPI card. For a long time it also
// survived everything else. Re-tapping the same unit cleared it, and Escape
// cleared it — but only on a chart that still had keyboard focus, which a
// decorative chart never takes and a tap on a phone does not reliably give. So
// the reader's first instinct, clicking somewhere else on the page, did nothing:
// the mark stayed ringed, every other mark stayed dimmed by
// `:has([data-mc-active])`, and the way out was a shortcut nobody had been told.
//
// The kernel now light-dismisses: while something is pinned, a `pointerdown`
// that is not this chart's own drops the selection, and so does Escape from
// anywhere. What that must NOT do is fire on the chart's own clicks, fire twice
// for one Escape, or move a selection the host controls — those are the
// regressions this file exists to catch.
//
// jsdom has no SVG layout (`getBoundingClientRect` returns 0), so the pointer
// paths only mean anything here, in the browser project.

import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";

import "../../styles.css";

import { SparkBar } from "../charts/sparkbar/client.js";
import { Sparkline } from "../charts/sparkline/client.js";
import { ActivityGrid } from "../charts/activity-grid/client.js";
import type { MicroDatum } from "../shared/interactive.js";

const BARS = [4, 9, 6, 11, 7, 13, 8];

/** Somewhere on the page that is emphatically not a chart. */
function Outside(): React.ReactNode {
  return (
    <p data-outside style={{ padding: 24 }}>
      elsewhere
    </p>
  );
}

/** The host, its SVG, and a click target outside the chart. */
async function mount(ui: React.ReactNode): Promise<{
  host: HTMLElement;
  svg: SVGSVGElement;
  outside: HTMLElement;
}> {
  const screen = await render(
    <>
      {ui}
      <Outside />
    </>,
  );
  const host = screen.container.querySelector("[data-mc-host]") as HTMLElement;
  return {
    host,
    svg: host.querySelector("svg") as SVGSVGElement,
    outside: screen.container.querySelector("[data-outside]") as HTMLElement,
  };
}

/** Is a unit pinned? SparkBar/ActivityGrid mount the overlay; Sparkline hides
 *  its ring in place, so an `opacity="0"` ring is not a pin. */
function pinned(svg: SVGSVGElement): boolean {
  const el = svg.querySelector("[data-mc-active]");
  return el !== null && el.getAttribute("opacity") !== "0";
}

/** A finger, at the centre of `el`: down, up, click — the sequence a tap sends. */
function tap(el: Element): void {
  const r = el.getBoundingClientRect();
  const at = {
    bubbles: true,
    pointerId: 7,
    clientX: r.x + r.width / 2,
    clientY: r.y + r.height / 2,
  };
  el.dispatchEvent(new PointerEvent("pointerdown", { ...at, pointerType: "touch" }));
  el.dispatchEvent(new PointerEvent("pointerup", { ...at, pointerType: "touch" }));
  el.dispatchEvent(new MouseEvent("click", at));
}

describe("light dismiss", () => {
  it("an outside click drops the pin and reports it once", async () => {
    const picks = vi.fn<(d: MicroDatum | null) => void>();
    const { host, svg, outside } = await mount(
      <SparkBar data={BARS} title="Weekly" onSelect={picks} />,
    );

    await userEvent.click(host);
    expect(pinned(svg)).toBe(true);
    expect(picks.mock.lastCall?.[0]).toMatchObject({ value: expect.any(Number) });

    await userEvent.click(outside);
    await expect.poll(() => pinned(svg)).toBe(false);
    expect(picks.mock.lastCall?.[0]).toBeNull();
    // Once, not once per listener and not again on the click that follows the
    // dismissing pointerdown.
    expect(picks.mock.calls.filter(([d]) => d === null)).toHaveLength(1);
  });

  it("a tap elsewhere drops a tapped pin", async () => {
    // The case the fix was reported from: a phone has no hover to fall back on,
    // and a tap does not reliably move focus, so Escape was never available
    // either. The pin has to come off the way it went on.
    const picks = vi.fn<(d: MicroDatum | null) => void>();
    const { host, svg, outside } = await mount(
      <SparkBar data={BARS} title="Weekly" onSelect={picks} />,
    );

    tap(host);
    await expect.poll(() => pinned(svg)).toBe(true);

    tap(outside);
    await expect.poll(() => pinned(svg)).toBe(false);
    expect(picks.mock.lastCall?.[0]).toBeNull();
  });

  it("a click inside the chart is not an outside click", async () => {
    const picks = vi.fn<(d: MicroDatum | null) => void>();
    const { host, svg } = await mount(<SparkBar data={BARS} title="Weekly" onSelect={picks} />);

    // Two different bars, by keyboard so the unit is unambiguous.
    host.focus();
    await userEvent.keyboard("{Home}{Enter}");
    await userEvent.keyboard("{ArrowRight}{Enter}");

    expect(picks.mock.calls.map(([d]) => d?.index)).toEqual([0, 1]);
    expect(pinned(svg)).toBe(true);
  });

  it("Escape reaches a pinned chart that no longer has focus", async () => {
    const picks = vi.fn<(d: MicroDatum | null) => void>();
    const { host, svg, outside } = await mount(
      <SparkBar data={BARS} title="Weekly" onSelect={picks} />,
    );

    host.focus();
    await userEvent.keyboard("{Home}{Enter}");
    expect(pinned(svg)).toBe(true);

    host.blur();
    outside.focus();
    await userEvent.keyboard("{Escape}");

    await expect.poll(() => pinned(svg)).toBe(false);
    expect(picks.mock.lastCall?.[0]).toBeNull();
  });

  it("Escape on the focused chart clears once, not twice", async () => {
    const picks = vi.fn<(d: MicroDatum | null) => void>();
    const { host } = await mount(<SparkBar data={BARS} title="Weekly" onSelect={picks} />);

    host.focus();
    await userEvent.keyboard("{Home}{Enter}{Escape}");

    expect(picks.mock.calls.filter(([d]) => d === null)).toHaveLength(1);
  });

  it("the pin still survives blur — dismissal is an event, not a focus rule", async () => {
    const { host, svg } = await mount(<SparkBar data={BARS} title="Weekly" />);

    host.focus();
    await userEvent.keyboard("{Home}{Enter}");
    host.blur();

    await expect.poll(() => pinned(svg)).toBe(true);
  });

  it("an idle chart never fires a spurious deselect", async () => {
    const picks = vi.fn<(d: MicroDatum | null) => void>();
    const { outside } = await mount(<SparkBar data={BARS} title="Weekly" onSelect={picks} />);

    await userEvent.click(outside);
    await userEvent.keyboard("{Escape}");

    expect(picks).not.toHaveBeenCalled();
  });

  it("pinning one chart dismisses the other", async () => {
    const screen = await render(
      <>
        <SparkBar data={BARS} title="A" />
        <SparkBar data={BARS} title="B" />
      </>,
    );
    const [a, b] = [...screen.container.querySelectorAll("[data-mc-host]")] as HTMLElement[];
    const svgA = a!.querySelector("svg") as SVGSVGElement;
    const svgB = b!.querySelector("svg") as SVGSVGElement;

    await userEvent.click(a!);
    expect(pinned(svgA)).toBe(true);

    await userEvent.click(b!);
    await expect.poll(() => pinned(svgB)).toBe(true);
    await expect.poll(() => pinned(svgA)).toBe(false);
  });

  it("a controlled selection is reported, never overridden", async () => {
    const picks = vi.fn<(d: MicroDatum | null) => void>();
    const { svg, outside } = await mount(
      <SparkBar data={BARS} title="Weekly" selectedIndex={3} onSelect={picks} />,
    );

    expect(pinned(svg)).toBe(true);
    await userEvent.click(outside);

    expect(picks.mock.lastCall?.[0]).toBeNull();
    // The host owns `selectedIndex`: it stays until the host moves it.
    expect(pinned(svg)).toBe(true);
  });

  it("dismisses the sparkline's imperative ring too", async () => {
    const { host, svg, outside } = await mount(<Sparkline data={BARS} title="Line" />);

    host.focus();
    await userEvent.keyboard("{Home}{Enter}");
    await expect.poll(() => pinned(svg)).toBe(true);

    await userEvent.click(outside);
    await expect.poll(() => pinned(svg)).toBe(false);
  });

  it("dismisses a 2-D grid the same way", async () => {
    const { host, svg, outside } = await mount(
      <ActivityGrid data={Array.from({ length: 60 }, (_, i) => i % 5)} title="Grid" />,
    );

    host.focus();
    await userEvent.keyboard("{Home}{Enter}");
    await expect.poll(() => pinned(svg)).toBe(true);

    await userEvent.click(outside);
    await expect.poll(() => pinned(svg)).toBe(false);
  });

  it("clears a pin whose data went away, from the keyboard", async () => {
    // A live series can empty out under a pin. The keyboard handler used to
    // refuse every key on an empty chart, Escape included, which left the one
    // state the reader could not leave. The new data arrives as a re-render, so
    // no pointer event reaches the page — this is the keyboard path alone.
    const picks = vi.fn<(d: MicroDatum | null) => void>();
    const screen = await render(<SparkBar data={BARS} title="Weekly" onSelect={picks} />);
    const host = screen.container.querySelector("[data-mc-host]") as HTMLElement;

    host.focus();
    await userEvent.keyboard("{Home}{Enter}");
    expect(picks.mock.lastCall?.[0]).toMatchObject({ index: 0 });

    await screen.rerender(<SparkBar data={[]} title="Weekly" onSelect={picks} />);
    host.focus();
    await userEvent.keyboard("{Escape}");

    expect(picks.mock.lastCall?.[0]).toBeNull();
  });
});
