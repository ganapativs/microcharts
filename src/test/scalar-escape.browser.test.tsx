// Getting OUT of a scalar reveal, measured in a real browser.
//
// A scalar chart (one glyph, one reading) reveals its chip on hover or focus.
// Focus is the state a keyboard reader could enter and not leave: the chip
// stays up until the reader tabs away, and moving focus is the one thing a
// reveal must never require. `useScalarActive` gives the whole family the same
// exit the picker kernel gives a pin — Escape lowers the chip and reports
// `onActive(null)`, with focus (and the tab position) unmoved.
//
// jsdom has no SVG layout, so the chip/pointer paths only mean anything here.

import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";

import "../../styles.css";

import { Progress } from "../charts/progress/client.js";
import { MoonPhase } from "../charts/moon-phase/client.js";
import type { MicroDatum } from "../shared/interactive.js";

describe("scalar Escape", () => {
  it("Escape lowers the chip and reports onActive(null) without moving focus", async () => {
    const seen: (MicroDatum | null)[] = [];
    const screen = await render(
      <Progress value={0.44} label="none" onActive={(d) => seen.push(d)} />,
    );
    const host = screen.container.querySelector<HTMLElement>("[data-mc-host]")!;

    host.focus();
    await vi.waitFor(() => {
      expect(document.querySelector(".mc-spark-readout")).not.toBeNull();
    });
    expect(seen.at(-1)?.index).toBe(0);

    await userEvent.keyboard("{Escape}");
    await vi.waitFor(() => {
      expect(document.querySelector(".mc-spark-readout")).toBeNull();
    });
    expect(seen.at(-1)).toBeNull();
    expect(document.activeElement).toBe(host);
  });

  it("the reveal re-arms after Escape, and hover exits by leaving", async () => {
    const screen = await render(<MoonPhase value={0.62} />);
    const host = screen.container.querySelector<HTMLElement>("[data-mc-host]")!;

    // Pointer path: the chip's exit is the pointer leaving (Escape belongs to
    // the focused wrapper — same shape as the picker kernel).
    await userEvent.hover(host);
    await vi.waitFor(() => {
      expect(document.querySelector(".mc-spark-readout")).not.toBeNull();
    });
    await userEvent.unhover(host);
    await vi.waitFor(() => {
      expect(document.querySelector(".mc-spark-readout")).toBeNull();
    });

    // Keyboard path: Escape lowers it, and a fresh focus raises it again.
    host.focus();
    await vi.waitFor(() => {
      expect(document.querySelector(".mc-spark-readout")).not.toBeNull();
    });
    await userEvent.keyboard("{Escape}");
    await vi.waitFor(() => {
      expect(document.querySelector(".mc-spark-readout")).toBeNull();
    });
    host.blur();
    host.focus();
    await vi.waitFor(() => {
      expect(document.querySelector(".mc-spark-readout")).not.toBeNull();
    });
  });

  it("Enter reports onSelect, and Escape needs no onSelect to work", async () => {
    const picked: (MicroDatum | null)[] = [];
    const screen = await render(
      <Progress value={0.44} label="none" onSelect={(d) => picked.push(d)} />,
    );
    const host = screen.container.querySelector<HTMLElement>("[data-mc-host]")!;

    host.focus();
    await userEvent.keyboard("{Enter}");
    expect(picked.at(-1)?.index).toBe(0);

    await userEvent.keyboard("{Escape}");
    await vi.waitFor(() => {
      expect(document.querySelector(".mc-spark-readout")).toBeNull();
    });
  });
});
