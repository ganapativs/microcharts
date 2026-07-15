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

  it("is axe-clean", async () => {
    const { container } = draw(<HeartbeatBlip events={EVENTS} now={100_000} title="Requests" />);
    await expectNoA11yViolations(container);
  });
});
