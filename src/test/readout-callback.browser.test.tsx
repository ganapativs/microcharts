// The readout callback contract, measured in a real browser.
//
// Two guarantees the interaction kernel makes, verified end-to-end:
//
//  1. `onActive` hands the consumer `datum.formatted` — the SAME string the
//     chart's own floating chip shows. So a KPI card fed from `onActive` reads
//     identically to the in-chart readout, without re-deriving `format`/`locale`.
//     We assert the mirror directly: every `formatted` seen during a sweep also
//     appeared as chip text.
//
//  2. `readout={false}` suppresses ONLY the chip. Hover still fires `onActive`
//     (so the value is available), but no `.mc-spark-readout` is ever painted.
//     This is the "render the value somewhere else" pattern.
//
// jsdom has no SVG layout, so this must run in the browser project.
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import type { ReactElement } from "react";

import "../../styles.css";

import { Sparkline } from "../charts/sparkline/client.js";
import { Funnel } from "../charts/funnel/client.js";
import { Slope } from "../charts/slope/client.js";
import type { MicroDatum } from "../shared/interactive.js";

type Render = (onActive: (d: MicroDatum | null) => void, readout: boolean) => ReactElement;

// One picker chart per readout shape: a bare number, a composite
// "stage percent (count)", and a "from → to" pair. If `formatted` mirrors the
// chip for these three it mirrors it everywhere the recipe was applied.
const CASES: Record<string, Render> = {
  sparkline: (onActive, readout) => (
    <Sparkline
      data={[3, 6, 2, 8, 5]}
      format={{ style: "currency", currency: "USD" }}
      title="Line"
      readout={readout}
      onActive={onActive}
    />
  ),
  funnel: (onActive, readout) => (
    <Funnel
      data={[
        { label: "Visited", value: 1000 },
        { label: "Signed up", value: 620 },
        { label: "Paid", value: 120 },
      ]}
      title="Funnel"
      readout={readout}
      onActive={onActive}
    />
  ),
  slope: (onActive, readout) => (
    <Slope
      data={[
        { label: "South", from: 20, to: 33 },
        { label: "North", from: 44, to: 28 },
      ]}
      title="Slope"
      readout={readout}
      onActive={onActive}
    />
  ),
};

const pointer = (el: Element, type: string, x: number, y: number): void => {
  el.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      clientX: x,
      clientY: y,
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true,
    }),
  );
};

const settle = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

/** Sweep pointer + keyboard; collect the chip strings seen while hovering/roving. */
async function sweep(host: HTMLElement): Promise<{ chipsSeen: Set<string> }> {
  const box = host.getBoundingClientRect();
  const chipsSeen = new Set<string>();
  const sampleChips = (): void => {
    for (const chip of host.querySelectorAll<HTMLElement>(".mc-spark-readout")) {
      const text = (chip.textContent ?? "").trim();
      if (text) chipsSeen.add(text);
    }
  };

  host.focus();
  for (let i = 0; i <= 12; i++) {
    const x = box.left + (box.width * i) / 12;
    const y = box.top + box.height / 2;
    pointer(host, "pointerenter", x, y);
    pointer(host, "pointermove", x, y);
    await settle();
    sampleChips();
  }
  pointer(host, "pointerleave", box.left, box.top);
  for (let i = 0; i < 12; i++) {
    host.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await settle();
    sampleChips();
  }
  return { chipsSeen };
}

const hostOf = (screen: Awaited<ReturnType<typeof render>>): HTMLElement => {
  const host = screen.container.querySelector<HTMLElement>('span[role="img"][tabindex]');
  expect(host, "interactive host wrapper").not.toBeNull();
  return host!;
};

describe("onActive carries the chart's own formatted string", () => {
  for (const [name, renderChart] of Object.entries(CASES)) {
    it(`${name} — every onActive.formatted also renders as a chip`, async () => {
      const formattedSeen = new Set<string>();
      const onActive = (d: MicroDatum | null): void => {
        if (d && d.formatted) formattedSeen.add(d.formatted);
      };
      const screen = await render(renderChart(onActive, true));
      const { chipsSeen } = await sweep(hostOf(screen));

      // The callback delivered non-empty formatted strings…
      expect(formattedSeen.size, "onActive delivered at least one formatted value").toBeGreaterThan(
        0,
      );
      // …and each is a string the chip actually showed (the mirror contract).
      for (const f of formattedSeen) {
        expect(typeof f).toBe("string");
        expect(
          chipsSeen.has(f),
          `onActive gave formatted "${f}" but no chip ever showed it (chips: ${[...chipsSeen].join(" | ")})`,
        ).toBe(true);
      }
    });
  }
});

describe("readout={false} suppresses the chip but not the callback", () => {
  for (const [name, renderChart] of Object.entries(CASES)) {
    it(`${name} — no chip paints, onActive still fires with formatted`, async () => {
      const formattedSeen = new Set<string>();
      const onActive = (d: MicroDatum | null): void => {
        if (d && d.formatted) formattedSeen.add(d.formatted);
      };
      const screen = await render(renderChart(onActive, false));
      const { chipsSeen } = await sweep(hostOf(screen));

      expect(
        chipsSeen.size,
        `chip painted despite readout={false}: ${[...chipsSeen].join(" | ")}`,
      ).toBe(0);
      expect(
        formattedSeen.size,
        "onActive stopped firing when the chip was suppressed",
      ).toBeGreaterThan(0);
    });
  }
});
