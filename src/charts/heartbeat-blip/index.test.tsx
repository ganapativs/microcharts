import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { HeartbeatBlip, heartbeatSummary } from "./index.js";
import { EN_HEARTBEAT } from "../../core/strings-heartbeat.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

const EVENTS = [97_000, 90_000, 80_000];

describe("<HeartbeatBlip>", () => {
  it("summary states count, window, and time since last", () => {
    const { container } = draw(<HeartbeatBlip events={EVENTS} now={100_000} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "3 events in the last minute; last 3s ago.",
    );
  });

  it("no events → the flat (down) summary — distinct from no-data", () => {
    expect(heartbeatSummary([], { now: 100_000 })).toBe("No events in the last minute.");
  });

  it("window label: singular units, and clean hour multiples read as hours", () => {
    const w = EN_HEARTBEAT.heartbeatWindow;
    expect(w(60_000)).toBe("minute");
    expect(w(3_600_000)).toBe("hour");
    expect(w(30_000)).toBe("30 seconds");
    expect(w(90_000)).toBe("2 minutes"); // not a clean hour → minutes
    expect(w(7_200_000)).toBe("2 hours"); // was "120 minutes"
    expect(w(10_800_000)).toBe("3 hours");
  });

  it("renders a spike per event + the now dot", () => {
    const { container } = draw(<HeartbeatBlip events={EVENTS} now={100_000} />);
    expect(container.querySelector(".mc-heartbeat-spikes")).not.toBeNull();
    expect(container.querySelector(".mc-heartbeat-now")).not.toBeNull();
  });

  it("flat window renders the 'no events' shape, not a spike path", () => {
    const { container } = draw(<HeartbeatBlip events={[]} now={100_000} />);
    expect(container.querySelector(".mc-heartbeat-spikes")).toBeNull();
    // the empty label is FILLED muted text (data-mc-ink="label"), never the
    // stroke-only "muted" role — that rendered the glyphs as heavy outlines.
    const empty = container.querySelector('text[data-mc-ink="label"]')!;
    expect(empty.textContent).toBe("no events");
    expect(empty.getAttribute("data-mc-ink")).not.toBe("muted");
  });

  it('label="count" prints the event count', () => {
    const { container } = draw(<HeartbeatBlip events={EVENTS} now={100_000} label="count" />);
    expect(container.querySelector('text[data-mc-ink="label"]')!.textContent).toBe("3");
  });

  it("now defaults to the latest event", () => {
    const { container } = draw(<HeartbeatBlip events={[97_000, 90_000]} />);
    // latest = 97_000, so last-ago is 0
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "2 events in the last minute; last 0s ago.",
    );
  });

  it("summary={false} hides it", () => {
    const { container } = draw(<HeartbeatBlip events={EVENTS} now={100_000} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBeNull();
  });

  it("the trace paints from the accent ink role, not an inline brand hex", () => {
    // `.mc-root` sets `forced-color-adjust: none`, so an inline
    // `stroke: var(--mc-accent)` survives verbatim into High Contrast Mode —
    // a brand hue on the user's own background. The role earns the mapping.
    const { container } = draw(<HeartbeatBlip events={EVENTS} now={100_000} />);
    const spikes = container.querySelector(".mc-heartbeat-spikes")!;
    expect(spikes.getAttribute("data-mc-ink")).toBe("accent");
    expect(spikes.getAttribute("data-mc-w")).toBe("full");
    // an accent PATH is a line, so the literal fill has to be off
    expect(spikes.getAttribute("fill")).toBe("none");
    expect(spikes.getAttribute("style") ?? "").not.toMatch(/stroke:/);
  });

  it("color still overrides the trace inline", () => {
    const { container } = draw(<HeartbeatBlip events={EVENTS} now={100_000} color="red" />);
    expect(container.querySelector(".mc-heartbeat-spikes")!.getAttribute("style")).toContain(
      "stroke: red",
    );
  });

  it("a non-finite fontSize falls back to the default instead of NaN-ing the box", () => {
    // `Number(field.value)` on an empty input is the ordinary way to get here.
    const { container } = draw(
      <HeartbeatBlip events={EVENTS} now={100_000} fontSize={NaN} label="count" />,
    );
    expect(container.querySelector("svg")!.innerHTML).not.toMatch(/NaN|Infinity/);
  });

  it('label="count" never eats the plot it annotates', () => {
    // The band was a flat `fontSize * 2`, so on a narrow chart it exceeded the
    // width, inverted the plot, and painted every mark left of the viewBox.
    const { container } = draw(
      <HeartbeatBlip events={EVENTS} now={100_000} width={12} label="count" />,
    );
    const line = container.querySelector("line")!;
    expect(Number(line.getAttribute("x2"))).toBeGreaterThan(Number(line.getAttribute("x1")));
    expect(Number(container.querySelector("circle")!.getAttribute("cx"))).toBeGreaterThan(0);
  });

  it("labels drop rather than spill when the box can no longer seat them", () => {
    // A 400-unit numeral in a 16-unit box, and the empty-state word in a plot
    // narrower than the word — both used to paint outside the viewBox.
    const huge = draw(<HeartbeatBlip events={EVENTS} now={100_000} fontSize={400} label="count" />);
    expect(huge.container.querySelector("text")).toBeNull();
    const narrow = draw(<HeartbeatBlip events={[]} now={100_000} width={20} />);
    expect(narrow.container.querySelector("text")).toBeNull();
    // the flat baseline is the down signal on its own; the summary still reads it
    expect(narrow.container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "No events in the last minute.",
    );
    // and at the default size the word stays
    const roomy = draw(<HeartbeatBlip events={[]} now={100_000} />);
    expect(roomy.container.querySelector("text")!.textContent).toBe("no events");
  });

  it("stays inside the viewBox, marks and estimated text extents alike", () => {
    // 0.62 per char is core/labels.ts' figure estimate — the same one the
    // reserved gutters are computed from, and a safe over-estimate for the
    // lowercase empty-state word.
    const busy = Array.from({ length: 400 }, (_, i) => 100_000 - i * 120);
    for (const events of [EVENTS, [], busy]) {
      for (const label of ["none", "count"] as const) {
        for (const [width, height] of [
          [12, 16],
          [20, 8],
          [40, 10],
          [60, 16],
          [30, 90],
          [200, 40],
        ] as const) {
          const where = `${events.length}ev ${label} ${width}x${height}`;
          const { container } = draw(
            <HeartbeatBlip
              events={events}
              now={100_000}
              width={width}
              height={height}
              label={label}
            />,
          );
          const svg = container.querySelector("svg")!;
          const [, , w, h] = svg.getAttribute("viewBox")!.split(" ").map(Number);
          const d = svg.querySelector("path")?.getAttribute("d") ?? "";
          for (const n of d.match(/-?[\d.]+/g) ?? []) {
            expect(Number(n), `${where} path coord`).toBeGreaterThanOrEqual(0);
          }
          for (const c of svg.querySelectorAll("circle")) {
            const [cx, cy, r] = ["cx", "cy", "r"].map((a) => Number(c.getAttribute(a)));
            expect(cx! - r!, `${where} dot left`).toBeGreaterThanOrEqual(0);
            expect(cx! + r!, `${where} dot right`).toBeLessThanOrEqual(w!);
            expect(cy! + r!, `${where} dot bottom`).toBeLessThanOrEqual(h!);
          }
          for (const t of svg.querySelectorAll("text")) {
            const x = Number(t.getAttribute("x"));
            const y = Number(t.getAttribute("y"));
            const fs = Number(t.getAttribute("font-size"));
            const run = t.textContent!.length * 0.62 * fs;
            const mid = t.getAttribute("text-anchor") === "middle";
            expect(x - (mid ? run / 2 : run), `${where} text left`).toBeGreaterThanOrEqual(0);
            expect(x + (mid ? run / 2 : 0), `${where} text right`).toBeLessThanOrEqual(w!);
            // central baseline straddles y; alphabetic sits on it
            const central = t.getAttribute("dominant-baseline") === "central";
            expect(y - fs * (central ? 0.5 : 0.78), `${where} ascent`).toBeGreaterThanOrEqual(0);
            expect(y + fs * (central ? 0.5 : 0.22), `${where} descent`).toBeLessThanOrEqual(h!);
          }
        }
      }
    }
  });

  it("is axe-clean", async () => {
    const { container } = draw(<HeartbeatBlip events={EVENTS} now={100_000} title="Requests" />);
    await expectNoA11yViolations(container);
  });
});
